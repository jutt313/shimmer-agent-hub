
import { useState, useEffect } from 'react';
import { Bot, Zap, Key, Trash2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Automation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  description?: string;
}

interface AIAgent {
  id: string;
  agent_name: string;
  agent_role?: string;
  llm_provider?: string;
  model?: string;
  created_at: string;
}

interface PlatformCredential {
  id: string;
  platform_name: string;
  credential_type: string;
  is_active: boolean;
  created_at: string;
}

interface AutomationDetailsModalProps {
  automation: Automation;
  isOpen: boolean;
  onClose: () => void;
}

const AutomationDetailsModal = ({ automation, isOpen, onClose }: AutomationDetailsModalProps) => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && automation) {
      fetchAutomationDetails();
    }
  }, [isOpen, automation]);

  const fetchAutomationDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch AI agents for this automation
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('automation_id', automation.id);

      if (agentError) throw agentError;
      setAgents(agentData || []);

      // Fetch platform credentials (general user credentials)
      const { data: credentialData, error: credentialError } = await supabase
        .from('platform_credentials')
        .select('*')
        .eq('is_active', true);

      if (credentialError) throw credentialError;
      setCredentials(credentialData || []);

    } catch (error) {
      console.error('Error fetching automation details:', error);
      toast({
        title: "Error",
        description: "Failed to load automation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
      
      setAgents(prev => prev.filter(a => a.id !== agentId));
      toast({
        title: "Success",
        description: "AI Agent deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Error",
        description: "Failed to delete AI agent",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            {automation.title}
          </DialogTitle>
          <DialogDescription>
            Detailed view of automation components and settings
          </DialogDescription>
        </DialogHeader>

        <div className="h-[600px] overflow-y-auto space-y-6">
          {/* Automation Overview */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Automation Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(automation.status)}>
                  {automation.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm text-gray-600">
                  {new Date(automation.created_at).toLocaleDateString()}
                </span>
              </div>
              {automation.description && (
                <div>
                  <span className="text-sm font-medium">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{automation.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Agents */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                AI Agents ({agents.length})
              </CardTitle>
              <CardDescription>
                AI agents configured for this automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">No AI agents configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{agent.agent_name}</h4>
                        {agent.agent_role && (
                          <p className="text-sm text-gray-600">{agent.agent_role}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {agent.llm_provider && (
                            <Badge variant="outline" className="text-xs">
                              {agent.llm_provider}
                            </Badge>
                          )}
                          {agent.model && (
                            <Badge variant="outline" className="text-xs">
                              {agent.model}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Credentials */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-green-600" />
                Available Platform Credentials ({credentials.length})
              </CardTitle>
              <CardDescription>
                Platform credentials available for this automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {credentials.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">No platform credentials configured</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {credentials.map((credential) => (
                    <div
                      key={credential.id}
                      className="p-3 bg-white rounded-xl shadow-sm border"
                    >
                      <h4 className="font-medium text-gray-900">{credential.platform_name}</h4>
                      <p className="text-sm text-gray-600">{credential.credential_type}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant={credential.is_active ? "default" : "secondary"} className="text-xs">
                          {credential.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(credential.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutomationDetailsModal;
