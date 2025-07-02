
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  PlayCircle, 
  Copy, 
  Send, 
  Code2, 
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface PlaygroundRequest {
  id: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  request: string;
  response: any;
  status: number;
  duration: number;
  error?: string;
  errorCode?: string;
}

const PlaygroundConsole = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [plainTextRequest, setPlainTextRequest] = useState('');
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/automations');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PlaygroundRequest[]>([]);

  // Fixed API base URL - matches the edge function
  const API_BASE_URL = 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api';

  const availableEndpoints = [
    { value: '/automations', label: 'GET /automations - List automations', method: 'GET' },
    { value: '/automations', label: 'POST /automations - Create automation', method: 'POST' },
    { value: '/automations/{id}', label: 'GET /automations/{id} - Get automation', method: 'GET' },
    { value: '/automations/{id}', label: 'PUT /automations/{id} - Update automation', method: 'PUT' },
    { value: '/automations/{id}', label: 'DELETE /automations/{id} - Delete automation', method: 'DELETE' },
    { value: '/execute/{id}', label: 'POST /execute/{id} - Execute automation', method: 'POST' },
    { value: '/webhooks', label: 'GET /webhooks - List webhooks', method: 'GET' },
    { value: '/events', label: 'GET /events - List events', method: 'GET' },
  ];

  const convertPlainTextToRequest = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('list') && lowerText.includes('automation')) {
      return { method: 'GET', endpoint: '/automations', body: null };
    } else if (lowerText.includes('create') && lowerText.includes('automation')) {
      return { 
        method: 'POST', 
        endpoint: '/automations', 
        body: {
          title: 'New Automation from Playground',
          description: 'Created via API Playground'
        }
      };
    } else if (lowerText.includes('webhook')) {
      return { method: 'GET', endpoint: '/webhooks', body: null };
    } else if (lowerText.includes('event')) {
      return { method: 'GET', endpoint: '/events', body: null };
    } else if (lowerText.includes('execute') || lowerText.includes('run')) {
      return { 
        method: 'POST', 
        endpoint: '/execute/test-id', 
        body: { triggerData: { source: 'playground' } }
      };
    }
    
    return { method: 'GET', endpoint: '/automations', body: null };
  };

  const makeApiCall = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }

    if (!apiKey.startsWith('YUSR_')) {
      toast.error('API key must start with YUSR_ prefix');
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      let requestConfig;
      
      if (plainTextRequest.trim()) {
        requestConfig = convertPlainTextToRequest(plainTextRequest);
      } else {
        requestConfig = { method, endpoint, body: null };
      }

      // Use the correct API base URL
      const url = `${API_BASE_URL}${requestConfig.endpoint}`;
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };

      const fetchOptions: RequestInit = {
        method: requestConfig.method,
        headers,
      };

      if (requestConfig.body && ['POST', 'PUT'].includes(requestConfig.method)) {
        fetchOptions.body = JSON.stringify(requestConfig.body);
      }

      console.log(`[Playground] Making API call to: ${url}`, { method: requestConfig.method, headers });
      
      const response = await fetch(url, fetchOptions);
      const responseData = await response.json();
      const duration = Date.now() - startTime;

      console.log(`[Playground] API response:`, { status: response.status, data: responseData, duration });

      let errorMessage = '';
      let errorCode = '';
      
      if (!response.ok) {
        errorCode = responseData.code || 'UNKNOWN_ERROR';
        errorMessage = responseData.message || 'Unknown error occurred';
        
        switch (errorCode) {
          case 'AUTH_MISSING_TOKEN':
            toast.error('Authentication required: Please provide your API key');
            break;
          case 'AUTH_INVALID_FORMAT':
            toast.error('Invalid API key format: Must start with YUSR_');
            break;
          case 'AUTH_INVALID_TOKEN':
            toast.error('Invalid API key: Token not found or expired');
            break;
          case 'DB_ERROR':
            toast.error('Database error: Please try again later');
            break;
          case 'METHOD_NOT_ALLOWED':
            toast.error(`Method not allowed: ${requestConfig.method} not supported for this endpoint`);
            break;
          case 'ENDPOINT_NOT_FOUND':
            toast.error('Endpoint not found: Please check the URL');
            break;
          default:
            toast.error(`API Error (${response.status}): ${errorMessage}`);
        }
      } else {
        toast.success(`API call successful (${duration}ms)`);
      }

      const newRequest: PlaygroundRequest = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        method: requestConfig.method,
        endpoint: requestConfig.endpoint,
        request: plainTextRequest || `${requestConfig.method} ${requestConfig.endpoint}`,
        response: responseData,
        status: response.status,
        duration,
        error: !response.ok ? errorMessage : undefined,
        errorCode: !response.ok ? errorCode : undefined
      };

      setResponse(responseData);
      setHistory(prev => [newRequest, ...prev.slice(0, 9)]);

      // Track usage if successful
      if (response.ok && user) {
        await trackApiUsage(requestConfig.endpoint, requestConfig.method, response.status, duration);
      }

    } catch (error: any) {
      console.error('[Playground] Network error:', error);
      const duration = Date.now() - startTime;
      
      let errorMessage = 'Network error occurred';
      let errorCode = 'NETWORK_ERROR';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to API server';
        errorCode = 'CONNECTION_ERROR';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Cross-origin request blocked';
        errorCode = 'CORS_ERROR';
      } else {
        errorMessage = error.message || 'Unknown network error';
      }

      const errorResponse = {
        error: 'Network Error',
        message: errorMessage,
        code: errorCode,
        details: 'Check console for more information'
      };

      const newRequest: PlaygroundRequest = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        method: method,
        endpoint: endpoint,
        request: plainTextRequest || `${method} ${endpoint}`,
        response: errorResponse,
        status: 0,
        duration,
        error: errorMessage,
        errorCode
      };

      setResponse(errorResponse);
      setHistory(prev => [newRequest, ...prev.slice(0, 9)]);
      
      toast.error(`Network error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const trackApiUsage = async (endpoint: string, method: string, statusCode: number, duration: number) => {
    try {
      const { error } = await supabase
        .from('api_usage_tracking')
        .insert({
          user_id: user?.id,
          endpoint,
          method,
          status_code: statusCode,
          response_time_ms: duration,
          usage_date: new Date().toISOString().split('T')[0]
        });

      if (error) {
        console.error('Failed to track API usage:', error);
      }
    } catch (err) {
      console.error('Error tracking API usage:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const generateCurlCommand = () => {
    const url = `${API_BASE_URL}${endpoint}`;
    let curl = `curl -X ${method} "${url}" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json"`;
    
    if (['POST', 'PUT'].includes(method)) {
      curl += ` \\\n  -d '{"title": "Example", "description": "API Test"}'`;
    }
    
    return curl;
  };

  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 400 && status < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = (status: number) => {
    if (status === 0) return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
          <Terminal className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            API Playground
          </h1>
          <p className="text-gray-600">
            Test your API endpoints with plain English or direct calls
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Make Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key Input with validation feedback */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <Input
                type="password"
                placeholder="Enter your YUSR_ API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`rounded-xl border-gray-300 ${
                  apiKey && !apiKey.startsWith('YUSR_') ? 'border-red-300 bg-red-50' : ''
                }`}
              />
              {apiKey && !apiKey.startsWith('YUSR_') && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  API key must start with YUSR_ prefix
                </p>
              )}
            </div>

            {/* Plain Text Request */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Plain English Request</label>
              <Textarea
                placeholder="e.g., 'List all my automations' or 'Create a new automation' or 'Show my webhooks'"
                value={plainTextRequest}
                onChange={(e) => setPlainTextRequest(e.target.value)}
                className="rounded-xl border-gray-300 min-h-[100px]"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Zap className="h-4 w-4" />
              AI will convert your request to the appropriate API call
            </div>

            <Separator />

            {/* Manual Request Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Or configure manually:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Method</label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg rounded-xl z-50">
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Endpoint</label>
                  <Select value={endpoint} onValueChange={setEndpoint}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg rounded-xl z-50">
                      {availableEndpoints.map((ep) => (
                        <SelectItem key={`${ep.method}-${ep.value}`} value={ep.value}>
                          {ep.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={makeApiCall} 
                disabled={loading || !apiKey.trim() || (apiKey && !apiKey.startsWith('YUSR_'))}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generateCurlCommand())}
                className="rounded-xl"
                disabled={!apiKey.trim()}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy cURL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Response Panel */}
        <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-green-600" />
              Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(history[0]?.status || 0)}
                    <Badge 
                      variant={history[0]?.status >= 200 && history[0]?.status < 300 ? "default" : "destructive"}
                      className="font-mono"
                    >
                      {history[0]?.status || 'ERROR'}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {history[0]?.duration}ms
                    </div>
                  </div>
                  {history[0]?.errorCode && (
                    <Badge variant="outline" className="text-xs font-mono text-red-600 border-red-200">
                      {history[0].errorCode}
                    </Badge>
                  )}
                </div>

                {history[0]?.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">Error Details:</p>
                    <p className="text-sm text-red-700 mt-1">{history[0].error}</p>
                  </div>
                )}
                
                <ScrollArea className="h-96 w-full rounded-xl border border-gray-200 bg-gray-50">
                  <pre className="p-4 text-sm font-mono">
                    <code>{JSON.stringify(response, null, 2)}</code>
                  </pre>
                </ScrollArea>
                
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                  className="w-full rounded-xl"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Response
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Terminal className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium">No response yet</p>
                <p className="text-sm">Make an API call to see the response here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request History */}
      {history.length > 0 && (
        <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Request History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.method}
                      </Badge>
                      <code className="text-sm text-gray-700">{item.endpoint}</code>
                      {getStatusIcon(item.status)}
                      <span className={`text-sm font-mono ${getStatusColor(item.status)}`}>
                        {item.status || 'ERROR'}
                      </span>
                      {item.errorCode && (
                        <Badge variant="outline" className="text-xs font-mono text-red-600 border-red-200">
                          {item.errorCode}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {item.timestamp.toLocaleTimeString()}
                      <span>({item.duration}ms)</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-start justify-between">
                    <p className="text-sm text-gray-600">{item.request}</p>
                    {item.error && (
                      <p className="text-xs text-red-600 ml-4 flex-shrink-0">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {item.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlaygroundConsole;
