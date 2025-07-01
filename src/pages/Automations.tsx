

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bot, Play, Pause, Settings, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AutomationDashboard from "@/components/AutomationDashboard";
import AIAgentForm from "@/components/AIAgentForm";
import AutomationRunsMonitor from "@/components/AutomationRunsMonitor";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { SecurityDashboard } from "@/components/SecurityDashboard";
import { AutomationBlueprint } from "@/types/automation";

interface Automation {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  updated_at: string;
  user_id: string;
}

const Automations = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Default automation blueprint for dashboard view
  const defaultBlueprint: AutomationBlueprint = {
    version: "1.0",
    trigger: {
      type: 'manual'
    },
    steps: []
  };

  useEffect(() => {
    if (user) {
      fetchAutomations();
    }
  }, [user]);

  const transformAutomation = (item: any): Automation => {
    return {
      ...item,
      name: item.title || item.name || 'Untitled Automation', // Map title to name
      status: item.status as 'active' | 'paused' | 'draft'
    };
  };

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomations((data || []).map(transformAutomation));
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast({
        title: "Error",
        description: "Failed to load automations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAutomation = () => {
    navigate('/create-automation');
  };

  const toggleAutomationStatus = async (automationId: string, currentStatus: 'active' | 'paused' | 'draft') => {
    // Only allow toggling between active and paused, not draft
    if (currentStatus === 'draft') {
      toast({
        title: "Cannot toggle draft automation",
        description: "Please complete the automation setup first",
        variant: "destructive",
      });
      return;
    }

    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('automations')
        .update({ status: newStatus })
        .eq('id', automationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setAutomations(prev =>
        prev.map(auto =>
          auto.id === automationId ? { ...auto, status: newStatus } : auto
        )
      );

      toast({
        title: "Success",
        description: `Automation ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });
    } catch (error) {
      console.error('Error toggling automation status:', error);
      toast({
        title: "Error",
        description: "Failed to update automation status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Automations
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor your AI-powered automations
          </p>
        </div>
        <Button
          onClick={handleCreateAutomation}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Automation
        </Button>
      </div>
      
      <Tabs defaultValue="automations" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
          <TabsTrigger 
            value="automations" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200"
          >
            <Bot className="w-4 h-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger 
            value="dashboard"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="runs"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200"
          >
            <Play className="w-4 h-4 mr-2" />
            Runs
          </TabsTrigger>
          <TabsTrigger 
            value="performance"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading automations...</div>
          ) : automations.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Automations</h3>
                <p className="text-gray-500 text-center mb-6">
                  Create your first automation to streamline your workflows
                </p>
                <Button onClick={handleCreateAutomation} variant="outline">
                  Create Automation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {automations.map((automation) => (
                <Card key={automation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{automation.name}</CardTitle>
                    <Badge variant="secondary" className="rounded-full">
                      {automation.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{automation.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Updated {new Date(automation.updated_at).toLocaleDateString()}
                      </div>
                      {automation.status !== 'draft' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAutomationStatus(automation.id, automation.status)}
                        >
                          {automation.status === 'active' ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <AutomationDashboard 
            automationId="" 
            automationTitle="All Automations" 
            automationBlueprint={defaultBlueprint} 
          />
        </TabsContent>

        <TabsContent value="runs" className="space-y-6">
          <AutomationRunsMonitor automationId="" />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Automations;

