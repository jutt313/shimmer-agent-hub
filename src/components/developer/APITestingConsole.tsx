
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Copy, Eye, EyeOff, Zap, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import YusrAI from '@/utils/yusraiSDK';
import { YusrAIRealTime } from '@/utils/realTimeWebSocket';

const APITestingConsole = () => {
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('/automations');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [realTimeConnected, setRealTimeConnected] = useState(false);
  const [realTimeEvents, setRealTimeEvents] = useState<any[]>([]);
  const [yusraiClient, setYusraiClient] = useState<YusrAI | null>(null);
  const [realTimeClient, setRealTimeClient] = useState<YusrAIRealTime | null>(null);
  const { toast } = useToast();

  const endpoints = [
    '/automations',
    '/automations/{id}',
    '/runs',
    '/runs/{id}',
    '/webhooks',
    '/user/profile',
    '/platforms'
  ];

  const methods = ['GET', 'POST', 'PUT', 'DELETE'];

  useEffect(() => {
    if (apiKey) {
      const client = new YusrAI({ apiKey });
      setYusraiClient(client);
    }
  }, [apiKey]);

  const executeRequest = async () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter your API key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const baseUrl = 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/api-v1';
      const url = `${baseUrl}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();
      
      setResponse(JSON.stringify({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data
      }, null, 2));

      if (res.ok) {
        toast({
          title: "Success",
          description: `${method} ${endpoint} completed successfully`,
        });
      } else {
        toast({
          title: "API Error",
          description: data.error || `HTTP ${res.status}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setResponse(JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectRealTime = async () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter your API key",
        variant: "destructive",
      });
      return;
    }

    try {
      const client = new YusrAIRealTime(apiKey);
      await client.connect();
      
      client.subscribe(['automation_runs', 'webhook_deliveries', 'api_usage']);
      
      client.on('automation_run_update', (event) => {
        setRealTimeEvents(prev => [...prev, {
          type: 'Automation Run',
          data: event.data,
          timestamp: new Date().toISOString()
        }]);
      });

      client.on('webhook_delivery_update', (event) => {
        setRealTimeEvents(prev => [...prev, {
          type: 'Webhook Delivery',
          data: event.data,
          timestamp: new Date().toISOString()
        }]);
      });

      client.on('api_usage_update', (event) => {
        setRealTimeEvents(prev => [...prev, {
          type: 'API Usage',
          data: event.data,
          timestamp: new Date().toISOString()
        }]);
      });

      setRealTimeClient(client);
      setRealTimeConnected(true);
      
      toast({
        title: "Connected",
        description: "Real-time connection established",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const disconnectRealTime = () => {
    if (realTimeClient) {
      realTimeClient.disconnect();
      setRealTimeClient(null);
      setRealTimeConnected(false);
      setRealTimeEvents([]);
      
      toast({
        title: "Disconnected",
        description: "Real-time connection closed",
      });
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    toast({
      title: "Copied",
      description: "Response copied to clipboard",
    });
  };

  const testSDKMethods = async () => {
    if (!yusraiClient) return;

    try {
      // Test getting automations
      const automations = await yusraiClient.getAutomations();
      console.log('Automations:', automations);
      
      // Test getting user profile
      const profile = await yusraiClient.getUserProfile();
      console.log('Profile:', profile);
      
      setResponse(JSON.stringify({
        sdk_test: 'success',
        automations_count: automations.length,
        user_profile: profile,
        timestamp: new Date().toISOString()
      }, null, 2));

      toast({
        title: "SDK Test Complete",
        description: "Check the response panel for results",
      });
    } catch (error: any) {
      setResponse(JSON.stringify({
        sdk_test: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      toast({
        title: "SDK Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            API Testing Console
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rest" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rest">REST API</TabsTrigger>
              <TabsTrigger value="realtime">Real-time</TabsTrigger>
              <TabsTrigger value="sdk">SDK Test</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rest" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">API Key</label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder="ysr_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                      <label className="text-sm font-medium mb-2 block">Method</label>
                      <Select value={method} onValueChange={setMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {methods.map(m => (
                            <SelectItem key={m} value={m}>
                              <Badge variant={m === 'GET' ? 'secondary' : m === 'POST' ? 'default' : 'outline'}>
                                {m}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-3">
                      <label className="text-sm font-medium mb-2 block">Endpoint</label>
                      <Select value={endpoint} onValueChange={setEndpoint}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {endpoints.map(ep => (
                            <SelectItem key={ep} value={ep}>{ep}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {['POST', 'PUT', 'PATCH'].includes(method) && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Request Body (JSON)</label>
                      <Textarea
                        placeholder='{"title": "Test Automation", "description": "Created via API"}'
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        rows={4}
                      />
                    </div>
                  )}

                  <Button onClick={executeRequest} disabled={loading} className="w-full">
                    {loading ? 'Executing...' : 'Execute Request'}
                    <Play className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Response</label>
                    {response && (
                      <Button variant="outline" size="sm" onClick={copyResponse}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-96 w-full border rounded-md p-4">
                    <pre className="text-sm">{response || 'No response yet...'}</pre>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="realtime" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">API Key</label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder="ysr_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${realTimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">
                      {realTimeConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  {realTimeConnected ? (
                    <Button variant="destructive" onClick={disconnectRealTime} className="w-full">
                      <Activity className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button onClick={connectRealTime} className="w-full">
                      <Zap className="mr-2 h-4 w-4" />
                      Connect Real-time
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Real-time Events</label>
                  <ScrollArea className="h-96 w-full border rounded-md p-4">
                    {realTimeEvents.length === 0 ? (
                      <p className="text-sm text-gray-500">No events yet...</p>
                    ) : (
                      <div className="space-y-2">
                        {realTimeEvents.map((event, index) => (
                          <div key={index} className="p-2 border rounded text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline">{event.type}</Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sdk" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">API Key</label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder="ysr_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button onClick={testSDKMethods} disabled={!yusraiClient} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Test YusrAI SDK
                  </Button>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-2">SDK Usage Example:</h4>
                    <pre className="text-xs overflow-auto">
{`import YusrAI from '@/utils/yusraiSDK';

const client = new YusrAI({
  apiKey: 'your_api_key'
});

// Get automations
const automations = await client.getAutomations();

// Execute automation
const run = await client.executeAutomation('automation_id');

// Real-time updates
const realTime = await client.connectRealTime();
client.onAutomationUpdate((run) => {
  console.log('Automation updated:', run);
});`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">SDK Test Results</label>
                  <ScrollArea className="h-96 w-full border rounded-md p-4">
                    <pre className="text-sm">{response || 'Run SDK test to see results...'}</pre>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default APITestingConsole;
