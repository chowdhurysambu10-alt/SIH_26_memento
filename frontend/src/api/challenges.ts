import { apiClient } from './client';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  district: string;
  location_text?: string;
  latitude?: number;
  longitude?: number;
  media_urls?: string[];
  category_id?: string;
  priority_score?: number;
  support_count?: number;
  status: 'submitted' | 'under_review' | 'routed' | 'team_formed' | 'in_progress' | 'completed' | 'validated' | 'rejected';
  submitted_by: string;
  assigned_institution_id?: string;
  created_at: string;
  categories?: {
    id: string;
    name: string;
    slug: string;
  };
  institutions?: {
    id: string;
    name: string;
    type: string;
    district?: string;
  };
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ChallengeFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  district?: string;
  category_id?: string;
  category_slug?: string;
  search?: string;
}

export const challengesApi = {
  getChallenges: async (params: ChallengeFilterParams = {}): Promise<Challenge[]> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.district) query.set('district', params.district);
    if (params.category_id) query.set('category_id', params.category_id);
    if (params.category_slug) query.set('category_slug', params.category_slug);
    if (params.search) query.set('search', params.search);

    const qs = query.toString();
    const endpoint = `/challenges${qs ? `?${qs}` : ''}`;
    const result = await apiClient<any>(endpoint);
    return Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
  },

  getChallengeById: (id: string): Promise<Challenge> => {
    return apiClient<Challenge>(`/challenges/${id}`);
  },

  createChallenge: (formData: FormData): Promise<Challenge> => {
    return apiClient<Challenge>('/challenges', {
      method: 'POST',
      body: formData,
    });
  },

  supportChallenge: (id: string): Promise<{ challenge_id: string; support_count: number; is_supported: boolean }> => {
    return apiClient<{ challenge_id: string; support_count: number; is_supported: boolean }>(`/challenges/${id}/support`, {
      method: 'POST',
    });
  },

  updateStatus: (id: string, status: string, notes?: string): Promise<Challenge> => {
    return apiClient<Challenge>(`/challenges/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },
};
