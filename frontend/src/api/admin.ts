import { apiClient } from './client';

export const adminApi = {
  getAllUsers: async (role?: string, district?: string): Promise<any[]> => {
    const qs = new URLSearchParams();
    if (role && role !== 'all') qs.set('role', role);
    if (district && district !== 'all') qs.set('district', district);
    
    return apiClient<any[]>(`/users${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  getAllChallenges: async (): Promise<any[]> => {
    return apiClient<any[]>('/challenges');
  },

  getVerificationRequests: async (): Promise<any[]> => {
    return apiClient<any[]>('/users/verification-requests');
  },

  broadcastNotification: async (payload: { role: string; type: string; payload: any }): Promise<any> => {
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

  updateUserRole: async (userId: string, role: string): Promise<any> => {
    return apiClient<any>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  verifyUser: async (userId: string): Promise<any> => {
    return apiClient<any>(`/users/${userId}/verify`, {
      method: 'PATCH',
    });
  },

  deleteChallenge: async (challengeId: string): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}`, {
      method: 'DELETE',
    });
  },

  updateChallengeStatus: async (challengeId: string, status: string, remark: string = 'Status updated by Admin'): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remark }),
    });
  },

  updateChallengeDetails: async (challengeId: string, title: string, description: string): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, description }),
    });
  },
};
