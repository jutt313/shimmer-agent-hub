import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Bot,
  Zap,
  Activity,
  Users,
  Database,
  Globe,
  ArrowRight,
  Eye,
  Edit,
  Copy,
  MoreVertical,
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Workflow
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import AutomationForm from "./AutomationForm";
import PlatformCredentialForm from "./PlatformCredentialForm";
import AIAgentForm from "./AIAgentForm";
import AgentChatPopup from "./AgentChatPopup";
import EnhancedAgentChatPopup from "./EnhancedAgentChatPopup";

interface Automation {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'draft';
  trigger_type: string;
  created_at: string;
  updated_at: string;
  last_run?: string;
  run_count: number;
  success_rate: number;
  platform_credentials?: any[];
  ai_agents?: any[];
  automation_blueprint?: any;
}

interface PlatformCredential {
  id: string;
  platform_name: string;
  credential_name: string;
  is_active: boolean;
  created_at: string;
  last_tested?: string;
  test_status?: 'success' | 'failed' | 'pending';
}

interface AIAgent {
  id: string;
  agent_name: string;
  agent_role: string;
  agent_goal: string;
  llm_provider: string;
  model: string;
  created_at: string;
  is_active: boolean;
}

const AutomationDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [platformCredentials, setPlatformCredentials] = useState<PlatformCredential[]>([]);
  const [aiAgents, setAIAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [currentAutomation, setCurrentAutomation] = useState<Automation | null>(null);
  
  // Form states
  const [showAutomationForm, setShowAutomationForm] = useState(false);
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [selectedCredentialPlatform, setSelectedCredentialPlatform] = useState<string>("");
  
  // Chat states
  const [chatAgent, setChatAgent] = useState<any>(null);

  // Statistics
  const [stats, setStats] = useState({
    totalAutomations: 0,
    activeAutomations: 0,
    totalRuns: 0,
    avgSuccessRate: 0,
    totalCredentials: 0,
    totalAgents: 0
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch automations with related data
      const { data: automationsData, error: automationsError } = await supabase
        .from('automations')
        .select(`
          *,
          platform_credentials (
            id,
            platform_name,
            credential_name,
            is_active,
            created_at,
            last_tested,
            test_status
          ),
          ai_agents (
            id,
            agent_name,
            agent_role,
            agent_goal,
            llm_provider,
            model,
            created_at,
            is_active
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (automationsError) throw automationsError;

      // Fetch standalone platform credentials
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('platform_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (credentialsError) throw credentialsError;

      // Fetch standalone AI agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;

      setAutomations(automationsData || []);
      setPlatformCredentials(credentialsData || []);
      setAIAgents(agentsData || []);

      // Calculate statistics
      const totalAutomations = automationsData?.length || 0;
      const activeAutomations = automationsData?.filter(a => a.status === 'active').length || 0;
      const totalRuns = automationsData?.reduce((sum, a) => sum + (a.run_count || 0), 0) || 0;
      const avgSuccessRate = totalAutomations > 0 
        ? automationsData.reduce((sum, a) => sum + (a.success_rate || 0), 0) / totalAutomations 
        : 0;
      const totalCredentials = credentialsData?.length || 0;
      const totalAgents = agentsData?.length || 0;

      setStats({
        totalAutomations,
        activeAutomations,
        totalRuns,
        avgSuccessRate,
        totalCredentials,
        totalAgents
      });

    } catch (error: any) {
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

  const handleToggleAutomation = async (automationId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('automations')
        .update({ status: newStatus })
        .eq('id', automationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Automation ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });

      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update automation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;

    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', automationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Automation deleted successfully",
      });

      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete automation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleRunAutomation = async (automationId: string) => {
    try {
      toast({
        title: "Running Automation",
        description: "Automation execution started...",
      });

      // Here you would call your automation execution service
      // For now, we'll just simulate it
      setTimeout(() => {
        toast({
          title: "Success",
          description: "Automation completed successfully",
        });
        fetchDashboardData();
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to run automation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleViewAutomation = (automation: Automation) => {
    setCurrentAutomation(automation);
    setSelectedTab("details");
  };

  const handleEditAutomation = (automation: Automation) => {
    setEditingAutomation(automation);
    setShowAutomationForm(true);
  };

  const handleAddCredential = (platformName: string) => {
    setSelectedCredentialPlatform(platformName);
    setShowCredentialForm(true);
  };

  const handleAgentChat = (agent: any) => {
    console.log(`💬 Opening chat for agent: ${agent.agent_name}`);
    setChatAgent(agent);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'draft': return <AlertCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Automation Dashboard</h1>
          <p className="text-gray-600">Manage your automations, credentials, and AI agents</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Automations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAutomations}</p>
                </div>
                <Workflow className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeAutomations}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Runs</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalRuns}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.avgSuccessRate.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Credentials</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalCredentials}</p>
                </div>
                <Database className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">AI Agents</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalAgents}</p>
                </div>
                <Bot className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="automations" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Automations
            </TabsTrigger>
            <TabsTrigger value="credentials" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Credentials
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              AI Agents
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Automations */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="w-5 h-5" />
                    Recent Automations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {automations.slice(0, 5).map((automation) => (
                        <div key={automation.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(automation.status)}
                            <div>
                              <p className="font-medium text-gray-900">{automation.name}</p>
                              <p className="text-sm text-gray-600">
                                {formatDistanceToNow(new Date(automation.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(automation.status)}>
                            {automation.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setShowAutomationForm(true)}
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Workflow className="w-4 h-4 mr-2" />
                    Create New Automation
                  </Button>
                  <Button 
                    onClick={() => setShowCredentialForm(true)}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Add Platform Credential
                  </Button>
                  <Button 
                    onClick={() => setShowAgentForm(true)}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Create AI Agent
                  </Button>
                  <Button 
                    onClick={fetchDashboardData}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Automations</h2>
              <Button 
                onClick={() => setShowAutomationForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Workflow className="w-4 h-4 mr-2" />
                Create Automation
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {automations.map((automation) => (
                <Card key={automation.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{automation.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {automation.description || 'No description'}
                        </p>
                      </div>
                      <Badge className={getStatusColor(automation.status)}>
                        {automation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Trigger</p>
                        <p className="font-medium">{automation.trigger_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Runs</p>
                        <p className="font-medium">{automation.run_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Success Rate</p>
                        <p className="font-medium">{automation.success_rate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Run</p>
                        <p className="font-medium">
                          {automation.last_run 
                            ? formatDistanceToNow(new Date(automation.last_run), { addSuffix: true })
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleRunAutomation(automation.id)}
                        size="sm"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Run
                      </Button>
                      <Button
                        onClick={() => handleToggleAutomation(automation.id, automation.status)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        {automation.status === 'active' ? (
                          <>
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleViewAutomation(automation)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleEditAutomation(automation)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteAutomation(automation.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {automations.length === 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <Workflow className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Automations Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first automation to get started</p>
                  <Button 
                    onClick={() => setShowAutomationForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Workflow className="w-4 h-4 mr-2" />
                    Create Automation
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Platform Credentials</h2>
              <Button 
                onClick={() => setShowCredentialForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Database className="w-4 h-4 mr-2" />
                Add Credential
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformCredentials.map((credential) => (
                <Card key={credential.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{credential.credential_name}</h4>
                        <p className="text-sm text-gray-600">{credential.platform_name}</p>
                      </div>
                      <Badge className={credential.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {credential.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Created: {formatDistanceToNow(new Date(credential.created_at), { addSuffix: true })}</p>
                      {credential.last_tested && (
                        <p>Last tested: {formatDistanceToNow(new Date(credential.last_tested), { addSuffix: true })}</p>
                      )}
                      {credential.test_status && (
                        <p className={`font-medium ${
                          credential.test_status === 'success' ? 'text-green-600' : 
                          credential.test_status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          Status: {credential.test_status}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {platformCredentials.length === 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Credentials Yet</h3>
                  <p className="text-gray-600 mb-4">Add platform credentials to connect your automations</p>
                  <Button 
                    onClick={() => setShowCredentialForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Add Credential
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
              <Button 
                onClick={() => setShowAgentForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Bot className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiAgents.map((agent) => (
                <Card key={agent.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{agent.agent_name}</h4>
                        <p className="text-sm text-gray-600">{agent.agent_role}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAgentChat(agent)}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-3 py-1 text-xs"
                        >
                          Chat
                        </Button>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          agent.llm_provider === 'OpenAI' ? 'bg-green-100 text-green-800' :
                          agent.llm_provider === 'Claude' ? 'bg-purple-100 text-purple-800' :
                          agent.llm_provider === 'Gemini' ? 'bg-yellow-100 text-yellow-800' :
                          agent.llm_provider === 'Grok' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {agent.llm_provider}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{agent.agent_goal}</p>
                    <div className="text-xs text-gray-500">
                      <p>Model: {agent.model}</p>
                      <p>Created: {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}</p>
                      <p>Status: {agent.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {aiAgents.length === 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Agents Yet</h3>
                  <p className="text-gray-600 mb-4">Create AI agents to enhance your automations</p>
                  <Button 
                    onClick={() => setShowAgentForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Create Agent
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {currentAutomation && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{currentAutomation.name}</CardTitle>
                      <p className="text-gray-600 mt-2">{currentAutomation.description}</p>
                    </div>
                    <Badge className={getStatusColor(currentAutomation.status)}>
                      {currentAutomation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Automation Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50/80 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Trigger Type</p>
                      <p className="font-semibold">{currentAutomation.trigger_type}</p>
                    </div>
                    <div className="bg-gray-50/80 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Runs</p>
                      <p className="font-semibold">{currentAutomation.run_count || 0}</p>
                    </div>
                    <div className="bg-gray-50/80 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="font-semibold">{currentAutomation.success_rate || 0}%</p>
                    </div>
                    <div className="bg-gray-50/80 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Last Run</p>
                      <p className="font-semibold">
                        {currentAutomation.last_run 
                          ? formatDistanceToNow(new Date(currentAutomation.last_run), { addSuffix: true })
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Platform Credentials Section */}
                  {currentAutomation?.platform_credentials && currentAutomation.platform_credentials.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Platform Credentials ({currentAutomation.platform_credentials.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentAutomation.platform_credentials.map((credential: any, index: number) => (
                          <Card key={credential.id || index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-800">{credential.credential_name}</h4>
                                  <p className="text-sm text-gray-600">{credential.platform_name}</p>
                                </div>
                                <Badge className={credential.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {credential.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                Created: {formatDistanceToNow(new Date(credential.created_at), { addSuffix: true })}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                          {/* AI Agents Section */}
                          {currentAutomation?.ai_agents && currentAutomation.ai_agents.length > 0 && (
                            <div className="mt-8">
                              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Bot className="w-5 h-5" />
                                AI Agents ({currentAutomation.ai_agents.length})
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentAutomation.ai_agents.map((agent: any, index: number) => (
                                  <Card key={agent.id || index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <h4 className="font-semibold text-gray-800">{agent.agent_name}</h4>
                                          <p className="text-sm text-gray-600">{agent.agent_role}</p>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={() => handleAgentChat(agent)}
                                            size="sm"
                                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-3 py-1 text-xs"
                                          >
                                            Chat
                                          </Button>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            agent.llm_provider === 'OpenAI' ? 'bg-green-100 text-green-800' :
                                            agent.llm_provider === 'Claude' ? 'bg-purple-100 text-purple-800' :
                                            agent.llm_provider === 'Gemini' ? 'bg-yellow-100 text-yellow-800' :
                                            agent.llm_provider === 'Grok' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {agent.llm_provider}
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-700 mb-2">{agent.agent_goal}</p>
                                      <div className="text-xs text-gray-500">
                                        Model: {agent.model} | Memory: {agent.agent_memory ? '✓' : '✗'}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                  {/* Automation Blueprint */}
                  {currentAutomation.automation_blueprint && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Automation Blueprint
                      </h3>
                      <Card className="bg-gray-50/80 backdrop-blur-sm border-0">
                        <CardContent className="p-4">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                            {JSON.stringify(currentAutomation.automation_blueprint, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Forms */}
      {showAutomationForm && (
        <AutomationForm
          onClose={() => {
            setShowAutomationForm(false);
            setEditingAutomation(null);
          }}
          onAutomationSaved={() => {
            fetchDashboardData();
            setShowAutomationForm(false);
            setEditingAutomation(null);
          }}
          editingAutomation={editingAutomation}
        />
      )}

      {showCredentialForm && (
        <PlatformCredentialForm
          onClose={() => {
            setShowCredentialForm(false);
            setSelectedCredentialPlatform("");
          }}
          onCredentialSaved={() => {
            fetchDashboardData();
            setShowCredentialForm(false);
            setSelectedCredentialPlatform("");
          }}
          preselectedPlatform={selectedCredentialPlatform}
        />
      )}

      {showAgentForm && (
        <AIAgentForm
          onClose={() => setShowAgentForm(false)}
          onAgentSaved={() => {
            fetchDashboardData();
            setShowAgentForm(false);
          }}
        />
      )}

      {/* Enhanced Agent Chat Popup */}
      {chatAgent && (
        <EnhancedAgentChatPopup
          agent={chatAgent}
          automationContext={{
            id: currentAutomation?.id || '',
            name: currentAutomation?.name,
            description: currentAutomation?.description
          }}
          onClose={() => setChatAgent(null)}
        />
      )}

    </div>
  );
};

export default AutomationDashboard;
