import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, authApi, SignupPayload } from '../api/auth';
import { useUI } from './UIContext';
import { messagingApi } from '../api/messaging';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string, expectedRole?: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showConfirm } = useUI();

  useEffect(() => {
    const savedToken = localStorage.getItem('supabase_access_token');
    const savedUser = localStorage.getItem('user_data');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        localStorage.removeItem('user_data');
        localStorage.removeItem('supabase_access_token');
      }
    } else {
      // Clean up any orphaned local civic data if the user is not authenticated
      localStorage.removeItem('civic_watchlist');
      localStorage.removeItem('supported_challenges');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string, expectedRole?: string) => {
    const res = await authApi.login(email, pass, expectedRole);
    if (res?.session?.access_token) {
      localStorage.setItem('supabase_access_token', res.session.access_token);
      if (res.session.refresh_token) {
        localStorage.setItem('supabase_refresh_token', res.session.refresh_token);
      }
      setToken(res.session.access_token);
    }
    if (res?.user) {
      // Start with login response, then enrich with fresh DB profile (gets org_id, verified, etc.)
      let finalUser = res.user;
      try {
        const freshProfile = await authApi.getProfile();
        if (freshProfile) {
          finalUser = { ...res.user, ...freshProfile };
        }
      } catch {
        // If profile fetch fails, fall back to login response data
      }
      localStorage.setItem('user_data', JSON.stringify(finalUser));
      setUser(finalUser);
    }
  };

  const signup = async (payload: SignupPayload) => {
    const res = await authApi.signup(payload);
    if (res?.session?.access_token) {
      localStorage.setItem('supabase_access_token', res.session.access_token);
      if (res.session.refresh_token) {
        localStorage.setItem('supabase_refresh_token', res.session.refresh_token);
      }
      setToken(res.session.access_token);
    }
    if (res?.user) {
      localStorage.setItem('user_data', JSON.stringify(res.user));
      setUser(res.user);
    }
  };

  const logout = async () => {
    if (!(await showConfirm('Are you sure you want to sign out?'))) return;
    
    // Wipe temporary email messages from backend for security FIRST (before removing token)
    try {
      await messagingApi.deleteAlias();
    } catch (e) {
      console.error('Failed to wipe temporary messages on logout', e);
    }

    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('supabase_refresh_token');
    localStorage.removeItem('user_data');
    
    // Clear localized civic data upon logout to maintain privacy
    localStorage.removeItem('civic_watchlist');
    localStorage.removeItem('supported_challenges');
    
    // Also clear from local storage
    sessionStorage.removeItem('student_temp_mail');
    sessionStorage.removeItem('student_temp_mail_key');
    
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
