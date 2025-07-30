import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ChatCard from "@/components/ChatCard";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { agentStateManager } from '@/utils/agentStateManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AgentConfigurationForm from '@/components/AgentConfigurationForm';
import { GHQAutomationExecuteButton } from '@/components/GHQAutomationExecuteButton';

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

interface Agent {
  name: string;
  role: string;
  goal: string;
  rule: string;
  memory: string;
  why_needed: string;
}

const AutomationDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const { user } = useAuth();
  const { handleError } = useErrorRecovery();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [automation, setAutomation] = useState<any>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [platformCredentialStatus, setPlatformCredentialStatus] = useState<{ [key: string]: 'saved' | 'tested' | 'missing' }>({});
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const fetchAutomation = useCallback(async () => {
    if (!id || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching automation:", error);
        toast({
          title: "Error",
          description: "Failed to load automation details.",
          variant: "destructive",
        });
        return;
      }

      setAutomation(data);
    } catch (error: any) {
      handleError(error, 'AutomationDetail - Fetch Automation');
      toast({
        title: "Error",
        description: "Failed to load automation details.",
        variant: "destructive",
      });
    }
  }, [id, user?.id, toast, handleError]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('automation_id', id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load chat messages.",
          variant: "destructive",
        });
        return;
      }

      const formattedMessages = data.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      setMessages(formattedMessages);
    } catch (error: any) {
      handleError(error, 'AutomationDetail - Fetch Messages');
      toast({
        title: "Error",
        description: "Failed to load chat messages.",
        variant: "destructive",
      });
    }
  }, [id, toast, handleError]);

  const fetchAgents = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('automation_id', id);

      if (error) {
        console.error("Error fetching agents:", error);
        toast({
          title: "Error",
          description: "Failed to load agents.",
          variant: "destructive",
        });
        return;
      }

      setAgents(data || []);
      data?.forEach(agent => {
        agentStateManager.addAgent(agent.name, agent);
      });
    } catch (error: any) {
      handleError(error, 'AutomationDetail - Fetch Agents');
      toast({
        title: "Error",
        description: "Failed to load agents.",
        variant: "destructive",
      });
    }
  }, [id, toast, handleError]);

  const fetchPlatformCredentialStatuses = useCallback(async () => {
    if (!id || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('platform_name, is_tested')
        .eq('automation_id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error fetching platform credential statuses:", error);
        toast({
          title: "Error",
          description: "Failed to load platform credential statuses.",
          variant: "destructive",
        });
        return;
      }

      const statuses = {};
      data.forEach(item => {
        statuses[item.platform_name] = item.is_tested ? 'tested' : 'saved';
      });
      setPlatformCredentialStatus(statuses);
    } catch (error: any) {
      handleError(error, 'AutomationDetail - Fetch Platform Credential Statuses');
      toast({
        title: "Error",
        description: "Failed to load platform credential statuses.",
        variant: "destructive",
      });
    }
  }, [id, user?.id, toast, handleError]);

  useEffect(() => {
    if (id) {
      fetchAutomation();
      fetchMessages();
      fetchAgents();
      fetchPlatformCredentialStatuses();
    }
  }, [id, fetchAutomation, fetchMessages, fetchAgents, fetchPlatformCredentialStatuses]);

  const handleSendMessage = async (overrideMessage?: string) => {
    if (!id || !user?.id) return;

    const messageText = overrideMessage || inputMessage;
    if (!messageText.trim()) return;

    setIsLoading(true);
    setInputMessage('');

    try {
      const newMessage = {
        text: messageText,
        isBot: false,
        timestamp: new Date(),
        automation_id: id,
        user_id: user.id
      };

      const { data: insertedMessage, error: insertError } = await supabase
        .from('chat_messages')
        .insert([newMessage])
        .select('*')
        .single();

      if (insertError) {
        console.error("Error inserting message:", insertError);
        toast({
          title: "Error",
          description: "Failed to send message.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const optimisticMessage = {
        ...insertedMessage,
        timestamp: new Date(insertedMessage.timestamp)
      };

      setMessages(prevMessages => [...prevMessages, optimisticMessage]);

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: messageText,
          messages: messages.map(m => ({
            text: m.text,
            isBot: m.isBot
          })),
          automation_id: id
        }
      });

      if (error) {
        console.error("Error invoking chat-ai:", error);
        toast({
          title: "AI Error",
          description: "Failed to get response from AI.",
          variant: "destructive",
        });

        await supabase
          .from('chat_messages')
          .update({ error_help_available: true })
          .eq('id', optimisticMessage.id);

        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.id === optimisticMessage.id) {
              return { ...msg, error_help_available: true };
            }
            return msg;
          });
        });
        setIsLoading(false);
        return;
      }

      const botMessage = {
        text: data.response,
        isBot: true,
        timestamp: new Date(),
        automation_id: id,
        user_id: user.id
      };

      const { data: insertedBotMessage, error: insertBotError } = await supabase
        .from('chat_messages')
        .insert([botMessage])
        .select('*')
        .single();

      if (insertBotError) {
        console.error("Error inserting bot message:", insertBotError);
        toast({
          title: "Error",
          description: "Failed to save bot message.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setMessages(prevMessages => [
        ...prevMessages,
        {
          ...insertedBotMessage,
          timestamp: new Date(insertedBotMessage.timestamp)
        }
      ]);
    } catch (error: any) {
      handleError(error, 'AutomationDetail - Send Message');
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleAgentAdd = async (agent: Agent) => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .insert([{ ...agent, automation_id: id }])
        .select('*')
        .single();

      if (error) {
        console.error("Error adding agent:", error);
        toast({
          title: "Error",
          description: "Failed to add agent.",
          variant: "destructive",
        });
        return;
      }

      setAgents(prevAgents => [...prevAgents, data]);
      toast({
        title: "Success",
        description: "Agent added successfully.",
      });
    } catch (error: any) {
      handleError(error, 'AutomationDetail - Add Agent');
      toast({
        title: "Error",
        description: "Failed to add agent.",
        variant: "destructive",
      });
    }
  };

  const handleAgentDismiss = (agentName: string) => {
    setDismissedAgents(prev => {
      const newSet = new Set(prev);
      newSet.add(agentName);
      return newSet;
    });
  };

  const handlePlatformCredentialChange = () => {
    fetchPlatformCredentialStatuses();
  };

  const handleExecuteAutomation = () => {
    console.log('🚀 Automation execution triggered!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">{automation?.title || 'Loading...'}</h1>
          <p className="mt-2 text-lg text-gray-600">{automation?.description || 'Configure and run your automation.'}</p>
        </div>

        
        <div className="space-y-6">
          <ChatCard
            messages={messages}
            onAgentAdd={handleAgentAdd}
            dismissedAgents={dismissedAgents}
            onAgentDismiss={handleAgentDismiss}
            automationId={id}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onExecuteAutomation={handleExecuteAutomation}
            platformCredentialStatus={platformCredentialStatus}
            onPlatformCredentialChange={handlePlatformCredentialChange}
          />

          

          
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border-0 p-6">
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask YusrAI to help with your automation, add features, or troubleshoot issues..."
                  className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 resize-none bg-white/90 backdrop-blur-sm transition-all duration-200"
                  disabled={isLoading}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  Press Ctrl+Enter to send
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  💡 Tip: Be specific about what you want to achieve
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send to YusrAI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border-0 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Execution</h2>
          <p className="text-gray-600 mb-6">Ready to execute the automation? Click the button below to start the process.</p>
          <GHQAutomationExecuteButton automationId={id as string} />
        </div>
      </div>
    </div>
  );
};

export default AutomationDetail;
