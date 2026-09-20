import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ImageValidationService } from './image-validation.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

describe('ImageValidationService', () => {
  let service: ImageValidationService;
  let mockConfigService: Partial<ConfigService>;
  let originalFetch: typeof global.fetch;

  beforeEach(async () => {
    originalFetch = global.fetch;

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'ai.gemini.apiKey') return 'mock-gemini-key';
        if (key === 'ai.gemini.model') return 'gemini-1.5-flash';
        if (key === 'ai.gemini.apiUrl') return 'https://generativelanguage.googleapis.com/v1beta/models';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageValidationService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ImageValidationService>(ImageValidationService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should bypass non-image mime types with isValid: true', async () => {
    const dummyBuffer = Buffer.from('test pdf content');
    const result = await service.validateImage(dummyBuffer, 'application/pdf', 'document.pdf');

    expect(result.isValid).toBe(true);
    expect(result.isScreenshot).toBe(false);
    expect(result.isAiGenerated).toBe(false);
    expect(result.rejectionReason).toBeNull();
  });

  it('should detect and reject screenshots via Gemini API analysis', async () => {
    // Generate a real 100x100 PNG buffer with sharp so image processing succeeds
    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  isValid: false,
                  isScreenshot: true,
                  isAiGenerated: false,
                  confidence: 0.96,
                  rejectionReason:
                    'Upload rejected: The image appears to be a screenshot. Please upload an authentic, direct photograph of the issue taken with a camera.',
                  details: 'Detected mobile battery icon and notification bar.',
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockGeminiResponse),
    } as any);

    const result = await service.validateImage(imageBuffer, 'image/png', 'photo.png');

    expect(result.isValid).toBe(false);
    expect(result.isScreenshot).toBe(true);
    expect(result.isAiGenerated).toBe(false);
    expect(result.rejectionReason).toContain('screenshot');
    expect(result.details).toContain('mobile battery icon');
  });

  it('should detect and reject AI-generated images via Gemini API analysis', async () => {
    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  isValid: false,
                  isScreenshot: false,
                  isAiGenerated: true,
                  confidence: 0.94,
                  rejectionReason:
                    'Upload rejected: The image appears to be AI-generated. Please upload an authentic, real-world photograph of the issue.',
                  details: 'Detected synthetic diffusion patterns and unnaturally smooth surfaces.',
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockGeminiResponse),
    } as any);

    const result = await service.validateImage(imageBuffer, 'image/jpeg', 'concept.jpg');

    expect(result.isValid).toBe(false);
    expect(result.isScreenshot).toBe(false);
    expect(result.isAiGenerated).toBe(true);
    expect(result.rejectionReason).toContain('AI-generated');
    expect(result.details).toContain('synthetic diffusion patterns');
  });

  it('should approve authentic camera photographs', async () => {
    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  isValid: true,
                  isScreenshot: false,
                  isAiGenerated: false,
                  confidence: 0.98,
                  rejectionReason: null,
                  details: 'Authentic camera photograph of street drainage problem.',
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockGeminiResponse),
    } as any);

    const result = await service.validateImage(imageBuffer, 'image/jpeg', 'broken_pipe.jpg');

    expect(result.isValid).toBe(true);
    expect(result.isScreenshot).toBe(false);
    expect(result.isAiGenerated).toBe(false);
    expect(result.rejectionReason).toBeNull();
  });

  it('should reject both screenshot and AI-generated when flagged as both', async () => {
    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    })
      .png()
      .toBuffer();

    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  isValid: false,
                  isScreenshot: true,
                  isAiGenerated: true,
                  confidence: 0.91,
                  rejectionReason: null, // should be synthesized
                  details: 'Screenshot of Midjourney feed.',
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockGeminiResponse),
    } as any);

    const result = await service.validateImage(imageBuffer, 'image/png', 'test.png');

    expect(result.isValid).toBe(false);
    expect(result.isScreenshot).toBe(true);
    expect(result.isAiGenerated).toBe(true);
    expect(result.rejectionReason).toContain('screenshot of AI-generated content');
  });

  it('should fall back to heuristic validation when Gemini API key is missing', async () => {
    // Recreate service without API key
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageValidationService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('') },
        },
      ],
    }).compile();

    const noKeyService = module.get<ImageValidationService>(ImageValidationService);

    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 100, g: 100, b: 100 },
      },
    })
      .png()
      .toBuffer();

    // With screenshot filename
    const screenshotResult = await noKeyService.validateImage(
      imageBuffer,
      'image/png',
      'Screenshot_2026-09-18.png',
    );
    expect(screenshotResult.isValid).toBe(false);
    expect(screenshotResult.isScreenshot).toBe(true);
    expect(screenshotResult.rejectionReason).toContain('screenshot');

    // With AI filename
    const aiResult = await noKeyService.validateImage(
      imageBuffer,
      'image/jpeg',
      'midjourney_sample.jpg',
    );
    expect(aiResult.isValid).toBe(false);
    expect(aiResult.isAiGenerated).toBe(true);
    expect(aiResult.rejectionReason).toContain('AI-generated');
  });

  it('should fall back to heuristic validation when Gemini API call fails', async () => {
    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 50, g: 50, b: 50 },
      },
    })
      .png()
      .toBuffer();

    // Mock fetch rejection (e.g. network failure / ENOTFOUND)
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error: getaddrinfo ENOTFOUND'));

    const result = await service.validateImage(
      imageBuffer,
      'image/png',
      'camera_capture.png',
    );

    // Heuristic fallback should run without crashing
    expect(result).toBeDefined();
    expect(result.providerUsed).toBe('Metadata Heuristic Engine');
  });
});
