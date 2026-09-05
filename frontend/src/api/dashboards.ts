import { apiClient } from './client';

export interface DashboardChallenge {
  id: string;
  title: string;
  description: string;
  district: string;
  category?: string;

  support_count?: number;
  status: 'submitted' | 'under_action' | 'resolved' | 'under_review' | 'claimed' | 'in_progress' | 'completed';
  user_id?: string;
  created_at: string;
  ai_summary?: string;
  ai_confidence?: number;
  model_used?: string;
  media_urls?: string[];
  // Joined assignments
  challenge_assignments?: {
    id: string;
    org_id: string;
    status: string;
    claimed_at: string;
    organizations?: {
      name: string;
      type: string;
    };
  }[];
  // Joined AI log
  ai_analysis_log?: {
    id: string;
    model_used: string;
    ai_category: string;

    ai_confidence: number;
    ai_summary: string;
    created_at: string;
  }[];
}

export interface TopProblemsFilter {
  district?: string;
  category?: string;
  status?: string;
  timeRange?: 'week' | 'month' | 'all';
  limit?: number;
  offset?: number;
}

export interface Organization {
  id: string;
  name: string;
  type: 'university' | 'industry' | 'govt';
  contact_info?: Record<string, any>;
}

export interface AiLogEntry {
  id: string;
  challenge_id: string;
  model_used: string;
  ai_category: string;

  ai_confidence: number;
  ai_summary: string;
  created_at: string;
  challenge?: DashboardChallenge;
}

export const dashboardsApi = {
  // 1. Top Problems
  getTopProblems: async (filter: TopProblemsFilter = {}): Promise<DashboardChallenge[]> => {
    const qs = new URLSearchParams();
    if (filter.district && filter.district !== 'all') qs.set('district', filter.district);
    if (filter.category && filter.category !== 'all') qs.set('category', filter.category);
    if (filter.status && filter.status !== 'all') qs.set('status', filter.status);
    if (filter.limit) qs.set('limit', String(filter.limit));
    if (filter.offset) qs.set('offset', String(filter.offset));
    

    const endpoint = `/challenges${qs.toString() ? `?${qs.toString()}` : ''}`;
    const result = await apiClient<any>(endpoint);
    let items = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);

    // Filter by time range if requested
    if (filter.timeRange && filter.timeRange !== 'all') {
      const now = Date.now();
      const maxAgeMs = filter.timeRange === 'week' ? 7 * 86400000 : 30 * 86400000;
      items = items.filter((item: any) => {
        const createdAt = new Date(item.created_at).getTime();
        return now - createdAt <= maxAgeMs;
      });
    }

    // Sort: support_count DESC
    return items.sort((a: any, b: any) => {
      return (Number(b.support_count) || 0) - (Number(a.support_count) || 0);
    });
  },

  // 2. Submit Challenge (with instant AI Edge analysis)
  submitProblem: async (formData: FormData): Promise<any> => {
    return apiClient<any>('/challenges', {
      method: 'POST',
      body: formData,
    });
  },

  // 3. Claim Challenge for Organizations
  getClaimableChallenges: async (): Promise<DashboardChallenge[]> => {
    const result = await apiClient<any>('/challenges?limit=50');
    const items = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
    return items.filter((c: any) => c.status === 'submitted' || c.status === 'under_review');
  },

  claimChallenge: async (challengeId: string, orgId?: string, notes?: string): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'team_formed',
        notes: notes || 'Claimed by institutional research team',
      }),
    });
  },

  // 4. AI Analysis Dashboard: Get all challenges with AI metadata
  getAiAnalysisChallenges: async (): Promise<DashboardChallenge[]> => {
    const result = await apiClient<any>('/challenges?limit=50');
    return Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
  },

  // 5. Admin Manual Override of Category and Priority
  overrideAiClassification: async (
    challengeId: string,
    category: string,
    notes?: string
  ): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/override-routing`, {
      method: 'POST',
      body: JSON.stringify({
        override_category_slug: category.toLowerCase().replace(/\s+/g, '_'),
        override_reason: notes || 'Human reviewer manual override',
      }),
    });
  },
};
