import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import ChatCard from '@/components/ChatCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Settings, Trash2 } from 'lucide-react';
import { parseYusrAIStructuredResponse } from '@/utils/jsonParser';
import { agentStateManager } from '@/utils/agentStateManager';
import SimpleExecuteButton from '@/components/SimpleExecuteButton';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: any;
  error_help_available?: boolean;
  yusrai_powered?: boolean;
  seven_sections_validated?: boolean;
}

const AutomationDetail = () => {
  const { automationId } = useParams<{ automationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [automation, setAutomation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [platformCredentialStatus, setPlatformCredentialStatus] = useState<{ [key: string]: 'saved' | 'tested' | 'missing' }>({});

  useEffect(() => {
    if (!automationId) {
      console.error("No automation ID provided");
      return;
    }

    const loadAutomation = async () => {
      setLoading(true);
      try {
        const { data: automationData, error } = await supabase
          .from('automations')
          .select('*')
          .eq('id', automationId)
          .single();

        if (error) {
          console.error("Error loading automation:", error);
          toast({
            title: "Error",
            description: "Failed to load automation details.",
            variant: "destructive",
          });
          return;
        }

        setAutomation(automationData);
      } finally {
        setLoading(false);
      }
    };

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data: messageData, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('automation_id', automationId)
          .order('timestamp', { ascending: true });

        if (error) {
          console.error("Error loading messages:", error);
          toast({
            title: "Error",
            description: "Failed to load chat messages.",
            variant: "destructive",
          });
          return;
        }

        const formattedMessages = messageData.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));

        setMessages(formattedMessages);
      } finally {
        setIsLoading(false);
      }
    };

    loadAutomation();
    loadMessages();
  }, [automationId, toast]);

  // Enhanced platform extraction function
  const extractPlatformsFromMessages = (messages: any[]) => {
    console.log('🔍 Extracting platforms from messages:', messages);
    
    const platforms: any[] = [];
    
    messages.forEach((message, index) => {
      if (message.isBot && message.text) {
        try {
          const parseResult = parseYusrAIStructuredResponse(message.text);
          if (parseResult.structuredData) {
            console.log(`✅ Found structured data in message ${index}:`, parseResult.structuredData);
            
            const platformsSource = parseResult.structuredData.platforms_credentials || 
                                   parseResult.structuredData.platforms || 
                                   parseResult.structuredData.required_platforms || 
                                   [];
            
            if (Array.isArray(platformsSource)) {
              platformsSource.forEach(platform => {
                const transformedPlatform = {
                  name: platform.name || platform.platform_name || platform.platform || 'Unknown Platform',
                  credentials: Array.isArray(platform.credentials) ? platform.credentials.map((cred: any) => ({
                    field: cred.field || cred.name || cred.key || 'api_key',
                    placeholder: cred.example || cred.placeholder || cred.description || `Enter ${cred.field || 'credential'}`,
                    link: cred.link || cred.where_to_get || cred.documentation_url || cred.url || '#',
                    why_needed: cred.why_needed || cred.description || cred.purpose || 'Authentication required'
                  })) : []
                };
                
                console.log(`🔗 Transformed platform: ${transformedPlatform.name}`, transformedPlatform);
                
                // Avoid duplicates
                if (!platforms.find(p => p.name === transformedPlatform.name)) {
                  platforms.push(transformedPlatform);
                }
              });
            }
          }
        } catch (error) {
          console.log(`❌ Error parsing message ${index}:`, error);
        }
      }
    });
    
    console.log('🎯 Final extracted platforms:', platforms);
    return platforms;
  };

  useEffect(() => {
    const subscription = supabase
      .channel('any')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          if (payload.new && payload.new.automation_id === automationId) {
            const newMessage = {
              ...payload.new,
              timestamp: new Date(payload.new.timestamp)
            };
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [automationId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    try {
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert([{
          automation_id: automationId,
          text: inputMessage,
          isBot: false,
          timestamp: new Date(),
          user_id: user?.id
        }])
        .single();

      if (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message.",
          variant: "destructive",
        });
        return;
      }

      setInputMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentAdd = (agent: any) => {
    console.log(`Adding agent: ${agent.name}`);
    agentStateManager.addAgent(agent.name, agent);
  };

  const handleAgentDismiss = (agentName: string) => {
    console.log(`Dismissing agent: ${agentName}`);
    const newDismissedAgents = new Set(dismissedAgents);
    newDismissedAgents.add(agentName);
    setDismissedAgents(newDismissedAgents);
  };

  const handlePlatformCredentialChange = () => {
    console.log('Platform credentials changed, refreshing data...');
    toast({
      title: "Credentials Changed",
      description: "Please test your automation again.",
    });
  };

  const handleDeleteAutomation = async () => {
    if (!window.confirm("Are you sure you want to delete this automation? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', automationId);

      if (error) {
        console.error("Error deleting automation:", error);
        toast({
          title: "Error",
          description: "Failed to delete automation.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Automation Deleted",
        description: "Automation deleted successfully.",
      });
      navigate('/automations');
    } catch (error: any) {
      console.error("Error deleting automation:", error.message);
      toast({
        title: "Error",
        description: "Failed to delete automation.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Automation Not Found</h1>
          <p className="text-gray-600">The requested automation could not be found.</p>
          <Button onClick={() => navigate('/automations')} className="mt-4">
            Go Back to Automations
          </Button>
        </div>
      </div>
    );
  }

  // Extract current platforms for credential buttons
  const currentPlatforms = extractPlatformsFromMessages(messages);
  console.log('🔗 Current platforms for credential buttons:', currentPlatforms);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-30"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/automations')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Automations
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{automation.title}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/automations/edit/${automationId}`)}>
              <Settings className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDeleteAutomation}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border-0 p-8 mb-8">
          <p className="text-gray-700 leading-relaxed">{automation.description}</p>
        </div>

        {/* Chat Interface */}
        <div className="space-y-6">
          <ChatCard
            messages={messages}
            onAgentAdd={handleAgentAdd}
            dismissedAgents={dismissedAgents}
            onAgentDismiss={handleAgentDismiss}
            automationId={automationId}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onExecuteAutomation={() => {}}
            platformCredentialStatus={platformCredentialStatus}
            onPlatformCredentialChange={handlePlatformCredentialChange}
            currentPlatforms={currentPlatforms}
          />

          {/* Input Section */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-0 p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Describe your automation or ask questions..."
                  className="min-h-[60px] rounded-2xl border-gray-200/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 bg-white/70 text-lg resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="h-[60px] px-8 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Send className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Super Small Execute Button */}
          <div className="flex justify-center">
            <div className="scale-75 opacity-80">
              <SimpleExecuteButton 
                automationId={automationId}
                onExecutionStart={() => {}}
                onExecutionComplete={() => {}}
                isReady={Object.keys(platformCredentialStatus).length > 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationDetail;
