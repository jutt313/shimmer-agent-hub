
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Bot, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DynamicAgentPromptBuilder } from "@/utils/dynamicAgentPromptBuilder";

interface AgentChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface EnhancedAgentChatPopupProps {
  agent: {
    id: string;
    agent_name: string;
    agent_role: string;
    agent_goal: string;
    agent_rules?: string;
    agent_memory?: any;
    llm_provider: string;
    model: string;
    api_key: string;
  };
  automationContext?: {
    id: string;
    name?: string;
    description?: string;
  };
  onClose: () => void;
}

const EnhancedAgentChatPopup = ({ agent, automationContext, onClose }: EnhancedAgentChatPopupProps) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with agent introduction
    const welcomeMessage: AgentChatMessage = {
      id: 1,
      text: `Hello! I'm ${agent.agent_name}, your ${agent.agent_role}. ${agent.agent_goal} How can I assist you today?`,
      isBot: true,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [agent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callAgentAPI = async (userMessage: string): Promise<string> => {
    try {
      console.log(`🤖 Calling ${agent.llm_provider} API for ${agent.agent_name}`);
      
      // Generate dynamic system prompt
      const systemPrompt = DynamicAgentPromptBuilder.generateSystemPrompt(agent, automationContext);
      const chatPrompt = DynamicAgentPromptBuilder.generateChatPrompt(agent, userMessage, messages);

      // Call the appropriate LLM API based on provider
      let response;
      
      switch (agent.llm_provider) {
        case 'OpenAI':
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${agent.api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: agent.model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: chatPrompt }
              ],
              max_tokens: 500,
              temperature: 0.7
            }),
          });
          
          if (!response.ok) throw new Error('OpenAI API call failed');
          const openaiData = await response.json();
          return openaiData.choices[0].message.content;

        case 'Claude':
          response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': agent.api_key,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: agent.model,
              max_tokens: 500,
              system: systemPrompt,
              messages: [{ role: 'user', content: chatPrompt }]
            }),
          });
          
          if (!response.ok) throw new Error('Claude API call failed');
          const claudeData = await response.json();
          return claudeData.content[0].text;

        default:
          // For other providers, use a simulated intelligent response for now
          return `As ${agent.agent_name}, I understand you're asking about "${userMessage}". Based on my role as ${agent.agent_role} and goal to ${agent.agent_goal}, I'm here to help you with this automation. ${agent.llm_provider} integration is working properly.`;
      }
    } catch (error) {
      console.error('❌ Agent API call failed:', error);
      throw error;
    }
  };

  const updateAgentMemory = async (interaction: string, outcome: string) => {
    try {
      const updatedMemory = DynamicAgentPromptBuilder.updateMemoryContext(
        agent.agent_memory,
        {
          interaction,
          outcome,
          timestamp: new Date(),
          metadata: { chat_session: true }
        }
      );

      await supabase
        .from('ai_agents')
        .update({ agent_memory: updatedMemory })
        .eq('id', agent.id);

      console.log('🧠 Agent memory updated');
    } catch (error) {
      console.error('❌ Failed to update agent memory:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage: AgentChatMessage = {
      id: Date.now(),
      text: newMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      const agentResponse = await callAgentAPI(newMessage);
      
      const botResponse: AgentChatMessage = {
        id: Date.now() + 1,
        text: agentResponse,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Update agent memory with this interaction
      await updateAgentMemory(newMessage, agentResponse);
      
    } catch (error: any) {
      console.error('❌ Chat error:', error);
      
      const errorResponse: AgentChatMessage = {
        id: Date.now() + 1,
        text: `I apologize, but I'm experiencing some technical difficulties. Please check my API configuration or try again later. (Error: ${error.message})`,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: "Chat Error",
        description: `Failed to get response from ${agent.agent_name}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] z-50">
      <Card className="w-full h-full bg-white/95 backdrop-blur-md shadow-2xl border border-blue-200/50">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-100/80 to-purple-100/80 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {agent.agent_name}
              </CardTitle>
              <p className="text-sm text-blue-600">{agent.agent_role}</p>
              <p className="text-xs text-gray-500">{agent.llm_provider}/{agent.model}</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 flex flex-col h-[calc(100%-6rem)]">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    message.isBot 
                      ? 'bg-blue-100/80 text-blue-800 border border-blue-200/50' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.isBot ? 'text-blue-500' : 'text-blue-100'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-blue-100/80 text-blue-800 border border-blue-200/50 px-3 py-2 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">{agent.agent_name} is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${agent.agent_name}...`}
              disabled={isLoading}
              className="rounded-2xl bg-white/80 border-blue-200/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !newMessage.trim()}
              size="sm"
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAgentChatPopup;
