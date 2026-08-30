export interface AnalyticsOverview {
  total_challenges: number;
  by_status: {
    submitted: number;
    under_review: number;
    routed: number;
    team_formed: number;
    in_progress: number;
    completed: number;
    validated: number;
  };
  total_institutions: number;
  active_teams: number;
  total_milestones: number;
  resolved_challenges: number;
  csr_funding_committed?: number;
}

export interface CategoryAnalytics {
  category_id: string;
  name: string;
  slug: string;
  total_challenges: number;
  completed_challenges: number;
  completion_rate_percentage: number;
}

export interface DistrictAnalytics {
  district: string;
  total_challenges: number;
  resolved_challenges: number;
  in_progress_challenges: number;
  high_priority_count: number;
  active_universities: number;
}

export interface InstitutionLeaderboardItem {
  id: string;
  name: string;
  type: string;
  district: string;
  assigned_challenges_count: number;
  completed_challenges_count: number;
  active_teams_count: number;
}
