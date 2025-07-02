
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
  Zap
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
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<PlaygroundRequest | null>(null);

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
          description: 'Created via API Playground',
          trigger_type: 'manual',
          actions: []
        }
      };
    } else if (lowerText.includes('webhook')) {
      return { method: 'GET', endpoint: '/webhooks', body: null };
    } else if (lowerText.includes('event')) {
      return { method: 'GET', endpoint: '/events', body: null };
    } else if (lowerText.includes('execute') || lowerText.includes('run')) {
      return { 
        method: 'POST', 
        endpoint: '/execute/placeholder-id', 
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

    setLoading(true);
    const startTime = Date.now();

    try {
      let requestConfig;
      
      if (plainTextRequest.trim()) {
        requestConfig = convertPlainTextToRequest(plainTextRequest);
      } else {
        requestConfig = { method, endpoint, body: null };
      }

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

      const response = await fetch(url, fetchOptions);
      const responseData = await response.json();
      const duration = Date.now() - startTime;

      const newRequest: PlaygroundRequest = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        method: requestConfig.method,
        endpoint: requestConfig.endpoint,
        request: plainTextRequest || `${requestConfig.method} ${requestConfig.endpoint}`,
        response: responseData,
        status: response.status,
        duration
      };

      setResponse(responseData);
      setHistory(prev => [newRequest, ...prev.slice(0, 9)]); // Keep last 10 requests
      
      // Track usage for both success and failure
      try {
        await supabase.functions.invoke('yusrai-api', {
          body: {
            action: 'track_usage',
            endpoint: requestConfig.endpoint,
            method: requestConfig.method,
            status_code: response.status,
            response_time_ms: duration,
            success: response.ok
          },
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
      } catch (trackingError) {
        console.log('Usage tracking failed:', trackingError);
      }
      
      if (response.ok) {
        toast.success(`API call successful (${duration}ms)`);
      } else {
        toast.error(`API call failed: ${response.status}`);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorResponse = {
        error: 'Network Error',
        message: error.message || 'Failed to make API call'
      };

      const newRequest: PlaygroundRequest = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        method: method,
        endpoint: endpoint,
        request: plainTextRequest || `${method} ${endpoint}`,
        response: errorResponse,
        status: 0,
        duration
      };

      setResponse(errorResponse);
      setHistory(prev => [newRequest, ...prev.slice(0, 9)]);
      
      // Track network errors too
      try {
        await supabase.functions.invoke('yusrai-api', {
          body: {
            action: 'track_usage',
            endpoint: endpoint,
            method: method,
            status_code: 0,
            response_time_ms: duration,
            success: false
          },
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
      } catch (trackingError) {
        console.log('Usage tracking failed:', trackingError);
      }
      
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
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
            {/* API Key Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <Input
                type="password"
                placeholder="Enter your YUSR_ API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="rounded-xl border-gray-300"
              />
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
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
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
                <div className="flex items-center gap-2">
                  {history[0]?.status >= 200 && history[0]?.status < 300 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Badge variant={history[0]?.status >= 200 && history[0]?.status < 300 ? "default" : "destructive"}>
                    {history[0]?.status || 'Error'}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {history[0]?.duration}ms
                  </div>
                </div>
                
                <ScrollArea className="h-96 w-full rounded-xl border border-gray-200 bg-gray-50">
                  <pre className="p-4 text-sm">
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
                  onClick={() => setSelectedHistoryItem(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.method}
                      </Badge>
                      <code className="text-sm text-gray-700">{item.endpoint}</code>
                      {item.status >= 200 && item.status < 300 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{item.request}</p>
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
