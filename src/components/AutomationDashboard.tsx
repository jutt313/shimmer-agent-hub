
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Clock, CheckCircle, XCircle, Play, Activity, Server, Bot, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
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

const AutomationDashboard = ({ automationId, automationTitle, automationBlueprint, onClose }: AutomationDashboardProps) => {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [showAgentChat, setShowAgentChat] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    setupRealtimeSubscriptions();
  }, [automationId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch automation runs
      const { data: runsData, error: runsError } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('automation_id', automationId)
        .order('run_timestamp', { ascending: false });

      if (runsError) throw runsError;
      setRuns(runsData || []);

      // Fetch AI agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('automation_id', automationId)
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);

      // Extract platforms from blueprint
      if (automationBlueprint?.steps) {
        const extractedPlatforms = automationBlueprint.steps
          .filter((step: any) => step.action?.integration)
          .map((step: any) => ({
            name: step.action.integration,
            method: step.action.method,
            parameters: step.action.parameters
          }));
        
        // Remove duplicates
        const uniquePlatforms = extractedPlatforms.filter((platform: any, index: number, self: any[]) => 
          index === self.findIndex(p => p.name === platform.name)
        );
        
        setPlatforms(uniquePlatforms);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_runs',
          filter: `automation_id=eq.${automationId}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agents',
          filter: `automation_id=eq.${automationId}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Calculate metrics
  const totalRuns = runs.length;
  const successfulRuns = runs.filter(run => run.status === 'completed').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
  const avgExecutionTime = runs.length > 0 
    ? Math.round(runs.filter(run => run.duration_ms).reduce((acc, run) => acc + (run.duration_ms || 0), 0) / runs.filter(run => run.duration_ms).length)
    : 0;

  // Get last run
  const lastRun = runs[0];

  // Prepare chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dayRuns = runs.filter(run => 
      startOfDay(new Date(run.run_timestamp)).getTime() === date.getTime()
    );
    
    return {
      date: format(date, 'MMM dd'),
      total: dayRuns.length,
      successful: dayRuns.filter(run => run.status === 'completed').length,
      failed: dayRuns.filter(run => run.status === 'failed').length
    };
  });

  // Get last 24 hours runs
  const last24Hours = runs.filter(run => 
    new Date(run.run_timestamp) > subDays(new Date(), 1)
  ).slice(0, 10);

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

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const handleTalkToAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setShowAgentChat(true);
  };

  if (loading) {
    return (
      <div 
        className="w-full max-w-6xl h-[75vh] bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-0 relative flex items-center justify-center"
        style={{
          boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
        }}
      >
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <div 
        style={{
          boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
        }} 
        className="w-full max-w-6xl h-[75vh] bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-0 relative"
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative z-10 flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {automationTitle} Dashboard
          </h2>
          <Button
            onClick={onClose}
            className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Back to Chat
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-5rem)] relative z-10">
          <div className="space-y-8 pr-4">
            {/* Overview Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Overview
              </h3>
              
              {/* Last Run Status */}
              {lastRun && (
                <div className="bg-white/50 rounded-2xl p-4 border border-blue-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(lastRun.status)}
                      <div>
                        <p className="font-medium text-gray-800">Last Run</p>
                        <p className="text-sm text-gray-600">
                          {new Date(lastRun.run_timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(lastRun.status)}
                  </div>
                </div>
              )}

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

              {/* Chart */}
              <Card className="bg-white/50 border-blue-200/50">
                <CardHeader>
                  <CardTitle className="text-lg">Last 7 Days Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      total: { label: "Total", color: "#3b82f6" },
                      successful: { label: "Successful", color: "#10b981" },
                      failed: { label: "Failed", color: "#ef4444" }
                    }}
                    className="h-[200px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={last7Days}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="successful" fill="#10b981" />
                        <Bar dataKey="failed" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Last 24 Hours */}
              {last24Hours.length > 0 && (
                <Card className="bg-white/50 border-blue-200/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Last 24 Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {last24Hours.map((run) => (
                        <div key={run.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(run.status)}
                            <span className="text-sm">
                              {new Date(run.run_timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {getStatusBadge(run.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Services Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Server className="w-5 h-5" />
                Services & Platforms
              </h3>
              
              {platforms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {platforms.map((platform, index) => (
                    <Card key={index} className="bg-white/50 border-blue-200/50">
                      <CardHeader>
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Method: {platform.method}</p>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white/50 border-blue-200/50">
                  <CardContent className="text-center py-8">
                    <Server className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No platforms configured yet</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* AI Agents Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Agents
              </h3>
              
              {agents.length > 0 ? (
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <Card key={agent.id} className="bg-white/50 border-blue-200/50">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{agent.agent_name}</CardTitle>
                            <p className="text-sm text-gray-600">{agent.agent_role}</p>
                          </div>
                          <Button
                            onClick={() => handleTalkToAgent(agent)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Talk to Agent
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm"><strong>Goal:</strong> {agent.agent_goal}</p>
                          <p className="text-sm"><strong>Provider:</strong> {agent.llm_provider} - {agent.model}</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary">Active</Badge>
                            <Badge variant="outline">Healthy</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white/50 border-blue-200/50">
                  <CardContent className="text-center py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No AI agents configured yet</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Activity History Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <History className="w-5 h-5" />
                Activity History
              </h3>
              
              {runs.length > 0 ? (
                <Card className="bg-white/50 border-blue-200/50">
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {runs.slice(0, 10).map((run) => (
                        <div key={run.id} className="border-b border-gray-200/50 last:border-b-0 p-4">
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
                                {run.duration_ms && (
                                  <p className="text-xs text-gray-500">
                                    Duration: {run.duration_ms}ms
                                  </p>
                                )}
                              </div>
                            </div>
                            {getStatusBadge(run.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/50 border-blue-200/50">
                  <CardContent className="text-center py-8">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No activity history yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Agent Chat Popup */}
      {showAgentChat && selectedAgent && (
        <AgentChatPopup
          agent={selectedAgent}
          onClose={() => {
            setShowAgentChat(false);
            setSelectedAgent(null);
          }}
        />
      )}
    </>
  );
};

export default AutomationDashboard;
