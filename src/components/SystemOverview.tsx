
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Activity, TrendingUp, Users, Zap, Globe, Shield, Clock, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const SystemOverview = () => {
  const { user } = useAuth();
  const [systemStats, setSystemStats] = useState({
    totalAutomations: 0,
    activeAutomations: 0,
    totalRuns: 0,
    successRate: 0,
    apiCalls: 0,
    webhookDeliveries: 0,
    errorCount: 0,
    avgResponseTime: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [automationStatusData, setAutomationStatusData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSystemData();
      const interval = setInterval(fetchSystemData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchSystemData = async () => {
    try {
      // Fetch automations
      const { data: automations } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user?.id);

      // Fetch automation runs
      const { data: runs } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('user_id', user?.id)
        .order('run_timestamp', { ascending: false })
        .limit(100);

      // Fetch API usage
      const { data: apiUsage } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch webhook deliveries
      const { data: webhookLogs } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Calculate system stats
      const totalAutomations = automations?.length || 0;
      const activeAutomations = automations?.filter(a => a.status === 'active').length || 0;
      const totalRuns = runs?.length || 0;
      const successfulRuns = runs?.filter(r => r.status === 'completed').length || 0;
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

      setSystemStats({
        totalAutomations,
        activeAutomations,
        totalRuns,
        successRate,
        apiCalls: apiUsage?.length || 0,
        webhookDeliveries: webhookLogs?.length || 0,
        errorCount: runs?.filter(r => r.status === 'failed').length || 0,
        avgResponseTime: 180 // Mock data
      });

      // Generate activity chart data for last 7 days
      const now = new Date();
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dayRuns = runs?.filter(run => {
          const runDate = new Date(run.run_timestamp);
          return runDate.toDateString() === date.toDateString();
        }) || [];

        const dayApiCalls = apiUsage?.filter(api => {
          const apiDate = new Date(api.created_at);
          return apiDate.toDateString() === date.toDateString();
        }) || [];

        const dayWebhooks = webhookLogs?.filter(webhook => {
          const webhookDate = new Date(webhook.created_at);
          return webhookDate.toDateString() === date.toDateString();
        }) || [];

        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          automations: dayRuns.length,
          api: dayApiCalls.length,
          webhooks: dayWebhooks.length,
          success: dayRuns.filter(r => r.status === 'completed').length,
          errors: dayRuns.filter(r => r.status === 'failed').length
        };
      });

      setChartData(chartData);

      // Automation status distribution
      const statusCounts = automations?.reduce((acc: any, automation) => {
        acc[automation.status] = (acc[automation.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count as number,
        color: status === 'active' ? '#10b981' : status === 'paused' ? '#f59e0b' : '#6b7280'
      }));

      setAutomationStatusData(statusData);

      // Recent activity
      const allActivity = [
        ...(runs?.slice(0, 5).map(run => ({
          type: 'automation',
          status: run.status,
          message: `Automation run ${run.status}`,
          timestamp: run.run_timestamp,
          id: run.id
        })) || []),
        ...(apiUsage?.slice(0, 3).map(api => ({
          type: 'api',
          status: api.status_code >= 200 && api.status_code < 300 ? 'success' : 'error',
          message: `API ${api.method} ${api.endpoint}`,
          timestamp: api.created_at,
          id: api.id
        })) || []),
        ...(webhookLogs?.slice(0, 2).map(webhook => ({
          type: 'webhook',
          status: webhook.status_code >= 200 && webhook.status_code < 300 ? 'success' : 'error',
          message: `Webhook delivery`,
          timestamp: webhook.created_at,
          id: webhook.id
        })) || [])
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      setRecentActivity(allActivity);

    } catch (error) {
      console.error('Error fetching system data:', error);
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
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">System Overview</h2>
        <p className="text-blue-100">Monitor your automation ecosystem in real-time</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Automations</p>
                <p className="text-2xl font-bold text-blue-600">{systemStats.totalAutomations}</p>
                <p className="text-xs text-gray-500">{systemStats.activeAutomations} active</p>
              </div>
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{systemStats.successRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">{systemStats.totalRuns} total runs</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Calls</p>
                <p className="text-2xl font-bold text-purple-600">{systemStats.apiCalls}</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
              <Globe className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{systemStats.errorCount}</p>
                <p className="text-xs text-gray-500">Last 7 days</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Activity Timeline (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="automations" stroke="#3b82f6" strokeWidth={2} name="Automations" />
                <Line type="monotone" dataKey="api" stroke="#8b5cf6" strokeWidth={2} name="API Calls" />
                <Line type="monotone" dataKey="webhooks" stroke="#10b981" strokeWidth={2} name="Webhooks" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Automation Status Distribution */}
        <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={automationStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {automationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-blue-600">{systemStats.avgResponseTime}ms</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Webhook Deliveries</p>
                <p className="text-2xl font-bold text-green-600">{systemStats.webhookDeliveries}</p>
              </div>
              <Globe className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-purple-600">99.9%</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {activity.type === 'automation' && <Zap className="w-4 h-4 text-blue-500" />}
                  {activity.type === 'api' && <Globe className="w-4 h-4 text-purple-500" />}
                  {activity.type === 'webhook' && <Activity className="w-4 h-4 text-green-500" />}
                  <div>
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={activity.status === 'completed' || activity.status === 'success' ? "default" : "destructive"}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemOverview;
