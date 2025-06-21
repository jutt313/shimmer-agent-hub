
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Bot } from "lucide-react";

interface AgentChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface AgentChatPopupProps {
  agent: {
    id: string;
    agent_name: string;
    agent_role: string;
    agent_goal: string;
    llm_provider: string;
    model: string;
  };
  onClose: () => void;
}

const AgentChatPopup = ({ agent, onClose }: AgentChatPopupProps) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 1,
      text: `Hello! I'm ${agent.agent_name}, your ${agent.agent_role}. My goal is: ${agent.agent_goal}. How can I help you today?`,
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    // Simulate AI response (in a real implementation, this would call the AI agent)
    setTimeout(() => {
      const botResponse: AgentChatMessage = {
        id: Date.now() + 1,
        text: `As your ${agent.agent_role}, I understand you're asking about "${userMessage.text}". Based on my role and goal (${agent.agent_goal}), I would recommend focusing on the automation workflow and how I can best assist you in achieving your objectives.`,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] z-50">
      <Card className="w-full h-full bg-white/90 backdrop-blur-md shadow-2xl border border-blue-200/50">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-100/80 to-purple-100/80 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg text-blue-800">{agent.agent_name}</CardTitle>
              <p className="text-sm text-blue-600">{agent.agent_role}</p>
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
        
        <CardContent className="p-4 flex flex-col h-[calc(100%-5rem)]">
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

export default AgentChatPopup;
