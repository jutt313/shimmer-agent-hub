
export interface ApiToken {
  id: string;
  token_name: string;
  token_description: string | null;
  connection_purpose: string | null;
  token_type: string;
  permissions: {
    read: boolean;
    write: boolean;
    webhook: boolean;
    notifications: boolean;
    full_control: boolean;
    platform_connections: boolean;
  };
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
  user_id: string;
}

export interface ApiError {
  id: string;
  error_type: string;
  error_message: string;
  endpoint?: string;
  created_at: string;
  severity: string;
  stack_trace?: string;
  context?: any;
}

export interface DashboardStats {
  totalCalls: number;
  successRate: number;
  activeWebhooks: number;
  totalErrors: number;
}

export interface ApiUsageData {
  date: string;
  calls: number;
  success: number;
  errors: number;
}

export interface TestApiResult {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: any;
  responseTime?: number;
  error?: string;
}
