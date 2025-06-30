
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Activity, 
  TrendingUp, 
  Webhook, 
  Copy, 
  Plus, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Settings,
  Code,
  Play,
  FileText,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useEnhancedApiTokens } from '@/hooks/useEnhancedApiTokens';
import { useWebhookEvents } from '@/hooks/useWebhookEvents';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PersonalApiDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiUsageData {
  date: string;
  calls: number;
  success: number;
  errors: number;
}

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
  user_id: string;
}

interface ApiError {
  id: string;
  error_type: string;
  error_message: string;
  automation_id?: string;
  created_at: string;
  stack_trace?: string;
  context?: any;
  severity: string;
  error_code: string;
  resolved: boolean;
}

const PersonalApiDashboard = ({ isOpen, onClose }: PersonalApiDashboardProps) => {
  const { tokens, loading: tokensLoading, createToken } = useEnhancedApiTokens();
  const { webhookEvents, createWebhookEvent, automations, eventTypes } = useWebhookEvents();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [usageData, setUsageData] = useState<ApiUsageData[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [apiErrors, setApiErrors] = useState<ApiError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  
  // Webhook creation state
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    automation_id: '',
    event_type: '',
    event_description: ''
  });

  // API Testing state
  const [testEndpoint, setTestEndpoint] = useState('/automations');
  const [testMethod, setTestMethod] = useState('GET');
  const [testPayload, setTestPayload] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Token creation state
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState({
    token_name: '',
    token_description: '',
    connection_purpose: '',
    permissions: {
      read: true,
      write: false,
      webhook: false,
      notifications: false,
      full_control: false,
      platform_connections: false
    }
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchDashboardData();
      setupRealTimeSubscriptions();
    }
  }, [isOpen, user, chartPeriod]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsageData(),
        fetchApiLogs(),
        fetchApiErrors()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsageData = async () => {
    const periodHours = chartPeriod === '24h' ? 24 : chartPeriod === '7d' ? 168 : 720;
    const startDate = new Date(Date.now() - periodHours * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', user?.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group data by time periods
    const groupedData: { [key: string]: { calls: number; success: number; errors: number } } = {};
    
    (data || []).forEach(log => {
      const date = new Date(log.created_at);
      const key = chartPeriod === '24h' 
        ? `${date.getHours()}:00`
        : date.toISOString().split('T')[0];
      
      if (!groupedData[key]) {
        groupedData[key] = { calls: 0, success: 0, errors: 0 };
      }
      
      groupedData[key].calls++;
      if (log.status_code >= 200 && log.status_code < 300) {
        groupedData[key].success++;
      } else {
        groupedData[key].errors++;
      }
    });

    const chartData = Object.entries(groupedData).map(([date, stats]) => ({
      date,
      ...stats
    }));

    setUsageData(chartData);
  };

  const fetchApiLogs = async () => {
    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setApiLogs(data || []);
  };

  const fetchApiErrors = async () => {
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    setApiErrors(data || []);
  };

  const setupRealTimeSubscriptions = () => {
    const channel = supabase
      .channel('api-dashboard-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'api_usage_logs',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchApiLogs();
        fetchUsageData();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'error_logs',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchApiErrors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createApiToken = async () => {
    const result = await createToken(newToken);
    if (result) {
      setShowTokenDialog(false);
      setNewToken({
        token_name: '',
        token_description: '',
        connection_purpose: '',
        permissions: {
          read: true,
          write: false,
          webhook: false,
          notifications: false,
          full_control: false,
          platform_connections: false
        }
      });
      
      // Show the token to the user
      toast({
        title: "API Token Created",
        description: "Copy your token now - it won't be shown again!",
      });
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.automation_id || !newWebhook.event_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const result = await createWebhookEvent(newWebhook);
    if (result) {
      setNewWebhook({ automation_id: '', event_type: '', event_description: '' });
      setShowWebhookDialog(false);
    }
  };

  const testApiEndpoint = async () => {
    if (!tokens.length) {
      toast({
        title: "Error",
        description: "You need an API token to test endpoints",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    try {
      const activeToken = tokens.find(t => t.is_active);
      if (!activeToken) {
        throw new Error('No active API token found');
      }

      const baseUrl = 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api';
      const url = `${baseUrl}${testEndpoint}`;
      
      const options: RequestInit = {
        method: testMethod,
        headers: {
          'Authorization': `Bearer ${activeToken.id}`, // This would be the actual token in real usage
          'Content-Type': 'application/json',
        }
      };

      if (testMethod !== 'GET' && testPayload) {
        options.body = testPayload;
      }

      const response = await fetch(url, options);
      const result = await response.json();
      
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: result
      });

    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  // Calculate overview stats
  const totalCalls = usageData.reduce((sum, day) => sum + day.calls, 0);
  const successRate = totalCalls > 0 ? Math.round((usageData.reduce((sum, day) => sum + day.success, 0) / totalCalls) * 100) : 0;
  const activeWebhooks = webhookEvents.filter(w => w.is_active).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex">
      {/* Slide-out Panel */}
      <div className={`w-full max-w-6xl bg-white rounded-r-3xl shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-hidden`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Personal API Dashboard
            </h2>
            <p className="text-gray-600 mt-1">
              Control your account from external services
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            
            {/* Tab Navigation */}
            <TabsList className="grid w-full grid-cols-4 mx-6 mt-4 bg-gray-100 rounded-xl">
              <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg">
                <Activity className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2 rounded-lg">
                <FileText className="w-4 h-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="errors" className="flex items-center gap-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                Errors
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-2 rounded-lg">
                <Code className="w-4 h-4" />
                Test
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <div className="flex-1 overflow-auto p-6">
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="rounded-2xl border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total API Calls</p>
                          <p className="text-3xl font-bold text-blue-800">{totalCalls}</p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Active Webhooks</p>
                          <p className="text-3xl font-bold text-purple-800">{activeWebhooks}</p>
                        </div>
                        <Webhook className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Success Rate</p>
                          <p className="text-3xl font-bold text-green-800">{successRate}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Usage Chart */}
                <Card className="rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>API Usage Trends</CardTitle>
                      <Select value={chartPeriod} onValueChange={(value: '24h' | '7d' | '30d') => setChartPeriod(value)}>
                        <SelectTrigger className="w-32 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="24h">Last 24h</SelectItem>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={usageData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} />
                          <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} />
                          <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* API Tokens & Webhooks Management */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* API Tokens */}
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>API Tokens</CardTitle>
                        <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="rounded-xl">
                              <Plus className="w-4 h-4 mr-2" />
                              New Token
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Create API Token</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Token Name *</label>
                                <Input
                                  value={newToken.token_name}
                                  onChange={(e) => setNewToken(prev => ({ ...prev, token_name: e.target.value }))}
                                  placeholder="e.g., Production API"
                                  className="rounded-xl"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                  value={newToken.token_description}
                                  onChange={(e) => setNewToken(prev => ({ ...prev, token_description: e.target.value }))}
                                  placeholder="What this token is used for"
                                  className="rounded-xl"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Connection Purpose</label>
                                <Input
                                  value={newToken.connection_purpose}
                                  onChange={(e) => setNewToken(prev => ({ ...prev, connection_purpose: e.target.value }))}
                                  placeholder="External service name"
                                  className="rounded-xl"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Permissions</label>
                                <div className="space-y-2">
                                  {Object.entries(newToken.permissions).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                      <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                                      <Switch
                                        checked={value}
                                        onCheckedChange={(checked) => 
                                          setNewToken(prev => ({
                                            ...prev,
                                            permissions: { ...prev.permissions, [key]: checked }
                                          }))
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <Button onClick={createApiToken} className="w-full rounded-xl">
                                Create Token
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-60">
                        <div className="space-y-3">
                          {tokens.map(token => (
                            <div key={token.id} className="p-3 border rounded-xl bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{token.token_name}</p>
                                  <p className="text-sm text-gray-500">{token.token_description}</p>
                                </div>
                                <Badge variant={token.is_active ? "default" : "secondary"}>
                                  {token.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Webhooks */}
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Webhooks</CardTitle>
                        <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="rounded-xl">
                              <Plus className="w-4 h-4 mr-2" />
                              New Webhook
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Create Webhook</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Automation *</label>
                                <Select value={newWebhook.automation_id} onValueChange={(value) => 
                                  setNewWebhook(prev => ({ ...prev, automation_id: value }))
                                }>
                                  <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select automation" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    {automations.map(automation => (
                                      <SelectItem key={automation.id} value={automation.id}>
                                        {automation.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Event Type *</label>
                                <Select value={newWebhook.event_type} onValueChange={(value) => 
                                  setNewWebhook(prev => ({ ...prev, event_type: value }))
                                }>
                                  <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select event" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    {eventTypes.map(eventType => (
                                      <SelectItem key={eventType} value={eventType}>
                                        {eventType.replace('_', ' ').toUpperCase()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                  value={newWebhook.event_description}
                                  onChange={(e) => setNewWebhook(prev => ({ ...prev, event_description: e.target.value }))}
                                  placeholder="Describe the webhook purpose"
                                  className="rounded-xl"
                                />
                              </div>
                              <Button onClick={createWebhook} className="w-full rounded-xl">
                                Create Webhook
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-60">
                        <div className="space-y-3">
                          {webhookEvents.map(webhook => (
                            <div key={webhook.id} className="p-3 border rounded-xl bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">{webhook.event_type}</p>
                                <Badge variant={webhook.is_active ? "default" : "secondary"}>
                                  {webhook.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                                  {webhook.webhook_url}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(webhook.webhook_url)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">API Call Logs</h3>
                  <Button variant="outline" size="sm" onClick={fetchApiLogs} className="rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                <Card className="rounded-2xl">
                  <CardContent className="p-0">
                    <ScrollArea className="h-96">
                      <div className="divide-y">
                        {apiLogs.map(log => (
                          <div key={log.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <Badge variant={log.status_code >= 200 && log.status_code < 300 ? "default" : "destructive"}>
                                  {log.status_code}
                                </Badge>
                                <span className="font-medium">{log.method}</span>
                                <span className="text-gray-600">{log.endpoint}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                {log.response_time_ms}ms
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Errors Tab */}
              <TabsContent value="errors" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Error Logs</h3>
                  <Button variant="outline" size="sm" onClick={fetchApiErrors} className="rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {apiErrors.map(error => (
                    <Card key={error.id} className="rounded-2xl border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <h4 className="font-medium text-red-800">{error.error_type}</h4>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(error.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Error Message:</p>
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                              {error.error_message}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Plain English Explanation:</p>
                            <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded border">
                              {error.error_type === 'VALIDATION_ERROR' && 'The data you sent doesn\'t match what we expected. Please check your request format.'}
                              {error.error_type === 'AUTHENTICATION_ERROR' && 'Your API key is missing or invalid. Please check your authentication credentials.'}
                              {error.error_type === 'AUTHORIZATION_ERROR' && 'Your API key doesn\'t have permission to access this resource.'}
                              {error.error_type === 'NOT_FOUND_ERROR' && 'The resource you\'re trying to access doesn\'t exist or has been moved.'}
                              {error.error_type === 'RATE_LIMIT_ERROR' && 'You\'ve made too many requests too quickly. Please slow down and try again.'}
                              {!['VALIDATION_ERROR', 'AUTHENTICATION_ERROR', 'AUTHORIZATION_ERROR', 'NOT_FOUND_ERROR', 'RATE_LIMIT_ERROR'].includes(error.error_type) && 
                                'An unexpected error occurred. Please contact support if this persists.'}
                            </p>
                          </div>

                          {error.automation_id && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Related Automation:</p>
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{error.automation_id}</code>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Test Tab */}
              <TabsContent value="test" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4">API Testing Console</h3>
                  
                  <Card className="rounded-2xl">
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">HTTP Method</label>
                          <Select value={testMethod} onValueChange={setTestMethod}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Endpoint</label>
                          <Select value={testEndpoint} onValueChange={setTestEndpoint}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="/automations">List Automations</SelectItem>
                              <SelectItem value="/webhooks">List Webhooks</SelectItem>
                              <SelectItem value="/events">List Events</SelectItem>
                              <SelectItem value="/execute">Execute Automation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {testMethod !== 'GET' && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Request Payload (JSON)</label>
                          <Textarea
                            value={testPayload}
                            onChange={(e) => setTestPayload(e.target.value)}
                            placeholder='{"key": "value"}'
                            className="rounded-xl font-mono text-sm"
                            rows={6}
                          />
                        </div>
                      )}

                      <Button 
                        onClick={testApiEndpoint} 
                        disabled={testLoading}
                        className="w-full rounded-xl"
                      >
                        {testLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Test API Call
                          </>
                        )}
                      </Button>

                      {testResult && (
                        <div className="space-y-3">
                          <Separator />
                          <h4 className="font-medium">Response:</h4>
                          
                          {testResult.error ? (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                              <p className="text-red-800 font-medium">Error:</p>
                              <p className="text-red-600 text-sm mt-1">{testResult.error}</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Badge variant={testResult.status >= 200 && testResult.status < 300 ? "default" : "destructive"}>
                                  {testResult.status} {testResult.statusText}
                                </Badge>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium mb-2">Response Data:</p>
                                <div className="bg-gray-50 border rounded-xl p-4 max-h-60 overflow-auto">
                                  <pre className="text-sm">
                                    {JSON.stringify(testResult.data, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Documentation Links */}
                <Card className="rounded-2xl border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-blue-900">API Documentation</h4>
                        <p className="text-sm text-blue-700">
                          Check our{' '}
                          <a 
                            href="https://docs.yusrai.com/api" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800 font-medium"
                          >
                            API documentation
                          </a>
                          {' '}for detailed integration examples and best practices.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PersonalApiDashboard;
