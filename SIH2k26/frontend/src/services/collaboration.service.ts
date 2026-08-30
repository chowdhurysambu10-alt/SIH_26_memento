import { apiClient } from './api';
import { IndustryEngagement, Milestone, ProjectTeam } from '../types/collaboration.types';
import { MOCK_PROJECT_TEAMS, MOCK_MILESTONES, MOCK_ENGAGEMENTS, MOCK_INSTITUTIONS, DEMO_USERS } from './mockData';

const LOCAL_TEAMS_KEY = 'sih_mock_teams_store';
const LOCAL_MILESTONES_KEY = 'sih_mock_milestones_store';
const LOCAL_ENGAGEMENTS_KEY = 'sih_mock_engagements_store';

function getStoredTeams(): ProjectTeam[] {
  const s = localStorage.getItem(LOCAL_TEAMS_KEY);
  return s ? JSON.parse(s) : MOCK_PROJECT_TEAMS;
}
function saveStoredTeams(t: ProjectTeam[]) {
  localStorage.setItem(LOCAL_TEAMS_KEY, JSON.stringify(t));
}

function getStoredMilestones(): Milestone[] {
  const s = localStorage.getItem(LOCAL_MILESTONES_KEY);
  return s ? JSON.parse(s) : MOCK_MILESTONES;
}
function saveStoredMilestones(m: Milestone[]) {
  localStorage.setItem(LOCAL_MILESTONES_KEY, JSON.stringify(m));
}

function getStoredEngagements(): IndustryEngagement[] {
  const s = localStorage.getItem(LOCAL_ENGAGEMENTS_KEY);
  return s ? JSON.parse(s) : MOCK_ENGAGEMENTS;
}
function saveStoredEngagements(e: IndustryEngagement[]) {
  localStorage.setItem(LOCAL_ENGAGEMENTS_KEY, JSON.stringify(e));
}

