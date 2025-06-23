
import { useState, useEffect } from 'react';
import { Bot, Settings, Zap, Key, Pin, PinOff, ChevronDown, ChevronRight, Calendar, Shield, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Automation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  description?: string;
  is_pinned?: boolean;
  notification_enabled?: boolean;
  priority?: number;
  settings?: any;
}

interface AIAgent {
  id: string;
  agent_name: string;
  agent_role?: string;
  llm_provider?: string;
  model?: string;
}

interface PlatformCredential {
  id: string;
  platform_name: string;
  credential_type: string;
  is_active: boolean;
}

const AutomationsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [expandedAutomation, setExpandedAutomation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Record<string, AIAgent[]>>({});
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);

  useEffect(() => {
    fetchAutomations();
    fetchCredentials();
  }, [user]);

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  const fetchAgentsForAutomation = async (automationId: string) => {
    if (agents[automationId]) return;

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

  const togglePin = async (automationId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('automations')
        .update({ is_pinned: !currentPinned })
        .eq('id', automationId);

      if (error) throw error;
      
      setAutomations(prev => prev.map(a => 
        a.id === automationId ? { ...a, is_pinned: !currentPinned } : a
      ));

      toast({
        title: "Success",
        description: `Automation ${!currentPinned ? 'pinned' : 'unpinned'}`,
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const toggleNotifications = async (automationId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('automations')
        .update({ notification_enabled: enabled })
        .eq('id', automationId);

      if (error) throw error;
      
      setAutomations(prev => prev.map(a => 
        a.id === automationId ? { ...a, notification_enabled: enabled } : a
      ));
    } catch (error) {
      console.error('Error updating notifications:', error);
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

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Sort automations: pinned first, then by priority, then by date
  const sortedAutomations = [...automations].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    if (a.priority !== b.priority) return (a.priority || 3) - (b.priority || 3);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="p-6 space-y-6">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading automations...</p>
        </div>
      ) : automations.length === 0 ? (
        <div className="text-center py-8">
          <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No automations created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAutomations.map((automation) => (
            <Card key={automation.id} className="bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm rounded-xl overflow-hidden">
              <Collapsible
                open={expandedAutomation === automation.id}
                onOpenChange={() => {
                  if (expandedAutomation === automation.id) {
                    setExpandedAutomation(null);
                  } else {
                    setExpandedAutomation(automation.id);
                    fetchAgentsForAutomation(automation.id);
                  }
                }}
              >
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-blue-50/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{automation.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getStatusColor(automation.status)}`}>
                                {automation.status}
                              </Badge>
                              {automation.priority && (
                                <Badge className={`text-xs ${getPriorityColor(automation.priority)}`}>
                                  P{automation.priority}
                                </Badge>
                              )}
                              {automation.is_pinned && (
                                <Pin className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                          </div>
                          {automation.description && (
                            <p className="text-sm text-gray-600 mt-1">{automation.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created: {new Date(automation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(automation.id, automation.is_pinned || false);
                          }}
                          className="rounded-xl hover:bg-blue-100"
                        >
                          {automation.is_pinned ? (
                            <PinOff className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Pin className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        {expandedAutomation === automation.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="border-t border-blue-100 bg-blue-50/30 space-y-6 py-6">
                    {/* Automation Settings */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-white/70 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                          <Settings className="w-4 h-4 text-blue-600" />
                          Default Settings
                        </h4>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-gray-600">Error Handling</Label>
                              <Select defaultValue="stop">
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="stop">Stop execution</SelectItem>
                                  <SelectItem value="retry">Retry automatically</SelectItem>
                                  <SelectItem value="continue">Continue</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Timezone</Label>
                              <Select defaultValue="UTC">
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UTC">UTC</SelectItem>
                                  <SelectItem value="America/New_York">Eastern</SelectItem>
                                  <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-gray-600">Max Time (s)</Label>
                              <Input defaultValue="300" className="h-8 text-xs" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Max Retries</Label>
                              <Input defaultValue="3" className="h-8 text-xs" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`retry-${automation.id}`}
                                checked={automation.notification_enabled !== false}
                                onCheckedChange={(checked) => toggleNotifications(automation.id, checked)}
                              />
                              <Label htmlFor={`retry-${automation.id}`} className="text-xs text-gray-600">
                                Enable notifications
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch id={`auto-retry-${automation.id}`} />
                              <Label htmlFor={`auto-retry-${automation.id}`} className="text-xs text-gray-600">
                                Auto retry on failure
                              </Label>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* AI Agents */}
                      <Card className="bg-white/70 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                          <Zap className="w-4 h-4 text-purple-600" />
                          AI Agents ({agents[automation.id]?.length || 0})
                        </h4>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {agents[automation.id]?.length > 0 ? (
                            agents[automation.id].map((agent) => (
                              <div key={agent.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <h5 className="font-medium text-sm text-gray-900">{agent.agent_name}</h5>
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
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No AI agents configured</p>
                          )}
                        </div>
                      </Card>

                      {/* Credentials */}
                      <Card className="bg-white/70 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                          <Key className="w-4 h-4 text-blue-600" />
                          Available Credentials ({credentials.length})
                        </h4>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {credentials.length > 0 ? (
                            credentials.map((credential) => (
                              <div key={credential.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <h5 className="font-medium text-sm text-gray-900">{credential.platform_name}</h5>
                                <p className="text-xs text-gray-600">{credential.credential_type}</p>
                                <Badge variant={credential.is_active ? "default" : "secondary"} className="text-xs mt-1">
                                  {credential.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No credentials configured</p>
                          )}
                        </div>
                      </Card>

                      {/* Data Retention */}
                      <Card className="bg-white/70 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                          <Database className="w-4 h-4 text-green-600" />
                          Data Retention
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-600">Automation Logs</Label>
                            <Select defaultValue="30days">
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7days">7 days</SelectItem>
                                <SelectItem value="30days">30 days</SelectItem>
                                <SelectItem value="90days">90 days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Chat History</Label>
                            <Select defaultValue="365days">
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30days">30 days</SelectItem>
                                <SelectItem value="90days">90 days</SelectItem>
                                <SelectItem value="365days">1 year</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id={`cleanup-${automation.id}`} />
                            <Label htmlFor={`cleanup-${automation.id}`} className="text-xs text-gray-600">
                              Automatic data cleanup
                            </Label>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutomationsTab;
