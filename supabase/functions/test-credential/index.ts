
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// UNIVERSAL PLATFORM INTEGRATOR WITH OAUTH2 SUPPORT
class UniversalPlatformIntegrator {
  private platformConfigs = new Map<string, any>();

  async discoverPlatform(platformName: string): Promise<any> {
    console.log(`🔍 Dynamically discovering platform: ${platformName}`);

    // Try to fetch OpenAPI spec from common locations
    const possibleUrls = [
      `https://api.${platformName.toLowerCase()}.com/openapi.json`,
      `https://api.${platformName.toLowerCase()}.com/swagger.json`,
      `https://${platformName.toLowerCase()}.com/api/docs/openapi.json`,
      `https://developers.${platformName.toLowerCase()}.com/openapi.json`,
      `https://docs.${platformName.toLowerCase()}.com/openapi.json`
    ];

    for (const url of possibleUrls) {
      try {
        console.log(`📡 Attempting to fetch API spec from: ${url}`);
        const response = await fetch(url);
        
        if (response.ok) {
          const spec = await response.json();
          const config = this.parseOpenAPISpec(platformName, spec);
          this.platformConfigs.set(platformName.toLowerCase(), config);
          
          console.log(`✅ Platform ${platformName} discovered and configured dynamically`);
          return config;
        }
      } catch (error: any) {
        console.log(`⚠️ Failed to fetch from ${url}:`, error.message);
      }
    }

    // Create intelligent fallback configuration
    console.log(`🔧 Creating intelligent fallback configuration for ${platformName}`);
    return this.createIntelligentFallback(platformName);
  }

  private parseOpenAPISpec(platformName: string, spec: any): any {
    const baseUrl = spec.servers?.[0]?.url || this.getBaseUrlForPlatform(platformName);
    const endpoints: Record<string, any> = {};

    // Parse all endpoints from the OpenAPI spec
    Object.entries(spec.paths || {}).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
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

    return {
      name: platformName,
      base_url: baseUrl,
      auth_config: this.detectAuthConfig(spec),
      endpoints,
      test_endpoint: this.findBestTestEndpoint(endpoints, platformName)
    };
  }

  private createIntelligentFallback(platformName: string): any {
    const lowerPlatform = platformName.toLowerCase();
    return {
      name: platformName,
      base_url: this.getBaseUrlForPlatform(platformName),
      auth_config: this.getAuthConfigForPlatform(platformName),
      endpoints: {},
      test_endpoint: this.getTestEndpointForPlatform(platformName)
    };
  }

  private getBaseUrlForPlatform(platformName: string): string {
    const lowerPlatform = platformName.toLowerCase();
    
    const platformUrls: Record<string, string> = {
      'slack': 'https://slack.com/api',
      'gmail': 'https://www.googleapis.com/gmail/v1',
      'google sheets': 'https://sheets.googleapis.com/v4',
      'google_sheets': 'https://sheets.googleapis.com/v4',
      'googlesheets': 'https://sheets.googleapis.com/v4',
      'trello': 'https://api.trello.com/1',
      'notion': 'https://api.notion.com/v1',
      'openai': 'https://api.openai.com/v1',
      'anthropic': 'https://api.anthropic.com/v1',
      'github': 'https://api.github.com',
      'stripe': 'https://api.stripe.com/v1',
      'discord': 'https://discord.com/api/v10'
    };

    return platformUrls[lowerPlatform] || `https://api.${lowerPlatform}.com`;
  }

