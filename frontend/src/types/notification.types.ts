export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  payload: {
    challenge_id?: string;
    title?: string;
    message?: string;
    action_url?: string;
    institution_name?: string;
    [key: string]: any;
  };
  read_status: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errorCode: string;
  timestamp: string;
}
