
import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, MessageCircle, CheckCircle, XCircle, AlertTriangle, Settings, Users, Webhook, TrendingUp, Clock, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area"
import { AutomationBlueprint } from '@/types/automation';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import ComingSoonBanner from '@/components/webhooks/ComingSoonBanner';

interface AutomationDashboardProps {
  automationId: string;
  automationTitle: string;
  automationBlueprint?: AutomationBlueprint | null;
}

interface AutomationStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalMessages: number;
  averageResponseTime: number;
}

const AutomationDashboard: React.FC<AutomationDashboardProps> = ({
  automationId,
  automationTitle,
  automationBlueprint
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AutomationStats>({
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    totalMessages: 0,
    averageResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [runHistory, setRunHistory] = useState<any[]>([]);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetchAutomationStats();
    fetchRunHistory();
    fetchMessageHistory();
    fetchChartData();
    fetchPlatforms();
    fetchAgents();
  }, [automationId]);

  const fetchAutomationStats = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('automation_id', automationId);

      if (error) throw error;

      const totalRuns = data.length;
      const successfulRuns = data.filter(run => run.status === 'success').length;
      const failedRuns = data.filter(run => run.status === 'failed').length;

      const { data: messagesData, error: messagesError } = await supabase
        .from('automation_chats')
        .select('*')
        .eq('automation_id', automationId);

      if (messagesError) throw messagesError;

      const totalMessages = messagesData.length;
      const responseTimes = data.map(run => run.duration_ms).filter(time => typeof time === 'number');
      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      setStats({
        totalRuns,
        successfulRuns,
        failedRuns,
        totalMessages,
        averageResponseTime
      });
    } catch (error: any) {
      console.error('Error fetching automation stats:', error);
      toast({
        title: "Error",
        description: `Failed to load automation stats: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRunHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('automation_id', automationId)
        .order('run_timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRunHistory(data);
    } catch (error: any) {
      console.error('Error fetching run history:', error);
    }
  };

  const fetchMessageHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_chats')
        .select('*')
        .eq('automation_id', automationId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMessageHistory(data);
    } catch (error: any) {
      console.error('Error fetching message history:', error);
    }
  };

  const fetchChartData = async () => {
    // Generate mock data for the stacked bar chart
    const mockData = [
      {
        period: 'Daily',
        totalRuns: stats.totalRuns * 0.1,
        successRuns: stats.successfulRuns * 0.1,
        failedRuns: stats.failedRuns * 0.1,
        avgTime: stats.averageResponseTime * 0.8
      },
      {
        period: 'Weekly', 
        totalRuns: stats.totalRuns * 0.5,
        successRuns: stats.successfulRuns * 0.5,
        failedRuns: stats.failedRuns * 0.5,
        avgTime: stats.averageResponseTime * 0.9
      },
      {
        period: 'Monthly',
        totalRuns: stats.totalRuns,
        successRuns: stats.successfulRuns,
        failedRuns: stats.failedRuns,
        avgTime: stats.averageResponseTime
      }
    ];
    setChartData(mockData);
  };

  const fetchPlatforms = async () => {
    try {
      // Fetch platform credentials for this automation
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error: any) {
      console.error('Error fetching platforms:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('automation_id', automationId);

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
    }
  };

  const getLast24HoursActivity = () => {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    return runHistory.filter(run => 
      new Date(run.run_timestamp) > last24Hours
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Clean white header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600">{automationTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              Production Ready
            </Badge>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-1 mb-6">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <TrendingUp className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Settings className="w-4 h-4" />
                Services
              </TabsTrigger>
              <TabsTrigger 
                value="agents" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="w-4 h-4" />
                Agents
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Activity className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="webhooks" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Webhook className="w-4 h-4" />
                Webhooks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Activity className="w-5 h-5" />
                      Total Runs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-800">{stats.totalRuns}</div>
                    <p className="text-sm text-blue-600">Lifetime executions</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-800">
                      {stats.totalRuns > 0 ? Math.round((stats.successfulRuns / stats.totalRuns) * 100) : 0}%
                    </div>
                    <p className="text-sm text-green-600">Completion rate</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <Clock className="w-5 h-5" />
                      Avg Execution Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-800">
                      {Math.round(stats.averageResponseTime)}
                    </div>
                    <p className="text-sm text-purple-600">ms average</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <MessageCircle className="w-5 h-5" />
                      Total Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-800">{stats.totalMessages}</div>
                    <p className="text-sm text-orange-600">Total interactions</p>
                  </CardContent>
                </Card>
              </div>

              {/* One Big Stacked Bar Chart */}
              <Card className="rounded-2xl border-2 border-gradient-to-r from-purple-100 to-blue-100">
                <CardHeader>
                  <CardTitle className="text-gray-800">Performance Analytics</CardTitle>
                  <p className="text-sm text-gray-600">Daily, Weekly & Monthly Overview</p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="period" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="successRuns" stackId="a" fill="#10b981" name="Success Runs" />
                        <Bar dataKey="failedRuns" stackId="a" fill="#ef4444" name="Failed Runs" />
                        <Bar dataKey="avgTime" stackId="b" fill="#8b5cf6" name="Avg Time (ms)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Last 24 Hours Activity */}
              <Card className="rounded-2xl border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Last 24 Hours Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    {getLast24HoursActivity().map(run => (
                      <div key={run.id} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium">{new Date(run.run_timestamp).toLocaleTimeString()}</p>
                          <p className="text-sm text-gray-500">Duration: {run.duration_ms || 0}ms</p>
                        </div>
                        <Badge variant={run.status === 'success' ? 'default' : 'destructive'}>
                          {run.status}
                        </Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <Card className="rounded-2xl border-2 border-blue-100">
                <CardHeader>
                  <CardTitle>Connected Services</CardTitle>
                  <p className="text-sm text-gray-600">Platforms used in this automation</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {platforms.map(platform => (
                      <div key={platform.id} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                        <div className="flex-1">
                          <h3 className="font-semibold">{platform.platform_name}</h3>
                          <p className="text-sm text-gray-600">Credential Type: {platform.credential_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Active</p>
                          <p className="text-sm text-gray-500">Connected</p>
                        </div>
                      </div>
                    ))}
                    {platforms.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No services connected yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map(agent => (
                  <Card key={agent.id} className="rounded-2xl border-2 border-purple-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        {agent.agent_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{agent.agent_role}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">Goal:</h4>
                          <p className="text-sm text-gray-600">{agent.agent_goal || 'No goal set'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Provider:</h4>
                          <p className="text-sm text-gray-600">{agent.llm_provider || 'Not specified'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Memory Status:</h4>
                          <p className="text-sm text-gray-600">
                            {agent.agent_memory ? 'Active' : 'No memory configured'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {agents.length === 0 && (
                  <Card className="rounded-2xl border-2 border-gray-100 col-span-full">
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500">No AI agents configured for this automation</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card className="rounded-2xl border-2 border-green-100">
                <CardHeader>
                  <CardTitle>Complete Automation History</CardTitle>
                  <p className="text-sm text-gray-600">Full execution timeline from start to end</p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {runHistory.map(run => (
                        <div key={run.id} className="p-4 border rounded-xl bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{new Date(run.run_timestamp).toLocaleString()}</p>
                              <p className="text-sm text-gray-500">Duration: {run.duration_ms || 0}ms</p>
                            </div>
                            <Badge variant={run.status === 'success' ? 'default' : 'destructive'}>
                              {run.status}
                            </Badge>
                          </div>
                          {run.details_log && (
                            <div className="mt-2 p-3 bg-white rounded-md text-sm">
                              <pre className="whitespace-pre-wrap text-gray-700">
                                {JSON.stringify(run.details_log, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="webhooks">
              <ComingSoonBanner />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AutomationDashboard;
