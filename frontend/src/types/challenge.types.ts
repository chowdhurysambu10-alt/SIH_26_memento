import { Institution, User } from './auth.types';

export type ChallengeStatus =
  | 'submitted'
  | 'under_review'
  | 'routed'
  | 'team_formed'
  | 'in_progress'
  | 'completed'
  | 'validated'
  | 'rejected';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface AiClassification {
  categorySlug: string;
  categoryName: string;
  priorityScore: number;
  recommendedKeywords: string[];
  duplicateCandidateId: string | null;
  duplicateSimilarityScore: number;
  rationale?: string;
  providerUsed?: string;
  processedAt?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category_id?: string;
  status: ChallengeStatus;
  location_text?: string;
  district: string;
  latitude?: number;
  longitude?: number;
  media_urls: string[];
  priority_score: number;
  duplicate_of?: string | null;
  assigned_institution_id?: string | null;
  ai_classification?: AiClassification;
  submitted_by?: string;
  created_at: string;
  updated_at: string;
  
  // Joined relations
  categories?: Category;
  institutions?: Institution;
  submitter?: User;
  project_teams?: any[];
  industry_engagements?: any[];
}

export interface FilterChallengeParams {
  page?: number;
  limit?: number;
  status?: ChallengeStatus | string;
  category_slug?: string;
  district?: string;
  search?: string;
  assigned_institution_id?: string;
}
