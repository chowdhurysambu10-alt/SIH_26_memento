export interface ImageValidationResult {
  /** Whether the image is considered a valid, authentic camera photograph */
  isValid: boolean;
  /** Whether the image was detected as a screenshot */
  isScreenshot: boolean;
  /** Whether the image was detected as AI-generated/synthesized */
  isAiGenerated: boolean;
  /** Confidence score of the assessment from 0.0 to 1.0 */
  confidence: number;
  /** Human-readable explanation if rejected, or null if accepted */
  rejectionReason: string | null;
  /** Detailed technical observations from the model/heuristics */
  details?: string;
  /** The provider used to analyze the image (e.g., 'gemini-1.5-flash', 'metadata-heuristic') */
  providerUsed?: string;
}
