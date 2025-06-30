import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Clock, CheckCircle, XCircle, Play, Activity, Server, Bot, History, Calendar, TrendingUp, Webhook, Plus, Copy, Eye, EyeOff, TestTube, AlertCircle, BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay, subWeeks, subMonths, startOfWeek, startOfMonth } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAutomationWebhooks } from "@/hooks/useAutomationWebhooks";
import WebhookCreateModal from "@/components/webhooks/WebhookCreateModal";
import AgentChatPopup from "./AgentChatPopup";

interface AutomationRun {
  id: string;
  status: string;
  run_timestamp: string;
  duration_ms: number | null;
  details_log: any;
  trigger_data: any;
}

interface AIAgent {
  id: string;
  agent_name: string;
  agent_role: string;
  agent_goal: string;
  llm_provider: string;
  model: string;
  agent_memory: any;
  agent_rules: string;
  created_at: string;
  updated_at: string;
}

interface AutomationDashboardProps {
  automationId: string;
  automationTitle: string;
  automationBlueprint: any;
  onClose: () => void;
}

const AutomationDashboard = ({
  automationId,
  automationTitle,
  automationBlueprint,
  onClose
}: AutomationDashboardProps) => {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [selectedWebhookTab, setSelectedWebhookTab] = useState('overview');
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [webhookErrors, setWebhookErrors] = useState<any[]>([]);
  const [testPayload, setTestPayload] = useState('{\n  "event": "test",\n  "data": {\n    "message": "Hello World"\n  }\n}');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const { toast } = useToast();

  // Use the webhook hook
  const { webhooks, loading: webhooksLoading, toggleWebhookStatus, refetch: refetchWebhooks } = useAutomationWebhooks(automationId);

  useEffect(() => {
    fetchDashboardData();
    fetchWebhookLogs();

    // Setup real-time subscriptions with unique channel names
    const runsChannel = supabase.channel(`automation-runs-${automationId}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'automation_runs',
      filter: `automation_id=eq.${automationId}`
    }, () => {
      fetchDashboardData();
    }).subscribe();

    const agentsChannel = supabase.channel(`ai-agents-${automationId}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'ai_agents',
      filter: `automation_id=eq.${automationId}`
    }, () => {
      fetchDashboardData();
    }).subscribe();

    const webhooksChannel = supabase.channel(`webhooks-${automationId}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'automation_webhooks',
      filter: `automation_id=eq.${automationId}`
    }, () => {
      refetchWebhooks();
      fetchWebhookLogs();
    }).subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(runsChannel);
      supabase.removeChannel(agentsChannel);
      supabase.removeChannel(webhooksChannel);
    };
  }, [automationId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch automation runs
      const {
        data: runsData,
        error: runsError
      } = await supabase.from('automation_runs').select('*').eq('automation_id', automationId).order('run_timestamp', {
        ascending: false
      });
      if (runsError) throw runsError;
      setRuns(runsData || []);

      // Fetch AI agents
      const {
        data: agentsData,
        error: agentsError
      } = await supabase.from('ai_agents').select('*').eq('automation_id', automationId).order('created_at', {
        ascending: false
      });
      if (agentsError) throw agentsError;
      setAgents(agentsData || []);

      // Extract platforms from blueprint - only real platforms
      if (automationBlueprint?.steps) {
        const extractedPlatforms = automationBlueprint.steps.filter((step: any) => step.action?.integration).map((step: any) => ({
          name: step.action.integration,
          method: step.action.method,
          parameters: step.action.parameters
        }));

        // Remove duplicates
        const uniquePlatforms = extractedPlatforms.filter((platform: any, index: number, self: any[]) => index === self.findIndex(p => p.name === platform.name));
        setPlatforms(uniquePlatforms);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('webhook_delivery_logs')
        .select(`
          *,
          automation_webhooks!inner(automation_id)
        `)
        .eq('automation_webhooks.automation_id', automationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setWebhookLogs(logsData || []);

      // Filter errors
      const errors = (logsData || []).filter(log => log.status_code >= 400 || !log.delivered_at);
      setWebhookErrors(errors);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('automation_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      toast({
        title: "Webhook Deleted",
        description: "The webhook has been successfully deleted",
      });

      refetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    }
  };

  const handleTestWebhook = async (webhookUrl: string) => {
    setTestingWebhook(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: testPayload,
      });

      const responseText = await response.text();
      
      toast({
        title: response.ok ? "Test Successful" : "Test Failed",
        description: response.ok 
          ? "Webhook test completed successfully" 
          : `Test failed with status ${response.status}`,
        variant: response.ok ? "default" : "destructive",
      });

      // Refresh logs to show the test
      fetchWebhookLogs();
    } catch (error) {
      console.error('Webhook test error:', error);
      toast({
        title: "Test Error",
        description: "Failed to test webhook",
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  // Calculate real metrics from actual data
  const totalRuns = runs.length;
  const successfulRuns = runs.filter(run => run.status === 'completed').length;
  const successRate = totalRuns > 0 ? Math.round(successfulRuns / totalRuns * 100) : 0;
  const avgExecutionTime = runs.length > 0 && runs.filter(run => run.duration_ms).length > 0 ? Math.round(runs.filter(run => run.duration_ms).reduce((acc, run) => acc + (run.duration_ms || 0), 0) / runs.filter(run => run.duration_ms).length) : 0;

  // Get last run
  const lastRun = runs[0];

  // Enhanced chart data for daily, weekly, monthly views
  const getDailyData = () => {
    return Array.from({
      length: 7
    }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i));
      const dayRuns = runs.filter(run => startOfDay(new Date(run.run_timestamp)).getTime() === date.getTime());
      return {
        date: format(date, 'MMM dd'),
        total: dayRuns.length,
        successful: dayRuns.filter(run => run.status === 'completed').length,
        failed: dayRuns.filter(run => run.status === 'failed').length
      };
    });
  };

  const getWeeklyData = () => {
    return Array.from({
      length: 4
    }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(new Date(), 3 - i));
      const weekEnd = subDays(startOfWeek(subWeeks(new Date(), 3 - i - 1)), 1);
      const weekRuns = runs.filter(run => {
        const runDate = new Date(run.run_timestamp);
        return runDate >= weekStart && runDate <= weekEnd;
      });
      return {
        date: format(weekStart, 'MMM dd'),
        total: weekRuns.length,
        successful: weekRuns.filter(run => run.status === 'completed').length,
        failed: weekRuns.filter(run => run.status === 'failed').length
      };
    });
  };

  const getMonthlyData = () => {
    return Array.from({
      length: 6
    }, (_, i) => {
      const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
      const monthEnd = subDays(startOfMonth(subMonths(new Date(), 5 - i - 1)), 1);
      const monthRuns = runs.filter(run => {
        const runDate = new Date(run.run_timestamp);
        return runDate >= monthStart && runDate <= monthEnd;
      });
      return {
        date: format(monthStart, 'MMM yyyy'),
        total: monthRuns.length,
        successful: monthRuns.filter(run => run.status === 'completed').length,
        failed: monthRuns.filter(run => run.status === 'failed').length
      };
    });
  };

  // Get last 24 hours runs
  const last24Hours = runs.filter(run => new Date(run.run_timestamp) > subDays(new Date(), 1)).slice(0, 10);

  // Recommended agents based on automation blueprint
  const getRecommendedAgents = () => {
    const recommendations = [];
    if (automationBlueprint?.steps) {
      const hasEmailSteps = automationBlueprint.steps.some((step: any) => step.action?.integration?.toLowerCase().includes('email') || step.action?.method?.toLowerCase().includes('email'));
      const hasDataSteps = automationBlueprint.steps.some((step: any) => step.action?.integration?.toLowerCase().includes('sheets') || step.action?.integration?.toLowerCase().includes('database'));
      const hasNotificationSteps = automationBlueprint.steps.some((step: any) => step.action?.integration?.toLowerCase().includes('slack') || step.action?.integration?.toLowerCase().includes('discord'));
      if (hasEmailSteps && !agents.some(a => a.agent_role.toLowerCase().includes('email'))) {
        recommendations.push({
          name: "Email Marketing Agent",
          role: "Email Campaign Manager",
          goal: "Optimize email campaigns and improve engagement rates",
          reason: "Your automation includes email operations"
        });
      }
      if (hasDataSteps && !agents.some(a => a.agent_role.toLowerCase().includes('data'))) {
        recommendations.push({
          name: "Data Analysis Agent",
          role: "Data Analyst",
          goal: "Analyze data patterns and provide insights",
          reason: "Your automation processes data"
        });
      }
      if (hasNotificationSteps && !agents.some(a => a.agent_role.toLowerCase().includes('notification'))) {
        recommendations.push({
          name: "Communication Agent",
          role: "Communication Manager",
          goal: "Manage notifications and team communications",
          reason: "Your automation sends notifications"
        });
      }
    }
    return recommendations;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Play className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      running: "default",
      completed: "secondary",
      failed: "destructive"
    };
    return <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>;
  };

  const handleTalkToAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setShowAgentChat(true);
  };

  if (loading) {
    return <div className="w-[calc(100vw-6rem)] max-w-none h-[75vh] bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-0 relative flex items-center justify-center mx-12" style={{
      boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
    }}>
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>;
  }

  return <>
      <div style={{
      boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
    }} className="w-[calc(100vw-6rem)] max-w-none h-[75vh] bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-0 relative mx-12">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative z-10 flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {automationTitle} Dashboard
          </h2>
        </div>

        {/* Tabs Navigation - Now with 5 tabs */}
        <div className="relative z-10 h-[calc(100%-4rem)]">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/50 rounded-2xl p-1 mb-4">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Activity className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Server className="w-4 h-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Bot className="w-4 h-4" />
                AI Agents
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <History className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Webhook className="w-4 h-4" />
                Webhooks
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 h-[calc(100%-5rem)]">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {/* Status Message */}
                  <div className="bg-white/50 rounded-2xl p-4 border border-blue-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {lastRun ? getStatusIcon(lastRun.status) : <Clock className="w-4 h-4 text-gray-400" />}
                        <div>
                          <p className="font-medium text-gray-800">
                            {lastRun ? 'Last Run' : 'Automation Status'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {lastRun ? new Date(lastRun.run_timestamp).toLocaleString() : 'Automation is configured but not yet started'}
                          </p>
                        </div>
                      </div>
                      {lastRun ? getStatusBadge(lastRun.status) : <Badge variant="outline">Ready to Start</Badge>}
                    </div>
                  </div>

                  {/* Metrics Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-white/50 border-blue-200/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Runs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{totalRuns}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white/50 border-blue-200/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{successRate}%</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white/50 border-blue-200/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Avg Execution Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{avgExecutionTime}ms</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Multi-timeframe Charts */}
                  <Card className="bg-white/50 border-blue-200/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Automation Activity Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="daily" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                          <TabsTrigger value="daily">Daily (7 days)</TabsTrigger>
                          <TabsTrigger value="weekly">Weekly (4 weeks)</TabsTrigger>
                          <TabsTrigger value="monthly">Monthly (6 months)</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="daily">
                          <ChartContainer config={{
                          successful: {
                            label: "Successful",
                            color: "#10b981"
                          },
                          failed: {
                            label: "Failed",
                            color: "#ef4444"
                          },
                          total: {
                            label: "Total",
                            color: "#3b82f6"
                          }
                        }} className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getDailyData()}>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="successful" fill="#10b981" name="Successful" />
                                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </TabsContent>
                        
                        <TabsContent value="weekly">
                          <ChartContainer config={{
                          successful: {
                            label: "Successful",
                            color: "#10b981"
                          },
                          failed: {
                            label: "Failed",
                            color: "#ef4444"
                          }
                        }} className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getWeeklyData()}>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="successful" fill="#10b981" name="Successful" />
                                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </TabsContent>
                        
                        <TabsContent value="monthly">
                          <ChartContainer config={{
                          successful: {
                            label: "Successful",
                            color: "#10b981"
                          },
                          failed: {
                            label: "Failed",
                            color: "#ef4444"
                          }
                        }} className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getMonthlyData()}>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="successful" fill="#10b981" name="Successful" />
                                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Last 24 Hours History */}
                  <Card className="bg-white/50 border-blue-200/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Last 24 Hours Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {last24Hours.length > 0 ? <div className="space-y-2 max-h-48 overflow-y-auto">
                          {last24Hours.map(run => <div key={run.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 border border-gray-200/50">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(run.status)}
                                <div>
                                  <span className="text-sm font-medium">
                                    Run {run.id.slice(0, 8)}...
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    {new Date(run.run_timestamp).toLocaleTimeString()}
                                  </p>
                                  {run.duration_ms && <p className="text-xs text-gray-400">
                                      {run.duration_ms}ms
                                    </p>}
                                </div>
                              </div>
                              {getStatusBadge(run.status)}
                            </div>)}
                        </div> : <div className="text-center py-8 text-gray-500">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No activity in the last 24 hours</p>
                        </div>}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="mt-6 h-[calc(100%-4rem)]">
              <ScrollArea className="h-full">
                <div className="space-y-6 pr-4">
                  {platforms.length > 0 ? <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {platforms.map((platform, index) => <Card key={index} className="bg-white/50 border-blue-200/50">
                            <CardHeader>
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600">Method: {platform.method}</p>
                                <div className="flex gap-2">
                                  <Badge variant="secondary">Configured</Badge>
                                  <Badge variant="outline">
                                    {runs.filter(run => run.details_log && JSON.stringify(run.details_log).toLowerCase().includes(platform.name.toLowerCase())).length} calls
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>)}
                      </div>
                    </> : <Card className="bg-white/50 border-blue-200/50">
                      <CardContent className="text-center py-8">
                        <Server className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No platforms configured yet</p>
                      </CardContent>
                    </Card>}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* AI Agents Tab */}
            <TabsContent value="agents" className="mt-0 h-[calc(100%-5rem)]">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {/* Current Agents */}
                  {agents.length > 0 && <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Active AI Agents</h3>
                      {agents.map(agent => <Card key={agent.id} className="bg-white/50 border-blue-200/50">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{agent.agent_name}</CardTitle>
                                <p className="text-sm text-gray-600">{agent.agent_role}</p>
                              </div>
                              <Button onClick={() => handleTalkToAgent(agent)} size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                                Talk to Agent
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm"><strong>Goal:</strong> {agent.agent_goal}</p>
                              <p className="text-sm"><strong>Provider:</strong> {agent.llm_provider} - {agent.model}</p>
                              <Badge variant="secondary">Active</Badge>
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>}

                  {/* Recommended Agents */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Recommended AI Agents</h3>
                    {getRecommendedAgents().length > 0 ? <div className="space-y-3">
                        {getRecommendedAgents().map((recommendation, index) => <Card key={index} className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/50">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-800">{recommendation.name}</h4>
                                  <p className="text-sm text-gray-600 mb-1">{recommendation.role}</p>
                                  <p className="text-sm text-gray-700 mb-2">{recommendation.goal}</p>
                                  <p className="text-xs text-blue-600 bg-blue-100/50 px-2 py-1 rounded">
                                    💡 {recommendation.reason}
                                  </p>
                                </div>
                                <Button size="sm" variant="outline" className="ml-4 border-blue-300 text-blue-600 hover:bg-blue-50">
                                  Add Agent
                                </Button>
                              </div>
                            </CardContent>
                          </Card>)}
                      </div> : <Card className="bg-white/50 border-blue-200/50">
                        <CardContent className="text-center py-8">
                          <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500">No specific agent recommendations available</p>
                          <p className="text-sm text-gray-400 mt-1">Recommendations will appear based on your automation's needs</p>
                        </CardContent>
                      </Card>}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-6 h-[calc(100%-4rem)]">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {runs.length > 0 ? <Card className="bg-white/50 border-blue-200/50">
                      <CardContent className="p-0">
                        <div className="space-y-0">
                          {runs.slice(0, 20).map(run => <div key={run.id} className="border-b border-gray-200/50 last:border-b-0 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(run.status)}
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      Run {run.id.slice(0, 8)}...
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(run.run_timestamp).toLocaleString()}
                                    </p>
                                    {run.duration_ms && <p className="text-xs text-gray-500">
                                        Duration: {run.duration_ms}ms
                                      </p>}
                                  </div>
                                </div>
                                {getStatusBadge(run.status)}
                              </div>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card> : <Card className="bg-white/50 border-blue-200/50">
                      <CardContent className="text-center py-8">
                        <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No activity history yet</p>
                      </CardContent>
                    </Card>}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* NEW: Webhooks Tab */}
            <TabsContent value="webhooks" className="mt-0 h-[calc(100%-5rem)]">
              <div className="h-full">
                {webhooks.length === 0 ? (
                  // Empty state
                  <div className="flex items-center justify-center h-full">
                    <Card className="bg-white/50 border-blue-200/50 max-w-md mx-auto">
                      <CardContent className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Webhook className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No webhooks configured
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Create webhooks to allow external systems to trigger this automation
                        </p>
                        <Button
                          onClick={() => setShowCreateWebhookModal(true)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Webhook
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  // Webhooks exist - show management interface
                  <div className="h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Webhook Management</h3>
                      <Button
                        onClick={() => setShowCreateWebhookModal(true)}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Webhook
                      </Button>
                    </div>

                    <Tabs value={selectedWebhookTab} onValueChange={setSelectedWebhookTab} className="h-[calc(100%-4rem)]">
                      <TabsList className="grid w-full grid-cols-4 bg-white/50 rounded-xl p-1 mb-4">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                          <BarChart className="w-4 h-4" />
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Logs
                        </TabsTrigger>
                        <TabsTrigger value="errors" className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Errors
                        </TabsTrigger>
                        <TabsTrigger value="test" className="flex items-center gap-2">
                          <TestTube className="w-4 h-4" />
                          Test
                        </TabsTrigger>
                      </TabsList>

                      {/* Overview Tab */}
                      <TabsContent value="overview" className="mt-0 h-[calc(100%-4rem)]">
                        <ScrollArea className="h-full">
                          <div className="space-y-4 pr-4">
                            {webhooks.map((webhook) => (
                              <Card key={webhook.id} className="bg-white/50 border-blue-200/50">
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle className="text-lg">{webhook.webhook_name}</CardTitle>
                                      {webhook.webhook_description && (
                                        <p className="text-sm text-gray-600">{webhook.webhook_description}</p>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        onClick={() => toggleWebhookStatus(webhook.id, webhook.is_active)}
                                        size="sm"
                                        variant={webhook.is_active ? "default" : "outline"}
                                        className={webhook.is_active ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : ""}
                                      >
                                        {webhook.is_active ? "Active" : "Inactive"}
                                      </Button>
                                      <Button 
                                        onClick={() => handleDeleteWebhook(webhook.id)}
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:bg-red-50"
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    {/* Webhook URL */}
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Webhook URL</label>
                                      <div className="flex items-center gap-2 mt-1">
                                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                                          {webhook.webhook_url}
                                        </code>
                                        <Button 
                                          onClick={() => copyToClipboard(webhook.webhook_url)}
                                          size="sm"
                                          variant="outline"
                                        >
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Webhook Secret */}
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Webhook Secret</label>
                                      <div className="flex items-center gap-2 mt-1">
                                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                                          {'•'.repeat(32)}
                                        </code>
                                        <Button 
                                          onClick={() => copyToClipboard(webhook.webhook_secret)}
                                          size="sm"
                                          variant="outline"
                                        >
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Statistics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">
                                          {webhook.delivery_stats?.total_deliveries || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">Total Calls</div>
                                      </div>
                                      <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="text-lg font-bold text-green-600">
                                          {webhook.delivery_stats?.success_rate || 0}%
                                        </div>
                                        <div className="text-xs text-gray-600">Success Rate</div>
                                      </div>
                                      <div className="bg-purple-50 p-3 rounded-lg">
                                        <div className="text-lg font-bold text-purple-600">
                                          {webhook.delivery_stats?.avg_response_time || 0}ms
                                        </div>
                                        <div className="text-xs text-gray-600">Avg Response</div>
                                      </div>
                                      <div className="bg-orange-50 p-3 rounded-lg">
                                        <div className="text-lg font-bold text-orange-600">
                                          {webhook.trigger_count || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">Total Triggers</div>
                                      </div>
                                    </div>

                                    {/* Expected Events */}
                                    {webhook.expected_events && webhook.expected_events.length > 0 && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Expected Events</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {webhook.expected_events.map((event, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                              {event}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      {/* Logs Tab */}
                      <TabsContent value="logs" className="mt-0 h-[calc(100%-4rem)]">
                        <ScrollArea className="h-full">
                          <div className="space-y-2 pr-4">
                            {webhookLogs.length > 0 ? (
                              webhookLogs.map((log) => (
                                <Card key={log.id} className="bg-white/50 border-blue-200/50">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${log.delivered_at ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div>
                                          <p className="font-medium text-sm">
                                            {log.delivered_at ? 'Delivered' : 'Failed'}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {new Date(log.created_at).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <Badge variant={log.status_code >= 200 && log.status_code < 300 ? "secondary" : "destructive"}>
                                          {log.status_code || 'No Response'}
                                        </Badge>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Attempt {log.delivery_attempts}
                                        </p>
                                      </div>
                                    </div>
                                    {log.response_body && (
                                      <div className="mt-2">
                                        <details className="cursor-pointer">
                                          <summary className="text-xs text-gray-600">View Response</summary>
                                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                            {log.response_body}
                                          </pre>
                                        </details>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-gray-500">No webhook logs yet</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      {/* Errors Tab */}
                      <TabsContent value="errors" className="mt-0 h-[calc(100%-4rem)]">
                        <ScrollArea className="h-full">
                          <div className="space-y-2 pr-4">
                            {webhookErrors.length > 0 ? (
                              webhookErrors.map((error) => (
                                <Card key={error.id} className="bg-red-50/50 border-red-200/50">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                      <AlertCircle className="w-4 h-4 text-red-500" />
                                      <div className="flex-1">
                                        <p className="font-medium text-sm text-red-800">
                                          Failed Delivery
                                        </p>
                                        <p className="text-xs text-red-600">
                                          {new Date(error.created_at).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-red-600 mt-1">
                                          Status: {error.status_code || 'No Response'} | Attempts: {error.delivery_attempts}
                                        </p>
                                      </div>
                                    </div>
                                    {error.response_body && (
                                      <div className="mt-2">
                                        <details className="cursor-pointer">
                                          <summary className="text-xs text-red-600">View Error Details</summary>
                                          <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-x-auto">
                                            {error.response_body}
                                          </pre>
                                        </details>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                <p className="text-gray-500">No webhook errors - great job!</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      {/* Test Tab */}
                      <TabsContent value="test" className="mt-0 h-[calc(100%-4rem)]">
                        <div className="space-y-4 h-full">
                          <div className="bg-white/50 rounded-2xl p-4 border border-blue-200/50">
                            <h4 className="font-medium text-gray-800 mb-3">Test Webhook</h4>
                            
                            {webhooks.length > 0 && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Select Webhook</label>
                                  <select className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                                    {webhooks.map((webhook) => (
                                      <option key={webhook.id} value={webhook.id}>
                                        {webhook.webhook_name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-gray-700">Test Payload</label>
                                  <textarea
                                    value={testPayload}
                                    onChange={(e) => setTestPayload(e.target.value)}
                                    className="w-full mt-1 p-3 border border-gray-300 rounded-md font-mono text-sm"
                                    rows={8}
                                    placeholder="Enter JSON payload to test..."
                                  />
                                </div>

                                <Button
                                  onClick={() => webhooks.length > 0 && handleTestWebhook(webhooks[0].webhook_url)}
                                  disabled={testingWebhook}
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                >
                                  <TestTube className="w-4 h-4 mr-2" />
                                  {testingWebhook ? 'Testing...' : 'Send Test Request'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Webhook Modal */}
      <WebhookCreateModal
        isOpen={showCreateWebhookModal}
        onClose={() => setShowCreateWebhookModal(false)}
        automationId={automationId}
        onWebhookCreated={() => {
          refetchWebhooks();
          fetchWebhookLogs();
        }}
      />

      {/* Agent Chat Popup */}
      {showAgentChat && selectedAgent && <AgentChatPopup agent={selectedAgent} onClose={() => {
      setShowAgentChat(false);
      setSelectedAgent(null);
    }} />}
    </>;
};

export default AutomationDashboard;
