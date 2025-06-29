
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Code, Shield, Activity, TrendingUp, Users, Globe, Zap, AlertTriangle, CheckCircle, Key, Webhook } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [devStats, setDevStats] = useState({
    totalApps: 0,
    activeTokens: 0,
    apiCalls: 0,
    oauthConnections: 0,
    webhookDeliveries: 0,
    errorRate: 0,
    rateLimitHits: 0,
    avgResponseTime: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [authMetrics, setAuthMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeveloperData();
      const interval = setInterval(fetchDeveloperData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDeveloperData = async () => {
    try {
      // Fetch developer apps
      const { data: apps } = await supabase
        .from('developer_integrations')
        .select('*')
        .eq('user_id', user?.id);

      // Fetch API tokens
      const { data: tokens } = await supabase
        .from('user_api_tokens')
        .select('*')
        .eq('user_id', user?.id);

      // Fetch API usage
      const { data: apiUsage } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch OAuth connections
      const { data: oauthConnections } = await supabase
        .from('oauth_connections')
        .select('*')
        .eq('user_id', user?.id);

      // Calculate stats
      const totalApps = apps?.length || 0;
      const activeTokens = tokens?.filter(t => t.is_active).length || 0;
      const apiCalls = apiUsage?.length || 0;
      const totalConnections = oauthConnections?.length || 0;
      const errorCalls = apiUsage?.filter(api => api.status_code >= 400).length || 0;
      const errorRate = apiCalls > 0 ? (errorCalls / apiCalls) * 100 : 0;

      setDevStats({
        totalApps,
        activeTokens,
        apiCalls,
        oauthConnections: totalConnections,
        webhookDeliveries: 0, // Would fetch from webhook delivery logs
        errorRate,
        rateLimitHits: apiUsage?.filter(api => api.status_code === 429).length || 0,
        avgResponseTime: apiUsage?.reduce((acc, api) => acc + (api.response_time_ms || 0), 0) / (apiUsage?.length || 1) || 0
      });

      // Generate chart data for last 24 hours
      const now = new Date();
      const chartData = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        const hourLogs = apiUsage?.filter(log => {
          const logTime = new Date(log.created_at);
          return logTime.getHours() === hour.getHours() && 
                 logTime.toDateString() === hour.toDateString();
        }) || [];

        return {
          time: hour.getHours() + ':00',
          requests: hourLogs.length,
          success: hourLogs.filter(log => log.status_code >= 200 && log.status_code < 300).length,
          errors: hourLogs.filter(log => log.status_code >= 400).length,
          responseTime: hourLogs.reduce((acc, log) => acc + (log.response_time_ms || 0), 0) / (hourLogs.length || 1) || 0
        };
      });

      setChartData(chartData);

      // Recent logs
      setRecentLogs(apiUsage?.slice(0, 20) || []);
      setErrorLogs(apiUsage?.filter(log => log.status_code >= 400).slice(0, 10) || []);

      // Auth metrics (mock data - would calculate from real OAuth flows)
      const authData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          authorizations: Math.floor(Math.random() * 20),
          tokenRefreshes: Math.floor(Math.random() * 50),
          failures: Math.floor(Math.random() * 5)
        };
      });

      setAuthMetrics(authData);

    } catch (error) {
      console.error('Error fetching developer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Developer Dashboard</h2>
        <p className="text-blue-100">Monitor your API usage and authentication metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Developer Apps</p>
                <p className="text-2xl font-bold text-blue-600">{devStats.totalApps}</p>
              </div>
              <Code className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tokens</p>
                <p className="text-2xl font-bold text-green-600">{devStats.activeTokens}</p>
              </div>
              <Key className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Calls</p>
                <p className="text-2xl font-bold text-purple-600">{devStats.apiCalls}</p>
              </div>
              <Globe className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-red-600">{devStats.errorRate.toFixed(1)}%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">OAuth Connections</p>
                <p className="text-2xl font-bold text-blue-600">{devStats.oauthConnections}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(devStats.avgResponseTime)}ms</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rate Limit Hits</p>
                <p className="text-2xl font-bold text-purple-600">{devStats.rateLimitHits}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring */}
      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">API Metrics</TabsTrigger>
          <TabsTrigger value="auth">OAuth Flow</TabsTrigger>
          <TabsTrigger value="logs">Request Logs</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  API Request Volume (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} name="Success" />
                    <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Errors" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Response Time (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="responseTime" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="auth" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                OAuth Flow Metrics (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={authMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Line type="monotone" dataKey="authorizations" stroke="#3b82f6" strokeWidth={2} name="New Authorizations" />
                  <Line type="monotone" dataKey="tokenRefreshes" stroke="#10b981" strokeWidth={2} name="Token Refreshes" />
                  <Line type="monotone" dataKey="failures" stroke="#ef4444" strokeWidth={2} name="Auth Failures" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent API Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {recentLogs.map((log, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant={log.status_code >= 200 && log.status_code < 300 ? "default" : "destructive"}>
                        {log.status_code}
                      </Badge>
                      <span className="font-mono text-sm">{log.method}</span>
                      <span className="text-sm text-gray-600">{log.endpoint}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{log.response_time_ms}ms</p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Error Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto space-y-3">
                {errorLogs.map((log, index) => (
                  <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive">{log.status_code}</Badge>
                        <span className="font-mono text-sm">{log.method} {log.endpoint}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-red-700">
                      Response time: {log.response_time_ms}ms
                    </p>
                  </div>
                ))}
                {errorLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No errors in recent requests!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperDashboard;
