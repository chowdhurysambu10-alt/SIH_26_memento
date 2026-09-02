import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClassificationService } from './classification.service';
import { GemmaApiProvider } from './providers/gemma-api.provider';
import { SupabaseService } from '../supabase/supabase.service';

describe('ClassificationService', () => {
  let service: ClassificationService;
  let gemmaProvider: GemmaApiProvider;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ai.defaultProvider') return 'gemma';
      return null;
    }),
  };

  const mockSupabaseService = {
    getAdminClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'c1111111-1111-1111-1111-111111111111',
                  title: 'Water pollution in Subarnarekha River',
                  description: 'Industrial discharge contaminating river water used for drinking.',
                },
              ],
            }),
          }),
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'univ-bau',
                name: 'Birsa Agricultural University',
                type: 'university',
                domain_expertise: ['agriculture', 'rural_livelihoods'],
                district: 'Ranchi',
              },
              {
                id: 'univ-bit',
                name: 'BIT Sindri',
                type: 'university',
                domain_expertise: ['water', 'environment', 'energy'],
                district: 'Dhanbad',
              },
            ],
          }),
        }),
      }),
    }),
  };

  const mockGemmaProvider = {
    name: 'GemmaAPI (Google AI Studio)',
    classifyAndDetectDuplicates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassificationService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: GemmaApiProvider, useValue: mockGemmaProvider },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<ClassificationService>(ClassificationService);
    gemmaProvider = module.get<GemmaApiProvider>(GemmaApiProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should classify via primary Gemma provider when successful', async () => {
    mockGemmaProvider.classifyAndDetectDuplicates.mockResolvedValueOnce({
      categorySlug: 'water',
      categoryName: 'Water & Sanitation',
      recommendedKeywords: ['water contamination', 'arsenic'],
      duplicateCandidateId: null,
      duplicateSimilarityScore: 0.1,
      rationale: 'Severe drinking water issue in Dhanbad',
    });

    const result = await service.processChallenge(
      'Drinking water fluoride issue',
      'High fluoride levels causing dental fluorosis in children',
      'Dhanbad',
    );

    expect(result.providerUsed).toBe('GemmaAPI (Google AI Studio)');
    expect(result.classification.categorySlug).toBe('water');
    expect(result.matchedInstitutionId).toBe('univ-bit');
  });

  it('should fall back to heuristic rule engine if Gemma fails', async () => {
    mockGemmaProvider.classifyAndDetectDuplicates.mockRejectedValueOnce(
      new Error('HTTP 429'),
    );

    const result = await service.processChallenge(
      'School building roof leak in monsoon',
      'Primary school classrooms flooding during rainy season',
      'Ranchi',
    );

    expect(result.providerUsed).toBe('Heuristic Fallback Engine');
    expect(result.classification.categorySlug).toBe('education');
  });

  it('should flag high duplicate similarity score when matching duplicate content', () => {
    const existing = [
      {
        id: 'c1111111-1111-1111-1111-111111111111',
        title: 'Water pollution in Subarnarekha River',
        description: 'Industrial discharge contaminating river water used for drinking.',
      },
    ];

    const duplicateCheck = service.heuristicClassification(
      'Subarnarekha River water pollution',
      'River water is contaminated by industrial discharge and not fit for drinking.',
      existing,
    );

    expect(duplicateCheck.duplicateCandidateId).toBe('c1111111-1111-1111-1111-111111111111');
    expect(duplicateCheck.duplicateSimilarityScore).toBeGreaterThanOrEqual(0.65);
  });
});
