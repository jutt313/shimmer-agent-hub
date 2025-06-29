import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { Activity, TrendingUp, Users, Globe, Shield, Clock, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import WebhookAnalytics from '@/components/WebhookAnalytics';

interface AutomationDashboardProps {
  automationId: string;
  automationTitle: string;
  automationBlueprint: any;
  onClose: () => void;
}

const AutomationDashboard = ({ automationId, automationTitle, automationBlueprint, onClose }: AutomationDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [overviewStats, setOverviewStats] = useState({
    totalRuns: 0,
    successRate: 0,
    avgResponseTime: 0,
    errorCount: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    networkTraffic: 0
  });
  const [agentActivity, setAgentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [automationId, user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch overview stats
      const { data: runs } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('automation_id', automationId);

      const totalRuns = runs?.length || 0;
      const successfulRuns = runs?.filter(run => run.status === 'completed').length || 0;
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
      const errorCount = runs?.filter(run => run.status === 'failed').length || 0;

      setOverviewStats({
        totalRuns,
        successRate,
        avgResponseTime: 120, // Mock data
        errorCount
      });

      // Fetch performance metrics (mock data)
      setPerformanceMetrics({
        cpuUsage: 65,
        memoryUsage: 42,
        networkTraffic: 180
      });

      // Fetch agent activity (mock data)
      setAgentActivity([
        { agent: 'Agent A', task: 'Data Extraction', status: 'completed', time: '2 mins ago' },
        { agent: 'Agent B', task: 'Sentiment Analysis', status: 'pending', time: '5 mins ago' },
        { agent: 'Agent C', task: 'Report Generation', status: 'failed', time: '10 mins ago' }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if automation uses webhooks
  const hasWebhooks = automationBlueprint?.trigger?.type === 'webhook' || 
                     automationBlueprint?.steps?.some(step => step.type === 'webhook');

  return (
    <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{automationTitle}</h2>
          <p className="text-gray-600">Automation Dashboard & Analytics</p>
        </div>
        <Button onClick={onClose} variant="outline" size="sm" className="rounded-xl">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className={`grid w-full mx-6 mt-4 ${hasWebhooks ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            {hasWebhooks && <TabsTrigger value="webhooks">Webhooks</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Automation Overview</h3>
              <p className="text-gray-600">Key metrics and stats for this automation</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600">Total Runs</p>
                    <p className="text-2xl font-bold text-blue-600">{overviewStats.totalRuns}</p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{overviewStats.successRate.toFixed(1)}%</p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold text-purple-600">{overviewStats.avgResponseTime}ms</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600">Error Count</p>
                    <p className="text-2xl font-bold text-red-600">{overviewStats.errorCount}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Performance Metrics</h3>
              <p className="text-gray-600">Real-time performance data for this automation</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                    <p className="text-2xl font-bold text-blue-600">{performanceMetrics.cpuUsage}%</p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                    <p className="text-2xl font-bold text-green-600">{performanceMetrics.memoryUsage}%</p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600">Network Traffic</p>
                    <p className="text-2xl font-bold text-purple-600">{performanceMetrics.networkTraffic} MB</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* AI Agents Tab */}
          <TabsContent value="agents" className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">AI Agent Activity</h3>
              <p className="text-gray-600">Track the performance and activity of AI agents</p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agentActivity.map((activity, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{activity.agent}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{activity.task}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">{activity.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{activity.time}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-gray-600">Track recent events and actions</p>

              <div className="space-y-3">
                {agentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.agent} - {activity.task}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <Badge variant="secondary">{activity.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          {hasWebhooks && (
            <TabsContent value="webhooks" className="flex-1 p-6 overflow-y-auto">
              <WebhookAnalytics automationId={automationId} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AutomationDashboard;
