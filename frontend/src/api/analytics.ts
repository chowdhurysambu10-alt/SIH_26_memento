import { apiClient } from './client';

export interface OverviewAnalytics {
  totals: {
    challenges: number;
    users: number;
    institutions: number;
    activeTeams: number;
    milestones: number;
  };
  statusBreakdown: Record<string, number>;
  districtBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
}

export interface DistrictAnalytics {
  district: string;
  total: number;
  resolved: number;
  active: number;
}

export interface CategoryAnalytics {
  id: string;
  name: string;
  slug: string;
  total: number;
  inProgress: number;
  completed: number;
  averagePriorityScore: number;
}

export interface InstitutionLeaderboardItem {
  id: string;
  name: string;
  type: string;
  district?: string;
  domainExpertise?: string;
  totalAssignedChallenges: number;
  activeTeamsCount: number;
  completedMilestones: number;
}

export const analyticsApi = {
  getOverview: (): Promise<OverviewAnalytics> => {
    return apiClient<OverviewAnalytics>('/analytics/overview');
  },

  getByDistrict: (): Promise<DistrictAnalytics[]> => {
    return apiClient<DistrictAnalytics[]>('/analytics/by-district');
  },

  getByCategory: (): Promise<CategoryAnalytics[]> => {
    return apiClient<CategoryAnalytics[]>('/analytics/by-category');
  },

  getInstitutions: (): Promise<InstitutionLeaderboardItem[]> => {
    return apiClient<InstitutionLeaderboardItem[]>('/analytics/institutions');
  },
};
