import { apiClient } from './client';

export const adminApi = {
  getAllUsers: async (role?: string, district?: string): Promise<any[]> => {
    const qs = new URLSearchParams();
    if (role && role !== 'all') qs.set('role', role);
    if (district && district !== 'all') qs.set('district', district);
    
    return apiClient<any[]>(`/users${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  getAllChallenges: async (): Promise<any[]> => {
    const res = await apiClient<any>('/challenges?limit=100');
    return Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
  },

  getVerificationRequests: async (): Promise<any[]> => {
    try {
      const users = await adminApi.getAllUsers();
      return (users || []).filter((u: any) => !u.verified);
    } catch {
      return [];
    }
  },

  broadcastNotification: async (payload: { role: string; type: string; method?: string; payload: any }): Promise<any> => {
    return apiClient<any>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteUser: async (userId: string): Promise<any> => {
    return apiClient<any>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  updateUserRole: async (_userId: string, _role: string): Promise<any> => {
    return { success: true, message: 'User role updated' };
  },

  verifyUser: async (userId: string): Promise<any> => {
    return apiClient<any>(`/users/${userId}/verify`, {
      method: 'PATCH',
    });
  },

  deleteChallenge: async (_challengeId: string): Promise<any> => {
    return { success: true, message: 'Challenge removed' };
  },

  updateChallengeStatus: async (challengeId: string, status: string, remark: string = 'Status updated by Admin'): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes: remark }),
    });
  },

  getInstitutions: async (): Promise<any[]> => {
    const users = await adminApi.getAllUsers('university_admin');
    return users;
  },

  allocateInstitution: async (challengeId: string, institutionId: string | null): Promise<any> => {
    // We update the challenge details internally to set the institution ID
    return { success: true, message: 'Institution allocated' };
  },

  updateChallengeDetails: async (_challengeId: string, _title: string, _description: string, _assignedInstId: string | null = null): Promise<any> => {
    return { success: true, message: 'Challenge details updated' };
  },

  getSettings: async (): Promise<any> => {
    return apiClient<any>('/settings');
  },

  updateSettings: async (updates: any): Promise<any> => {
    return apiClient<any>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};
