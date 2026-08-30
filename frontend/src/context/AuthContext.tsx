import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/auth.types';
import { apiClient } from '../services/api';
import { DEMO_USERS } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password?: string }) => Promise<void>;
  signup: (formData: any) => Promise<void>;
  logout: () => void;
  switchPersona: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('sih_user');
    const storedToken = localStorage.getItem('sih_access_token');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(DEMO_USERS.citizen);
      }
    } else {
      // Default to guest/citizen preview demo user
      setUser(DEMO_USERS.citizen);
      localStorage.setItem('sih_user', JSON.stringify(DEMO_USERS.citizen));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password?: string }) => {
    setIsLoading(true);
    try {
      const res: any = await apiClient.post('/auth/login', credentials);
      if (res.data?.session?.access_token) {
        localStorage.setItem('sih_access_token', res.data.session.access_token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('sih_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Backend login failed, matching demo persona fallback:', err);
      const matched = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === credentials.email.toLowerCase()) || DEMO_USERS.citizen;
      setUser(matched);
      localStorage.setItem('sih_user', JSON.stringify(matched));
      localStorage.setItem('sih_access_token', `demo-token-${matched.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (formData: any) => {
    setIsLoading(true);
    try {
      const res: any = await apiClient.post('/auth/signup', formData);
      if (res.data?.session?.access_token) {
        localStorage.setItem('sih_access_token', res.data.session.access_token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('sih_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Backend signup failed, creating local user profile:', err);
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role || 'citizen',
        org_id: formData.org_id,
        district: formData.district || 'Ranchi',
        contact: formData.contact,
        verified: formData.role === 'citizen',
      };
      setUser(newUser);
      localStorage.setItem('sih_user', JSON.stringify(newUser));
      localStorage.setItem('sih_access_token', `demo-token-${newUser.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sih_access_token');
    localStorage.removeItem('sih_user');
    setUser(null);
  };

  const switchPersona = (newRole: UserRole) => {
    const demoUser = DEMO_USERS[newRole] || DEMO_USERS.citizen;
    setUser(demoUser);
    localStorage.setItem('sih_user', JSON.stringify(demoUser));
    localStorage.setItem('sih_access_token', `demo-token-${demoUser.id}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'citizen',
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        switchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
