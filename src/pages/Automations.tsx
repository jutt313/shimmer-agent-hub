import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ChatCard from "@/components/ChatCard";
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Users,
  Zap
} from "lucide-react";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  why_needed: string;
  status: 'active' | 'inactive' | 'pending';
}

interface Automation {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  user_id: string;
  agents: Agent[];
  execution_count: number;
  last_executed: string | null;
}

const Automations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const automationId = id || "temp-automation-id";

  useEffect(() => {
    if (id && user) {
      loadAutomation();
    }
  }, [id, user]);

  const loadAutomation = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setAutomation(data);
      
      // Load initial messages if any
      const initialMessage: Message = {
        id: 1,
        text: `Welcome to your automation: ${data.name}\n\nDescription: ${data.description}\n\nStatus: ${data.status}`,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages([initialMessage]);
    } catch (error) {
      console.error('Error loading automation:', error);
      toast({
        title: "Error",
        description: "Failed to load automation details",
        variant: "destructive",
      });
    }
  };

  const handleAgentAdd = (agent: Agent) => {
    if (!dismissedAgents.has(agent.name)) {
      setAgents(prev => {
        const exists = prev.some(a => a.name === agent.name);
        if (!exists) {
          return [...prev, { ...agent, status: 'pending' as const }];
        }
        return prev;
      });
      
      toast({
        title: "Agent Added",
        description: `${agent.name} has been added to your automation`,
      });
    }
  };

  const handleAgentDismiss = (agentName: string) => {
    console.log('Dismissing agent:', agentName);
    setDismissedAgents(prev => new Set([...prev, agentName]));
    setAgents(prev => prev.filter(agent => agent.name !== agentName));
    
    toast({
      title: "Agent Dismissed",
      description: `${agentName} has been removed from your automation`,
    });
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'draft') => {
    if (!automation || !user) return;

    try {
      const { error } = await supabase
        .from('automations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', automation.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAutomation(prev => prev ? { ...prev, status: newStatus } : null);
      
      toast({
        title: "Status Updated",
        description: `Automation is now ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update automation status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'draft': return <Settings className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!automation && id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {automation?.name || 'New Automation'}
              </h1>
              <p className="text-gray-600 mt-1">
                {automation?.description || 'Configure your automation'}
              </p>
            </div>
          </div>

          {automation && (
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(automation.status)} flex items-center gap-1`}>
                {getStatusIcon(automation.status)}
                {automation.status}
              </Badge>
              
              <div className="flex gap-2">
                {automation.status === 'draft' && (
                  <Button
                    onClick={() => handleStatusChange('active')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                )}
                
                {automation.status === 'active' && (
                  <Button
                    onClick={() => handleStatusChange('paused')}
                    variant="outline"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                
                {automation.status === 'paused' && (
                  <Button
                    onClick={() => handleStatusChange('active')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 rounded-2xl p-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Bot className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Zap className="w-4 h-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger 
              value="agents" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4" />
              Agents ({agents.length})
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-3xl border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {automation ? new Date(automation.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Executions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {automation?.execution_count || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Last Run
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {automation?.last_executed 
                      ? new Date(automation.last_executed).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <ChatCard
              messages={messages}
              onAgentAdd={handleAgentAdd}
              onAgentDismiss={handleAgentDismiss}
              dismissedAgents={dismissedAgents}
              automationId={automationId}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            <Card className="rounded-3xl border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  AI Agents
                </CardTitle>
                <CardDescription>
                  Manage the AI agents working on this automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No agents added yet</p>
                    <p className="text-sm">Use the AI Assistant to add agents to your automation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div key={agent.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{agent.name}</h3>
                          <Badge className={getStatusColor(agent.status)}>
                            {agent.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Role:</strong> {agent.role}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Goal:</strong> {agent.goal}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Why needed:</strong> {agent.why_needed}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="rounded-3xl border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Automation Settings
                </CardTitle>
                <CardDescription>
                  Configure your automation preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Settings panel coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Automations;
