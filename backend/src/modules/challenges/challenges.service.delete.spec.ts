import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChallengesService } from './challenges.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ClassificationService } from '../ai/classification.service';
import { ImageValidationService } from '../ai/image-validation.service';
import { SettingsService } from '../settings/settings.service';
import { UserRole } from '../../common/constants/roles.enum';

describe('ChallengesService - Permanent Post & Image Deletion', () => {
  let service: ChallengesService;
  let mockSupabaseService: any;
  let mockAdminClient: any;
  let fromMock: jest.Mock;

  beforeEach(async () => {
    fromMock = jest.fn();

    mockAdminClient = {
      from: fromMock,
    };

    mockSupabaseService = {
      getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
      deleteFilesByUrls: jest.fn().mockResolvedValue(2),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ClassificationService, useValue: {} },
        { provide: ImageValidationService, useValue: {} },
        { provide: SettingsService, useValue: { getSettings: jest.fn() } },
      ],
    }).compile();

    service = module.get<ChallengesService>(ChallengesService);
  });

  const authorUser = {
    id: 'user-author-123',
    email: 'author@example.com',
    role: UserRole.CITIZEN,
  };

  const otherUser = {
    id: 'user-other-456',
    email: 'other@example.com',
    role: UserRole.CITIZEN,
  };

  const adminUser = {
    id: 'user-admin-789',
    email: 'admin@example.com',
    role: UserRole.SUPER_ADMIN,
  };

  it('should allow author to delete their own post and clean related records and images', async () => {
    const challengeId = 'challenge-uuid-1';
    const mockChallenge = {
      id: challengeId,
      submitted_by: 'user-author-123',
      user_id: 'user-author-123',
      title: 'Broken Streetlamp',
      media_urls: [
        'https://test.supabase.co/storage/v1/object/public/challenge-media/challenges/lamp1.webp',
        'https://test.supabase.co/storage/v1/object/public/challenge-media/challenges/lamp2.webp',
      ],
    };

    // Mock query chain for challenges and related tables
    fromMock.mockImplementation((table: string) => {
      if (table === 'challenges') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: mockChallenge, error: null }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'project_teams') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [{ id: 'team-1' }], error: null }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
          in: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
    });

    const result = await service.deleteChallenge(challengeId, authorUser);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Broken Streetlamp');

    // Verify storage files deletion was triggered with challenge's media_urls
    expect(mockSupabaseService.deleteFilesByUrls).toHaveBeenCalledWith(
      mockChallenge.media_urls,
    );
  });

  it('should allow admin to delete any post and clean storage images', async () => {
    const challengeId = 'challenge-uuid-2';
    const mockChallenge = {
      id: challengeId,
      submitted_by: 'user-author-123',
      user_id: 'user-author-123',
      title: 'Pothole on Ring Road',
      media_urls: ['challenges/pothole.webp'],
    };

    fromMock.mockImplementation((table: string) => {
      if (table === 'challenges') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: mockChallenge, error: null }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
          in: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
    });

    const result = await service.deleteChallenge(challengeId, adminUser);
    expect(result.success).toBe(true);
    expect(mockSupabaseService.deleteFilesByUrls).toHaveBeenCalledWith([
      'challenges/pothole.webp',
    ]);
  });

  it('should forbid non-author users from deleting another user post', async () => {
    const challengeId = 'challenge-uuid-3';
    const mockChallenge = {
      id: challengeId,
      submitted_by: 'user-author-123',
      user_id: 'user-author-123',
      title: 'Water contamination',
      media_urls: [],
    };

    fromMock.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: mockChallenge, error: null }),
        }),
      }),
    }));

    await expect(service.deleteChallenge(challengeId, otherUser)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockSupabaseService.deleteFilesByUrls).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if challenge does not exist', async () => {
    fromMock.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }));

    await expect(
      service.deleteChallenge('non-existent-id', authorUser),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if database delete fails', async () => {
    const challengeId = 'challenge-uuid-4';
    const mockChallenge = {
      id: challengeId,
      submitted_by: 'user-author-123',
      user_id: 'user-author-123',
      title: 'Road blockage',
      media_urls: [],
    };

    fromMock.mockImplementation((table: string) => {
      if (table === 'challenges') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: mockChallenge, error: null }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: { message: 'Database lock timeout' } }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
          in: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
    });

    await expect(service.deleteChallenge(challengeId, authorUser)).rejects.toThrow(
      BadRequestException,
    );
  });
});
