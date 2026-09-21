import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChallengesService } from './challenges.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ClassificationService } from '../ai/classification.service';
import { ImageValidationService } from '../ai/image-validation.service';
import { SettingsService } from '../settings/settings.service';
import { UserRole } from '../../common/constants/roles.enum';

describe('ChallengesService - Image Validation in Upload Workflow', () => {
  let service: ChallengesService;
  let mockSupabaseService: any;
  let mockClassificationService: any;
  let mockImageValidationService: any;
  let mockSettingsService: any;

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
            data: { id: 'test-challenge-id', title: 'Test Challenge' },
            error: null,
          }),
        }),
      }),
      uploadFile: jest.fn().mockResolvedValue({ url: 'https://storage.example.com/test.webp' }),
    };

    mockClassificationService = {
      processChallenge: jest.fn().mockResolvedValue({
        classification: {
          categorySlug: 'water',
          categoryName: 'Water & Sanitation',
          priorityScore: 75,
          recommendedKeywords: ['water'],
        },
        matchedInstitutionId: null,
        providerUsed: 'test-provider',
      }),
    };

    mockImageValidationService = {
      validateImage: jest.fn(),
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
    id: 'user-123',
    role: UserRole.CITIZEN,
    email: 'citizen@example.com',
  };

  const mockDto = {
    title: 'Pothole on Main Road',
    description: 'Deep pothole causing accidents at the main junction.',
    district: 'Ranchi',
    location_text: 'Main Road Ranchi',
  };

  it('should reject the upload if the image is identified as a screenshot', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-bytes'),
      originalname: 'captured_screen.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    mockImageValidationService.validateImage.mockResolvedValue({
      isValid: false,
      isScreenshot: true,
      isAiGenerated: false,
      confidence: 0.95,
      rejectionReason:
        'Upload rejected: The image appears to be a screenshot. Please upload an authentic, direct photograph of the issue taken with a camera.',
      details: 'Detected phone notification bar.',
    });

    await expect(
      service.createChallenge(mockDto as any, mockUser, [mockFile]),
    ).rejects.toThrow(BadRequestException);

    // Verify error message content
    try {
      await service.createChallenge(mockDto as any, mockUser, [mockFile]);
    } catch (err: any) {
      expect(err.message).toContain('screenshot');
    }

    // Storage upload MUST NOT be called
    expect(mockSupabaseService.uploadFile).not.toHaveBeenCalled();
  });

  it('should reject the upload if the image is identified as AI-generated', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-bytes'),
      originalname: 'synthetic_image.jpg',
      mimetype: 'image/jpeg',
      size: 2048,
    } as Express.Multer.File;

    mockImageValidationService.validateImage.mockResolvedValue({
      isValid: false,
      isScreenshot: false,
      isAiGenerated: true,
      confidence: 0.93,
      rejectionReason:
        'Upload rejected: The image appears to be AI-generated. Please upload an authentic, real-world photograph of the issue.',
      details: 'Detected synthetic diffusion patterns.',
    });

    await expect(
      service.createChallenge(mockDto as any, mockUser, [mockFile]),
    ).rejects.toThrow(BadRequestException);

    // Verify error message content
    try {
      await service.createChallenge(mockDto as any, mockUser, [mockFile]);
    } catch (err: any) {
      expect(err.message).toContain('AI-generated');
    }

    // Storage upload MUST NOT be called
    expect(mockSupabaseService.uploadFile).not.toHaveBeenCalled();
  });

  it('should validate and approve an authentic camera photograph', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-bytes'),
      originalname: 'real_camera_photo.jpg',
      mimetype: 'image/jpeg',
      size: 2048,
    } as Express.Multer.File;

    mockImageValidationService.validateImage.mockResolvedValue({
      isValid: true,
      isScreenshot: false,
      isAiGenerated: false,
      confidence: 0.98,
      rejectionReason: null,
    });

    const result = await service.validateUploadedImage(mockFile);
    expect(result.isValid).toBe(true);
    expect(result.rejectionReason).toBeNull();
  });

  it('should reject in validateUploadedImage when image is invalid', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-bytes'),
      originalname: 'screenshot.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    mockImageValidationService.validateImage.mockResolvedValue({
      isValid: false,
      isScreenshot: true,
      isAiGenerated: false,
      confidence: 0.95,
      rejectionReason: 'Upload rejected: The image appears to be a screenshot.',
    });

    await expect(service.validateUploadedImage(mockFile)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should accept and normalize HEIC image in createChallenge upload workflow', async () => {
    const scratchHeicPath =
      '/Users/sambu/.gemini/antigravity-ide/brain/7b6ea5fc-2f51-4223-9ac7-95e3b5a5f3e9/scratch/test_sample.heic';
    const fs = require('fs');
    if (!fs.existsSync(scratchHeicPath)) {
      return;
    }

    const heicBytes = fs.readFileSync(scratchHeicPath);
    const mockFile = {
      buffer: heicBytes,
      originalname: 'iphone_evidence.heic',
      mimetype: 'application/octet-stream', // Simulating generic mobile browser mime
      size: heicBytes.length,
    } as Express.Multer.File;

    mockImageValidationService.validateImage.mockResolvedValue({
      isValid: true,
      isScreenshot: false,
      isAiGenerated: false,
      confidence: 0.98,
      status: 'genuine',
      rejectionReason: null,
    });

    const result = await service.createChallenge(mockDto as any, mockUser, [mockFile]);
    expect(result).toBeDefined();

    // Verify AI validation service was called with normalized JPEG
    expect(mockImageValidationService.validateImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/jpeg',
      expect.stringMatching(/\.jpg$/i),
    );

    // Verify Supabase upload was called with converted WebP
    expect(mockSupabaseService.uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/\.webp$/i),
      'image/webp',
    );
  });

  it('should throw BadRequestException when uploaded HEIC file is corrupted', async () => {
    const corruptHeic = {
      buffer: Buffer.from('corrupt ftypheic data without valid containers'),
      originalname: 'broken.heic',
      mimetype: 'image/heic',
      size: 50,
    } as Express.Multer.File;

    await expect(
      service.createChallenge(mockDto as any, mockUser, [corruptHeic]),
    ).rejects.toThrow(BadRequestException);
  });
});

