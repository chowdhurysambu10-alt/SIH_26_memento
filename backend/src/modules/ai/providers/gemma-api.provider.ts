import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClassificationResult,
  ExistingChallengeSnippet,
  LlmProvider,
} from './llm-provider.interface';

@Injectable()
export class GemmaApiProvider implements LlmProvider {
  public readonly name = 'GemmaAPI (Google AI Studio)';
  private readonly logger = new Logger(GemmaApiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.gemma.apiKey');
    this.model = this.configService.get<string>('ai.gemma.model') || 'gemma-2-9b-it';
    this.apiUrl = this.configService.get<string>('ai.gemma.apiUrl') || 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async classifyAndDetectDuplicates(
    title: string,
    description: string,
    district: string,
    existingChallenges: ExistingChallengeSnippet[],
  ): Promise<ClassificationResult> {
    if (!this.apiKey) {
      throw new Error('GEMMA_API_KEY is not configured.');
    }

    const endpoint = `${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    const candidateList = existingChallenges
      .slice(0, 15)
      .map(
        (c) =>
          `ID: ${c.id}\nTitle: ${c.title}\nDescription: ${c.description.substring(0, 150)}...`,
      )
      .join('\n---\n');

    const systemPrompt = `
You are an expert AI Classifier and Duplicate Detection engine for societal challenges submitted in Jharkhand, India.
Given a citizen's challenge, you must:
1. Classify it into exactly ONE of the following valid category slugs:
   - education
   - agriculture
   - healthcare
   - water
   - environment
   - energy
   - urban_development
   - accessibility
   - public_administration
   - rural_livelihoods
2. Compare against the provided list of existing challenges to determine if it is a duplicate or near-duplicate. Return duplicateCandidateId (or null if none) and duplicateSimilarityScore (0.0 to 1.0, where >=0.75 indicates duplicate).
3. Provide 3-5 relevant keywords and a 1-sentence rationale.

Return ONLY a valid JSON object with the following schema:
{
  "categorySlug": "water",
  "categoryName": "Water & Sanitation",

  "recommendedKeywords": ["drinking water", "arsenic", "fluoride", "tube well"],
  "duplicateCandidateId": "uuid-or-null",
  "duplicateSimilarityScore": 0.85,
  "rationale": "High priority drinking water contamination impacting multiple tribal villages."
}
`;

    const userPrompt = `
New Challenge:
District: ${district}
Title: ${title}
Description: ${description}

Existing Challenges in Database for Comparison:
${candidateList || 'None'}
`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Gemma API Error ${response.status}: ${errorBody}`);
        throw new Error(`Gemma API request failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      const parsed = JSON.parse(responseText.trim());
      return this.sanitizeResult(parsed);
    } catch (err) {
      clearTimeout(timeoutId);
      this.logger.warn(`Gemma API execution failed: ${err.message}`);
      throw err;
    }
  }

  private sanitizeResult(raw: any): ClassificationResult {
    const validSlugs = [
      'education',
      'agriculture',
      'healthcare',
      'water',
      'environment',
      'energy',
      'urban_development',
      'accessibility',
      'public_administration',
      'rural_livelihoods',
    ];

    const slug = validSlugs.includes(raw.categorySlug)
      ? raw.categorySlug
      : 'public_administration';

    return {
      categorySlug: slug,
      categoryName: raw.categoryName || slug.replace('_', ' ').toUpperCase(),

      recommendedKeywords: Array.isArray(raw.recommendedKeywords)
        ? raw.recommendedKeywords
        : [],
      duplicateCandidateId: raw.duplicateCandidateId || null,
      duplicateSimilarityScore: Math.min(
        1.0,
        Math.max(0.0, Number(raw.duplicateSimilarityScore) || 0.0),
      ),
      rationale: raw.rationale || 'AI automated classification completed.',
    };
  }
}
