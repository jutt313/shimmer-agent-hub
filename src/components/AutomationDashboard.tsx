
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Activity, Clock, CheckCircle, AlertCircle, Play, Pause, Settings, Webhook, BarChart3, TrendingUp, Calendar, Globe, Bot, Zap, Server, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AutomationBlueprint } from '@/types/automation';
import WebhookCreateModal from '@/components/webhooks/WebhookCreateModal';
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AutomationDashboardProps {
  automationId: string;
  automationTitle: string;
  automationBlueprint: AutomationBlueprint | null;
}

interface AutomationRun {
  id: string;
  status: string;
  duration_ms: number;
  run_timestamp: string;
  details_log: any;
  trigger_data: any;
}

interface PlatformUsage {
  platform_name: string;
  total_runs: number;
  success_count: number;
  avg_duration: number;
}

interface AIAgent {
  id: string;
  agent_name: string;
  agent_role: string;
  agent_goal: string;
  created_at: string;
  total_calls: number;
  success_rate: number;
}

interface WebhookData {
  id: string;
  webhook_name: string;
  webhook_url: string;
  webhook_secret: string;
  is_active: boolean;
  trigger_count: number;
  expected_events: string[];
  last_triggered_at: string;
  created_at: string;
}

interface WebhookLog {
  id: string;
  webhook_name: string;
  payload: any;
  status_code: number;
  response_body: string;
  delivered_at: string;
  created_at: string;
  delivery_attempts: number;
}

interface WebhookError {
  id: string;
  webhook_name: string;
  error_code: string;
  error_message: string;
  timestamp: string;
  payload: any;
  attempts: number;
}

