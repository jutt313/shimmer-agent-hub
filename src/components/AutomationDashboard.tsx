import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, MessageCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { AutomationBlueprint } from '@/types/automation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

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

  useEffect(() => {
    fetchAutomationStats();
    fetchRunHistory();
    fetchMessageHistory();
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

      // Fetch total messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('automation_chats')
        .select('*')
        .eq('automation_id', automationId);

      if (messagesError) throw messagesError;

      const totalMessages = messagesData.length;

      // Calculate average response time
      const responseTimes = data.map(run => run.response_time).filter(time => typeof time === 'number');
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
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRunHistory(data);
    } catch (error: any) {
      console.error('Error fetching run history:', error);
      toast({
        title: "Error",
        description: `Failed to load run history: ${error.message}`,
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: `Failed to load message history: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const lineChartData = {
    labels: runHistory.map(run => new Date(run.created_at).toLocaleTimeString()),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: runHistory.map(run => run.response_time),
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        tension: 0.3
      }
    ]
  };

  const pieChartData = {
    labels: ['Successful', 'Failed'],
    datasets: [
      {
        label: 'Automation Runs',
        data: [stats.successfulRuns, stats.failedRuns],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 5
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false,
        text: 'Run History'
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: false,
        text: 'Run Distribution'
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* FIXED: Clean white header instead of chunky purple */}
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
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Total Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRuns}</div>
                <p className="text-sm text-gray-500">Lifetime executions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Successful Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successfulRuns}</div>
                <p className="text-sm text-gray-500">Completions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Failed Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.failedRuns}</div>
                <p className="text-sm text-gray-500">Errors and interruptions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  Total Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
                <p className="text-sm text-gray-500">Total interactions</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Run History</CardTitle>
                <p className="text-sm text-gray-500">Last 10 runs</p>
              </CardHeader>
              <CardContent className="h-72">
                <Line data={lineChartData} options={lineChartOptions} height={250} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Run Distribution</CardTitle>
                <p className="text-sm text-gray-500">Success vs. Failure</p>
              </CardHeader>
              <CardContent className="h-72">
                <Pie data={pieChartData} options={pieChartOptions} height={250} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Runs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Runs</CardTitle>
              <p className="text-sm text-gray-500">Latest automation executions</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <div className="divide-y divide-gray-200">
                  {runHistory.map(run => (
                    <div key={run.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{new Date(run.created_at).toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Response Time: {run.response_time}ms</p>
                        </div>
                        {run.status === 'success' ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                            Failed
                          </Badge>
                        )}
                      </div>
                      {run.error && (
                        <div className="mt-2 p-3 bg-red-50 rounded-md text-sm text-red-700">
                          <AlertTriangle className="w-4 h-4 inline-block mr-1 align-text-top" />
                          {run.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <p className="text-sm text-gray-500">Latest interactions</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <div className="divide-y divide-gray-200">
                  {messageHistory.map(message => (
                    <div key={message.id} className="py-3">
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="font-medium">{message.sender === 'user' ? 'You' : 'AI'}</p>
                          <p className="text-sm text-gray-500">{new Date(message.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-sm">{message.message_content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AutomationDashboard;
