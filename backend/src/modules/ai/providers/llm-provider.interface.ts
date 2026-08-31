export interface ClassificationResult {
  categorySlug: string;
  categoryName: string;
  priorityScore: number; // 1 - 100
  recommendedKeywords: string[];
  duplicateCandidateId: string | null;
  duplicateSimilarityScore: number; // 0 - 1
  rationale: string;
}

export interface ExistingChallengeSnippet {
  id: string;
  title: string;
  description: string;
}

export interface LlmProvider {
  name: string;
  classifyAndDetectDuplicates(
    title: string,
    description: string,
    district: string,
    existingChallenges: ExistingChallengeSnippet[],
  ): Promise<ClassificationResult>;
}
