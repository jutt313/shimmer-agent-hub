
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Key,
  Zap,
  BarChart3,
  Bot,
  MessageCircle,
  ListOrdered,
  Pin,
  PinOff,
  Edit,
  ClipboardList,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AutomationForm from "@/components/AutomationForm";
import PlatformCredentialForm from "@/components/PlatformCredentialForm";
import EnhancedAgentChatPopup from "@/components/EnhancedAgentChatPopup";

interface Automation {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  automation_blueprint: any;
  ai_agents?: AIAgent[];
}

interface PlatformCredential {
  id: string;
  platform_name: string;
  credential_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  credentials: string;
}

interface AIAgent {
  id: string;
  agent_name: string;
  agent_role: string;
  agent_goal: string;
  agent_rules: string | null;
  agent_memory: any;
  llm_provider: string;
  model: string;
  api_key: string;
  automation_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AutomationDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [platformCredentials, setPlatformCredentials] = useState<PlatformCredential[]>([]);
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAutomations, setTotalAutomations] = useState(0);
  const [runningAutomations, setRunningAutomations] = useState(0);
  const [averageSuccessRate, setAverageSuccessRate] = useState(0);
  const [showAutomationForm, setShowAutomationForm] = useState(false);
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent & { automationContext?: any } | null>(null);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch automations with ai_agents
      const { data: automationsData, error: automationsError } = await supabase
        .from('automations')
        .select(`
          *,
          ai_agents (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (automationsError) throw automationsError;

      // Fetch platform credentials
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('platform_credentials')
        .select('*')
        .eq('user_id', user.id);

      if (credentialsError) throw credentialsError;

      // Transform the data to match our interfaces
      const transformedAutomations: Automation[] = (automationsData || []).map((auto: any) => ({
        id: auto.id,
        title: auto.title,
        description: auto.description,
        status: auto.status,
        created_at: auto.created_at,
        updated_at: auto.updated_at,
        is_pinned: auto.is_pinned,
        automation_blueprint: auto.automation_blueprint,
        ai_agents: (auto.ai_agents || []).map((agent: any) => ({
          ...agent,
          is_active: true
        }))
      }));

      const transformedCredentials: PlatformCredential[] = (credentialsData || []).map((cred: any) => ({
        ...cred
      }));

      setAutomations(transformedAutomations);
      setPlatformCredentials(transformedCredentials);
      setAiAgents(transformedAutomations.flatMap(auto => auto.ai_agents || []));

      // Calculate stats
      setTotalAutomations(transformedAutomations.length);
      setRunningAutomations(transformedAutomations.filter(a => a.status === 'active').length);
      setAverageSuccessRate(100); // Default success rate

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

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const pinAutomation = async (automationId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('automations')
        .update({ is_pinned: !isPinned })
        .eq('id', automationId)
        .eq('user_id', user!.id);

      if (error) throw error;

      setAutomations(automations.map(auto =>
        auto.id === automationId ? { ...auto, is_pinned: !isPinned } : auto
      ));

      toast({
        title: "Success",
        description: `Automation ${isPinned ? 'unpinned' : 'pinned'} successfully!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to pin automation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleEditAutomation = (automationId: string) => {
    navigate(`/automation/${automationId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <header className="bg-white/80 backdrop-blur-md py-6 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              YusrAI Automations
            </h1>
            <p className="text-sm text-gray-500">
              Manage and monitor your automations
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-gray-700">{user?.email}</span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {isLoading ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading automations...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Automations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAutomations}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Running Automations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{runningAutomations}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Average Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageSuccessRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={() => setShowAutomationForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Automation
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowCredentialForm(true)}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Add Platform Credential
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Automations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-gray-600" />
                  Recent Automations ({automations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="divide-y divide-gray-200">
                    {automations.length > 0 ? (
                      automations.map((auto) => (
                        <div key={auto.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                          <div>
                            <h3 className="font-semibold text-gray-800">{auto.title}</h3>
                            <p className="text-sm text-gray-600">{auto.description || 'No description'}</p>
                            <p className="text-xs text-gray-500">Created at {new Date(auto.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pinAutomation(auto.id, auto.is_pinned)}
                              className="bg-white/80 hover:bg-white border-gray-200 text-gray-700 hover:text-gray-800"
                            >
                              {auto.is_pinned ? <PinOff className="w-4 h-4 mr-1" /> : <Pin className="w-4 h-4 mr-1" />}
                              {auto.is_pinned ? 'Unpin' : 'Pin'}
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                              onClick={() => handleEditAutomation(auto.id)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No automations created yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* AI Agents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  AI Agents ({aiAgents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiAgents.length > 0 ? (
                  <div className="space-y-4">
                    {aiAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {agent.agent_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{agent.agent_name}</h3>
                            <p className="text-sm text-gray-600">{agent.agent_role}</p>
                            <p className="text-xs text-gray-500">{agent.llm_provider}/{agent.model}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const automation = automations.find(a => a.id === agent.automation_id);
                              if (automation) {
                                setSelectedAgent({
                                  ...agent,
                                  automationContext: {
                                    id: automation.id,
                                    name: automation.title,
                                    description: automation.description || undefined
                                  }
                                });
                              }
                            }}
                            className="bg-white/80 hover:bg-white border-purple-200 text-purple-700 hover:text-purple-800"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No AI agents configured yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-orange-600" />
                  Platform Credentials ({platformCredentials.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="divide-y divide-gray-200">
                    {platformCredentials.length > 0 ? (
                      platformCredentials.map((cred) => (
                        <div key={cred.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                          <div>
                            <h3 className="font-semibold text-gray-800">{cred.platform_name} Credential</h3>
                            <p className="text-sm text-gray-600">{cred.platform_name}</p>
                            <p className="text-xs text-gray-500">Created at {new Date(cred.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No platform credentials added yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Modals */}
      {showAutomationForm && (
        <AutomationForm
          onClose={() => setShowAutomationForm(false)}
          onSubmit={async (data) => {
            try {
              const { error } = await supabase
                .from('automations')
                .insert([{
                  user_id: user!.id,
                  title: data.title,
                  description: data.description || null,
                  status: 'draft'
                }]);

              if (error) throw error;

              toast({
                title: "Success",
                description: "Automation created successfully!",
              });
              
              setShowAutomationForm(false);
              fetchDashboardData();
            } catch (error: any) {
              toast({
                title: "Error",
                description: `Failed to create automation: ${error.message}`,
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {showCredentialForm && (
        <PlatformCredentialForm
          onClose={() => setShowCredentialForm(false)}
          onSubmit={async (data) => {
            try {
              const { error } = await supabase
                .from('platform_credentials')
                .insert([{
                  user_id: user!.id,
                  platform_name: data.platform_name,
                  credential_type: data.credential_type,
                  credentials: JSON.stringify(data.credentials),
                  is_active: true
                }]);

              if (error) throw error;

              toast({
                title: "Success",
                description: "Platform credential added successfully!",
              });
              
              setShowCredentialForm(false);
              fetchDashboardData();
            } catch (error: any) {
              toast({
                title: "Error",
                description: `Failed to add credential: ${error.message}`,
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {/* Enhanced Agent Chat Popup */}
      {selectedAgent && (
        <EnhancedAgentChatPopup
          agent={selectedAgent}
          automationContext={selectedAgent.automationContext}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
};

export default AutomationDashboard;