export const collaborationService = {
  async getTeamByChallengeId(challengeId: string): Promise<ProjectTeam | null> {
    try {
      const response: any = await apiClient.get(`/collaboration/teams/challenge/${challengeId}`);
      return response.data;
    } catch (err) {
      console.warn(`Backend unavailable, resolving team for challenge ${challengeId} locally:`, err);
      const teams = getStoredTeams();
      const milestones = getStoredMilestones();
      const team = teams.find((t) => t.challenge_id === challengeId);
      if (team) {
        return {
          ...team,
          milestones: milestones.filter((m) => m.project_id === team.id),
        };
      }
      return null;
    }
  },

  async createTeam(payload: { challenge_id: string; university_id: string; faculty_ids: string[]; student_ids: string[] }): Promise<ProjectTeam> {
    try {
      const response: any = await apiClient.post('/collaboration/teams', payload);
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, creating project team locally:', err);
      const targetInst = MOCK_INSTITUTIONS.find((i) => i.id === payload.university_id) || MOCK_INSTITUTIONS[0];
      const newTeam: ProjectTeam = {
        id: `t-${Date.now()}`,
        challenge_id: payload.challenge_id,
        university_id: payload.university_id,
        faculty_ids: payload.faculty_ids,
        student_ids: payload.student_ids,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        university: targetInst,
        faculties: [DEMO_USERS.faculty],
        students: [DEMO_USERS.student],
        milestones: [],
      };
      const teams = getStoredTeams();
      const updated = [newTeam, ...teams];
      saveStoredTeams(updated);
      return newTeam;
    }
  },

  async updateTeamMembers(teamId: string, payload: { faculty_ids: string[]; student_ids: string[] }): Promise<ProjectTeam> {
    try {
      const response: any = await apiClient.patch(`/collaboration/teams/${teamId}/members`, payload);
      return response.data;
    } catch (err) {
      console.warn(`Backend unavailable, updating team ${teamId} members locally:`, err);
      const teams = getStoredTeams();
      const updated = teams.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            faculty_ids: payload.faculty_ids,
            student_ids: payload.student_ids,
            updated_at: new Date().toISOString(),
          };
        }
        return t;
      });
      saveStoredTeams(updated);
      return updated.find((t) => t.id === teamId)!;
    }
  },

  async createMilestone(payload: { project_id: string; title: string; description?: string; due_date?: string }): Promise<Milestone> {
    try {
      const response: any = await apiClient.post('/collaboration/milestones', payload);
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, creating milestone locally:', err);
      const newMilestone: Milestone = {
        id: `m-${Date.now()}`,
        project_id: payload.project_id,
        title: payload.title,
        description: payload.description,
        due_date: payload.due_date,
        status: 'pending',
        approval_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const list = getStoredMilestones();
      const updated = [...list, newMilestone];
      saveStoredMilestones(updated);
      return newMilestone;
    }
  },

  async submitMilestone(milestoneId: string, deliverable_url: string): Promise<Milestone> {
    try {
      const response: any = await apiClient.patch(`/collaboration/milestones/${milestoneId}/submit`, { deliverable_url });
      return response.data;
    } catch (err) {
      console.warn(`Backend unavailable, submitting deliverable for milestone ${milestoneId} locally:`, err);
      const list = getStoredMilestones();
      const updated = list.map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            deliverable_url,
            status: 'submitted' as const,
            approval_status: 'pending' as const,
            updated_at: new Date().toISOString(),
          };
        }
        return m;
      });
      saveStoredMilestones(updated);
      return updated.find((m) => m.id === milestoneId)!;
    }
  },

  async approveMilestone(milestoneId: string, payload: { approval_status: 'approved' | 'rejected'; approval_notes?: string }): Promise<Milestone> {
    try {
      const response: any = await apiClient.patch(`/collaboration/milestones/${milestoneId}/approve`, payload);
      return response.data;
    } catch (err) {
      console.warn(`Backend unavailable, approving milestone ${milestoneId} locally:`, err);
      const list = getStoredMilestones();
      const updated = list.map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            approval_status: payload.approval_status,
            approval_notes: payload.approval_notes,
            status: payload.approval_status === 'approved' ? ('completed' as const) : ('in_progress' as const),
            updated_at: new Date().toISOString(),
          };
        }
        return m;
      });
      saveStoredMilestones(updated);
      return updated.find((m) => m.id === milestoneId)!;
    }
  },

  async getEngagementsByChallengeId(challengeId: string): Promise<IndustryEngagement[]> {
    const list = getStoredEngagements();
    return list.filter((e) => e.challenge_id === challengeId);
  },

  async createEngagement(payload: { challenge_id: string; engagement_type: string; proposal_notes?: string }): Promise<IndustryEngagement> {
    try {
      const response: any = await apiClient.post('/collaboration/engagements', payload);
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, creating industry engagement locally:', err);
      const newEngagement: IndustryEngagement = {
        id: `e-${Date.now()}`,
        challenge_id: payload.challenge_id,
        industry_id: MOCK_INSTITUTIONS[4].id,
        engagement_type: payload.engagement_type as any,
        status: 'pending',
        proposal_notes: payload.proposal_notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        industry: MOCK_INSTITUTIONS[4],
      };
      const list = getStoredEngagements();
      const updated = [newEngagement, ...list];
      saveStoredEngagements(updated);
      return newEngagement;
    }
  },

  async updateEngagementStatus(engagementId: string, status: 'accepted' | 'declined'): Promise<IndustryEngagement> {
    try {
      const response: any = await apiClient.patch(`/collaboration/engagements/${engagementId}/status`, { status });
      return response.data;
    } catch (err) {
      console.warn(`Backend unavailable, updating engagement ${engagementId} status locally:`, err);
      const list = getStoredEngagements();
      const updated = list.map((e) => {
        if (e.id === engagementId) {
          return {
            ...e,
            status,
            updated_at: new Date().toISOString(),
          };
        }
        return e;
      });
      saveStoredEngagements(updated);
      return updated.find((e) => e.id === engagementId)!;
    }
  }
};
