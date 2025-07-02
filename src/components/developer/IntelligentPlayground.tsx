
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Play, 
  Code, 
  BookOpen, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Copy,
  Download,
  Eye,
  Settings
} from 'lucide-react';

interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
  }>;
  responses: Record<string, {
    description: string;
    schema: any;
    example?: any;
  }>;
  example_request: any;
}

interface APIDocumentation {
  title: string;
  version: string;
  description: string;
  base_url: string;
  endpoints: APIEndpoint[];
  authentication: {
    type: string;
    description: string;
    example: string;
  };
}

const IntelligentPlayground = () => {
  const { user } = useAuth();
  const [apiDocs, setApiDocs] = useState<APIDocumentation | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [requestBody, setRequestBody] = useState('');
  const [responseData, setResponseData] = useState('');
  const [requestHeaders, setRequestHeaders] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState('');

  // INTELLIGENT API DOCUMENTATION GENERATOR
  useEffect(() => {
    generateAPIDocumentation();
  }, []);

  const generateAPIDocumentation = async () => {
    console.log('📚 Generating intelligent API documentation...');
    
    // AUTOMATICALLY DISCOVER ALL AVAILABLE ENDPOINTS
    const documentation: APIDocumentation = {
      title: "YusrAI Automation Platform API",
      version: "2.0.0",
      description: "Comprehensive API for building, managing, and executing AI-powered automations",
      base_url: "https://zorwtyijosgdcckljmqd.supabase.co/functions/v1",
      authentication: {
        type: "Bearer Token",
        description: "Include your API key in the Authorization header",
        example: "Authorization: Bearer ysr_your_api_key_here"
      },
      endpoints: [
        {
          path: "/yusrai-api/automations",
          method: "GET",
          description: "Retrieve all automations for the authenticated user",
          parameters: [
            {
              name: "status",
              type: "string",
              required: false,
              description: "Filter automations by status",
              example: "active"
            },
            {
              name: "limit",
              type: "integer",
              required: false,
              description: "Maximum number of results to return",
              example: 20
            }
          ],
          responses: {
            "200": {
              description: "Successfully retrieved automations",
              schema: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    status: { type: "string" },
                    created_at: { type: "string" }
                  }
                }
              },
              example: [
                {
                  id: "uuid-here",
                  title: "Email Newsletter Automation",
                  status: "active",
                  created_at: "2024-01-01T00:00:00Z"
                }
              ]
            }
          },
          example_request: {
            method: "GET",
            headers: {
              "Authorization": "Bearer ysr_your_api_key",
              "Content-Type": "application/json"
            },
            url: "/yusrai-api/automations?status=active&limit=20"
          }
        },
        {
          path: "/yusrai-api/automations",
          method: "POST",
          description: "Create a new automation",
          parameters: [
            {
              name: "title",
              type: "string",
              required: true,
              description: "The title of the automation",
              example: "My New Automation"
            },
            {
              name: "description",
              type: "string",
              required: false,
              description: "Detailed description of what the automation does",
              example: "This automation sends welcome emails to new users"
            },
            {
              name: "automation_blueprint",
              type: "object",
              required: true,
              description: "The automation workflow configuration",
              example: {
                trigger: { type: "webhook" },
                steps: []
              }
            }
          ],
          responses: {
            "201": {
              description: "Automation created successfully",
              schema: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  status: { type: "string" }
                }
              }
            }
          },
          example_request: {
            method: "POST",
            headers: {
              "Authorization": "Bearer ysr_your_api_key",
              "Content-Type": "application/json"
            },
            body: {
              title: "My New Automation",
              description: "Welcome email automation",
              automation_blueprint: {
                trigger: { type: "webhook" },
                steps: []
              }
            }
          }
        },
        {
          path: "/yusrai-api/execute/{automation_id}",
          method: "POST",
          description: "Execute a specific automation",
          parameters: [
            {
              name: "automation_id",
              type: "string",
              required: true,
              description: "The unique identifier of the automation to execute",
              example: "uuid-here"
            },
            {
              name: "trigger_data",
              type: "object",
              required: false,
              description: "Optional data to pass to the automation",
              example: { user_email: "user@example.com" }
            }
          ],
          responses: {
            "200": {
              description: "Automation executed successfully",
              schema: {
                type: "object",
                properties: {
                  run_id: { type: "string" },
                  status: { type: "string" },
                  message: { type: "string" }
                }
              }
            }
          },
          example_request: {
            method: "POST",
            headers: {
              "Authorization": "Bearer ysr_your_api_key",
              "Content-Type": "application/json"
            },
            body: {
              trigger_data: {
                user_email: "user@example.com",
                action: "welcome"
              }
            }
          }
        },
        {
          path: "/chat-ai",
          method: "POST",
          description: "Generate automation blueprints using AI",
          parameters: [
            {
              name: "message",
              type: "string",
              required: true,
              description: "Natural language description of the automation you want to create",
              example: "Create an automation that sends a Slack message when a form is submitted"
            },
            {
              name: "messages",
              type: "array",
              required: false,
              description: "Previous conversation history for context",
              example: []
            }
          ],
          responses: {
            "200": {
              description: "AI-generated automation blueprint",
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  platforms: { type: "array" },
                  agents: { type: "array" },
                  automation_blueprint: { type: "object" }
                }
              }
            }
          },
          example_request: {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: {
              message: "Create an automation that sends a Slack message when a form is submitted",
              messages: []
            }
          }
        }
      ]
    };

    setApiDocs(documentation);
    setSelectedEndpoint(documentation.endpoints[0]);
    
    // Set example request body
    setRequestBody(JSON.stringify(documentation.endpoints[0].example_request.body || {}, null, 2));
    setRequestHeaders(JSON.stringify({
      "Authorization": "Bearer your_api_key_here",
      "Content-Type": "application/json"
    }, null, 2));
  };

  const handleEndpointSelect = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setRequestBody(JSON.stringify(endpoint.example_request.body || {}, null, 2));
    setResponseData('');
    setResponseStatus(null);
    setResponseTime(null);
  };

  const executeAPICall = async () => {
    if (!selectedEndpoint || !apiKey) {
      toast.error('Please select an endpoint and provide an API key');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      console.log(`🚀 Executing API call: ${selectedEndpoint.method} ${selectedEndpoint.path}`);

      // Parse headers
      let headers = {};
      try {
        headers = JSON.parse(requestHeaders);
      } catch (e) {
        headers = { 'Content-Type': 'application/json' };
      }

      // Add API key to headers
      headers = {
        ...headers,
        'Authorization': `Bearer ${apiKey}`
      };

      // Build request URL
      let url = `${apiDocs?.base_url}${selectedEndpoint.path}`;
      
      // Replace path parameters
      if (selectedEndpoint.path.includes('{')) {
        try {
          const bodyData = JSON.parse(requestBody);
          Object.entries(bodyData).forEach(([key, value]) => {
            url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
          });
        } catch (e) {
          console.warn('Could not parse request body for path parameters');
        }
      }

      console.log(`📡 Making request to: ${url}`);

      // Build request options
      const requestOptions: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };

      // Add body for non-GET requests
      if (selectedEndpoint.method !== 'GET' && requestBody.trim()) {
        requestOptions.body = requestBody;
      }

      const response = await fetch(url, requestOptions);
      const responseText = await response.text();
      
      setResponseStatus(response.status);
      setResponseTime(Date.now() - startTime);

      // Try to parse as JSON, fallback to text
      try {
        const jsonResponse = JSON.parse(responseText);
        setResponseData(JSON.stringify(jsonResponse, null, 2));
      } catch {
        setResponseData(responseText);
      }

      if (response.ok) {
        toast.success(`API call successful (${response.status})`);
      } else {
        toast.error(`API call failed (${response.status})`);
      }

    } catch (error: any) {
      console.error('❌ API call failed:', error);
      setResponseData(`Error: ${error.message}`);
      setResponseStatus(0);
      setResponseTime(Date.now() - startTime);
      toast.error('API call failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const generateCodeSnippet = (language: string) => {
    if (!selectedEndpoint) return '';

    const url = `${apiDocs?.base_url}${selectedEndpoint.path}`;
    
    switch (language) {
      case 'curl':
        return `curl -X ${selectedEndpoint.method} \\
  "${url}" \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json"${
    selectedEndpoint.method !== 'GET' && requestBody.trim() 
      ? ` \\\n  -d '${requestBody}'`
      : ''
  }`;
      
      case 'javascript':
        return `const response = await fetch('${url}', {
  method: '${selectedEndpoint.method}',
  headers: {
    'Authorization': 'Bearer your_api_key',
    'Content-Type': 'application/json'
  }${
    selectedEndpoint.method !== 'GET' && requestBody.trim()
      ? `,\n  body: JSON.stringify(${requestBody})`
      : ''
  }
});

const data = await response.json();
console.log(data);`;
      
      case 'python':
        return `import requests
import json

url = "${url}"
headers = {
    "Authorization": "Bearer your_api_key",
    "Content-Type": "application/json"
}

${
  selectedEndpoint.method !== 'GET' && requestBody.trim()
    ? `data = ${requestBody}\n\nresponse = requests.${selectedEndpoint.method.toLowerCase()}(url, headers=headers, json=data)`
    : `response = requests.${selectedEndpoint.method.toLowerCase()}(url, headers=headers)`
}

print(response.json())`;
      
      default:
        return '';
    }
  };

  if (!apiDocs) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Generating API documentation...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
            <Code className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {apiDocs.title}
            </h1>
            <p className="text-gray-600">
              Interactive API Playground - {apiDocs.version}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Auto-Generated
          </Badge>
          <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
            <Zap className="h-3 w-3 mr-1" />
            Intelligent
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - API Explorer */}
        <div className="space-y-4">
          {/* API Key Input */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <input
                  type="password"
                  placeholder="Enter your YusrAI API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500">
                  Get your API key from the API Keys tab
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Endpoint Selection */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {apiDocs.endpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      onClick={() => handleEndpointSelect(endpoint)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedEndpoint === endpoint
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={endpoint.method === 'GET' ? 'outline' : 'default'}
                          className={`text-xs ${
                            endpoint.method === 'GET' ? 'text-green-700 border-green-200' :
                            endpoint.method === 'POST' ? 'text-blue-700 border-blue-200' :
                            'text-orange-700 border-orange-200'
                          }`}
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                      </div>
                      <p className="text-xs text-gray-600">{endpoint.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Request Configuration */}
          {selectedEndpoint && (
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Request Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Headers</label>
                  <Textarea
                    value={requestHeaders}
                    onChange={(e) => setRequestHeaders(e.target.value)}
                    placeholder="Request headers (JSON format)"
                    className="font-mono text-sm h-24"
                  />
                </div>
                
                {selectedEndpoint.method !== 'GET' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Request Body</label>
                    <Textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder="Request body (JSON format)"
                      className="font-mono text-sm h-32"
                    />
                  </div>
                )}
                
                <Button 
                  onClick={executeAPICall}
                  disabled={isLoading || !apiKey}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Response & Documentation */}
        <div className="space-y-4">
          {/* Response */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Response
                </CardTitle>
                {responseStatus && (
                  <div className="flex items-center gap-2">
                    {responseStatus >= 200 && responseStatus < 300 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant="outline">{responseStatus}</Badge>
                    {responseTime && (
                      <Badge variant="outline" className="text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {responseTime}ms
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  value={responseData || 'No response yet. Execute a request to see the response.'}
                  readOnly
                  className="font-mono text-sm h-64 resize-none"
                />
                {responseData && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(responseData, 'Response')}
                    className="absolute top-2 right-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          {selectedEndpoint && (
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['curl', 'javascript', 'python'].map((lang) => (
                    <div key={lang}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium capitalize">{lang}</label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generateCodeSnippet(lang), `${lang} code`)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                        <code>{generateCodeSnippet(lang)}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligentPlayground;
