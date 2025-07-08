
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock, CheckCircle, AlertCircle, TrendingUp, Bot, Zap, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AutomationBlueprint } from "@/types/automation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AutomationDashboardProps {
  automationId: string;
  automationTitle: string;
  automationBlueprint?: AutomationBlueprint | null;
}

interface DashboardStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageExecutionTime: number;
  lastRunTime: string | null;
  uptime: number;
}

interface ActivityLog {
  id: string;
  event_type: string;
  message: string;
  timestamp: string;
  status: 'success' | 'error' | 'info' | 'warning';
}

const AutomationDashboard = ({ automationId, automationTitle, automationBlueprint }: AutomationDashboardProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    averageExecutionTime: 0,
    lastRunTime: null,
    uptime: 0
  });
  
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Sample chart data with daily, weekly, monthly combined
  const combinedChartData = [
    { name: 'Mon', daily: 12, weekly: 45, monthly: 180 },
    { name: 'Tue', daily: 19, weekly: 52, monthly: 195 },
    { name: 'Wed', daily: 8, weekly: 48, monthly: 170 },
    { name: 'Thu', daily: 15, weekly: 61, monthly: 210 },
    { name: 'Fri', daily: 22, weekly: 58, monthly: 225 },
    { name: 'Sat', daily: 7, weekly: 35, monthly: 145 },
    { name: 'Sun', daily: 4, weekly: 28, monthly: 120 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [automationId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Fetching dashboard data for automation:', automationId);

      // Fetch automation runs
      const { data: runs, error: runsError } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('automation_id', automationId)
        .order('run_timestamp', { ascending: false });

      if (runsError) {
        console.error('Error fetching runs:', runsError);
      }

      // Process runs data
      const processedRuns = runs || [];
      const successfulRuns = processedRuns.filter(run => run.status === 'completed').length;
      const failedRuns = processedRuns.filter(run => run.status === 'failed').length;
      
      // Calculate average execution time from duration_ms
      const executionTimes = processedRuns
        .filter(run => run.duration_ms)
        .map(run => run.duration_ms / 1000); // Convert to seconds
      
      const averageExecutionTime = executionTimes.length > 0 
        ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
        : 0;

      const lastRun = processedRuns[0];
      const lastRunTime = lastRun ? lastRun.run_timestamp : null;

      // Calculate uptime (mock data for now)
      const uptime = successfulRuns > 0 ? (successfulRuns / processedRuns.length) * 100 : 0;

      setStats({
        totalRuns: processedRuns.length,
        successfulRuns,
        failedRuns,
        averageExecutionTime,
        lastRunTime,
        uptime
      });

      // Create activity logs from runs data since automation_activity_logs doesn't exist
      const processedLogs: ActivityLog[] = processedRuns.slice(0, 20).map(run => ({
        id: run.id,
        event_type: run.status === 'completed' ? 'execution' : 'error',
        message: run.status === 'completed' 
          ? `Automation executed successfully${run.duration_ms ? ` in ${(run.duration_ms / 1000).toFixed(1)}s` : ''}`
          : `Automation execution failed`,
        timestamp: run.run_timestamp,
        status: run.status === 'completed' ? 'success' : 'error'
      }));

      setActivityLogs(processedLogs);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-0 flex items-center justify-center"
        style={{
          boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)'
        }}
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-0 overflow-hidden"
      style={{
        boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)'
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none"></div>
      
      <div className="relative z-10 h-full">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {automationTitle}
                </h2>
                <p className="text-gray-600 mt-1">Automation Dashboard & Analytics</p>
              </div>
              <Button
                onClick={fetchDashboardData}
                size="sm"
                variant="outline"
                className="bg-white/80 hover:bg-white border-blue-200 text-blue-600"
              >
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg"
                style={{ boxShadow: '0 0 25px rgba(59, 130, 246, 0.1)' }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Total Runs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalRuns}</div>
                  <p className="text-xs text-gray-500 mt-1">All executions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-0 shadow-lg"
                style={{ boxShadow: '0 0 25px rgba(34, 197, 94, 0.1)' }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalRuns > 0 ? Math.round((stats.successfulRuns / stats.totalRuns) * 100) : 0}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.successfulRuns} successful</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-0 shadow-lg"
                style={{ boxShadow: '0 0 25px rgba(251, 146, 60, 0.1)' }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Avg. Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.averageExecutionTime.toFixed(1)}s
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Execution time</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg"
                style={{ boxShadow: '0 0 25px rgba(147, 51, 234, 0.1)' }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    Uptime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.uptime.toFixed(1)}%</div>
                  <p className="text-xs text-gray-500 mt-1">Reliability</p>
                </CardContent>
              </Card>
            </div>

            {/* Combined Performance Chart */}
            <Card className="bg-gradient-to-br from-blue-50/30 to-purple-50/30 border-0 shadow-lg"
              style={{ boxShadow: '0 0 25px rgba(59, 130, 246, 0.1)' }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Performance Analytics
                </CardTitle>
                <p className="text-sm text-gray-600">Daily, Weekly, and Monthly execution trends</p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Bar dataKey="daily" fill="#3b82f6" name="Daily" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="weekly" fill="#8b5cf6" name="Weekly" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="monthly" fill="#06b6d4" name="Monthly" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card className="bg-gradient-to-br from-gray-50/30 to-blue-50/30 border-0 shadow-lg"
              style={{ boxShadow: '0 0 25px rgba(59, 130, 246, 0.1)' }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  <div className="space-y-3">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-200/50">
                          {getStatusIcon(log.status)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{log.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {log.event_type}
                              </Badge>
                              <span className="text-xs text-gray-500">{formatTimeAgo(log.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">No recent activity</p>
                        <p className="text-sm text-gray-500">Run your automation to see activity logs here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Automation Blueprint Info */}
            {automationBlueprint && (
              <Card className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 border-0 shadow-lg"
                style={{ boxShadow: '0 0 25px rgba(99, 102, 241, 0.1)' }}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Blueprint Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-gray-200/50">
                      <h4 className="font-medium text-gray-800 mb-2">Steps</h4>
                      <p className="text-2xl font-bold text-indigo-600">{automationBlueprint.steps?.length || 0}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-gray-200/50">
                      <h4 className="font-medium text-gray-800 mb-2">Trigger</h4>
                      <p className="text-sm text-gray-600">{automationBlueprint.trigger?.type || 'Manual'}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-gray-200/50">
                      <h4 className="font-medium text-gray-800 mb-2">Status</h4>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AutomationDashboard;
