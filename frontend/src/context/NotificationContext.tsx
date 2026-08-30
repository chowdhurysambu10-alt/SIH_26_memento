import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../types/notification.types';
import { notificationsService } from '../services/notifications.service';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addToast: (toast: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void;
  toasts: Array<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>>([]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s poll
    return () => clearInterval(interval);
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  const markAsRead = async (id: string) => {
    await notificationsService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_status: true } : n)));
  };

  const markAllAsRead = async () => {
    await notificationsService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
  };

  const addToast = (toast: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { id, title: toast.title, message: toast.message, type: toast.type || 'info' };
    setToasts((prev) => [newToast, ...prev]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isDrawerOpen,
        setIsDrawerOpen,
        markAsRead,
        markAllAsRead,
        addToast,
        toasts,
        removeToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
