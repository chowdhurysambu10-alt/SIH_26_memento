import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notifications';
import { useAuth } from '../context/AuthContext';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.getMyNotifications();
      // Map backend shape to AppNotification
      const mapped: AppNotification[] = data.map((n: any) => ({
        id: n.id,
        title: n.payload?.title || n.type,
        body: n.payload?.message || n.payload?.body || JSON.stringify(n.payload),
        timestamp: new Date(n.created_at).getTime(),
        isRead: n.read_status
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const addNotification = useCallback((title: string, body: string) => {
    // Local optimistic add only (for client-side only alerts if needed)
    const newNotif: AppNotification = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title,
      body,
      timestamp: Date.now(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const deleteNotifications = useCallback(async (ids: string[]) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    // API call
    try {
      await Promise.all(ids.map(id => notificationsApi.delete(id)));
    } catch (e) {
      fetchNotifications(); // revert on fail
    }
  }, [fetchNotifications]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      await notificationsApi.deleteAll();
    } catch (e) {
      fetchNotifications();
    }
  }, [fetchNotifications]);
  
  const markAsRead = useCallback(async (ids: string[]) => {
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n));
    try {
      await Promise.all(ids.map(id => notificationsApi.markAsRead(id)));
    } catch (e) {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return {
    notifications,
    addNotification,
    deleteNotifications,
    clearAll,
    markAsRead,
    refresh: fetchNotifications
  };
};
