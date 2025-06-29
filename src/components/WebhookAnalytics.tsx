
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Webhook, Activity, AlertCircle, CheckCircle, Clock, TrendingUp, Globe, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WebhookAnalyticsProps {
  automationId: string;
}

const WebhookAnalytics = ({ automationId }: WebhookAnalyticsProps) => {
  const [webhookStats, setWebhookStats] = useState({
    totalCalls: 0,
    successRate: 0,
    avgResponseTime: 0,
    activeWebhooks: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebhookData();
    const interval = setInterval(fetchWebhookData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [automationId]);

  const fetchWebhookData = async () => {
    try {
      // Fetch webhook statistics
      const { data: webhookEvents } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('automation_id', automationId);

      const { data: deliveryLogs } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .in('automation_webhook_id', webhookEvents?.map(w => w.id) || [])
        .order('created_at', { ascending: false })
        .limit(50);

      // Calculate stats
      const totalCalls = deliveryLogs?.length || 0;
      const successfulCalls = deliveryLogs?.filter(log => log.status_code >= 200 && log.status_code < 300).length || 0;
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      setWebhookStats({
        totalCalls,
        successRate,
        avgResponseTime: 150, // Mock data - would calculate from actual response times
        activeWebhooks: webhookEvents?.filter(w => w.is_active).length || 0
      });

      // Generate chart data for last 24 hours
      const now = new Date();
      const chartData = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        const hourLogs = deliveryLogs?.filter(log => {
          const logTime = new Date(log.created_at);
          return logTime.getHours() === hour.getHours() && 
                 logTime.toDateString() === hour.toDateString();
        }) || [];

        return {
          time: hour.getHours() + ':00',
          requests: hourLogs.length,
          success: hourLogs.filter(log => log.status_code >= 200 && log.status_code < 300).length,
          errors: hourLogs.filter(log => log.status_code >= 400).length
        };
      });

      setChartData(chartData);
      setRecentActivity(deliveryLogs?.slice(0, 10) || []);
      setLogs(deliveryLogs || []);
    } catch (error) {
      console.error('Error fetching webhook data:', error);
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-blue-600">{webhookStats.totalCalls}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{webhookStats.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-purple-600">{webhookStats.avgResponseTime}ms</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Hooks</p>
                <p className="text-2xl font-bold text-blue-600">{webhookStats.activeWebhooks}</p>
              </div>
              <Webhook className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Volume Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Request Volume (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
                    {activity.status_code >= 200 && activity.status_code < 300 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">HTTP {activity.status_code}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={activity.status_code >= 200 && activity.status_code < 300 ? "default" : "destructive"}>
                    {activity.status_code >= 200 && activity.status_code < 300 ? "Success" : "Error"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Logs */}
      <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Delivery Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="success">Successful</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-3">
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.status_code >= 200 && log.status_code < 300 ? "default" : "destructive"}>
                          {log.status_code}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(log.delivered_at || log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Attempt {log.delivery_attempts}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Payload:</p>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="success">
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {logs.filter(log => log.status_code >= 200 && log.status_code < 300).map((log, index) => (
                  <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <Badge variant="default">{log.status_code}</Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(log.delivered_at || log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="errors">
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {logs.filter(log => log.status_code >= 400).map((log, index) => (
                  <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="destructive">{log.status_code}</Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(log.delivered_at || log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.response_body && (
                      <p className="text-sm text-red-700 mt-2">{log.response_body}</p>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookAnalytics;
