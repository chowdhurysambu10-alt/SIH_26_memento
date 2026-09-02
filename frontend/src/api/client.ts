const API_BASE_URL = '/api/v1';
import { dispatchNetworkStart, dispatchNetworkEnd, dispatchNetworkError } from '../utils/networkEvents';

export interface ApiResponse<T = any> {
  statusCode: number;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  timestamp?: string;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('supabase_access_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Auto-set Content-Type for JSON payloads if not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  dispatchNetworkStart();
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const resData = await res.json().catch(() => null);

    if (!res.ok) {
      let errorMsg = 'An unexpected error occurred';
      if (resData?.message) {
        errorMsg = Array.isArray(resData.message) ? resData.message.join(', ') : resData.message;
      }
      
      if (res.status === 401 && errorMsg.toLowerCase().includes('token')) {
        // Auto-logout if token is invalid/expired
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_refresh_token');
        localStorage.removeItem('user_data');
        window.location.reload();
      } else {
        dispatchNetworkError(errorMsg);
      }
      throw new Error(errorMsg);
    }

    // Return unnested data from TransformInterceptor if present
    if (resData && typeof resData === 'object' && 'data' in resData) {
      return resData.data as T;
    }

    return resData as T;
  } catch (error: any) {
    // If it's a TypeError from fetch, it means network failed completely (e.g., offline or server down)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      dispatchNetworkError('Network error. Please check your internet connection.');
    }
    throw error;
  } finally {
    dispatchNetworkEnd();
  }
}
