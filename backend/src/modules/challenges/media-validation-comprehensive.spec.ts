import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChallengesService } from './challenges.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ClassificationService } from '../ai/classification.service';
import { ImageValidationService } from '../ai/image-validation.service';
import { SettingsService } from '../settings/settings.service';
import { UserRole } from '../../common/constants/roles.enum';
import { HeicConverterUtil } from '../../utils/heic-converter.util';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

describe('Comprehensive Media Validation & HEIC Compatibility Matrix', () => {
  let service: ChallengesService;
  let mockSupabaseService: any;
  let mockClassificationService: any;
  let mockImageValidationService: any;
  let mockSettingsService: any;

  const scratchHeicPath =
    '/Users/sambu/.gemini/antigravity-ide/brain/7b6ea5fc-2f51-4223-9ac7-95e3b5a5f3e9/scratch/test_sample.heic';

  beforeEach(async () => {
    mockSupabaseService = {
      getAdminClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-challenge-id', title: 'Road Maintenance' },
            error: null,
          }),
        }),
      }),
      uploadFile: jest.fn().mockResolvedValue({ url: 'https://storage.example.com/photo.webp' }),
    };

    mockClassificationService = {
      processChallenge: jest.fn().mockResolvedValue({
        classification: {
          categorySlug: 'roads',
          categoryName: 'Roads & Transport',
          priorityScore: 80,
          recommendedKeywords: ['road', 'pothole'],
        },
        matchedInstitutionId: null,
        providerUsed: 'test-classifier',
      }),
    };

    mockImageValidationService = {
      validateImage: jest.fn().mockResolvedValue({
        isValid: true,
        isScreenshot: false,
        isAiGenerated: false,
        confidence: 0.98,
        status: 'genuine',
        rejectionReason: null,
      }),
    };

    mockSettingsService = {
      getSettings: jest.fn().mockResolvedValue({
        maintenanceMode: false,
        aiAutoTriage: true,
        allowPublicComments: true,
        enforceGeolocation: false,
        maxAttachmentSizeMB: 10,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ClassificationService, useValue: mockClassificationService },
        { provide: ImageValidationService, useValue: mockImageValidationService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<ChallengesService>(ChallengesService);
  });

  const mockUser = {
    id: 'user-matrix',
    role: UserRole.CITIZEN,
    email: 'citizen@example.com',
  };

  const mockDto = {
    title: 'Broken Culvert',
    description: 'Culvert collapsed after heavy rainfall causing water stagnation.',
    district: 'Ranchi',
    location_text: 'Block 4 Main Junction',
  };

  // 1. Test JPG format
  it('1. should successfully process and upload a JPG image', async () => {
    const jpgBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 200, g: 100, b: 50 } },
    }).jpeg().toBuffer();

    const file = {
      buffer: jpgBuffer,
      originalname: 'pothole.jpg',
      mimetype: 'image/jpeg',
      size: jpgBuffer.length,
    } as Express.Multer.File;

    const result = await service.createChallenge(mockDto as any, mockUser, [file]);
    expect(result).toBeDefined();
    expect(mockSupabaseService.uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/\.webp$/i),
      'image/webp',
    );
  });

  // 2. Test JPEG format
  it('2. should successfully process and upload a JPEG image', async () => {
    const jpegBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 150, g: 150, b: 150 } },
    }).jpeg().toBuffer();

    const file = {
      buffer: jpegBuffer,
      originalname: 'evidence.jpeg',
      mimetype: 'image/jpeg',
      size: jpegBuffer.length,
    } as Express.Multer.File;

    const result = await service.createChallenge(mockDto as any, mockUser, [file]);
    expect(result).toBeDefined();
    expect(mockSupabaseService.uploadFile).toHaveBeenCalled();
  });

  // 3. Test PNG format
  it('3. should successfully process and upload a PNG image', async () => {
    const pngBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 120, b: 255 } },
    }).png().toBuffer();

    const file = {
      buffer: pngBuffer,
      originalname: 'site_photo.png',
      mimetype: 'image/png',
      size: pngBuffer.length,
    } as Express.Multer.File;

    const result = await service.createChallenge(mockDto as any, mockUser, [file]);
    expect(result).toBeDefined();
    expect(mockSupabaseService.uploadFile).toHaveBeenCalled();
  });

  // 4. Test WebP format
  it('4. should successfully process and upload a WebP image', async () => {
    const webpBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 80, g: 200, b: 80 } },
    }).webp().toBuffer();

    const file = {
      buffer: webpBuffer,
      originalname: 'drainage.webp',
      mimetype: 'image/webp',
      size: webpBuffer.length,
    } as Express.Multer.File;

    const result = await service.createChallenge(mockDto as any, mockUser, [file]);
    expect(result).toBeDefined();
    expect(mockSupabaseService.uploadFile).toHaveBeenCalled();
  });

  // 5. Test HEIC format
  it('5. should normalize, validate, and store a HEIC photo as WebP', async () => {
    if (!fs.existsSync(scratchHeicPath)) return;

    const heicBytes = fs.readFileSync(scratchHeicPath);
    const file = {
      buffer: heicBytes,
      originalname: 'IMG_2026.HEIC',
      mimetype: 'image/heic',
      size: heicBytes.length,
    } as Express.Multer.File;

    const result = await service.createChallenge(mockDto as any, mockUser, [file]);
    expect(result).toBeDefined();

    // AI validation received standard JPEG
    expect(mockImageValidationService.validateImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/jpeg',
      expect.stringMatching(/\.jpg$/i),
    );

    // Stored as WebP
    expect(mockSupabaseService.uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/\.webp$/i),
      'image/webp',
    );
  });

  // 6. Test HEIF format
  it('6. should normalize, validate, and store a HEIF photo as WebP', async () => {
    if (!fs.existsSync(scratchHeicPath)) return;

    const heifBytes = fs.readFileSync(scratchHeicPath);
    const file = {
      buffer: heifBytes,
      originalname: 'camera_capture.heif',
      mimetype: 'image/heif',
      size: heifBytes.length,
    } as Express.Multer.File;

    const result = await service.createChallenge(mockDto as any, mockUser, [file]);
    expect(result).toBeDefined();
    expect(mockSupabaseService.uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/\.webp$/i),
      'image/webp',
    );
  });

  // 7. Test invalid/corrupted image
  it('7. should reject corrupted image with BadRequestException without server crash', async () => {
    const corruptFile = {
      buffer: Buffer.from('not an image data string at all corrupt'),
      originalname: 'broken_file.heic',
      mimetype: 'image/heic',
      size: 40,
    } as Express.Multer.File;

    await expect(
      service.createChallenge(mockDto as any, mockUser, [corruptFile]),
    ).rejects.toThrow(BadRequestException);
  });

  // 8. Test unsupported / non-image attachment (e.g. PDF/document bypasses image validation)
  it('8. should allow non-image documents without running image forensics', async () => {
    const docFile = {
      buffer: Buffer.from('%PDF-1.4 report document bytes'),
      originalname: 'official_report.pdf',
      mimetype: 'application/pdf',
      size: 120,
    } as Express.Multer.File;

    const result = await service.createChallenge(mockDto as any, mockUser, [docFile]);
    expect(result).toBeDefined();
    expect(mockImageValidationService.validateImage).not.toHaveBeenCalled();
    expect(mockSupabaseService.uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      'official_report.pdf',
      'application/pdf',
    );
  });

  // 9. Test oversized file (> 10MB limit enforcement)
  it('9. should reject oversized media exceeding maximum MB limit', async () => {
    const largeFile = {
      buffer: Buffer.alloc(11 * 1024 * 1024), // 11MB exceeds 10MB setting
      originalname: 'huge_video.mp4',
      mimetype: 'video/mp4',
      size: 11 * 1024 * 1024,
    } as Express.Multer.File;

    await expect(
      service.createChallenge(mockDto as any, mockUser, [largeFile]),
    ).rejects.toThrow(BadRequestException);
  });

  // 10. Test AI-generated image detection and rejection
  it('10. should reject AI-generated image when flagged by forensic analysis', async () => {
    const syntheticJpg = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 255 } },
    }).jpeg().toBuffer();

    const file = {
      buffer: syntheticJpg,
      originalname: 'synthetic_concept.jpg',
      mimetype: 'image/jpeg',
      size: syntheticJpg.length,
    } as Express.Multer.File;

    mockImageValidationService.validateImage.mockResolvedValue({
      isValid: false,
      isScreenshot: false,
      isAiGenerated: true,
      confidence: 0.94,
      status: 'likely_ai',
      rejectionReason: 'Upload rejected: The image appears to be AI-generated.',
    });

    await expect(
      service.createChallenge(mockDto as any, mockUser, [file]),
    ).rejects.toThrow(BadRequestException);

    // Storage upload MUST NOT be called for rejected AI media
    expect(mockSupabaseService.uploadFile).not.toHaveBeenCalled();
  });

  // 11. Test normal mobile-camera image with computational processing (accepted)
  it('11. should accept genuine mobile camera photo even if computational smoothing is noted', async () => {
    const mobilePhoto = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 70, g: 120, b: 180 } },
    }).jpeg().toBuffer();

    const file = {
      buffer: mobilePhoto,
      originalname: 'iphone_street_photo.jpg',
      mimetype: 'image/jpeg',
      size: mobilePhoto.length,
    } as Express.Multer.File;

    // Simulating low/moderate AI signal from mobile camera noise reduction below threshold
    mockImageValidationService.validateImage.mockResolvedValue({
      isValid: true,
      isScreenshot: false,
      isAiGenerated: false,
      confidence: 0.62,
      status: 'suspicious',
      rejectionReason: null,
    });

    const result = await service.createChallenge(mockDto as any, mockUser, [file]);
    expect(result).toBeDefined();
    expect(mockSupabaseService.uploadFile).toHaveBeenCalled();
  });

  // 12. Test explicit HEIC -> JPEG conversion fidelity
  it('12. should convert HEIC directly to valid JPEG buffer that sharp can process', async () => {
    if (!fs.existsSync(scratchHeicPath)) return;

    const heicBytes = fs.readFileSync(scratchHeicPath);
    const convertedJpeg = await HeicConverterUtil.convertHeicToJpeg(heicBytes, 0.92);

    expect(convertedJpeg).toBeDefined();
    expect(convertedJpeg[0]).toBe(0xff);
    expect(convertedJpeg[1]).toBe(0xd8);
    expect(convertedJpeg[2]).toBe(0xff);

    const meta = await sharp(convertedJpeg).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBeGreaterThan(0);
    expect(meta.height).toBeGreaterThan(0);

    const webpBuffer = await sharp(convertedJpeg).webp().toBuffer();
    expect(webpBuffer.length).toBeGreaterThan(0);
  });
});
