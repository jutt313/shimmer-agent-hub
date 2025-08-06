
export interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
  testConfig?: {
    base_url: string;
    test_endpoint: {
      path: string;
      method: string;
      headers?: Record<string, string>;
    };
    authentication: {
      type: string;
      location: string;
      parameter_name: string;
      format: string;
    };
    success_indicators: {
      status_codes: number[];
      response_patterns: string[];
    };
    error_patterns: Record<string, string>;
  };
}
