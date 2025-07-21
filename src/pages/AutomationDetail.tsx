
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Settings, 
  MessageSquare, 
  Bot, 
  Zap,
  Code,
  Eye,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ChatCard from '@/components/ChatCard';
import PlatformButtons from '@/components/PlatformButtons';
import { parseYusrAIStructuredResponse } from '@/utils/jsonParser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: any;
  yusrai_powered?: boolean;
  seven_sections_validated?: boolean;
  error_help_available?: boolean;
}

interface Agent {
  name: string;
  role: string;
  goal: string;
  rules: string;
  memory: string;
  why_needed: string;
}

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
  test_payloads?: Array<{
    platform: string;
    test_data: any;
    field_mapping: Record<string, string>;
    api_config: any;
  }>;
}

const AutomationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [automation, setAutomation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [showChatCard, setShowChatCard] = useState(false);
  const [showJsonView, setShowJsonView] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [platformCredentialStatus, setPlatformCredentialStatus] = useState<{[key: string]: 'saved' | 'tested' | 'missing'}>({});

  useEffect(() => {
    if (id && user) {
      fetchAutomation();
      fetchMessages();
      setShowChatCard(true);
    }
  }, [id, user]);

  const fetchAutomation = async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setAutomation(data);
      setEditedTitle(data.title);
      setEditedDescription(data.description || '');
    } catch (error) {
      console.error('Error fetching automation:', error);
      toast({
        title: "Error",
        description: "Failed to load automation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('automation_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('🔄 Raw messages from database:', data);
      
      const processedMessages = (data || []).map((msg: any) => {
        const message: Message = {
          id: msg.id,
          text: msg.message,
          isBot: msg.is_bot,
          timestamp: new Date(msg.created_at),
          yusrai_powered: msg.yusrai_powered || false,
          seven_sections_validated: msg.seven_sections_validated || false,
          error_help_available: msg.error_help_available || false
        };

        // Parse structured data for bot messages
        if (msg.is_bot && msg.message) {
          try {
            const parseResult = parseYusrAIStructuredResponse(msg.message);
            if (parseResult.structuredData) {
              message.structuredData = parseResult.structuredData;
              message.yusrai_powered = parseResult.metadata.yusrai_powered;
              message.seven_sections_validated = parseResult.metadata.seven_sections_validated;
              
              console.log('✅ Structured data parsed for message:', {
                id: msg.id,
                hasStructuredData: !!parseResult.structuredData,
                yusraiPowered: message.yusrai_powered,
                sevenSectionsValidated: message.seven_sections_validated
              });
            }
          } catch (error) {
            console.log('Could not parse structured data:', error);
          }
        }

        return message;
      });

      console.log('🔄 Processed messages with flags:', processedMessages.map(m => ({
        id: m.id,
        isBot: m.isBot,
        yusraiPowered: m.yusrai_powered,
        sevenSectionsValidated: m.seven_sections_validated,
        hasStructuredData: !!m.structuredData
      })));

      setMessages(processedMessages);
      
      // Extract platforms from the latest YusrAI response
      extractPlatformsFromMessages(processedMessages);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const extractPlatformsFromMessages = (messages: Message[]) => {
    console.log('🔍 Extracting platforms from messages...');
    
    // Find the latest bot message with structured data
    const latestBotMessage = messages
      .filter(msg => msg.isBot && msg.structuredData && msg.yusrai_powered)
      .pop();

    if (latestBotMessage?.structuredData?.platforms) {
      const extractedPlatforms = latestBotMessage.structuredData.platforms;
      console.log('✅ Extracted platforms:', extractedPlatforms);
      
      // Ensure platforms have the correct structure with test_payloads
      const formattedPlatforms = extractedPlatforms.map((platform: any) => ({
        name: platform.name,
        credentials: platform.credentials || [],
        test_payloads: latestBotMessage.structuredData.test_payloads ? 
          Object.entries(latestBotMessage.structuredData.test_payloads)
            .filter(([platformName]) => platformName.toLowerCase() === platform.name.toLowerCase())
            .map(([platformName, payload]) => ({
              platform: platformName,
              test_data: payload,
              field_mapping: payload?.field_mapping || {},
              api_config: payload?.api_config || {}
            })) : []
      }));

      setPlatforms(formattedPlatforms);
      console.log('🎯 Formatted platforms with test payloads:', formattedPlatforms);
      
      // Check credential status
      checkPlatformCredentialStatus(formattedPlatforms);
    } else {
      console.log('⚠️ No platforms found in latest bot message');
      setPlatforms([]);
    }
  };

  const checkPlatformCredentialStatus = async (platforms: Platform[]) => {
    if (!user || !id) return;

    try {
      const validation = await AutomationCredentialManager.validateAutomationCredentials(
        id,
        platforms.map(p => p.name),
        user.id
      );

      setPlatformCredentialStatus(validation.status);
      console.log('📊 Platform credential status:', validation.status);
    } catch (error) {
      console.error('Failed to check platform credential status:', error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !id || !user) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: message,
      isBot: false,
      timestamp: new Date(),
      yusrai_powered: false,
      seven_sections_validated: false
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      // Save user message to database
      await supabase
        .from('chat_messages')
        .insert({
          automation_id: id,
          user_id: user.id,
          message: message,
          is_bot: false,
          yusrai_powered: false,
          seven_sections_validated: false
        });

      // Call YusrAI API
      const { data, error } = await supabase.functions.invoke('knowledge-ai-chat', {
        body: { 
          message: message,
          category: 'automation_creation',
          context: 'automation_detail'
        }
      });

      if (error) throw error;

      const botResponse = data.response;
      
      // Parse structured data from response
      const parseResult = parseYusrAIStructuredResponse(botResponse);
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
        structuredData: parseResult.structuredData,
        yusrai_powered: parseResult.metadata.yusrai_powered,
        seven_sections_validated: parseResult.metadata.seven_sections_validated,
        error_help_available: false
      };

      setMessages(prev => [...prev, botMessage]);

      // Save bot message to database with flags
      await supabase
        .from('chat_messages')
        .insert({
          automation_id: id,
          user_id: user.id,
          message: botResponse,
          is_bot: true,
          yusrai_powered: parseResult.metadata.yusrai_powered,
          seven_sections_validated: parseResult.metadata.seven_sections_validated,
          error_help_available: false
        });

      // Extract platforms from new response
      if (parseResult.structuredData?.platforms) {
        extractPlatformsFromMessages([...messages, botMessage]);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: Date.now() + 2,
        text: `I encountered an error: ${error.message}. Please try again.`,
        isBot: true,
        timestamp: new Date(),
        yusrai_powered: false,
        seven_sections_validated: false,
        error_help_available: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
    }
  };

  const handleAgentAdd = (agent: Agent) => {
    toast({
      title: "Agent Added",
      description: `${agent.name} has been added to your automation.`,
    });
  };

  const handleAgentDismiss = (agentName: string) => {
    setDismissedAgents(prev => {
      const newSet = new Set(prev);
      newSet.add(agentName);
      return newSet;
    });
    
    toast({
      title: "Agent Dismissed",
      description: `${agentName} has been dismissed.`,
    });
  };

  const handlePlatformCredentialChange = () => {
    console.log('🔄 Platform credential changed, refreshing status...');
    if (platforms.length > 0) {
      checkPlatformCredentialStatus(platforms);
    }
  };

  const generateAndSaveDiagram = async () => {
    if (!automation || !id || !user) return;

    try {
      console.log('📊 Generating diagram for automation:', automation.title);
      
      // Get the latest YusrAI response with structured data
      const latestBotMessage = messages
        .filter(msg => msg.isBot && msg.structuredData && msg.yusrai_powered)
        .pop();

      if (!latestBotMessage?.structuredData) {
        throw new Error('No YusrAI structured data found for diagram generation');
      }

      const structuredData = latestBotMessage.structuredData;
      
      // Create a comprehensive blueprint for diagram generation
      const blueprintData = {
        automation_id: id,
        title: automation.title,
        description: automation.description || structuredData.summary || 'YusrAI Automation',
        yusrai_powered: true,
        seven_sections_validated: latestBotMessage.seven_sections_validated,
        summary: structuredData.summary || '',
        steps: structuredData.steps || [],
        platforms: structuredData.platforms || [],
        agents: structuredData.agents || [],
        clarification_questions: structuredData.clarification_questions || [],
        test_payloads: structuredData.test_payloads || {},
        execution_blueprint: structuredData.execution_blueprint || {
          version: '1.0.0',
          description: structuredData.summary || 'YusrAI Automation',
          trigger: { type: 'manual' },
          steps: structuredData.steps?.map((step: string, index: number) => ({
            id: `step_${index + 1}`,
            name: step,
            type: 'action',
            description: step
          })) || [],
          variables: {}
        },
        workflow: {
          nodes: structuredData.steps?.map((step: string, index: number) => ({
            id: `node_${index + 1}`,
            type: 'step',
            data: { label: step, step: step },
            position: { x: 100, y: 100 + (index * 80) }
          })) || [],
          edges: structuredData.steps?.slice(0, -1).map((_, index: number) => ({
            id: `edge_${index + 1}`,
            source: `node_${index + 1}`,
            target: `node_${index + 2}`,
            type: 'default'
          })) || []
        }
      };

      console.log('📊 Blueprint data prepared:', blueprintData);

      toast({
        title: "Generating Diagram...",
        description: "Creating visual representation of your YusrAI automation",
      });

      const { data, error } = await supabase.functions.invoke('diagram-generator', {
        body: {
          automation_id: id,
          blueprint: blueprintData,
          user_id: user.id
        }
      });

      if (error) {
        console.error('❌ Diagram generation error:', error);
        throw error;
      }

      console.log('✅ Diagram generated successfully:', data);
      
      toast({
        title: "Diagram Generated!",
        description: "Your YusrAI automation diagram has been created successfully.",
      });

    } catch (error: any) {
      console.error('💥 Failed to generate diagram:', error);
      toast({
        title: "Diagram Generation Failed",
        description: error.message || "Failed to generate automation diagram",
        variant: "destructive",
      });
    }
  };

  const updateAutomation = async () => {
    if (!id || !user) return;

    try {
      const { error } = await supabase
        .from('automations')
        .update({
          title: editedTitle,
          description: editedDescription
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAutomation(prev => ({
        ...prev,
        title: editedTitle,
        description: editedDescription
      }));

      setIsEditing(false);
      toast({
        title: "Updated!",
        description: "Automation details updated successfully.",
      });
    } catch (error) {
      console.error('Error updating automation:', error);
      toast({
        title: "Error",
        description: "Failed to update automation",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading automation...</p>
        </div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Automation Not Found</h2>
          <p className="text-gray-600 mb-4">The automation you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/automations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Automations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/automations')}
                className="rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  {isEditing ? (
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-2xl font-bold border-0 bg-transparent p-0 focus:ring-0"
                      autoFocus
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{automation.title}</h1>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${getStatusColor(automation.status)}`}>
                      {automation.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Created {new Date(automation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={generateAndSaveDiagram}
                className="rounded-xl"
              >
                <Eye className="w-4 h-4 mr-2" />
                Generate Diagram
              </Button>
              
              <Dialog open={showJsonView} onOpenChange={setShowJsonView}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    <Code className="w-4 h-4 mr-2" />
                    View JSON
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>YusrAI Automation JSON - 7 Sections Validated</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] w-full">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                      <code>
                        {JSON.stringify({
                          automation: automation,
                          messages: messages,
                          platforms: platforms,
                          platformCredentialStatus: platformCredentialStatus,
                          yusrai_powered: messages.some(m => m.yusrai_powered),
                          seven_sections_validated: messages.some(m => m.seven_sections_validated)
                        }, null, 2)}
                      </code>
                    </pre>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="rounded-xl"
              >
                <Settings className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Describe what this automation does..."
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={updateAutomation} className="rounded-xl">
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {automation.description && !isEditing && (
            <p className="text-gray-600 mt-2">{automation.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Platform Credentials */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {platforms.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Platform Integrations</h3>
                  <PlatformButtons
                    platforms={platforms}
                    onCredentialChange={handlePlatformCredentialChange}
                  />
                </div>
              )}

              <Card className="bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Send Message to YusrAI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask YusrAI to help with your automation..."
                      className="rounded-xl min-h-[100px]"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Send to YusrAI
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-2">
            {showChatCard && (
              <div className="h-[calc(100vh-200px)]">
                <ChatCard
                  messages={messages}
                  onAgentAdd={handleAgentAdd}
                  onAgentDismiss={handleAgentDismiss}
                  dismissedAgents={dismissedAgents}
                  automationId={id}
                  isLoading={isLoading}
                  onSendMessage={sendMessage}
                  platformCredentialStatus={platformCredentialStatus}
                  onPlatformCredentialChange={handlePlatformCredentialChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationDetail;
