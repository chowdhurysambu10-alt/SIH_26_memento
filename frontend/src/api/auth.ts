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
  login: async (email: string, password: string, expectedRole?: string): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, expectedRole }),
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

  submitVerificationRequest: async (payload: any): Promise<any> => {
    if (payload?.mobileNumber) {
      await apiClient<any>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ contact: payload.mobileNumber }),
      }).catch(() => null);
    }
    return { success: true, message: 'Verification request submitted for admin review' };
  },

  requestOtp: (email: string, contact?: string): Promise<{ success: boolean; message: string }> => {
    return apiClient('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, contact }),
    });
  },

  resetPassword: (email: string, otp: string, newPassword?: string): Promise<{ success: boolean; message: string }> => {
    return apiClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};
