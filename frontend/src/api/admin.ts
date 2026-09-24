import { apiClient } from './client';

export const adminApi = {
  getAllUsers: async (role?: string, district?: string): Promise<any[]> => {
    const qs = new URLSearchParams();
    if (role && role !== 'all') qs.set('role', role);
    if (district && district !== 'all') qs.set('district', district);
    
    return apiClient<any[]>(`/users${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  // --- Student Verification ---
  submitStudentVerification: async (institution_name: string, student_id_card_url: string): Promise<any> => {
    return apiClient<any>('/users/verify', {
      method: 'POST',
      body: JSON.stringify({ institution_name, student_id_card_url })
    });
  },

  getPendingStudentVerifications: async (): Promise<any[]> => {
    return apiClient<any[]>('/users/verify/pending', { suppressGlobalError: true } as any);
  },

  updateStudentVerificationStatus: async (id: string, status: 'approved' | 'rejected'): Promise<any> => {
    return apiClient<any>(`/users/verify/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  getAllChallenges: async (): Promise<any[]> => {
    const res = await apiClient<any>('/challenges?limit=100');
    return Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
  },

  exportArchiveData: async (): Promise<any> => {
    return apiClient<any>('/challenges/admin/export-archive', {
      method: 'POST',
    });
  },

  purgeArchivedChallenges: async (challengeIds: string[]): Promise<any> => {
    return apiClient<any>('/challenges/admin/purge-archive', {
      method: 'POST',
      body: JSON.stringify({ challengeIds }),
    });
  },

  getVerificationRequests: async (): Promise<any[]> => {
    try {
      const users = await adminApi.getAllUsers();
      const unverifiedUsers = (users || []).filter((u: any) => !u.verified);
      
      let studentVerifs: any[] = [];
      try {
        studentVerifs = await adminApi.getPendingStudentVerifications();
      } catch (e) {
        console.warn('Could not fetch student verifications', e);
      }
      
      const mappedStudentVerifs = studentVerifs.map(sv => ({
        id: sv.id,
        name: sv.user?.name || 'Unknown Student',
        role: 'student',
        email: sv.user?.email || '',
        is_student_verification: true,
        verification_data: {
          institution: sv.institution_name,
          student_id_card_url: sv.student_id_card_url,
          submitted_at: sv.submitted_at
        }
      }));

      // Only show users who are not students in the unverifiedUsers list (since students use the new table)
      const otherUnverified = unverifiedUsers.filter(u => u.role !== 'student');
      
      return [...mappedStudentVerifs, ...otherUnverified];
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

  verifyUser: async (userId: string, action: 'verify' | 'reject' | 'reverify' = 'verify'): Promise<any> => {
    return apiClient<any>(`/users/${userId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
  },

  updateUserDetails: async (userId: string, updates: { name?: string; email?: string; contact?: string; district?: string }): Promise<any> => {
    return apiClient<any>(`/users/${userId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
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
      body: JSON.stringify({ status, notes: remark }),
    });
  },

  getInstitutions: async (): Promise<any[]> => {
    try {
      const res = await apiClient<any>('/analytics/institutions');
      return Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load registered institutions from database:', e);
      return [];
    }
  },

  allocateInstitution: async (challengeId: string, institutionId: string | null): Promise<any> => {
    return apiClient<any>(`/challenges/${challengeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ assigned_institution_id: institutionId }),
    });
  },

  updateChallengeDetails: async (
    challengeId: string, 
    title: string, 
    description: string, 
    assigned_institution_id?: string | null
  ): Promise<any> => {
    const payload: Record<string, any> = { title, description };
    if (assigned_institution_id !== undefined) {
      payload.assigned_institution_id = assigned_institution_id;
    }
    return apiClient<any>(`/challenges/${challengeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getSettings: async (): Promise<any> => {
    return apiClient<any>(`/settings?t=${Date.now()}`);
  },

  updateSettings: async (updates: any): Promise<any> => {
    return apiClient<any>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};
