
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, CheckCircle, XCircle, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AutomationRun {
  id: string;
  status: string;
  run_timestamp: string;
  duration_ms: number | null;
  details_log: any;
  trigger_data: any;
}

interface AutomationRunsMonitorProps {
  automationId: string;
}

const AutomationRunsMonitor = ({ automationId }: AutomationRunsMonitorProps) => {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRuns();
    
    // Set up real-time subscription for run updates
    const channel = supabase
      .channel('automation-runs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_runs',
          filter: `automation_id=eq.${automationId}`
        },
        (payload) => {
          console.log('🔄 Real-time update for automation runs:', payload);
          fetchRuns(); // Refresh the list when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [automationId]);

  const fetchRuns = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_runs')
        .select('*')
        .eq('automation_id', automationId)
        .order('run_timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRuns(data || []);
    } catch (error: any) {
      console.error('Failed to fetch automation runs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch automation runs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading Automation Runs...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Automation Runs
          </CardTitle>
          <Button
            onClick={fetchRuns}
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No automation runs yet</p>
            <p className="text-sm">Click "Execute Automation" to start your first run</p>
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <div
                key={run.id}
                className="border rounded-lg p-4 bg-white/50 hover:bg-white/70 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(run.status)}
                    <span className="font-medium text-sm">
                      Run {run.id.slice(0, 8)}...
                    </span>
                    {getStatusBadge(run.status)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(run.run_timestamp)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2">{formatDuration(run.duration_ms)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Trigger:</span>
                    <span className="ml-2 capitalize">
                      {run.trigger_data?.trigger_type || 'manual'}
                    </span>
                  </div>
                </div>

                {run.details_log && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-500">Details:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-gray-700 font-mono text-xs max-h-20 overflow-y-auto">
                      {typeof run.details_log === 'string' 
                        ? run.details_log 
                        : JSON.stringify(run.details_log, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomationRunsMonitor;
