import { apiClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  org_id?: string | null;
  district?: string | null;
  verified?: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export interface AuthResponse {
  user: AuthUser;
  session: AuthSession;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  role: string;
  district?: string;
  org_id?: string;
  contact?: string;
}

export const authApi = {
  login: (email: string, password: string): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup: (payload: SignupPayload): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getProfile: (): Promise<AuthUser> => {
    return apiClient<AuthUser>('/users/me');
  },
};
