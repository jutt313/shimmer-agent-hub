import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Activity, Clock, CheckCircle, AlertCircle, Play, Pause, Settings, Webhook, BarChart as BarChartIcon, TrendingUp, Calendar, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AutomationBlueprint } from '@/types/automation';
import { useAutomationWebhooks } from '@/hooks/useAutomationWebhooks';
import WebhookCard from '@/components/webhooks/WebhookCard';
import WebhookCreateModal from '@/components/webhooks/WebhookCreateModal';
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AutomationDashboardProps {
  automationId: string;
  automationTitle: string;
  automationBlueprint: AutomationBlueprint | null;
  onClose: () => void;
}

interface WebhookLog {
  id: string;
  webhook_name: string;
  event_type: string;
  status: string;
  status_code: number;
  timestamp: string;
  response_body?: string;
  delivery_attempts: number;
}

interface WebhookError {
  id: string;
  webhook_name: string;
  error_code: string;
  error_message: string;
  timestamp: string;
}

const AutomationDashboard = ({ automationId, automationTitle, automationBlueprint, onClose }: AutomationDashboardProps) => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [webhookActiveTab, setWebhookActiveTab] = useState('overview');
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [webhookErrors, setWebhookErrors] = useState<WebhookError[]>([]);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [selectedWebhookForTest, setSelectedWebhookForTest] = useState<string>('');
  const [testPayload, setTestPayload] = useState<string>('{"event": "test", "data": {"message": "Hello World"}}');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<null | {
    success: boolean;
    status_code: number;
    response_time: number;
    response_body?: string;
  }>(null);

  // Sample performance data for charts
  const performanceData = [
    { date: '2023-06-01', total: 100, successful: 90, failed: 10 },
    { date: '2023-06-02', total: 120, successful: 110, failed: 10 },
    { date: '2023-06-03', total: 130, successful: 125, failed: 5 },
    { date: '2023-06-04', total: 90, successful: 85, failed: 5 },
    { date: '2023-06-05', total: 150, successful: 140, failed: 10 },
    { date: '2023-06-06', total: 160, successful: 150, failed: 10 },
    { date: '2023-06-07', total: 170, successful: 160, failed: 10 },
  ];

  const webhookDeliveryData = [
    { date: '2023-06-01', successful: 80, failed: 5 },
    { date: '2023-06-02', successful: 90, failed: 10 },
    { date: '2023-06-03', successful: 85, failed: 15 },
    { date: '2023-06-04', successful: 95, failed: 5 },
    { date: '2023-06-05', successful: 100, failed: 8 },
    { date: '2023-06-06', successful: 110, failed: 7 },
    { date: '2023-06-07', successful: 120, failed: 6 },
  ];

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_webhooks')
        .select('*')
        .eq('automation_id', automationId);

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: "Error",
        description: "Failed to load webhooks",
        variant: "destructive",
      });
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select(`
          *,
          automation_webhooks!inner(webhook_name)
        `)
        .eq('automation_webhooks.automation_id', automationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform the data to match WebhookLog interface
      const transformedLogs: WebhookLog[] = (data || []).map((log: any) => ({
        id: log.id,
        webhook_name: log.automation_webhooks?.webhook_name || 'Unknown Webhook',
        event_type: 'webhook_delivery',
        status: log.delivered_at ? 'success' : 'failed',
        status_code: log.status_code || 0,
        timestamp: log.created_at,
        response_body: log.response_body,
        delivery_attempts: log.delivery_attempts,
      }));
      
      setWebhookLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      toast({
        title: "Error",
        description: "Failed to load webhook logs",
        variant: "destructive",
      });
    }
  };

  const fetchWebhookErrors = async () => {
    try {
      // Since webhook_errors table doesn't exist, we'll simulate errors from failed deliveries
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select(`
          *,
          automation_webhooks!inner(webhook_name)
        `)
        .eq('automation_webhooks.automation_id', automationId)
        .is('delivered_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform failed deliveries into webhook errors
      const transformedErrors: WebhookError[] = (data || []).map((log: any) => ({
        id: log.id,
        webhook_name: log.automation_webhooks?.webhook_name || 'Unknown Webhook',
        error_code: `HTTP_${log.status_code || 'UNKNOWN'}`,
        error_message: log.response_body || 'Delivery failed',
        timestamp: log.created_at,
      }));
      
      setWebhookErrors(transformedErrors);
    } catch (error) {
      console.error('Error fetching webhook errors:', error);
      toast({
        title: "Error",
        description: "Failed to load webhook errors",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchWebhooks();
    fetchWebhookLogs();
    fetchWebhookErrors();
  }, [automationId]);

  const handleToggleWebhookStatus = async (webhookId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_webhooks')
        .update({ is_active: !currentStatus })
        .eq('id', webhookId);

      if (error) throw error;
      toast({
        title: "Success",
        description: `Webhook ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook status:', error);
      toast({
        title: "Error",
        description: "Failed to update webhook status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      const { error } = await supabase
        .from('automation_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
      toast({
        title: "Deleted",
        description: "Webhook deleted successfully",
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    }
  };

  const handleTestWebhook = async () => {
    if (!selectedWebhookForTest) {
      toast({
        title: "Select Webhook",
        description: "Please select a webhook to test",
        variant: "destructive",
      });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(testPayload);
    } catch {
      toast({
        title: "Invalid JSON",
        description: "Test payload must be valid JSON",
        variant: "destructive",
      });
      return;
    }

    setTestingWebhook(true);
    setTestResult(null);

    try {
      const webhook = webhooks.find(w => w.id === selectedWebhookForTest);
      if (!webhook) throw new Error('Webhook not found');

      const startTime = performance.now();
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.webhook_secret,
        },
        body: JSON.stringify(payload),
      });
      const endTime = performance.now();

      const responseBody = await response.text();

      setTestResult({
        success: response.ok,
        status_code: response.status,
        response_time: Math.round(endTime - startTime),
        response_body: responseBody,
      });

      toast({
        title: response.ok ? "Test Successful" : "Test Failed",
        description: `Status code: ${response.status}`,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Error",
        description: "Failed to send test request",
        variant: "destructive",
      });
      setTestResult({
        success: false,
        status_code: 0,
        response_time: 0,
        response_body: String(error),
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <Card className="w-full h-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 text-white pb-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Activity className="w-7 h-7" />
              Dashboard
            </CardTitle>
            <p className="text-blue-100 mt-1 font-medium">{automationTitle}</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20 rounded-full px-3 py-1">
            Close
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-120px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid grid-cols-5 gap-1 p-2 bg-gray-50 mx-4 mt-4 rounded-2xl">
            <TabsTrigger 
              value="overview" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <BarChartIcon className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger 
              value="webhooks" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Webhook className="w-4 h-4 mr-2" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Executions</p>
                      <p className="text-3xl font-bold text-blue-600">1,247</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Webhooks</p>
                      <p className="text-3xl font-bold text-green-600">{webhooks.filter(w => w.is_active).length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Webhooks</p>
                      <p className="text-3xl font-bold text-purple-600">{webhooks.length}</p>
                    </div>
                    <Webhook className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Activity details will be shown here.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-3xl font-bold text-green-600">94.2%</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                        <p className="text-3xl font-bold text-blue-600">1.2s</p>
                      </div>
                      <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Executions</p>
                        <p className="text-3xl font-bold text-purple-600">1,247</p>
                      </div>
                      <Activity className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="successful" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Execution Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 p-6 overflow-y-auto">
            <div>
              <h3 className="text-lg font-semibold mb-4">Settings</h3>
              <p className="text-gray-600">Settings content will be here.</p>
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="flex-1 p-6 overflow-y-auto">
            <Tabs value={webhookActiveTab} onValueChange={setWebhookActiveTab} className="h-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger 
                    value="overview" 
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="logs" 
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    Logs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="errors" 
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    Errors
                  </TabsTrigger>
                  <TabsTrigger 
                    value="test" 
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    Test
                  </TabsTrigger>
                </TabsList>
                
                {webhooks.length > 0 && (
                  <Button
                    onClick={() => setShowCreateWebhook(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                  >
                    <Webhook className="w-4 h-4 mr-2" />
                    Add Webhook
                  </Button>
                )}
              </div>

              <TabsContent value="overview" className="space-y-6 h-full overflow-y-auto">
                {webhooks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <Webhook className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Webhooks Yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md">
                      Create your first webhook to receive real-time notifications when your automation runs.
                    </p>
                    <Button
                      onClick={() => setShowCreateWebhook(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl px-8 py-3"
                    >
                      <Webhook className="w-5 h-5 mr-2" />
                      Create Webhook
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Webhook Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-0 shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Webhooks</p>
                              <p className="text-2xl font-bold text-blue-600">{webhooks.length}</p>
                            </div>
                            <Webhook className="w-6 h-6 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Active</p>
                              <p className="text-2xl font-bold text-green-600">
                                {webhooks.filter(w => w.is_active).length}
                              </p>
                            </div>
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Calls</p>
                              <p className="text-2xl font-bold text-purple-600">
                                {webhooks.reduce((sum, w) => sum + w.trigger_count, 0)}
                              </p>
                            </div>
                            <Activity className="w-6 h-6 text-purple-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-0 shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Success Rate</p>
                              <p className="text-2xl font-bold text-orange-600">96%</p>
                            </div>
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Webhook Delivery Chart */}
                    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg mb-6">
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                          <BarChartIcon className="w-5 h-5" />
                          Webhook Delivery Statistics (Last 30 days)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={webhookDeliveryData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="successful" fill="#10b981" name="Successful" />
                              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Webhook Cards */}
                    <div className="grid gap-4">
                      {webhooks.map((webhook) => (
                        <WebhookCard
                          key={webhook.id}
                          webhook={webhook}
                          onToggleStatus={handleToggleWebhookStatus}
                          onDelete={handleDeleteWebhook}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="logs" className="space-y-4 h-full overflow-y-auto">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Webhook Delivery Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {webhookLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <div>
                              <p className="font-medium">{log.webhook_name}</p>
                              <p className="text-sm text-gray-600">{log.event_type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{log.status_code}</p>
                            <p className="text-xs text-gray-500">{log.timestamp}</p>
                          </div>
                        </div>
                      ))}
                      {webhookLogs.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-600">No webhook logs found.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="errors" className="space-y-4 h-full overflow-y-auto">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      Webhook Errors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {webhookErrors.map((error) => (
                        <div key={error.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="font-medium text-red-800">{error.webhook_name}</span>
                                <Badge variant="destructive" className="text-xs">{error.error_code}</Badge>
                              </div>
                              <p className="text-sm text-red-700 mb-1">{error.error_message}</p>
                              <p className="text-xs text-red-600">{error.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {webhookErrors.length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                          <p className="text-gray-600">No webhook errors found. Great job!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="space-y-4 h-full overflow-y-auto">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Test Webhook</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Webhook to Test
                      </label>
                      <select 
                        value={selectedWebhookForTest}
                        onChange={(e) => setSelectedWebhookForTest(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Choose a webhook...</option>
                        {webhooks.map((webhook) => (
                          <option key={webhook.id} value={webhook.id}>
                            {webhook.webhook_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Payload (JSON)
                      </label>
                      <Textarea
                        value={testPayload}
                        onChange={(e) => setTestPayload(e.target.value)}
                        placeholder='{"event": "test", "data": {"message": "Hello World"}}'
                        className="h-32 font-mono text-sm"
                      />
                    </div>

                    <Button
                      onClick={handleTestWebhook}
                      disabled={!selectedWebhookForTest || testingWebhook}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg"
                    >
                      {testingWebhook ? 'Testing...' : 'Send Test Request'}
                    </Button>

                    {testResult && (
                      <Card className={`mt-4 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {testResult.success ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                              {testResult.success ? 'Test Successful' : 'Test Failed'}
                            </span>
                          </div>
                          <div className="text-sm">
                            <p><strong>Status Code:</strong> {testResult.status_code}</p>
                            <p><strong>Response Time:</strong> {testResult.response_time}ms</p>
                            {testResult.response_body && (
                              <div className="mt-2">
                                <strong>Response:</strong>
                                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                  {testResult.response_body}
                                </pre>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Create Webhook Modal */}
      {showCreateWebhook && (
        <WebhookCreateModal
          isOpen={showCreateWebhook}
          automationId={automationId}
          onClose={() => setShowCreateWebhook(false)}
          onWebhookCreated={() => {
            setShowCreateWebhook(false);
            fetchWebhooks();
          }}
        />
      )}
    </Card>
  );
};

export default AutomationDashboard;
