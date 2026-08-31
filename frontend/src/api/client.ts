const API_BASE_URL = '/api/v1';

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
    throw new Error(errorMsg);
  }

  // Return unnested data from TransformInterceptor if present
  if (resData && typeof resData === 'object' && 'data' in resData) {
    return resData.data as T;
  }

  return resData as T;
}
