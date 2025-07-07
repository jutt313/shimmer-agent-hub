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
  details_log: {
    platforms?: string[];
    [key: string]: any;
  } | null;
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
      
      // Transform the data to match our AutomationRun interface
      const transformedRuns: AutomationRun[] = (runsData || []).map(run => ({
        id: run.id,
        status: run.status,
        duration_ms: run.duration_ms || 0,
        run_timestamp: run.run_timestamp,
        details_log: run.details_log as { platforms?: string[]; [key: string]: any; } | null,
        trigger_data: run.trigger_data
      }));
      
      setAutomationRuns(transformedRuns);

      // Extract platform usage from runs
      const platformStats: { [key: string]: PlatformUsage } = {};
      transformedRuns.forEach(run => {
        // Safely access platforms from details_log
        const detailsLog = run.details_log as { platforms?: string[] } | null;
        if (detailsLog?.platforms) {
          detailsLog.platforms.forEach((platform: string) => {
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
      <CardHeader className="bg-white text-gray-800 pb-4 border-b border-gray-200">
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <BarChart3 className="w-6 h-6" />
          {automationTitle || 'Automation'} - Dashboard
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

              {/* Single Big Stacked Bar Chart */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        ...getChartData('daily').map(d => ({ ...d, period: `${d.period} (D)`, type: 'Daily' })),
                        ...getChartData('weekly').map(d => ({ ...d, period: `${d.period} (W)`, type: 'Weekly' })),
                        ...getChartData('monthly').map(d => ({ ...d, period: `${d.period} (M)`, type: 'Monthly' }))
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total_runs" stackId="a" fill="#8b5cf6" name="Total Runs" />
                        <Bar dataKey="success_rate" stackId="a" fill="#10b981" name="Success Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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

          {/* Services Tab - Enhanced */}
          <TabsContent value="services" className="flex-1 p-6 overflow-y-auto">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Detected Platform Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Show detected platforms from automation blueprint */}
                <div className="space-y-4">
                  {automationBlueprint?.steps?.map((step, index) => {
                    const platformName = (step.action as any)?.integration || 'Unknown Platform';
                    if (platformName === 'Unknown Platform') return null;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{platformName}</h3>
                            <p className="text-sm text-gray-600">Detected in automation steps</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-orange-100 text-orange-800 mb-2">
                            Detected
                          </Badge>
                          <div className="flex gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Step Type</p>
                              <p className="font-bold text-blue-600">{step.type}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Status</p>
                              <p className="font-bold text-orange-600">Not Connected</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Show connected platforms from usage data */}
                  {platformUsage.map((platform) => (
                    <div key={platform.platform_name} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{platform.platform_name}</h3>
                          <p className="text-sm text-gray-600">Connected & Active</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800 mb-2">
                          Connected
                        </Badge>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total Calls</p>
                            <p className="font-bold text-blue-600">{platform.total_runs}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Success Rate</p>
                            <p className="font-bold text-green-600">
                              {Math.round((platform.success_count / platform.total_runs) * 100)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Avg Duration</p>
                            <p className="font-bold text-purple-600">{platform.avg_duration}ms</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!automationBlueprint?.steps || automationBlueprint.steps.length === 0) && platformUsage.length === 0 && (
                    <div className="text-center py-8">
                      <Server className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No platform services detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Agents Tab - Enhanced to show recommended agents */}
          <TabsContent value="agents" className="flex-1 p-6 overflow-y-auto">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Agents (Configured & Recommended)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show configured agents */}
                  {aiAgents.map((agent) => (
                    <div key={agent.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-l-4 border-purple-500">
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
                            <Badge className="bg-green-100 text-green-800">Configured</Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{agent.agent_goal}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Total Calls</p>
                              <p className="font-bold text-blue-600">{agent.total_calls}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Success Rate</p>
                              <p className="font-bold text-green-600">{agent.success_rate}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Memory Capability</p>
                              <p className="font-bold text-purple-600">Advanced</p>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show recommended agents from automation blueprint */}
                  {automationBlueprint?.steps?.filter(step => step.type === 'ai_agent' || (step.action as any)?.type === 'ai_agent').map((step, index) => {
                    const agentName = (step.action as any)?.agent_name || `AI Agent ${index + 1}`;
                    const agentRole = (step.action as any)?.role || 'Automation Assistant';
                    const agentGoal = step.name || 'Execute intelligent automation tasks';
                    
                    return (
                      <div key={`recommended-${index}`} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900">{agentName}</h3>
                                <p className="text-sm text-gray-600">{agentRole}</p>
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800">Recommended</Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{agentGoal}</p>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Potential Impact</p>
                                <p className="font-bold text-yellow-600">High</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Complexity</p>
                                <p className="font-bold text-orange-600">Medium</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Memory Capability</p>
                                <p className="font-bold text-purple-600">Advanced</p>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
                            Add Agent
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {aiAgents.length === 0 && (!automationBlueprint?.steps || !automationBlueprint.steps.some(step => step.type === 'ai_agent')) && (
                    <div className="text-center py-8">
                      <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No AI agents configured or recommended</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab - keep existing code */}
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

          {/* Webhooks Tab - Coming Soon */}
          <TabsContent value="webhooks" className="flex-1 p-6 overflow-y-auto">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center h-96 text-center">
                <Webhook className="w-16 h-16 text-gray-300 mb-4" />
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl mb-4">
                  <h3 className="text-xl font-bold">Webhooks Coming Soon</h3>
                </div>
                <p className="text-gray-600 max-w-md mb-4">
                  Advanced webhook functionality is currently under development. 
                  Soon you'll be able to create, manage, and test webhooks for real-time automation notifications.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Expected release: Next update</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AutomationDashboard;
