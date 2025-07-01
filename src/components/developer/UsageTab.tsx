
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Zap,
  DollarSign,
  Activity,
  Calendar
} from 'lucide-react';

interface UsageData {
  endpoint: string;
  method: string;
  count: number;
  tokens_used: number;
  cost_amount: number;
  avg_response_time: number;
}

const UsageTab = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [totalStats, setTotalStats] = useState({
    total_calls: 0,
    total_tokens: 0,
    total_cost: 0,
    avg_response_time: 0
  });

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user, timeframe]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      
      // Calculate date filter
      const now = new Date();
      const daysBack = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data for display
      const processedData = processUsageData(data || []);
      setUsageData(processedData);

      // Calculate totals
      const totals = (data || []).reduce((acc, curr) => ({
        total_calls: acc.total_calls + 1,
        total_tokens: acc.total_tokens + (curr.tokens_used || 0),
        total_cost: acc.total_cost + parseFloat(curr.cost_amount || '0'),
        avg_response_time: acc.avg_response_time + (curr.response_time_ms || 0)
      }), { total_calls: 0, total_tokens: 0, total_cost: 0, avg_response_time: 0 });

      setTotalStats({
        ...totals,
        avg_response_time: totals.total_calls > 0 ? Math.round(totals.avg_response_time / totals.total_calls) : 0
      });

    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processUsageData = (data: any[]): UsageData[] => {
    const grouped = data.reduce((acc, curr) => {
      const key = `${curr.method} ${curr.endpoint}`;
      if (!acc[key]) {
        acc[key] = {
          endpoint: curr.endpoint,
          method: curr.method,
          count: 0,
          tokens_used: 0,
          cost_amount: 0,
          response_times: []
        };
      }
      acc[key].count += 1;
      acc[key].tokens_used += curr.tokens_used || 0;
      acc[key].cost_amount += parseFloat(curr.cost_amount || '0');
      if (curr.response_time_ms) {
        acc[key].response_times.push(curr.response_time_ms);
      }
      return acc;
    }, {} as any);

    return Object.values(grouped).map((item: any) => ({
      ...item,
      avg_response_time: item.response_times.length > 0 
        ? Math.round(item.response_times.reduce((a: number, b: number) => a + b, 0) / item.response_times.length)
        : 0
    })).sort((a: any, b: any) => b.count - a.count);
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case '1d': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading usage data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usage Analytics</h2>
          <p className="text-gray-600">Monitor your API usage and performance</p>
        </div>
        
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.total_calls.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tokens Used</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.total_tokens.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">${totalStats.total_cost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.avg_response_time}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Endpoint */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Usage by Endpoint - {getTimeframeLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageData.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Usage Data</h3>
              <p className="text-gray-600">No API calls found for the selected timeframe</p>
            </div>
          ) : (
            <div className="space-y-4">
              {usageData.slice(0, 10).map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.method}
                      </Badge>
                      <code className="text-sm text-gray-700">{item.endpoint}</code>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{item.count} calls</p>
                      <p className="text-xs text-gray-600">${item.cost_amount.toFixed(4)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Tokens</p>
                      <p className="font-medium">{item.tokens_used.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Response</p>
                      <p className="font-medium">{item.avg_response_time}ms</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Cost per Call</p>
                      <p className="font-medium">${(item.cost_amount / item.count).toFixed(4)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Usage</span>
                      <span>{((item.count / totalStats.total_calls) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(item.count / totalStats.total_calls) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
              
              {usageData.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Showing top 10 endpoints • {usageData.length - 10} more available
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageTab;
