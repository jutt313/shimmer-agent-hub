
import { useState, useEffect } from 'react';
import { Bot, Trash2, Eye, Calendar, Zap, Key, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

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

const AutomationSettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAutomation, setExpandedAutomation] = useState<string | null>(null);
  const [agents, setAgents] = useState<Record<string, AIAgent[]>>({});
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  
  const [defaultSettings, setDefaultSettings] = useState({
    defaultErrorHandling: 'stop',
    maxExecutionTime: '300',
    timezone: 'UTC',
    autoRetry: false,
    maxRetries: '3',
  });

  useEffect(() => {
    fetchAutomations();
    fetchCredentials();
  }, [user]);

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('id, title, status, created_at, description')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomations(data || []);
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

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  const fetchAgentsForAutomation = async (automationId: string) => {
    if (agents[automationId]) return; // Already fetched

    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('automation_id', automationId);

      if (error) throw error;
      setAgents(prev => ({ ...prev, [automationId]: data || [] }));
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', automationId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setAutomations(prev => prev.filter(a => a.id !== automationId));
      setAgents(prev => {
        const newAgents = { ...prev };
        delete newAgents[automationId];
        return newAgents;
      });
      
      toast({
        title: "Success",
        description: "Automation deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast({
        title: "Error",
        description: "Failed to delete automation",
        variant: "destructive",
      });
    }
  };

  const toggleAutomationExpanded = (automationId: string) => {
    if (expandedAutomation === automationId) {
      setExpandedAutomation(null);
    } else {
      setExpandedAutomation(automationId);
      fetchAgentsForAutomation(automationId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Default Settings */}
      <Card className="bg-gradient-to-br from-green-50/50 to-blue-50/50 backdrop-blur-sm border border-green-100 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-green-600" />
            Default Automation Settings
          </CardTitle>
          <CardDescription>
            Configure default behavior for all your automations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="errorHandling">Default Error Handling</Label>
              <Select
                value={defaultSettings.defaultErrorHandling}
                onValueChange={(value) => setDefaultSettings(prev => ({ ...prev, defaultErrorHandling: value }))}
              >
                <SelectTrigger className="rounded-xl border-green-200 focus:border-green-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stop">Stop execution</SelectItem>
                  <SelectItem value="retry">Retry automatically</SelectItem>
                  <SelectItem value="continue">Continue with next step</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={defaultSettings.timezone}
                onValueChange={(value) => setDefaultSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="rounded-xl border-green-200 focus:border-green-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxExecutionTime">Max Execution Time (seconds)</Label>
              <Input
                id="maxExecutionTime"
                type="number"
                value={defaultSettings.maxExecutionTime}
                onChange={(e) => setDefaultSettings(prev => ({ ...prev, maxExecutionTime: e.target.value }))}
                className="rounded-xl border-green-200 focus:border-green-400 focus:ring-green-400"
              />
            </div>
            <div>
              <Label htmlFor="maxRetries">Max Retry Attempts</Label>
              <Input
                id="maxRetries"
                type="number"
                value={defaultSettings.maxRetries}
                onChange={(e) => setDefaultSettings(prev => ({ ...prev, maxRetries: e.target.value }))}
                className="rounded-xl border-green-200 focus:border-green-400 focus:ring-green-400"
                disabled={!defaultSettings.autoRetry}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="autoRetry"
              checked={defaultSettings.autoRetry}
              onCheckedChange={(checked) => setDefaultSettings(prev => ({ ...prev, autoRetry: checked }))}
            />
            <Label htmlFor="autoRetry">Enable automatic retry on failure</Label>
          </div>
        </CardContent>
      </Card>

      {/* Individual Automations */}
      <Card className="bg-gradient-to-br from-green-50/50 to-blue-50/50 backdrop-blur-sm border border-green-100 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-green-600" />
            Your Automations ({automations.length})
          </CardTitle>
          <CardDescription>
            Manage your automation workflows, agents, and credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading automations...</p>
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No automations created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map((automation) => (
                <Collapsible key={automation.id}>
                  <div className="bg-white rounded-xl shadow-sm border border-green-100">
                    <CollapsibleTrigger 
                      onClick={() => toggleAutomationExpanded(automation.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-green-50/50 transition-colors rounded-xl"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-gray-900">{automation.title}</h4>
                            <Badge className={`text-xs ${getStatusColor(automation.status)}`}>
                              {automation.status}
                            </Badge>
                          </div>
                          {automation.description && (
                            <p className="text-sm text-gray-600">{automation.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created: {new Date(automation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAutomation(automation.id);
                          }}
                          className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-green-100 mt-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* AI Agents Section */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-green-600" />
                              AI Agents ({agents[automation.id]?.length || 0})
                            </h5>
                            {agents[automation.id]?.length > 0 ? (
                              <div className="space-y-2">
                                {agents[automation.id].map((agent) => (
                                  <div key={agent.id} className="p-3 bg-green-50 rounded-lg border border-green-100">
                                    <h6 className="font-medium text-sm text-gray-900">{agent.agent_name}</h6>
                                    {agent.agent_role && (
                                      <p className="text-xs text-gray-600">{agent.agent_role}</p>
                                    )}
                                    <div className="flex gap-1 mt-1">
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
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">No AI agents configured</p>
                            )}
                          </div>

                          {/* Available Credentials Section */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Key className="w-4 h-4 text-green-600" />
                              Available Credentials ({credentials.length})
                            </h5>
                            {credentials.length > 0 ? (
                              <div className="space-y-2">
                                {credentials.map((credential) => (
                                  <div key={credential.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <h6 className="font-medium text-sm text-gray-900">{credential.platform_name}</h6>
                                    <p className="text-xs text-gray-600">{credential.credential_type}</p>
                                    <div className="flex items-center justify-between mt-1">
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
                            ) : (
                              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">No credentials configured</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationSettingsTab;
