
// Enhanced platform type definitions for the credential system
export interface PlatformCredential {
  field: string;
  placeholder: string;
  link: string;
  why_needed: string;
}

export interface TestPayload {
  platform: string;
  test_data: Record<string, any>;
  field_mapping: Record<string, string>;
  api_config: {
    endpoint?: string;
    method?: string;
    headers?: Record<string, string>;
    base_url?: string;
  };
}

export interface Platform {
  name: string;
  credentials: PlatformCredential[];
  test_payloads?: TestPayload[];
}

export interface CredentialStatus {
  configured: boolean;
  tested: boolean;
  status: 'not_configured' | 'saved' | 'tested' | 'success' | 'error' | 'untested';
}

export interface EnhancedTestResult {
  success: boolean;
  message: string;
  test_duration?: number;
  timestamp?: string;
  details?: {
    status: number;
    endpoint_tested: string;
    ai_generated_config: boolean;
    platform_name: string;
    api_response: any;
    headers_used: Record<string, string>;
    config_source: string;
  };
  error_type?: string;
  troubleshooting?: string[];
}
