import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GemmaApiProvider } from './providers/gemma-api.provider';
import { OllamaProvider } from './providers/ollama.provider';
import {
  ClassificationResult,
  ExistingChallengeSnippet,
  LlmProvider,
} from './providers/llm-provider.interface';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);
  private primaryProvider: LlmProvider;
  private fallbackProvider: LlmProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly gemmaProvider: GemmaApiProvider,
    private readonly ollamaProvider: OllamaProvider,
    private readonly supabaseService: SupabaseService,
  ) {
    const defaultChoice = this.configService.get<string>('ai.defaultProvider');
    if (defaultChoice === 'ollama') {
      this.primaryProvider = this.ollamaProvider;
      this.fallbackProvider = this.gemmaProvider;
    } else {
      this.primaryProvider = this.gemmaProvider;
      this.fallbackProvider = this.ollamaProvider;
    }
  }

  /**
   * Classify a challenge, detect duplicates, and route to matching institutions.
   */
  async processChallenge(
    title: string,
    description: string,
    district: string,
  ): Promise<{
    classification: ClassificationResult;
    matchedInstitutionId: string | null;
    providerUsed: string;
  }> {
    // 1. Fetch recent challenges for similarity check
    const existing = await this.getExistingChallengeSnippets();

    let classification: ClassificationResult;
    let providerUsed = this.primaryProvider.name;

    try {
      this.logger.log(`Attempting AI classification with primary provider: ${this.primaryProvider.name}`);
      classification = await this.primaryProvider.classifyAndDetectDuplicates(
        title,
        description,
        district,
        existing,
      );
    } catch (primaryErr) {
      this.logger.warn(
        `Primary provider (${this.primaryProvider.name}) failed: ${primaryErr.message}. Attempting fallback to ${this.fallbackProvider.name}...`,
      );

      try {
        providerUsed = this.fallbackProvider.name;
        classification = await this.fallbackProvider.classifyAndDetectDuplicates(
          title,
          description,
          district,
          existing,
        );
      } catch (fallbackErr) {
        this.logger.error(
          `Fallback provider (${this.fallbackProvider.name}) also failed: ${fallbackErr.message}. Utilizing heuristic fallback.`,
        );
        providerUsed = 'Heuristic Fallback Engine';
        classification = this.heuristicClassification(title, description, existing);
      }
    }

    // 2. Route to matching institution based on domain expertise and district
    const matchedInstitutionId = await this.findMatchingInstitution(
      classification.categorySlug,
      district,
    );

    return {
      classification,
      matchedInstitutionId,
      providerUsed,
    };
  }

  /**
   * Heuristic fallback rule engine when external APIs are unavailable.
   */
  public heuristicClassification(
    title: string,
    description: string,
    existing: ExistingChallengeSnippet[],
  ): ClassificationResult {
    const text = `${title} ${description}`.toLowerCase();

    const categoryKeywords: Record<string, { slug: string; name: string; score: number }> = {
      water: { slug: 'water', name: 'Water & Sanitation', score: 80 },
      arsenic: { slug: 'water', name: 'Water & Sanitation', score: 85 },
      sanitation: { slug: 'water', name: 'Water & Sanitation', score: 70 },
      school: { slug: 'education', name: 'Education', score: 75 },
      teacher: { slug: 'education', name: 'Education', score: 70 },
      student: { slug: 'education', name: 'Education', score: 65 },
      crop: { slug: 'agriculture', name: 'Agriculture', score: 80 },
      farmer: { slug: 'agriculture', name: 'Agriculture', score: 80 },
      irrigation: { slug: 'agriculture', name: 'Agriculture', score: 85 },
      hospital: { slug: 'healthcare', name: 'Healthcare', score: 90 },
      doctor: { slug: 'healthcare', name: 'Healthcare', score: 85 },
      malnutrition: { slug: 'healthcare', name: 'Healthcare', score: 95 },
      forest: { slug: 'environment', name: 'Environment & Forestry', score: 75 },
      pollution: { slug: 'environment', name: 'Environment & Forestry', score: 80 },
      solar: { slug: 'energy', name: 'Clean Energy', score: 65 },
      electricity: { slug: 'energy', name: 'Clean Energy', score: 70 },
      road: { slug: 'urban_development', name: 'Urban Infrastructure', score: 75 },
      drainage: { slug: 'urban_development', name: 'Urban Infrastructure', score: 75 },
      disability: { slug: 'accessibility', name: 'Accessibility & Inclusion', score: 80 },
      handicap: { slug: 'accessibility', name: 'Accessibility & Inclusion', score: 80 },
      livelihood: { slug: 'rural_livelihoods', name: 'Rural Livelihoods', score: 75 },
      handicraft: { slug: 'rural_livelihoods', name: 'Rural Livelihoods', score: 70 },
    };

    let matched = { slug: 'public_administration', name: 'Public Administration', score: 60 };
    for (const [kw, data] of Object.entries(categoryKeywords)) {
      if (text.includes(kw)) {
        matched = data;
        break;
      }
    }

    // Heuristic duplicate detection (Jaccard similarity on tokens)
    let bestDupId: string | null = null;
    let maxSim = 0.0;
    const inputWords = new Set(text.split(/\s+/).filter((w) => w.length > 3));

    for (const candidate of existing) {
      const candText = `${candidate.title} ${candidate.description}`.toLowerCase();
      const candWords = new Set(candText.split(/\s+/).filter((w) => w.length > 3));
      
      let intersection = 0;
      for (const w of inputWords) {
        if (candWords.has(w)) intersection++;
      }
      const union = inputWords.size + candWords.size - intersection;
      const sim = union > 0 ? intersection / union : 0;
      if (sim > maxSim) {
        maxSim = sim;
        bestDupId = candidate.id;
      }
    }

    return {
      categorySlug: matched.slug,
      categoryName: matched.name,
      priorityScore: matched.score,
      recommendedKeywords: Array.from(inputWords).slice(0, 5),
      duplicateCandidateId: maxSim >= 0.65 ? bestDupId : null,
      duplicateSimilarityScore: parseFloat(maxSim.toFixed(2)),
      rationale: 'Categorized via keyword & similarity heuristic rules.',
    };
  }

  /**
   * Matches challenge category to university domain expertise.
   */
  async findMatchingInstitution(categorySlug: string, district?: string): Promise<string | null> {
    try {
      const { data: universities } = await this.supabaseService
        .getAdminClient()
        .from('institutions')
        .select('id, name, domain_expertise, district, type')
        .eq('type', 'university');

      if (!universities || universities.length === 0) {
        return null;
      }

      // Priority 1: Match domain expertise AND same district
      if (district) {
        const localMatch = universities.find(
          (u) =>
            u.district.toLowerCase() === district.toLowerCase() &&
            u.domain_expertise?.some((dom: string) => dom.toLowerCase() === categorySlug.toLowerCase()),
        );
        if (localMatch) return localMatch.id;
      }

      // Priority 2: Match domain expertise in any district
      const domainMatch = universities.find((u) =>
        u.domain_expertise?.some((dom: string) => dom.toLowerCase() === categorySlug.toLowerCase()),
      );
      if (domainMatch) return domainMatch.id;

      // Default to first university if none match domain directly
      return universities[0].id;
    } catch (err) {
      this.logger.warn(`Could not query matching institution: ${err.message}`);
      return null;
    }
  }

  private async getExistingChallengeSnippets(): Promise<ExistingChallengeSnippet[]> {
    try {
      const { data } = await this.supabaseService
        .getAdminClient()
        .from('challenges')
        .select('id, title, description')
        .order('created_at', { ascending: false })
        .limit(20);

      return data || [];
    } catch (err) {
      this.logger.warn(`Could not fetch existing challenges for duplicate comparison: ${err.message}`);
      return [];
    }
  }
}
