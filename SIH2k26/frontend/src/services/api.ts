import axios, { AxiosError } from 'axios';

// Base URL: Connects to local NestJS backend API or relative proxy
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sih_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap standard response & map error envelopes
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError<any>) => {
    // 401 Unauthorized handling
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/');
      if (!isAuthRequest) {
        // Token expired or invalid
        localStorage.removeItem('sih_access_token');
        localStorage.removeItem('sih_user');
      }
    }

    const customError = error.response?.data || {
      statusCode: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      errorCode: error.response?.data?.errorCode || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(customError);
  }
);