  private getAuthConfigForPlatform(platformName: string): any {
    const lowerPlatform = platformName.toLowerCase();
    
    const authConfigs: Record<string, any> = {
      'slack': {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {bot_token}'
      },
      'gmail': {
        type: 'oauth2',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}',
        oauth2_endpoint: 'https://oauth2.googleapis.com/token'
      },
      'google sheets': {
        type: 'oauth2',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}',
        oauth2_endpoint: 'https://oauth2.googleapis.com/token'
      },
      'google_sheets': {
        type: 'oauth2',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}',
        oauth2_endpoint: 'https://oauth2.googleapis.com/token'
      },
      'googlesheets': {
        type: 'oauth2',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}',
        oauth2_endpoint: 'https://oauth2.googleapis.com/token'
      },
      'trello': {
        type: 'api_key',
        location: 'query',
        parameter_name: 'key',
        format: '{api_key}'
      },
      'openai': {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {api_key}'
      }
    };

    return authConfigs[lowerPlatform] || {
      type: 'bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {token}'
    };
  }

  private getTestEndpointForPlatform(platformName: string): any {
    const lowerPlatform = platformName.toLowerCase();
    
    const testEndpoints: Record<string, any> = {
      'slack': {
        method: 'GET',
        path: '/auth.test',
        description: 'Test Slack authentication'
      },
      'gmail': {
        method: 'GET',
        path: '/users/me/profile',
        description: 'Get Gmail user profile'
      },
      'google sheets': {
        method: 'GET',
        path: '/spreadsheets/{spreadsheet_id}',
        description: 'Get Google Sheets spreadsheet details',
        requires_spreadsheet_id: true
      },
      'google_sheets': {
        method: 'GET',
        path: '/spreadsheets/{spreadsheet_id}',
        description: 'Get Google Sheets spreadsheet details',
        requires_spreadsheet_id: true
      },
      'googlesheets': {
        method: 'GET',
        path: '/spreadsheets/{spreadsheet_id}',
        description: 'Get Google Sheets spreadsheet details',
        requires_spreadsheet_id: true
      },
      'trello': {
        method: 'GET',
        path: '/members/me',
        description: 'Get Trello user info'
      },
      'notion': {
        method: 'GET',
        path: '/users/me',
        description: 'Get Notion user info'
      },
      'openai': {
        method: 'GET',
        path: '/models',
        description: 'List available OpenAI models'
      }
    };

    return testEndpoints[lowerPlatform] || {
      method: 'GET',
      path: '/user',
      description: 'Generic user info endpoint'
    };
  }

  // OAUTH2 TOKEN EXCHANGE
  async getOAuth2AccessToken(
    clientId: string,
    clientSecret: string,
    oauth2Endpoint: string
  ): Promise<{ success: boolean; access_token?: string; error?: string }> {
    try {
      console.log(`🔑 Exchanging OAuth2 credentials for access token`);
      
      const response = await fetch(oauth2Endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://www.googleapis.com/auth/spreadsheets.readonly'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `OAuth2 token exchange failed: ${response.status} ${errorText}`
        };
      }

      const tokenData = await response.json();
      return {
        success: true,
        access_token: tokenData.access_token
      };
    } catch (error: any) {
      return {
        success: false,
        error: `OAuth2 token exchange error: ${error.message}`
      };
    }
  }

  async testPlatformCredentials(
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string; details?: any; error_type?: string }> {
    try {
      console.log(`🧪 UNIVERSAL TESTING: ${platformName} with credentials:`, Object.keys(credentials));
      
      let config = this.platformConfigs.get(platformName.toLowerCase());
      
      if (!config) {
        console.log(`🔍 Platform ${platformName} not configured, discovering...`);
        config = await this.discoverPlatform(platformName);
      }

      const testEndpoint = config.test_endpoint;
      const baseUrl = config.base_url;
      
      // Handle OAuth2 platforms (Google Sheets, Gmail, etc.)
      let accessToken = '';
      if (config.auth_config.type === 'oauth2') {
        if (credentials.client_id && credentials.client_secret) {
          console.log(`🔑 OAuth2 platform detected, exchanging credentials for access token`);
          
          const tokenResult = await this.getOAuth2AccessToken(
            credentials.client_id,
            credentials.client_secret,
            config.auth_config.oauth2_endpoint
          );

          if (!tokenResult.success) {
            return {
              success: false,
              message: `OAuth2 authentication failed for ${platformName}`,
              error_type: 'oauth2_error',
              details: {
                error: tokenResult.error,
                troubleshooting: [
                  `Verify your Client ID and Client Secret are correct`,
                  `Ensure your Google Cloud Console project has the Sheets API enabled`,
                  `Check that your service account has proper permissions`
                ]
              }
            };
          }

          accessToken = tokenResult.access_token!;
        } else {
          return {
            success: false,
            message: `${platformName} requires Client ID and Client Secret for OAuth2 authentication`,
            error_type: 'missing_credentials',
            details: {
              required_fields: ['client_id', 'client_secret'],
              provided_fields: Object.keys(credentials),
              troubleshooting: [
                `Go to Google Cloud Console`,
                `Create OAuth2 credentials`,
                `Enable Google Sheets API`,
                `Add your credentials to the form`
              ]
            }
          };
        }
      }

      // Build test URL with proper endpoint
      let testUrl = `${baseUrl}${testEndpoint.path}`;
      
      // Handle Google Sheets specific endpoint that requires spreadsheet_id
      if (testEndpoint.requires_spreadsheet_id) {
        if (!credentials.spreadsheet_id) {
          return {
            success: false,
            message: `${platformName} requires a Spreadsheet ID for testing`,
            error_type: 'missing_spreadsheet_id',
            details: {
              required_fields: ['spreadsheet_id'],
              provided_fields: Object.keys(credentials),
              troubleshooting: [
                'Open your Google Sheet',
                'Copy the Spreadsheet ID from the URL',
                'The ID is the long string between /d/ and /edit in the URL',
                'Example: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit'
              ]
            }
          };
        }
        
        testUrl = testUrl.replace('{spreadsheet_id}', credentials.spreadsheet_id);
      }

      // Add query parameters if needed
      if (testEndpoint.query_params) {
        const queryString = new URLSearchParams(testEndpoint.query_params).toString();
        testUrl += `?${queryString}`;
      }

      // Build authentication headers
      const headers = await this.buildAuthHeaders(config.auth_config, {
        ...credentials,
        access_token: accessToken || credentials.access_token
      });

      console.log(`📡 Testing ${platformName} with URL: ${testUrl}`);
      console.log(`🔐 Using auth headers:`, Object.keys(headers));

      const response = await fetch(testUrl, {
        method: testEndpoint.method,
        headers,
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (response.ok) {
        console.log(`✅ ${platformName} credentials test SUCCESSFUL`);
        
        // Special handling for Google Sheets success response
        if (platformName.toLowerCase().includes('google') && platformName.toLowerCase().includes('sheet')) {
          const sheetTitle = responseData.properties?.title || 'Unknown Sheet';
          return {
            success: true,
            message: `Google Sheets connection successful! Connected to: "${sheetTitle}"`,
            details: {
              status: response.status,
              endpoint_tested: testUrl,
              spreadsheet_title: sheetTitle,
              spreadsheet_id: credentials.spreadsheet_id,
              oauth2_success: true
            }
          };
        }
        
        return {
          success: true,
          message: `${platformName} credentials are working correctly!`,
          details: {
            status: response.status,
            endpoint_tested: testUrl,
            response_preview: typeof responseData === 'object' ? 
              Object.keys(responseData).slice(0, 5) : 
              responseData.toString().substring(0, 100)
          }
        };
      } else {
        console.error(`❌ ${platformName} credentials test FAILED:`, response.status, responseData);
        
        let errorType = 'unknown_error';
        let helpfulMessage = `${platformName} credentials test failed`;
        let troubleshooting: string[] = [];

        if (response.status === 401) {
          errorType = 'authentication_error';
          helpfulMessage = `${platformName} authentication failed. Please check your credentials.`;
          troubleshooting = [
            'Verify your credentials are correct and not expired',
            'For Google Sheets: Check your Client ID and Client Secret',
            'Ensure your Google Cloud project has the Sheets API enabled'
          ];
        } else if (response.status === 403) {
          errorType = 'permission_error';
          helpfulMessage = `${platformName} credentials don't have required permissions.`;
          troubleshooting = [
            'Check your account permissions in the platform',
            'For Google Sheets: Ensure your service account has access to the spreadsheet',
            'Verify the required scopes are granted'
          ];
        } else if (response.status === 404) {
          errorType = 'resource_not_found';
          if (platformName.toLowerCase().includes('google') && platformName.toLowerCase().includes('sheet')) {
            helpfulMessage = `Google Sheets spreadsheet not found. Please check your Spreadsheet ID.`;
            troubleshooting = [
              'Verify the Spreadsheet ID is correct',
              'Ensure the spreadsheet exists and is accessible',
              'Check that your service account has permission to access this specific sheet'
            ];
          } else {
            helpfulMessage = `${platformName} API endpoint not found. Platform may have changed.`;
          }
        } else if (response.status >= 500) {
          errorType = 'server_error';
          helpfulMessage = `${platformName} server error. Try again later.`;
        }

        return {
          success: false,
          message: helpfulMessage,
          error_type: errorType,
          details: {
            status: response.status,
            endpoint_tested: testUrl,
            error_response: responseData,
            troubleshooting
          }
        };
      }

    } catch (error: any) {
      console.error(`💥 ${platformName} test error:`, error);
      return {
        success: false,
        message: `Failed to connect to ${platformName}: ${error.message}`,
        error_type: 'connection_error',
        details: {
          error: error.message,
          troubleshooting: [
            'Check your internet connection',
            `Verify ${platformName} service is operational`,
            'Try testing your credentials again in a few minutes'
          ]
        }
      };
    }
  }

  private async buildAuthHeaders(authConfig: any, credentials: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Universal-Integrator/2.0'
    };

    // Apply authentication based on platform configuration
    switch (authConfig.type) {
      case 'bearer':
        const token = credentials.access_token || credentials.token || credentials.api_key || credentials.bot_token;
        if (token) {
          headers[authConfig.parameter_name] = authConfig.format
            .replace('{token}', token)
            .replace('{access_token}', token)
            .replace('{api_key}', token)
            .replace('{bot_token}', token);
        }
        break;
        
      case 'oauth2':
        const oauthToken = credentials.access_token;
        if (oauthToken) {
          headers[authConfig.parameter_name] = authConfig.format.replace('{access_token}', oauthToken);
        }
        break;
        
      case 'api_key':
        const apiKey = credentials.api_key || credentials.key;
        if (apiKey && authConfig.location === 'header') {
          headers[authConfig.parameter_name] = authConfig.format.replace('{api_key}', apiKey).replace('{token}', apiKey);
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

  // Helper methods for OpenAPI parsing
  private detectAuthConfig(spec: any): any {
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

  private findBestTestEndpoint(endpoints: Record<string, any>, platformName: string): any {
    // Look for user info, profile, or auth test endpoints
    const testCandidates = ['user', 'profile', 'me', 'auth', 'account'];
    
    for (const candidate of testCandidates) {
      for (const [name, endpoint] of Object.entries(endpoints)) {
        if (name.includes(candidate) && endpoint.method === 'GET') {
          return endpoint;
        }
      }
    }

    // Fallback to platform-specific test endpoint
    return this.getTestEndpointForPlatform(platformName);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { platform_name, credentials, user_id } = await req.json()

    if (!platform_name || !credentials || !user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required parameters: platform_name, credentials, user_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 UNIVERSAL CREDENTIAL TEST: ${platform_name} for user ${user_id}`);

    // USE UNIVERSAL PLATFORM INTEGRATOR WITH OAUTH2 SUPPORT
    const universalIntegrator = new UniversalPlatformIntegrator();
    
    const testResult = await universalIntegrator.testPlatformCredentials(
      platform_name,
      credentials
    );

    console.log(`🎯 Universal test result for ${platform_name}:`, testResult);

    // Send success/failure notification
    try {
      await supabaseClient.functions.invoke('create-notification', {
        body: {
          userId: user_id,
          title: testResult.success ? 'Credentials Verified' : 'Credential Test Failed',
          message: testResult.success 
            ? `Your ${platform_name} credentials are working correctly!`
            : `${platform_name} credential test failed: ${testResult.message}`,
          type: 'credential_test',
          category: testResult.success ? 'success' : 'error',
          metadata: { 
            platform_name, 
            test_result: testResult.success,
            error_type: testResult.error_type,
            endpoint_tested: testResult.details?.endpoint_tested
          }
        }
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    return new Response(
      JSON.stringify(testResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Universal credential test error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error during credential testing',
        error_type: 'server_error',
        details: { error: error.message }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
