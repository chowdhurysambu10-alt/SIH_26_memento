import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, authApi, SignupPayload } from '../api/auth';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await authApi.login(email, pass);
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

  const logout = () => {
    if (!window.confirm('Are you sure you want to sign out?')) return;
    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('supabase_refresh_token');
    localStorage.removeItem('user_data');
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
