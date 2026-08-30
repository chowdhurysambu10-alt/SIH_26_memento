import { apiClient } from './api';
import { User } from '../types/auth.types';
import { DEMO_USERS } from './mockData';

const LOCAL_USERS_KEY = 'sih_mock_users_store';

function getStoredUsers(): User[] {
  const s = localStorage.getItem(LOCAL_USERS_KEY);
  return s ? JSON.parse(s) : Object.values(DEMO_USERS);
}
function saveStoredUsers(u: User[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(u));
}

export const usersService = {
  async getMe(): Promise<User> {
    try {
      const response: any = await apiClient.get('/users/me');
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, using active local session user:', err);
      const stored = localStorage.getItem('sih_user');
      if (stored) return JSON.parse(stored);
      return DEMO_USERS.citizen;
    }
  },

  async updateMe(payload: Partial<User>): Promise<User> {
    try {
      const response: any = await apiClient.patch('/users/me', payload);
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, updating active profile locally:', err);
      const stored = localStorage.getItem('sih_user');
      const currentUser = stored ? JSON.parse(stored) : DEMO_USERS.citizen;
      const updated = { ...currentUser, ...payload };
      localStorage.setItem('sih_user', JSON.stringify(updated));
      return updated;
    }
  },

  async getUsers(params?: { role?: string; district?: string }): Promise<User[]> {
    try {
      const response: any = await apiClient.get('/users', { params });
      return response.data || [];
    } catch (err) {
      console.warn('Backend unavailable, fetching users from fallback list:', err);
      let list = getStoredUsers();
      if (params?.role) {
        list = list.filter((u) => u.role === params.role);
      }
      if (params?.district) {
        list = list.filter((u) => u.district?.toLowerCase() === params.district?.toLowerCase());
      }
      return list;
    }
  },

  async verifyUser(id: string): Promise<User> {
    try {
      const response: any = await apiClient.patch(`/users/${id}/verify`);
      return response.data;
    } catch (err) {
      console.warn(`Backend unavailable, verifying user ${id} locally:`, err);
      const list = getStoredUsers();
      const updated = list.map((u) => (u.id === id ? { ...u, verified: true } : u));
      saveStoredUsers(updated);
      return updated.find((u) => u.id === id)!;
    }
  }
};