const AutomationDashboard = ({ automationId, automationTitle, automationBlueprint }: AutomationDashboardProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [webhookActiveTab, setWebhookActiveTab] = useState('overview');
  
  // Data states
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [platformUsage, setPlatformUsage] = useState<PlatformUsage[]>([]);
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [webhookErrors, setWebhookErrors] = useState<WebhookError[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Webhook management states
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [selectedWebhookForTest, setSelectedWebhookForTest] = useState<string>('');
  const [testPayload, setTestPayload] = useState<string>('{"event": "automation_completed", "data": {"automation_id": "' + automationId + '", "status": "success"}}');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<null | {
    success: boolean;
    status_code: number;
    response_time: number;
    response_body?: string;
  }>(null);

  // Stats calculations
  const totalRuns = automationRuns.length;
  const successfulRuns = automationRuns.filter(run => run.status === 'completed').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
  const avgExecutionTime = automationRuns.length > 0 
    ? Math.round(automationRuns.reduce((sum, run) => sum + (run.duration_ms || 0), 0) / automationRuns.length)
    : 0;

  // Chart data preparation
  const getChartData = (period: string) => {
    const now = new Date();
    const data: any[] = [];
    
    if (period === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayRuns = automationRuns.filter(run => 
          new Date(run.run_timestamp).toDateString() === date.toDateString()
        );
        const successful = dayRuns.filter(run => run.status === 'completed').length;
        data.push({
          period: date.toLocaleDateString('en-US', { weekday: 'short' }),
          total_runs: dayRuns.length,
          success_rate: dayRuns.length > 0 ? Math.round((successful / dayRuns.length) * 100) : 0,
          avg_time: dayRuns.length > 0 ? Math.round(dayRuns.reduce((sum, run) => sum + (run.duration_ms || 0), 0) / dayRuns.length) : 0
        });
      }
    } else if (period === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (i * 7 + 6));
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        
        const weekRuns = automationRuns.filter(run => {
          const runDate = new Date(run.run_timestamp);
          return runDate >= startDate && runDate <= endDate;
        });
        const successful = weekRuns.filter(run => run.status === 'completed').length;
        data.push({
          period: `Week ${4-i}`,
          total_runs: weekRuns.length,
          success_rate: weekRuns.length > 0 ? Math.round((successful / weekRuns.length) * 100) : 0,
          avg_time: weekRuns.length > 0 ? Math.round(weekRuns.reduce((sum, run) => sum + (run.duration_ms || 0), 0) / weekRuns.length) : 0
        });
      }
    } else { // monthly
      for (let i = 2; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthRuns = automationRuns.filter(run => {
          const runDate = new Date(run.run_timestamp);
          return runDate.getMonth() === date.getMonth() && runDate.getFullYear() === date.getFullYear();
        });
        const successful = monthRuns.filter(run => run.status === 'completed').length;
        data.push({
          period: date.toLocaleDateString('en-US', { month: 'short' }),
          total_runs: monthRuns.length,
          success_rate: monthRuns.length > 0 ? Math.round((successful / monthRuns.length) * 100) : 0,
          avg_time: monthRuns.length > 0 ? Math.round(monthRuns.reduce((sum, run) => sum + (run.duration_ms || 0), 0) / monthRuns.length) : 0
        });
      }
    }
    return data;
  };

  const fetchAutomationData = async () => {
    try {
      // Fetch automation runs
      const { data: runsData, error: runsError } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('automation_id', automationId)
        .order('run_timestamp', { ascending: false })
        .limit(100);

      if (runsError) throw runsError;
      setAutomationRuns(runsData || []);

      // Extract platform usage from runs
      const platformStats: { [key: string]: PlatformUsage } = {};
      (runsData || []).forEach(run => {
        if (run.details_log?.platforms) {
          run.details_log.platforms.forEach((platform: string) => {
            if (!platformStats[platform]) {
              platformStats[platform] = {
                platform_name: platform,
                total_runs: 0,
                success_count: 0,
                avg_duration: 0
              };
            }
            platformStats[platform].total_runs++;
            if (run.status === 'completed') {
              platformStats[platform].success_count++;
            }
            platformStats[platform].avg_duration += run.duration_ms || 0;
          });
        }
      });

      // Calculate averages and set platform usage
      Object.values(platformStats).forEach(stat => {
        stat.avg_duration = Math.round(stat.avg_duration / stat.total_runs);
      });
      setPlatformUsage(Object.values(platformStats));

      // Fetch AI agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('automation_id', automationId);

      if (agentsError) throw agentsError;
      
      // Transform agents data with mock stats for now
      const transformedAgents: AIAgent[] = (agentsData || []).map(agent => ({
        id: agent.id,
        agent_name: agent.agent_name,
        agent_role: agent.agent_role || 'Assistant',
        agent_goal: agent.agent_goal || 'Process automation tasks',
        created_at: agent.created_at,
        total_calls: Math.floor(Math.random() * 100) + 10, // Will be replaced with real data
        success_rate: Math.floor(Math.random() * 20) + 80 // Will be replaced with real data
      }));
      setAiAgents(transformedAgents);

      // Fetch webhooks
      const { data: webhooksData, error: webhooksError } = await supabase
        .from('automation_webhooks')
        .select('*')
        .eq('automation_id', automationId);

      if (webhooksError) throw webhooksError;
      setWebhooks(webhooksData || []);

      // Fetch webhook logs
      const { data: logsData, error: logsError } = await supabase
        .from('webhook_delivery_logs')
        .select(`
          *,
          automation_webhooks!inner(webhook_name)
        `)
        .eq('automation_webhooks.automation_id', automationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      
      const transformedLogs: WebhookLog[] = (logsData || []).map((log: any) => ({
        id: log.id,
        webhook_name: log.automation_webhooks?.webhook_name || 'Unknown Webhook',
        payload: log.payload,
        status_code: log.status_code || 0,
        response_body: log.response_body || '',
        delivered_at: log.delivered_at || '',
        created_at: log.created_at,
        delivery_attempts: log.delivery_attempts || 1
      }));
      setWebhookLogs(transformedLogs);

      // Simulate webhook errors from failed deliveries
      const failedLogs = transformedLogs.filter(log => !log.delivered_at);
      const simulatedErrors: WebhookError[] = failedLogs.map(log => ({
        id: log.id,
        webhook_name: log.webhook_name,
        error_code: `HTTP_${log.status_code}`,
        error_message: log.response_body || 'Webhook delivery failed',
        timestamp: log.created_at,
        payload: log.payload,
        attempts: log.delivery_attempts
      }));
      setWebhookErrors(simulatedErrors);

    } catch (error) {
      console.error('Error fetching automation data:', error);
      toast({
        title: "Error",
        description: "Failed to load automation dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchAutomationData();
  }, [automationId]);

  if (loading) {
    return (
      <Card className="w-full h-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 text-white pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <BarChart3 className="w-6 h-6" />
          Dashboard
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-80px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid grid-cols-5 gap-1 p-2 bg-gray-50 mx-4 mt-4 rounded-2xl">
            <TabsTrigger 
              value="overview" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Server className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger 
              value="agents" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Bot className="w-4 h-4 mr-2" />
              AI Agents
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity
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
            <div className="space-y-6">
              {/* Top 3 Mini Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Runs</p>
                        <p className="text-3xl font-bold text-blue-600">{totalRuns}</p>
                      </div>
                      <Zap className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-3xl font-bold text-green-600">{successRate}%</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Execution Time</p>
                        <p className="text-3xl font-bold text-purple-600">{avgExecutionTime}ms</p>
                      </div>
                      <Clock className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Big Stacked Bar Chart */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getChartData('daily')}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total_runs" fill="#8b5cf6" name="Total Runs" />
                            <Bar dataKey="success_rate" fill="#10b981" name="Success Rate %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    <TabsContent value="weekly">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getChartData('weekly')}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total_runs" fill="#8b5cf6" name="Total Runs" />
                            <Bar dataKey="success_rate" fill="#10b981" name="Success Rate %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    <TabsContent value="monthly">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getChartData('monthly')}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total_runs" fill="#8b5cf6" name="Total Runs" />
                            <Bar dataKey="success_rate" fill="#10b981" name="Success Rate %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Last 24 Hour Activity */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Last 24 Hour Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {automationRuns
                      .filter(run => {
                        const runTime = new Date(run.run_timestamp);
                        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        return runTime >= twentyFourHoursAgo;
                      })
                      .slice(0, 10)
                      .map((run) => (
                        <div key={run.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              run.status === 'completed' ? 'bg-green-500' : 
                              run.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <div>
                              <p className="font-medium">Automation Executed</p>
                              <p className="text-sm text-gray-600">Status: {run.status}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{run.duration_ms}ms</p>
                            <p className="text-xs text-gray-500">
                              {new Date(run.run_timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    {automationRuns.filter(run => {
                      const runTime = new Date(run.run_timestamp);
                      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                      return runTime >= twentyFourHoursAgo;
                    }).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No activity in the last 24 hours</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="flex-1 p-6 overflow-y-auto">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Platform Services Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {platformUsage.length > 0 ? (
                  <div className="space-y-4">
                    {platformUsage.map((platform) => (
                      <div key={platform.platform_name} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{platform.platform_name}</h3>
                            <p className="text-sm text-gray-600">Platform Service</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Total Runs</p>
                              <p className="font-bold text-blue-600">{platform.total_runs}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Success Rate</p>
                              <p className="font-bold text-green-600">
                                {Math.round((platform.success_count / platform.total_runs) * 100)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Avg Duration</p>
                              <p className="font-bold text-purple-600">{platform.avg_duration}ms</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Server className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No platform services detected in automation runs</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Agents Tab */}
          <TabsContent value="agents" className="flex-1 p-6 overflow-y-auto">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Agents Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiAgents.length > 0 ? (
                  <div className="space-y-4">
                    {aiAgents.map((agent) => (
                      <div key={agent.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900">{agent.agent_name}</h3>
                                <p className="text-sm text-gray-600">{agent.agent_role}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{agent.agent_goal}</p>
                            <div className="flex gap-4 text-sm">
                              <span className="text-blue-600">Total Calls: {agent.total_calls}</span>
                              <span className="text-green-600">Success Rate: {agent.success_rate}%</span>
                              <span className="text-gray-600">Created: {new Date(agent.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No AI agents configured for this automation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 p-6 overflow-y-auto">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Complete Automation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {automationRuns.map((run) => (
                    <div key={run.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            run.status === 'completed' ? 'bg-green-500' : 
                            run.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="font-medium">Run #{run.id.slice(-8)}</span>
                          <Badge className={
                            run.status === 'completed' ? 'bg-green-100 text-green-800' :
                            run.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }>
                            {run.status}
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>{new Date(run.run_timestamp).toLocaleString()}</p>
                          <p>{run.duration_ms}ms</p>
                        </div>
                      </div>
                      {run.details_log && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <pre className="text-gray-700 overflow-x-auto">
                            {JSON.stringify(run.details_log, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                  {automationRuns.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No automation runs found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
              </div>

              <TabsContent value="overview" className="space-y-6">
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
                  <div className="space-y-6">
                    {/* Webhook Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                      <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-0 shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Success Rate</p>
                              <p className="text-2xl font-bold text-pink-600">96%</p>
                            </div>
                            <TrendingUp className="w-6 h-6 text-pink-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Button
                      onClick={() => setShowCreateWebhook(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                    >
                      <Webhook className="w-4 h-4 mr-2" />
                      Add Another Webhook
                    </Button>

                    {/* Webhook List */}
                    <div className="space-y-4">
                      {webhooks.map((webhook) => (
                        <Card key={webhook.id} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-3 h-3 rounded-full ${webhook.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                  <h3 className="font-bold text-gray-900">{webhook.webhook_name}</h3>
                                  <Badge className={webhook.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                    {webhook.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <p><strong>URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{webhook.webhook_url}</code></p>
                                  <p><strong>Secret:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{webhook.webhook_secret.slice(0, 20)}...</code></p>
                                  <p><strong>Expected Events:</strong> {webhook.expected_events.join(', ') || 'All events'}</p>
                                  <p><strong>Trigger Count:</strong> {webhook.trigger_count}</p>
                                  {webhook.last_triggered_at && (
                                    <p><strong>Last Triggered:</strong> {new Date(webhook.last_triggered_at).toLocaleString()}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Webhook Delivery Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {webhookLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${log.delivered_at ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="font-medium">{log.webhook_name}</span>
                              <Badge className={log.delivered_at ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {log.status_code}
                              </Badge>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <p>{new Date(log.created_at).toLocaleString()}</p>
                              <p>Attempts: {log.delivery_attempts}</p>
                            </div>
                          </div>
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                            <p className="font-medium mb-1">Payload:</p>
                            <pre className="text-gray-700 overflow-x-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                            {log.response_body && (
                              <>
                                <p className="font-medium mb-1 mt-2">Response:</p>
                                <pre className="text-gray-700 overflow-x-auto">
                                  {log.response_body}
                                </pre>
                              </>
                            )}
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

              <TabsContent value="errors" className="space-y-4">
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
                              <p className="text-sm text-red-700 mb-2">
                                <strong>Error:</strong> Webhook delivery failed after {error.attempts} attempts
                              </p>
                              <p className="text-sm text-red-700 mb-2">
                                <strong>Plain English:</strong> The webhook endpoint is not responding correctly. 
                                This could mean the target URL is down, returning errors, or not accepting the webhook payload format.
                              </p>
                              <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                                <p className="font-medium mb-1">Raw Response:</p>
                                <pre className="text-red-800 overflow-x-auto">
                                  {error.error_message || 'No response received'}
                                </pre>
                              </div>
                              <p className="text-xs text-red-600 mt-2">{new Date(error.timestamp).toLocaleString()}</p>
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

              <TabsContent value="test" className="space-y-4">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Test Webhook Playground</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Webhook to Test
                      </label>
                      <select 
                        value={selectedWebhookForTest}
                        onChange={(e) => {
                          setSelectedWebhookForTest(e.target.value);
                          // Auto-populate test payload based on webhook events
                          const webhook = webhooks.find(w => w.id === e.target.value);
                          if (webhook && webhook.expected_events.length > 0) {
                            setTestPayload(JSON.stringify({
                              event: webhook.expected_events[0],
                              data: {
                                automation_id: automationId,
                                timestamp: new Date().toISOString(),
                                status: "test"
                              }
                            }, null, 2));
                          }
                        }}
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
                        placeholder={'{"event": "automation_completed", "data": {"automation_id": "' + automationId + '", "status": "success"}}'}
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
                          <div className="text-sm space-y-1">
                            <p><strong>Status Code:</strong> {testResult.status_code}</p>
                            <p><strong>Response Time:</strong> {testResult.response_time}ms</p>
                            {!testResult.success && (
                              <p className="text-red-700">
                                <strong>Issue:</strong> The webhook endpoint returned an error. Check if the URL is correct and the service is running.
                              </p>
                            )}
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
            fetchAutomationData();
          }}
        />
      )}
    </Card>
  );
};

export default AutomationDashboard;
