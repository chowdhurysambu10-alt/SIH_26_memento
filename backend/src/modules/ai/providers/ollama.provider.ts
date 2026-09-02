import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClassificationResult,
  ExistingChallengeSnippet,
  LlmProvider,
} from './llm-provider.interface';

@Injectable()
export class OllamaProvider implements LlmProvider {
  public readonly name = 'Ollama (Self-Hosted Gemma)';
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('ai.ollama.baseUrl') || 'http://localhost:11434';
    this.model = this.configService.get<string>('ai.ollama.model') || 'gemma2:9b';
  }

  async classifyAndDetectDuplicates(
    title: string,
    description: string,
    district: string,
    existingChallenges: ExistingChallengeSnippet[],
  ): Promise<ClassificationResult> {
    const endpoint = `${this.baseUrl}/api/generate`;

    const candidateList = existingChallenges
      .slice(0, 15)
      .map(
        (c) =>
          `ID: ${c.id}\nTitle: ${c.title}\nDescription: ${c.description.substring(0, 150)}...`,
      )
      .join('\n---\n');

    const prompt = `
You are an expert AI Classifier and Duplicate Detection engine for societal challenges submitted in Jharkhand.
Given a citizen challenge:
District: ${district}
Title: ${title}
Description: ${description}

Existing Challenges:
${candidateList || 'None'}

Return ONLY a JSON object:
{
  "categorySlug": "education|agriculture|healthcare|water|environment|energy|urban_development|accessibility|public_administration|rural_livelihoods",
  "categoryName": "string",

  "recommendedKeywords": ["keyword1", "keyword2"],
  "duplicateCandidateId": null,
  "duplicateSimilarityScore": 0.0,
  "rationale": "reason"
}
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          format: 'json',
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.response.trim());
      return {
        categorySlug: parsed.categorySlug || 'public_administration',
        categoryName: parsed.categoryName || 'Public Administration',

        recommendedKeywords: parsed.recommendedKeywords || [],
        duplicateCandidateId: parsed.duplicateCandidateId || null,
        duplicateSimilarityScore: Math.min(1.0, Math.max(0.0, Number(parsed.duplicateSimilarityScore) || 0.0)),
        rationale: parsed.rationale || 'Processed via self-hosted Ollama model.',
      };
    } catch (err) {
      clearTimeout(timeoutId);
      this.logger.warn(`Ollama call failed: ${err.message}`);
      throw err;
    }
  }
}
