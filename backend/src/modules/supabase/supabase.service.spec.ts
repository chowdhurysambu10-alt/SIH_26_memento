import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

describe('SupabaseService - Storage Management', () => {
  let service: SupabaseService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'supabase.url') return 'https://test-project.supabase.co';
        if (key === 'supabase.anonKey') return 'test-anon-key';
        if (key === 'supabase.serviceRoleKey') return 'test-service-key';
        if (key === 'supabase.storageBucket') return 'challenge-media';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  describe('extractStoragePath', () => {
    it('should extract path from a full public Supabase Storage URL', () => {
      const url =
        'https://test-project.supabase.co/storage/v1/object/public/challenge-media/challenges/1710000000000_photo.webp';
      const path = service.extractStoragePath(url);
      expect(path).toBe('challenges/1710000000000_photo.webp');
    });

    it('should extract path from URL with query parameters', () => {
      const url =
        'https://test-project.supabase.co/storage/v1/object/public/challenge-media/challenges/12345_issue.jpg?token=abc';
      const path = service.extractStoragePath(url);
      expect(path).toBe('challenges/12345_issue.jpg');
    });

    it('should handle URL-encoded characters in storage path', () => {
      const url =
        'https://test-project.supabase.co/storage/v1/object/public/challenge-media/challenges/12345_my%20file.webp';
      const path = service.extractStoragePath(url);
      expect(path).toBe('challenges/12345_my file.webp');
    });

    it('should return relative path when url starts with challenges/', () => {
      const path = service.extractStoragePath('challenges/12345_pic.webp');
      expect(path).toBe('challenges/12345_pic.webp');
    });

    it('should return null for base64 data URIs', () => {
      const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...';
      const path = service.extractStoragePath(dataUri);
      expect(path).toBeNull();
    });

    it('should return null for invalid or empty inputs', () => {
      expect(service.extractStoragePath('')).toBeNull();
      expect(service.extractStoragePath(null as any)).toBeNull();
      expect(service.extractStoragePath(undefined as any)).toBeNull();
    });
  });

  describe('deleteFilesByUrls', () => {
    it('should ignore base64 data URIs and return 0 if no storage URLs exist', async () => {
      const count = await service.deleteFilesByUrls([
        'data:image/jpeg;base64,abc...',
        'data:image/png;base64,xyz...',
      ]);
      expect(count).toBe(0);
    });

    it('should call storage.remove for valid storage URLs', async () => {
      const mockRemove = jest.fn().mockResolvedValue({ data: [], error: null });
      const adminClient = service.getAdminClient();
      jest.spyOn(adminClient.storage, 'from').mockReturnValue({
        remove: mockRemove,
      } as any);

      const urls = [
        'https://test-project.supabase.co/storage/v1/object/public/challenge-media/challenges/photo1.webp',
        'https://test-project.supabase.co/storage/v1/object/public/challenge-media/challenges/photo2.webp',
      ];

      const count = await service.deleteFilesByUrls(urls);
      expect(mockRemove).toHaveBeenCalledWith([
        'challenges/photo1.webp',
        'challenges/photo2.webp',
      ]);
      expect(count).toBe(2);
    });
  });
});
