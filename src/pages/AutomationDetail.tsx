import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ChatCard from "@/components/ChatCard";
import { ArrowLeft, Send, Bot, Loader2 } from 'lucide-react';
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { YusrAIStructuredResponse } from "@/utils/jsonParser";
import { agentStateManager } from '@/utils/agentStateManager';
import YusrAIStructuredDisplay from "@/components/YusrAIStructuredDisplay";
import ExecutionBlueprintVisualizer from "@/components/ExecutionBlueprintVisualizer";
import { useAutomationPersistence } from "@/hooks/useAutomationPersistence";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: YusrAIStructuredResponse;
  error_help_available?: boolean;
  yusrai_powered?: boolean;
  seven_sections_validated?: boolean;
}

const AutomationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { handleError } = useErrorRecovery();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [automationTitle, setAutomationTitle] = useState('');
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [platformCredentialStatus, setPlatformCredentialStatus] = useState<{ [key: string]: 'saved' | 'tested' | 'missing' }>({});
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const { savedResponses, saveAutomationResponse } = useAutomationPersistence(id || '');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (id) {
      agentStateManager.setAutomationId(id);
      loadAutomationDetails();
    }
  }, [id, user, navigate]);

  const loadAutomationDetails = async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('title, description')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading automation:', error);
        toast({
          title: "Error",
          description: "Failed to load automation details",
          variant: "destructive",
        });
        return;
      }

      setAutomationTitle(data.title || 'YusrAI Automation');
      
      // Load existing chat messages
      const { data: chatData, error: chatError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('automation_id', id)
        .order('created_at', { ascending: true });

      if (chatError) {
        console.error('Error loading chat messages:', chatError);
        return;
      }

      // Convert chat messages to our format
      const loadedMessages: Message[] = chatData.map((msg, index) => ({
        id: index,
        text: msg.message,
        isBot: msg.is_bot,
        timestamp: new Date(msg.created_at),
        structuredData: msg.structured_data as YusrAIStructuredResponse,
        error_help_available: msg.error_help_available,
        yusrai_powered: msg.yusrai_powered,
        seven_sections_validated: msg.seven_sections_validated
      }));

      setMessages(loadedMessages);
      
    } catch (error) {
      console.error('Error in loadAutomationDetails:', error);
      handleError(error, 'Loading automation details');
    }
  };

  // PHASE 5: Enhanced message sending with better context
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessage: Message = {
      id: messages.length,
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    try {
      // PHASE 5: Enhanced context building for better follow-up understanding
      const recentMessages = messages.slice(-10); // Get last 10 messages for context
      const conversationContext = recentMessages.map(msg => 
        `${msg.isBot ? 'YusrAI' : 'User'}: ${msg.text}`
      ).join('\n');
      
      // Include agent state information
      const agentStatusSummary = agentStateManager.getStatusSummary();
      
      // Build comprehensive context
      const contextualMessage = `
CONVERSATION CONTEXT:
${conversationContext}

CURRENT MESSAGE: ${inputMessage}

AGENT STATUS: ${agentStatusSummary}

Please provide a comprehensive response based on the full conversation context above.
      `.trim();
      
      console.log('📤 Sending enhanced contextual message to ChatAI:', contextualMessage.substring(0, 500));
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { 
          message: contextualMessage,
          automation_id: id,
          context: {
            recent_messages: recentMessages,
            agent_decisions: agentStateManager.getAllDecisions(),
            automation_title: automationTitle
          }
        }
      });
      
      if (error) {
        console.error('ChatAI Error:', error);
        throw error;
      }
      
      console.log('✅ ChatAI Response received:', data);
      
      const botMessage: Message = {
        id: messages.length + 1,
        text: data.response || data.message || 'YusrAI processed your request.',
        isBot: true,
        timestamp: new Date(),
        error_help_available: data.error_help_available,
        yusrai_powered: data.yusrai_powered,
        seven_sections_validated: data.seven_sections_validated
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Save both messages to database
      await saveChatMessage(userMessage);
      await saveChatMessage(botMessage);
      
      // Save automation response if structured
      if (data.yusrai_powered && data.seven_sections_validated) {
        await saveAutomationResponse({
          chat_message_id: botMessage.id,
          response_text: botMessage.text,
          structured_data: data.structured_data,
          yusrai_powered: data.yusrai_powered,
          seven_sections_validated: data.seven_sections_validated,
          error_help_available: data.error_help_available,
          is_ready_for_execution: false
        });
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      handleError(error, 'Sending message to YusrAI');
      
      const errorMessage: Message = {
        id: messages.length + 1,
        text: 'I encountered an error processing your request. Please try again.',
        isBot: true,
        timestamp: new Date(),
        error_help_available: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChatMessage = async (message: Message) => {
    if (!id || !user) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          automation_id: id,
          user_id: user.id,
          message: message.text,
          is_bot: message.isBot,
          structured_data: message.structuredData,
          error_help_available: message.error_help_available,
          yusrai_powered: message.yusrai_powered,
          seven_sections_validated: message.seven_sections_validated
        });
      
      if (error) {
        console.error('Error saving chat message:', error);
      }
    } catch (error) {
      console.error('Error in saveChatMessage:', error);
    }
  };

  const handleAgentAdd = (agent: any) => {
    console.log(`Adding agent ${agent.name}`);
    setDismissedAgents(prev => {
      const newSet = new Set(prev);
      newSet.delete(agent.name);
      return newSet;
    });
  };

  const handleAgentDismiss = (agentName: string) => {
    console.log(`Dismissing agent ${agentName}`);
    setDismissedAgents(prev => new Set(prev).add(agentName));
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const handlePlatformCredentialChange = () => {
    setShowCredentialForm(!showCredentialForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/automations')}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Automations
          </Button>
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {automationTitle || 'YusrAI Automation Chat'}
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <ChatCard
            messages={messages}
            onAgentAdd={handleAgentAdd}
            onAgentDismiss={handleAgentDismiss}
            dismissedAgents={dismissedAgents}
            automationId={id}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            platformCredentialStatus={platformCredentialStatus}
            onPlatformCredentialChange={handlePlatformCredentialChange}
          />
          
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask YusrAI about your automation..."
                  className="flex-1 bg-white/80 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AutomationDetail;
