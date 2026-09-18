import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('Image Verification')
@Controller('image-check')
export class ImageCheckController {
  private readonly logger = new Logger(ImageCheckController.name);
  private checkCount = 0;
  private readonly MONTHLY_LIMIT = 1500;

  constructor(private readonly configService: ConfigService) {}

  @Post()
  @Public()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Check if an image is AI-generated using Gemini Vision API' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new HttpException('Only image files are allowed', HttpStatus.BAD_REQUEST), false);
        }
        cb(null, true);
      },
    }),
  )
  async checkImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    this.checkCount++;
    if (this.checkCount > this.MONTHLY_LIMIT) {
      this.logger.warn('Monthly AI image check limit reached, allowing through');
      return { isAiGenerated: false, confidence: 0, limitReached: true };
    }

    const gemmaApiKey = this.configService.get<string>('GEMMA_API_KEY');
    if (!gemmaApiKey) {
      this.logger.warn('GEMMA_API_KEY not configured, skipping AI check');
      return { isAiGenerated: false, confidence: 0, skipped: true };
    }

    try {
      const base64Image = file.buffer.toString('base64');
      const mimeType = file.mimetype;

      const prompt = `You are an AI image forensics expert. Analyze this image and determine if it was AI-generated (Midjourney, DALL-E, Stable Diffusion, Firefly, etc.) or a real photograph.

Check for: overly smooth textures, unnatural lighting, distorted hands/fingers, blurry/nonsensical text, impossible geometry, too-perfect composition, dreamlike quality.

Respond ONLY in valid JSON: {"isAiGenerated": true/false, "confidence": 0.0-1.0, "reason": "one-line reason"}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gemmaApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64Image } },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: { 
              temperature: 0.1, 
              maxOutputTokens: 120,
              responseMimeType: "application/json"
            },
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Gemini API error: ${errText}`);
        return { isAiGenerated: false, confidence: 0, error: 'Gemini API call failed' };
      }

      const data = await response.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('Could not parse Gemini response:', text);
        return { isAiGenerated: false, confidence: 0 };
      }

      const result = JSON.parse(jsonMatch[0]);
      this.logger.log(
        `AI check #${this.checkCount}: isAI=${result.isAiGenerated}, conf=${result.confidence}, reason=${result.reason}`,
      );
      return result;
    } catch (err) {
      this.logger.error('AI image check failed:', err);
      return { isAiGenerated: false, confidence: 0, error: String(err) };
    }
  }
}
