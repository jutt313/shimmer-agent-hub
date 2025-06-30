import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  X, 
  Activity, 
  FileText, 
  AlertTriangle, 
  Code, 
  Copy, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Plus,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ApiToken {
  id: string;
  token_name: string;
  token_description: string | null;
  connection_purpose: string | null;
  token_type: string;
  permissions: {
    read: boolean;
    write: boolean;
    webhook: boolean;
    notifications: boolean;
    full_control: boolean;
    platform_connections: boolean;
  };
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
}

interface ApiError {
  id: string;
  error_type: string;
  error_message: string;
  endpoint?: string;
  created_at: string;
  severity: string;
}

interface UsageData {
  date: string;
  calls: number;
  success: number;
  errors: number;
}

interface DashboardStats {
  totalCalls: number;
  successRate: number;
  activeWebhooks: number;
  totalErrors: number;
}

interface PersonalApiDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PersonalApiDashboard = ({ isOpen, onClose }: PersonalApiDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    successRate: 0,
    activeWebhooks: 0,
    totalErrors: 0
  });
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [apiErrors, setApiErrors] = useState<ApiError[]>([]);
  const [showTokens, setShowTokens] = useState<{[key: string]: boolean}>({});
  const [realtimeWebhookUrl, setRealtimeWebhookUrl] = useState('');

  // Token creation form
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    name: '',
    description: '',
    purpose: '',
    permissions: {
      read: true,
      write: false,
      webhook: false,
      notifications: false,
      full_control: false,
      platform_connections: false,
    }
  });

  // Test API form
  const [testForm, setTestForm] = useState({
    naturalLanguage: '',
    jsonPayload: '',
    method: 'POST',
    endpoint: '/automations',
    selectedToken: ''
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Helper function to safely parse permissions
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
    return {
      read: true,
      write: false,
      webhook: false,
      notifications: false,
      full_control: false,
      platform_connections: false,
    };
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchTokens(),
        fetchStats(),
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
      setLoading(false);
    }
  }, [user, toast]);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('user_api_tokens')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedTokens: ApiToken[] = (data || []).map(token => ({
        ...token,
        permissions: parsePermissions(token.permissions),
        usage_count: token.usage_count || 0,
      }));
      
      setTokens(transformedTokens);

      // Generate real-time webhook URL for the user
      if (user?.id) {
        setRealtimeWebhookUrl(`https://usr.com/api/realtime-webhook/${user.id}?events=automation_created,automation_executed,account_updated,notification_sent,user_login,api_call_made,automation_error,automation_updated,webhook_received`);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total API calls
      const { count: totalCalls } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get successful calls
      const { count: successfulCalls } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('status_code', 200)
        .lt('status_code', 300);

      // Get total errors
      const { count: totalErrors } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const successRate = totalCalls && totalCalls > 0 
        ? Math.round((successfulCalls || 0) / totalCalls * 100) 
        : 0;

      setStats({
        totalCalls: totalCalls || 0,
        successRate,
        activeWebhooks: 1, // Always 1 real-time webhook
        totalErrors: totalErrors || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsageData = async () => {
    try {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group data by hour
      const groupedData: { [key: string]: { calls: number; success: number; errors: number } } = {};
      
      (data || []).forEach(log => {
        const date = new Date(log.created_at);
        const key = `${date.getHours()}:00`;
        
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
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const fetchApiLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setApiLogs(data || []);
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

      if (error) throw error;
      setApiErrors(data || []);
    } catch (error) {
      console.error('Error fetching API errors:', error);
    }
  };

  // Create new API token
  const createToken = async () => {
    try {
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('generate_api_token');

      if (tokenError) throw tokenError;

      // Add YUSR_ prefix to the token
      const yusrToken = `YUSR_${tokenResult}`;
      const tokenHash = await hashToken(yusrToken);

      const { data, error } = await supabase
        .from('user_api_tokens')
        .insert({
          user_id: user?.id,
          token_name: tokenForm.name,
          token_description: tokenForm.description,
          connection_purpose: tokenForm.purpose,
          token_hash: tokenHash,
          token_type: 'user',
          permissions: tokenForm.permissions
        })
        .select()
        .single();

      if (error) throw error;

      const transformedToken: ApiToken = {
        ...data,
        permissions: tokenForm.permissions,
        usage_count: data.usage_count || 0,
      };

      setTokens(prev => [transformedToken, ...prev]);
      setShowTokenForm(false);
      setTokenForm({
        name: '',
        description: '',
        purpose: '',
        permissions: {
          read: true,
          write: false,
          webhook: false,
          notifications: false,
          full_control: false,
          platform_connections: false,
        }
      });
      
      toast({
        title: "Success",
        description: `API token created successfully. Token: ${yusrToken}`,
      });

      return yusrToken;
    } catch (error) {
      console.error('Error creating API token:', error);
      toast({
        title: "Error",
        description: "Failed to create API token",
        variant: "destructive",
      });
      return null;
    }
  };

  const hashToken = async (token: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Convert natural language to JSON
  const convertToJson = (naturalLanguage: string) => {
    const input = naturalLanguage.toLowerCase();
    
    if (input.includes('create') && input.includes('automation')) {
      const nameMatch = input.match(/automation.*?['"](.*?)['"]|named\s+([^,\s]+)|called\s+([^,\s]+)/);
      const automationName = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3]) : 'API Created Automation';
      
      return JSON.stringify({
        title: automationName,
        description: `Automation created via Personal API: ${naturalLanguage}`,
        trigger_type: "api_trigger",
        actions: [
          {
            type: "notification",
            config: {
              message: `Automation "${automationName}" was created successfully`,
              channels: ["dashboard", "webhook"]
            }
          }
        ]
      }, null, 2);
    }
    
    if (input.includes('list') || input.includes('get') || input.includes('show')) {
      return JSON.stringify({
        action: "list_automations",
        filters: {
          status: "active",
          limit: 10
        }
      }, null, 2);
    }
    
    // Default structure
    return JSON.stringify({
      request: naturalLanguage,
      action: "custom_request",
      data: {}
    }, null, 2);
  };

  // Test API call
  const testApiCall = async () => {
    if (!testForm.selectedToken) {
      toast({
        title: "Error",
        description: "Please select an API token",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    try {
      const baseUrl = 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api';
      const url = `${baseUrl}${testForm.endpoint}`;
      
      const options: RequestInit = {
        method: testForm.method,
        headers: {
          'Authorization': `Bearer ${testForm.selectedToken}`,
          'Content-Type': 'application/json',
        }
      };

      if (testForm.method !== 'GET' && testForm.jsonPayload) {
        options.body = testForm.jsonPayload;
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result = await response.json();
      
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

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user || !isOpen) return;

    fetchDashboardData();

    const channel = supabase
      .channel('personal-api-dashboard')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'api_usage_logs',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        console.log('New API usage log:', payload);
        fetchStats();
        fetchApiLogs();
        fetchUsageData();
        
        toast({
          title: "New API Call",
          description: `${payload.new.method} ${payload.new.endpoint} - ${payload.new.status_code}`,
        });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'error_logs',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        console.log('New error log:', payload);
        fetchStats();
        fetchApiErrors();
        
        toast({
          title: "API Error Detected",
          description: payload.new.error_message,
          variant: "destructive",
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOpen, fetchDashboardData, toast]);

  // Handle natural language input change
  const handleNaturalLanguageChange = (value: string) => {
    setTestForm(prev => ({
      ...prev,
      naturalLanguage: value,
      jsonPayload: convertToJson(value)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">Personal API Dashboard</h2>
            <p className="text-gray-600">Control your account from external services</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="errors" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Errors
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Test
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* No Tokens Setup */}
                {tokens.length === 0 && !showTokenForm && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Settings className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Get Started with Your Personal API</h3>
                    <p className="text-gray-600 mb-6">Create your first API token to start connecting external services</p>
                    <Button onClick={() => setShowTokenForm(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Token
                    </Button>
                  </div>
                )}

                {/* Token Creation Form */}
                {showTokenForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New API Token</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="token-name">Token Name</Label>
                          <Input
                            id="token-name"
                            value={tokenForm.name}
                            onChange={(e) => setTokenForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="My External Service"
                          />
                        </div>
                        <div>
                          <Label htmlFor="token-purpose">Connection Purpose</Label>
                          <Input
                            id="token-purpose"
                            value={tokenForm.purpose}
                            onChange={(e) => setTokenForm(prev => ({ ...prev, purpose: e.target.value }))}
                            placeholder="Zapier Integration"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="token-description">Description</Label>
                        <Textarea
                          id="token-description"
                          value={tokenForm.description}
                          onChange={(e) => setTokenForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what this token will be used for..."
                        />
                      </div>
                      <div>
                        <Label>Permissions</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {Object.entries(tokenForm.permissions).map(([key, value]) => (
                            <label key={key} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => setTokenForm(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, [key]: e.target.checked }
                                }))}
                              />
                              <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={createToken} className="bg-blue-600 hover:bg-blue-700">
                          Create Token
                        </Button>
                        <Button variant="outline" onClick={() => setShowTokenForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stats Overview */}
                {tokens.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-6">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-600 font-medium">Total API Calls</p>
                              <p className="text-3xl font-bold text-blue-700">{stats.totalCalls}</p>
                            </div>
                            <Activity className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-600 font-medium">Real-time Webhook</p>
                              <p className="text-3xl font-bold text-purple-700">{stats.activeWebhooks}</p>
                            </div>
                            <Zap className="h-8 w-8 text-purple-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-600 font-medium">Success Rate</p>
                              <p className="text-3xl font-bold text-green-700">{stats.successRate}%</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* API Credentials */}
                    <Card className="bg-orange-50 border-orange-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                          <Settings className="h-5 w-5" />
                          Your API Credentials
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-gray-700 font-medium">Personal API Token:</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-white p-3 rounded border font-mono text-sm">
                              {tokens[0] && showTokens[tokens[0].id] 
                                ? `YUSR_${tokens[0].id.slice(0, 8)}...${tokens[0].id.slice(-8)}`
                                : 'YUSR_••••••••••••••••••••••••••••••••'
                              }
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => tokens[0] && setShowTokens(prev => ({ ...prev, [tokens[0].id]: !prev[tokens[0].id] }))}
                            >
                              {tokens[0] && showTokens[tokens[0].id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (tokens[0]) {
                                  navigator.clipboard.writeText(`YUSR_${tokens[0].id}`);
                                  toast({ title: "Copied!", description: "API token copied to clipboard" });
                                }
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-gray-700 font-medium">Real-time Webhook URL:</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-white p-3 rounded border font-mono text-sm break-all">
                              {realtimeWebhookUrl}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(realtimeWebhookUrl);
                                toast({ title: "Copied!", description: "Webhook URL copied to clipboard" });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Usage Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>API Usage Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
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
                  </>
                )}
              </TabsContent>

              <TabsContent value="logs" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent API Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apiLogs.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No API calls yet</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {apiLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-4">
                              <Badge variant={log.status_code < 300 ? "default" : "destructive"}>
                                {log.method}
                              </Badge>
                              <span className="font-mono text-sm">{log.endpoint}</span>
                              <Badge variant="outline">{log.status_code}</Badge>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>{log.response_time_ms}ms</p>
                              <p>{new Date(log.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="errors" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apiErrors.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No errors - great job! 🎉</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {apiErrors.map((error) => (
                          <div key={error.id} className="p-4 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="destructive">{error.severity}</Badge>
                                  <Badge variant="outline">{error.error_type}</Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">{error.error_message}</p>
                                {error.endpoint && (
                                  <p className="text-xs text-gray-500">Endpoint: {error.endpoint}</p>
                                )}
                                <div className="mt-2 text-xs text-gray-600">
                                  <p>Common solutions:</p>
                                  <ul className="list-disc list-inside ml-2 mt-1">
                                    {error.error_type === 'VALIDATION_ERROR' && <li>Check your request format and required fields</li>}
                                    {error.error_type === 'AUTHENTICATION_ERROR' && <li>Verify your API token is correct and active</li>}
                                    {error.error_type === 'AUTHORIZATION_ERROR' && <li>Ensure your token has the required permissions</li>}
                                    {error.error_type === 'NOT_FOUND_ERROR' && <li>Verify the resource ID and endpoint URL</li>}
                                    {error.error_type === 'RATE_LIMIT_ERROR' && <li>Reduce request frequency and implement backoff</li>}
                                  </ul>
                                </div>
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                {new Date(error.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Your API</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="test-token">API Token</Label>
                        <Select value={testForm.selectedToken} onValueChange={(value) => setTestForm(prev => ({ ...prev, selectedToken: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your API token" />
                          </SelectTrigger>
                          <SelectContent>
                            {tokens.map((token) => (
                              <SelectItem key={token.id} value={`YUSR_${token.id}`}>
                                {token.token_name} (YUSR_{token.id.slice(0, 8)}...)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="test-method">HTTP Method</Label>
                          <Select value={testForm.method} onValueChange={(value) => setTestForm(prev => ({ ...prev, method: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="test-endpoint">Endpoint</Label>
                          <Select value={testForm.endpoint} onValueChange={(value) => setTestForm(prev => ({ ...prev, endpoint: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="/automations">List Automations</SelectItem>
                              <SelectItem value="/automations">Create Automation</SelectItem>
                              <SelectItem value="/webhooks">List Webhooks</SelectItem>
                              <SelectItem value="/events">List Events</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="natural-language">What do you want to do? (Natural Language)</Label>
                        <Textarea
                          id="natural-language"
                          value={testForm.naturalLanguage}
                          onChange={(e) => handleNaturalLanguageChange(e.target.value)}
                          placeholder="Create an automation called 'Email Notification' that sends alerts when a user signs up"
                          className="min-h-20"
                        />
                      </div>

                      <div>
                        <Label htmlFor="test-payload">Request Payload (JSON)</Label>
                        <Textarea
                          id="test-payload"
                          value={testForm.jsonPayload}
                          onChange={(e) => setTestForm(prev => ({ ...prev, jsonPayload: e.target.value }))}
                          placeholder="Auto-generated from your natural language input above"
                          className="min-h-32 font-mono text-sm"
                        />
                      </div>

                      <Button 
                        onClick={testApiCall} 
                        disabled={testLoading || !testForm.selectedToken}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        {testLoading ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Testing API Call...
                          </>
                        ) : (
                          <>
                            <Code className="h-4 w-4 mr-2" />
                            Test API Call
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {testResult ? (
                        <div className="space-y-4">
                          {testResult.error ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-5 w-5 text-red-500" />
                                <span className="font-medium text-red-700">Request Failed</span>
                              </div>
                              <p className="text-sm text-red-600">{testResult.error}</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-4">
                                <Badge variant={testResult.status < 300 ? "default" : "destructive"}>
                                  {testResult.status}
                                </Badge>
                                <span className="text-sm text-gray-600">{testResult.responseTime}ms</span>
                              </div>
                              
                              <div>
                                <Label>Response Data:</Label>
                                <div className="mt-2 max-h-64 overflow-y-auto">
                                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(testResult.data, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Run a test to see the response here</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PersonalApiDashboard;
