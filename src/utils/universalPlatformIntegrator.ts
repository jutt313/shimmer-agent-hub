
import { supabase } from '@/integrations/supabase/client';

// UNIVERSAL PLATFORM INTEGRATION SYSTEM
// This system can dynamically integrate with ANY platform's API

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, Record<string, {
    summary?: string;
    description?: string;
    parameters?: Array<{
      name: string;
      in: string;
      required?: boolean;
      schema: any;
    }>;
    requestBody?: {
      content: Record<string, any>;
    };
    responses: Record<string, any>;
  }>>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export interface UniversalPlatformConfig {
  name: string;
  api_spec: OpenAPISpec;
  auth_config: {
    type: 'bearer' | 'api_key' | 'oauth2' | 'basic';
    location: 'header' | 'query' | 'body';
    parameter_name: string;
    format?: string;
  };
  rate_limits: {
    requests_per_second: number;
    requests_per_minute: number;
    requests_per_hour: number;
  };
  endpoints: Record<string, {
    method: string;
    path: string;
    required_params: string[];
    optional_params: string[];
    response_schema: any;
  }>;
}

export class UniversalPlatformIntegrator {
  private platformConfigs = new Map<string, UniversalPlatformConfig>();
  private rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    console.log('🌍 Universal Platform Integrator initialized');
  }

  // DYNAMICALLY DISCOVER AND INTEGRATE PLATFORMS
  async discoverPlatform(platformName: string, apiDocumentationUrl?: string): Promise<UniversalPlatformConfig> {
    console.log(`🔍 Discovering platform: ${platformName}`);

    // Try to fetch OpenAPI spec from common locations
    const possibleUrls = [
      apiDocumentationUrl,
      `https://api.${platformName.toLowerCase()}.com/openapi.json`,
      `https://api.${platformName.toLowerCase()}.com/swagger.json`,
      `https://${platformName.toLowerCase()}.com/api/docs/openapi.json`,
      `https://developers.${platformName.toLowerCase()}.com/openapi.json`
    ].filter(Boolean);

    for (const url of possibleUrls) {
      try {
        console.log(`📡 Attempting to fetch API spec from: ${url}`);
        const response = await fetch(url!);
        
        if (response.ok) {
          const spec: OpenAPISpec = await response.json();
          const config = this.parseOpenAPISpec(platformName, spec);
          this.platformConfigs.set(platformName.toLowerCase(), config);
          
          console.log(`✅ Platform ${platformName} discovered and configured`);
          return config;
        }
      } catch (error: any) {
        console.log(`⚠️ Failed to fetch from ${url}:`, error.message);
      }
    }

    // If auto-discovery fails, create a generic configuration
    console.log(`🔧 Creating generic configuration for ${platformName}`);
    return this.createGenericConfig(platformName);
  }

  private parseOpenAPISpec(platformName: string, spec: OpenAPISpec): UniversalPlatformConfig {
    console.log(`📋 Parsing OpenAPI spec for ${platformName}`);

    const baseUrl = spec.servers?.[0]?.url || `https://api.${platformName.toLowerCase()}.com`;
    const endpoints: Record<string, any> = {};

    // Parse all endpoints from the OpenAPI spec
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, details]) => {
        const endpointName = this.generateEndpointName(path, method);
        
        endpoints[endpointName] = {
          method: method.toUpperCase(),
          path: path,
          required_params: this.extractRequiredParams(details.parameters || []),
          optional_params: this.extractOptionalParams(details.parameters || []),
          response_schema: details.responses?.['200'] || {}
        };
      });
    });

    // Detect authentication scheme
    const authConfig = this.detectAuthConfig(spec);

    return {
      name: platformName,
      api_spec: spec,
      auth_config: authConfig,
      rate_limits: {
        requests_per_second: 10,  // Conservative defaults
        requests_per_minute: 100,
        requests_per_hour: 1000
      },
      endpoints
    };
  }

  private createGenericConfig(platformName: string): UniversalPlatformConfig {
    return {
      name: platformName,
      api_spec: {
        openapi: '3.0.0',
        info: { title: platformName, version: '1.0.0' },
        servers: [{ url: `https://api.${platformName.toLowerCase()}.com` }],
        paths: {}
      },
      auth_config: {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {token}'
      },
      rate_limits: {
        requests_per_second: 5,
        requests_per_minute: 50,
        requests_per_hour: 500
      },
      endpoints: {
        'generic_api_call': {
          method: 'POST',
          path: '/api/v1/generic',
          required_params: [],
          optional_params: [],
          response_schema: {}
        }
      }
    };
  }

  private detectAuthConfig(spec: OpenAPISpec): any {
    const securitySchemes = spec.components?.securitySchemes;
    
    if (securitySchemes) {
      const firstScheme = Object.values(securitySchemes)[0] as any;
      
      if (firstScheme?.type === 'http' && firstScheme?.scheme === 'bearer') {
        return {
          type: 'bearer',
          location: 'header',
          parameter_name: 'Authorization',
          format: 'Bearer {token}'
        };
      } else if (firstScheme?.type === 'apiKey') {
        return {
          type: 'api_key',
          location: firstScheme.in,
          parameter_name: firstScheme.name,
          format: '{token}'
        };
      }
    }

    // Default to bearer token
    return {
      type: 'bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {token}'
    };
  }

  private generateEndpointName(path: string, method: string): string {
    return `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}`;
  }

  private extractRequiredParams(parameters: any[]): string[] {
    return parameters.filter(p => p.required).map(p => p.name);
  }

  private extractOptionalParams(parameters: any[]): string[] {
    return parameters.filter(p => !p.required).map(p => p.name);
  }

  // UNIVERSAL API CALLER
  async callPlatformAPI(
    platformName: string,
    endpointName: string,
    parameters: Record<string, any>,
    credentials: Record<string, string>
  ): Promise<any> {
    console.log(`🚀 Making API call to ${platformName}.${endpointName}`);

    let config = this.platformConfigs.get(platformName.toLowerCase());
    
    if (!config) {
      console.log(`🔍 Platform ${platformName} not configured, discovering...`);
      config = await this.discoverPlatform(platformName);
    }

    const endpoint = config.endpoints[endpointName];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointName} not found for platform ${platformName}`);
    }

    // Check rate limits
    if (!this.checkRateLimit(platformName, config.rate_limits)) {
      throw new Error(`Rate limit exceeded for platform ${platformName}`);
    }

    // Build request URL
    const baseUrl = config.api_spec.servers[0]?.url || `https://api.${platformName.toLowerCase()}.com`;
    let url = baseUrl + endpoint.path;

    // Replace path parameters
    Object.entries(parameters).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });

    // Build headers with authentication
    const headers = await this.buildAuthHeaders(config.auth_config, credentials);

    // Build request options
    const requestOptions: RequestInit = {
      method: endpoint.method,
      headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      requestOptions.body = JSON.stringify(parameters);
    } else if (endpoint.method === 'GET') {
      // Add query parameters for GET requests
      const queryParams = new URLSearchParams();
      Object.entries(parameters).forEach(([key, value]) => {
        if (!url.includes(`{${key}}`)) {
          queryParams.append(key, String(value));
        }
      });
      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }
    }

    console.log(`📡 Making ${endpoint.method} request to: ${url}`);

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ API call successful`);
      
      return result;
    } catch (error) {
      console.error(`❌ API call failed:`, error);
      throw error;
    }
  }

  private async buildAuthHeaders(authConfig: any, credentials: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Universal-Integrator/1.0'
    };

    // Apply authentication
    switch (authConfig.type) {
      case 'bearer':
        const token = credentials.access_token || credentials.token || credentials.api_key;
        if (token) {
          headers[authConfig.parameter_name] = authConfig.format.replace('{token}', token);
        }
        break;
        
      case 'api_key':
        const apiKey = credentials.api_key || credentials.key;
        if (apiKey) {
          if (authConfig.location === 'header') {
            headers[authConfig.parameter_name] = authConfig.format.replace('{token}', apiKey);
          }
        }
        break;
        
      case 'basic':
        const username = credentials.username;
        const password = credentials.password;
        if (username && password) {
          const basicAuth = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${basicAuth}`;
        }
        break;
    }

    return headers;
  }

  private checkRateLimit(platformName: string, limits: any): boolean {
    const now = Date.now();
    const key = platformName.toLowerCase();
    const tracker = this.rateLimitTracker.get(key);

    if (!tracker || now > tracker.resetTime) {
      this.rateLimitTracker.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return true;
    }

    if (tracker.count >= limits.requests_per_minute) {
      return false;
    }

    tracker.count++;
    return true;
  }

  // GET PLATFORM CONFIGURATION
  getPlatformConfig(platformName: string): UniversalPlatformConfig | null {
    return this.platformConfigs.get(platformName.toLowerCase()) || null;
  }

  // LIST ALL CONFIGURED PLATFORMS
  getConfiguredPlatforms(): string[] {
    return Array.from(this.platformConfigs.keys());
  }
}

// GLOBAL INSTANCE
export const universalIntegrator = new UniversalPlatformIntegrator();

// INTEGRATION WITH EXISTING SYSTEM
export const buildUniversalPlatformConfig = async (
  platformName: string,
  credentials: Record<string, string>
): Promise<any> => {
  console.log(`🌍 Building universal config for: ${platformName}`);
  
  const config = await universalIntegrator.discoverPlatform(platformName);
  
  return {
    baseURL: config.api_spec.servers[0]?.url || `https://api.${platformName.toLowerCase()}.com`,
    headers: await universalIntegrator.buildAuthHeaders(config.auth_config, credentials),
    timeout: 30000,
    platform_config: config
  };
};
