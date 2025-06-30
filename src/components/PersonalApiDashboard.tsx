import { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Key,
  Wifi,
  Globe
} from 'lucide-react';
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
  updated_at: string;
  user_id: string;
}

interface ApiToken {
  id: string;
  token_name: string;
  token_description: string;
  is_active: boolean;
  created_at: string;
  permissions: {
    read: boolean;
    write: boolean;
    webhook: boolean;
    notifications: boolean;
    full_control: boolean;
    platform_connections: boolean;
  };
}

// Helper function to parse permissions from Json to expected structure
const parsePermissions = (permissions: any) => {
  if (typeof permissions === 'object' && permissions !== null && !Array.isArray(permissions)) {
    return {
      read: Boolean(permissions.read || false),
      write: Boolean(permissions.write || false),
      webhook: Boolean(permissions.webhook || false),
      notifications: Boolean(permissions.notifications || false),
      full_control: Boolean(permissions.full_control || false),
      platform_connections: Boolean(permissions.platform_connections || false),
    };
  }
  
  // Default permissions if parsing fails
  return {
    read: true,
    write: false,
    webhook: false,
    notifications: false,
    full_control: false,
    platform_connections: false,
  };
};

const PersonalApiDashboard = ({ isOpen, onClose }: PersonalApiDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [usageData, setUsageData] = useState<ApiUsageData[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [apiErrors, setApiErrors] = useState<ApiError[]>([]);
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [hasTokens, setHasTokens] = useState(false);
  
  // Token creation state
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState({
    token_name: '',
    token_description: '',
    connection_purpose: '',
    events: [] as string[],
    permissions: {
      read: true,
      write: false,
      webhook: false,
      notifications: false,
      full_control: false,
      platform_connections: false
    }
  });

  // API Testing state
  const [testEndpoint, setTestEndpoint] = useState('/automations');
  const [testMethod, setTestMethod] = useState('GET');
  const [testPayload, setTestPayload] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>('');

  // Real-time webhook URL for user's account
  const [globalWebhookUrl, setGlobalWebhookUrl] = useState<string>('');

  // Available events for webhook subscriptions
  const eventTypes = [
    'automation_created',
    'automation_updated', 
    'automation_executed',
    'automation_error',
    'webhook_received',
    'api_call_made',
    'notification_sent',
    'user_login',
    'account_updated'
  ];

  useEffect(() => {
    if (isOpen && user) {
      initializeDashboard();
    }
  }, [isOpen, user]);

  const initializeDashboard = async () => {
    console.log('Initializing Personal API Dashboard...');
    setIsLoading(true);
    
    try {
      await checkExistingTokens();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to initialize dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingTokens = async () => {
    try {
      const { data: tokens, error } = await supabase
        .from('user_api_tokens')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching tokens:', error);
        return;
      }

      const hasActiveTokens = tokens && tokens.length > 0;
      setHasTokens(hasActiveTokens);
      
      // Transform the tokens to match our ApiToken interface
      const transformedTokens: ApiToken[] = (tokens || []).map(token => ({
        id: token.id,
        token_name: token.token_name,
        token_description: token.token_description || '',
        is_active: token.is_active,
        created_at: token.created_at,
        permissions: parsePermissions(token.permissions),
      }));
      
      setApiTokens(transformedTokens);

      if (hasActiveTokens) {
        await loadDashboardData();
        setupRealTimeSubscriptions();
      }
    } catch (error) {
      console.error('Error checking tokens:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        fetchUsageData(),
        fetchApiLogs(),
        fetchApiErrors()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const fetchUsageData = async () => {
    try {
      const periodHours = chartPeriod === '24h' ? 24 : chartPeriod === '7d' ? 168 : 720;
      const startDate = new Date(Date.now() - periodHours * 60 * 60 * 1000);

      // Create dummy data for now since we don't have actual usage logs yet
      const dummyData: ApiUsageData[] = [];
      for (let i = 0; i < (chartPeriod === '24h' ? 24 : chartPeriod === '7d' ? 7 : 30); i++) {
        const date = new Date(startDate.getTime() + i * (chartPeriod === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
        dummyData.push({
          date: chartPeriod === '24h' ? `${date.getHours()}:00` : date.toISOString().split('T')[0],
          calls: Math.floor(Math.random() * 50),
          success: Math.floor(Math.random() * 45),
          errors: Math.floor(Math.random() * 5)
        });
      }
      
      setUsageData(dummyData);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const fetchApiLogs = async () => {
    try {
      // For now, we'll create dummy logs until the real API usage logging is implemented
      const dummyLogs: ApiLog[] = [];
      setApiLogs(dummyLogs);
    } catch (error) {
      console.error('Error fetching API logs:', error);
    }
  };

  const fetchApiErrors = async () => {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching errors:', error);
        return;
      }
      
      setApiErrors(data || []);
    } catch (error) {
      console.error('Error fetching API errors:', error);
    }
  };

  const setupRealTimeSubscriptions = useCallback(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for user:', user.id);
    
    const channel = supabase
      .channel(`api-dashboard-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'error_logs',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('New error log:', payload);
        fetchApiErrors();
        
        toast({
          title: "New Error Detected",
          description: payload.new.error_message || 'An error occurred',
          variant: "destructive",
        });
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createApiToken = async () => {
    if (!newToken.token_name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a token name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Generate a new API token
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('generate_api_token');

      if (tokenError) throw tokenError;

      const token = tokenResult as string;
      const tokenHash = await hashToken(token);

      // Store the token in database using correct token_type
      const { data: tokenData, error: insertError } = await supabase
        .from('user_api_tokens')
        .insert({
          user_id: user?.id,
          token_name: newToken.token_name,
          token_description: newToken.token_description,
          token_hash: tokenHash,
          connection_purpose: newToken.connection_purpose,
          permissions: newToken.permissions,
          token_type: 'user', // Use 'user' instead of 'personal'
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Generate global webhook URL for real-time data
      const webhookUrl = `https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/realtime-webhook/${user?.id}?events=${newToken.events.join(',')}`;
      setGlobalWebhookUrl(webhookUrl);

      // Show success with the actual token
      toast({
        title: "API Token Created Successfully!",
        description: "Copy your credentials now - they won't be shown again!",
      });

      // Show token and webhook in a dialog
      setShowTokenDialog(false);
      showCredentialsDialog(token, webhookUrl);

      // Reset form and refresh data
      setNewToken({
        token_name: '',
        token_description: '',
        connection_purpose: '',
        events: [],
        permissions: {
          read: true,
          write: false,
          webhook: false,
          notifications: false,
          full_control: false,
          platform_connections: false
        }
      });

      await checkExistingTokens();
      
    } catch (error) {
      console.error('Error creating API token:', error);
      toast({
        title: "Error",
        description: "Failed to create API token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hashToken = async (token: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const showCredentialsDialog = (token: string, webhookUrl: string) => {
    // Create a temporary dialog to show credentials
    const credentialsHtml = `
      <div style="font-family: monospace; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 10px 0;">
        <h3 style="color: #333; margin-bottom: 15px;">🔑 Your API Credentials</h3>
        <div style="margin-bottom: 15px;">
          <strong>Personal API Token:</strong><br/>
          <code style="background: #fff; padding: 8px; border-radius: 4px; display: block; margin-top: 5px; word-break: break-all;">${token}</code>
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Real-time Webhook URL:</strong><br/>
          <code style="background: #fff; padding: 8px; border-radius: 4px; display: block; margin-top: 5px; word-break: break-all;">${webhookUrl}</code>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 15px;">
          ⚠️ Store these securely - they won't be shown again!
        </p>
      </div>
    `;
    
    toast({
      title: "🎉 Credentials Generated!",
      description: "Check the dashboard for your API token and webhook URL",
    });
  };

  const testApiEndpoint = async () => {
    if (!selectedToken) {
      toast({
        title: "Error",
        description: "Please select an API token first",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    try {
      const baseUrl = 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api';
      const url = `${baseUrl}${testEndpoint}`;
      
      const options: RequestInit = {
        method: testMethod,
        headers: {
          'Authorization': `Bearer ${selectedToken}`,
          'Content-Type': 'application/json',
        }
      };

      if (testMethod !== 'GET' && testPayload.trim()) {
        try {
          JSON.parse(testPayload); // Validate JSON
          options.body = testPayload;
        } catch (e) {
          throw new Error('Invalid JSON payload');
        }
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = await response.text();
      }
      
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: result,
        responseTime
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
  const activeWebhooks = 1; // User has one global webhook for real-time data

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-start">
      {/* Left Slide Panel */}
      <div className={`w-full max-w-4xl h-full bg-white rounded-r-3xl shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!hasTokens ? (
            // No tokens - Show setup screen
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Key className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Get Started with Personal API
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first API token to control your YusrAI account from external services with real-time data access.
                </p>
                
                <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Create API Token
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Create Personal API Token
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-96">
                      <div className="space-y-4 p-1">
                        <div>
                          <label className="text-sm font-medium">Token Name *</label>
                          <Input
                            value={newToken.token_name}
                            onChange={(e) => setNewToken(prev => ({ ...prev, token_name: e.target.value }))}
                            placeholder="e.g., Production Integration"
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
                          <label className="text-sm font-medium">External Service</label>
                          <Input
                            value={newToken.connection_purpose}
                            onChange={(e) => setNewToken(prev => ({ ...prev, connection_purpose: e.target.value }))}
                            placeholder="e.g., Zapier, Make.com, Custom App"
                            className="rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Real-time Events (for webhook)</label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {eventTypes.map(eventType => (
                              <div key={eventType} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={eventType}
                                  checked={newToken.events.includes(eventType)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewToken(prev => ({
                                        ...prev,
                                        events: [...prev.events, eventType]
                                      }));
                                    } else {
                                      setNewToken(prev => ({
                                        ...prev,
                                        events: prev.events.filter(event => event !== eventType)
                                      }));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <label htmlFor={eventType} className="text-xs">
                                  {eventType.replace('_', ' ').toUpperCase()}
                                </label>
                              </div>
                            ))}
                          </div>
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

                        <Button 
                          onClick={createApiToken} 
                          disabled={isLoading}
                          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600"
                        >
                          {isLoading ? 'Creating...' : 'Create Token & Webhook'}
                        </Button>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ) : (
            // Has tokens - Show dashboard
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              
              {/* Tab Navigation */}
              <TabsList className="grid w-full grid-cols-4 mx-6 mt-4 bg-gray-100 rounded-xl flex-shrink-0">
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

              {/* Tab Contents - Scrollable */}
              <div className="flex-1 overflow-auto">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    
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
                                <p className="text-sm font-medium text-purple-600">Real-time Webhook</p>
                                <p className="text-3xl font-bold text-purple-800">{activeWebhooks}</p>
                              </div>
                              <Wifi className="h-8 w-8 text-purple-500" />
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

                      {/* Credentials Display */}
                      <Card className="rounded-2xl border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-orange-600" />
                            Your API Credentials
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Personal API Token:</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-white px-3 py-2 rounded-lg border text-sm">
                                {apiTokens[0]?.id ? `${apiTokens[0].id.substring(0, 20)}...` : 'Loading...'}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(apiTokens[0]?.id || '')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {globalWebhookUrl && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Real-time Webhook URL:</p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white px-3 py-2 rounded-lg border text-sm break-all">
                                  {globalWebhookUrl}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(globalWebhookUrl)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

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
                          <div className="p-8 text-center text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No API calls logged yet</p>
                            <p className="text-sm">Start making API calls to see logs here</p>
                          </div>
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
                        {apiErrors.length === 0 ? (
                          <Card className="rounded-2xl">
                            <CardContent className="p-8 text-center text-gray-500">
                              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                              <p>No errors logged</p>
                              <p className="text-sm">Your API is running smoothly!</p>
                            </CardContent>
                          </Card>
                        ) : (
                          apiErrors.map(error => (
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
                                      {error.error_type === 'VALIDATION_ERROR' && 'The data sent doesn\'t match the expected format. Check your request structure.'}
                                      {error.error_type === 'AUTHENTICATION_ERROR' && 'Your API key is missing or invalid. Verify your authentication credentials.'}
                                      {error.error_type === 'AUTHORIZATION_ERROR' && 'Your API key doesn\'t have permission to access this resource.'}
                                      {error.error_type === 'NOT_FOUND_ERROR' && 'The resource you\'re trying to access doesn't exist.'}
                                      {error.error_type === 'RATE_LIMIT_ERROR' && 'Too many requests sent too quickly. Please slow down.'}
                                      {!['VALIDATION_ERROR', 'AUTHENTICATION_ERROR', 'AUTHORIZATION_ERROR', 'NOT_FOUND_ERROR', 'RATE_LIMIT_ERROR'].includes(error.error_type) && 
                                        'An unexpected error occurred. Contact support if this persists.'}
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
                          ))
                        )}
                      </div>
                    </TabsContent>

                    {/* Test Tab */}
                    <TabsContent value="test" className="space-y-6 mt-0">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">API Testing Console</h3>
                        
                        <Card className="rounded-2xl">
                          <CardContent className="p-6 space-y-4">
                            
                            {/* Token Selection */}
                            <div>
                              <label className="text-sm font-medium mb-2 block">Select API Token</label>
                              <Select value={selectedToken} onValueChange={setSelectedToken}>
                                <SelectTrigger className="rounded-xl">
                                  <SelectValue placeholder="Choose an API token" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {apiTokens.map(token => (
                                    <SelectItem key={token.id} value={token.id}>
                                      {token.token_name} ({token.id.substring(0, 10)}...)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

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
                                  placeholder='{"title": "My New Automation", "description": "Create a new automation via API"}'
                                  className="rounded-xl font-mono text-sm min-h-[120px]"
                                />
                              </div>
                            )}

                            <Button 
                              onClick={testApiEndpoint} 
                              disabled={testLoading || !selectedToken}
                              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600"
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
                                      {testResult.responseTime && (
                                        <Badge variant="outline">
                                          {testResult.responseTime}ms
                                        </Badge>
                                      )}
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
                </ScrollArea>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalApiDashboard;
