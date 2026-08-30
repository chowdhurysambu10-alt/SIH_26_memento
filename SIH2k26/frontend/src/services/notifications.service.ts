import { apiClient } from './api';
import { Notification } from '../types/notification.types';
import { MOCK_NOTIFICATIONS } from './mockData';

const LOCAL_NOTIFICATIONS_KEY = 'sih_mock_notifications_store';

function getStoredNotifications(): Notification[] {
  const s = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
  return s ? JSON.parse(s) : MOCK_NOTIFICATIONS;
}
function saveStoredNotifications(n: Notification[]) {
  localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(n));
}

export const notificationsService = {
  async getNotifications(unreadOnly = false): Promise<Notification[]> {
    try {
      const response: any = await apiClient.get('/notifications', { params: { unreadOnly } });
      return response.data || [];
    } catch (err) {
      console.warn('Backend unavailable, using local notifications store fallback:', err);
      let list = getStoredNotifications();
      if (unreadOnly) {
        list = list.filter((n) => !n.read_status);
      }
      return list;
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.warn(`Backend unavailable, marking notification ${id} read locally:`, err);
      const list = getStoredNotifications();
      const updated = list.map((n) => (n.id === id ? { ...n, read_status: true } : n));
      saveStoredNotifications(updated);
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch('/notifications/read-all');
    } catch (err) {
      console.warn('Backend unavailable, marking all notifications read locally:', err);
      const list = getStoredNotifications();
      const updated = list.map((n) => ({ ...n, read_status: true }));
      saveStoredNotifications(updated);
    }
  }
};
