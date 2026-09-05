import { apiClient } from './client';

export const notificationsApi = {
  getMyNotifications: async (unreadOnly?: boolean): Promise<any[]> => {
    return apiClient<any[]>(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
  },

  markAsRead: async (id: string): Promise<any> => {
    return apiClient<any>(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllAsRead: async (): Promise<any> => {
    return apiClient<any>(`/notifications/read-all`, { method: 'PATCH' });
  },

  delete: async (id: string): Promise<any> => {
    return notificationsApi.markAsRead(id);
  },

  deleteAll: async (): Promise<any> => {
    return notificationsApi.markAllAsRead();
  }
};
