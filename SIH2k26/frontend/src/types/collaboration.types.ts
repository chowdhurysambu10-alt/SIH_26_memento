import { Institution, User } from './auth.types';

export type MilestoneStatus = 'pending' | 'in_progress' | 'submitted' | 'completed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type EngagementType = 'funding' | 'mentorship' | 'technology' | 'internships' | 'pilot_testing' | 'incubation';
export type EngagementStatus = 'pending' | 'accepted' | 'declined';

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: MilestoneStatus;
  deliverable_url?: string;
  approval_status: ApprovalStatus;
  approved_by?: string;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTeam {
  id: string;
  challenge_id: string;
  university_id: string;
  faculty_ids: string[];
  student_ids: string[];
  status: string;
  created_at: string;
  updated_at: string;
  
  // Joined
  university?: Institution;
  faculties?: User[];
  students?: User[];
  milestones?: Milestone[];
}

export interface IndustryEngagement {
  id: string;
  challenge_id: string;
  industry_id: string;
  engagement_type: EngagementType;
  status: EngagementStatus;
  proposal_notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined
  industry?: Institution;
}
