import { apiClient } from './client';

export interface DashboardChallenge {
  id: string;
  title: string;
  description: string;
  district: string;
  location_text?: string;
  category?: string;
  support_count?: number;
  priority_score?: number;
  status: 'submitted' | 'under_action' | 'resolved' | 'under_review' | 'routed' | 'team_formed' | 'claimed' | 'in_progress' | 'completed' | 'validated' | 'rejected';
  user_id?: string;
  org_id?: string;
  created_at: string;
  ai_summary?: string;
  ai_confidence?: number;
  model_used?: string;
  media_urls?: string[];
  assigned_institution_id?: string | null;
  ai_classification?: {
    vacancies_released?: boolean;
    [key: string]: any;
  };
  institutions?: {
    id: string;
    name: string;
    type?: string;
    district?: string;
  } | null;
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
    vacancies_released?: boolean;
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
    try {
      const result = await apiClient<any>('/challenges?limit=100');
      const items = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
      return items.filter((c: any) => 
        c?.assigned_institution_id && c?.ai_classification?.vacancies_released === true
      );
    } catch (e) {
      console.error('Failed to get claimable challenges:', e);
      return [];
    }
  },

  claimChallenge: async (challengeId: string, orgId?: string, notes?: string): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'under_review',
        assigned_institution_id: orgId,
        notes: notes || 'Claim requested by institution. Awaiting Admin verification.',
      }),
    });
  },

  releaseVacancy: async (challengeId: string, isReleased: boolean): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/vacancy`, {
      method: 'PATCH',
      body: JSON.stringify({ vacancies_released: isReleased })
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
    notes?: string,
    priority_score?: number
  ): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/override-routing`, {
      method: 'POST',
      body: JSON.stringify({
        override_category_slug: category.toLowerCase().replace(/\s+/g, '_'),
        override_reason: notes || 'Human reviewer manual override',
        priority_score: priority_score,
      }),
    });
  },

  // --- TENDER / PROPOSAL SYSTEM ---

  submitProposal: async (challengeId: string, payload: { proposal_text: string, budget_estimate?: string, timeline_estimate?: string, contact_phone?: string }): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/proposals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyProposals: async (): Promise<any[]> => {
    return apiClient<any[]>('/challenges/proposals/my-bids');
  },

  getChallengeProposals: async (challengeId: string): Promise<any[]> => {
    return apiClient<any[]>(`/challenges/${challengeId}/proposals`);
  },

  approveProposal: async (challengeId: string, proposalId: string): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/proposals/${proposalId}/approve`, {
      method: 'PATCH',
    });
  },

  rejectProposal: async (challengeId: string, proposalId: string): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/proposals/${proposalId}/reject`, {
      method: 'PATCH',
    });
  },

  cleanRejectedBids: async (challengeId: string): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/proposals/clean-rejected`, {
      method: 'PATCH',
    });
  },

  // --- Student Applications via Storage ---
  applyToChallenge: async (challengeId: string, payload: any): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/apply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getChallengeApplications: async (challengeId: string): Promise<any[]> => {
    try {
      return await apiClient<any[]>(`/challenges/${challengeId}/applications`, {
        method: 'GET',
        suppressGlobalError: true,
      } as any);
    } catch (e) {
      console.error('Failed to get student applications:', e);
      return [];
    }
  },

  getInstitutionApplications: async (institutionId?: string): Promise<any[]> => {
    try {
      const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
      return await apiClient<any[]>(`/challenges/institution/applications${query}`, {
        method: 'GET',
        suppressGlobalError: true,
      } as any);
    } catch (e) {
      console.error('Failed to get institution student applications:', e);
      return [];
    }
  },

  updateApplicationStatus: async (applicationId: string, status: 'approved' | 'rejected' | 'pending' | 'waitlisted', appRole?: string): Promise<any> => {
    return apiClient<any>(`/challenges/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, appRole }),
    });
  },

  sendDirectOffer: async (challengeId: string, studentEmail: string, role: string, message: string): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/offer`, {
      method: 'POST',
      body: JSON.stringify({ studentEmail, role, message }),
    });
  },

  getMyApplications: async (): Promise<any[]> => {
    try {
      return await apiClient<any[]>(`/challenges/my-applications`, {
        method: 'GET',
        suppressGlobalError: true,
      } as any);
    } catch (e) {
      console.error('Failed to get my student applications:', e);
      return [];
    }
  },

  addManualTeamMember: async (challengeId: string, payload: { name: string; email?: string; contact?: string; role?: string }): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/manual-team-member`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createEngagement: async (payload: { challenge_id: string; engagement_type: string; proposal_notes: string }): Promise<any> => {
    return apiClient<any>('/collaboration/engagements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- Collaboration: Milestones & Teams ---

  /** Fetch all milestones for a project_team (project_id = team.id) */
  getMilestonesForProject: async (projectId: string): Promise<any[]> => {
    try {
      // Milestones are linked to project_teams.id via project_id column
      return await apiClient<any[]>(`/collaboration/milestones/${projectId}`, {
        method: 'GET',
        suppressGlobalError: true,
      } as any);
    } catch {
      return [];
    }
  },

  /** Create a new milestone (student can create for their project) */
  createMilestone: async (payload: { project_id: string; title: string; description?: string; due_date?: string }): Promise<any> => {
    return apiClient<any>('/collaboration/milestones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Submit a deliverable URL for a milestone (sends it to senior for approval) */
  submitMilestoneDeliverable: async (milestoneId: string, deliverable_url: string): Promise<any> => {
    return apiClient<any>(`/collaboration/milestones/${milestoneId}/submit`, {
      method: 'PATCH',
      body: JSON.stringify({ deliverable_url }),
    });
  },

  /** Get the project team for a challenge (includes milestones and member IDs) */
  getTeamByChallenge: async (challengeId: string): Promise<any> => {
    try {
      return await apiClient<any>(`/collaboration/teams/challenge/${challengeId}`, {
        method: 'GET',
        suppressGlobalError: true,
      } as any);
    } catch {
      return [];
    }
  },
};
