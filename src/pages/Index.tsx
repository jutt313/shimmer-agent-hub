
import { useState } from "react";
import { Send, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatCard from "@/components/ChatCard";
import AIAgentForm from "@/components/AIAgentForm";
import SettingsDropdown from "@/components/SettingsDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [message, setMessage] = useState("");
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgentConfig, setCurrentAgentConfig] = useState(null);
  const [messages, setMessages] = useState([{
    id: 1,
    text: "I am YusrAI, your AI assistant powered by OpenAI. How can I help you today?",
    isBot: true,
    timestamp: new Date()
  }]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) {
      return;
    }

    const newMessage = {
      id: Date.now(),
      text: message.trim(),
      isBot: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    const currentMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      // Enhanced payload with proper typing
      const payload: {
        message: string;
        messages: Array<{
          id: number;
          text: string;
          isBot: boolean;
          timestamp: Date;
        }>;
        agentConfig?: any;
        llmProvider?: string;
        model?: string;
      } = { 
        message: currentMessage,
        messages: Array.isArray(messages) ? messages.slice(-10) : []
      };

      // Add agent configuration with null checks
      if (currentAgentConfig && typeof currentAgentConfig === 'object') {
        payload.agentConfig = currentAgentConfig.config || {};
        payload.llmProvider = currentAgentConfig.llmProvider || 'OpenAI';
        payload.model = currentAgentConfig.model || 'gpt-4o-mini';
      }

      console.log('Sending enhanced payload to chat-ai...');

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: payload
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      // Ultra-safe response handling
      let responseText = "I apologize, but I couldn't process your request properly. Please try again.";
      
      if (data) {
        if (typeof data === 'string' && data.trim()) {
          responseText = data;
        } else if (typeof data === 'object') {
          if (typeof data.response === 'string' && data.response.trim()) {
            responseText = data.response;
          } else if (typeof data.message === 'string' && data.message.trim()) {
            responseText = data.message;
          } else if (typeof data.text === 'string' && data.text.trim()) {
            responseText = data.text;
          }
        }
      }
      
      const botResponse = {
        id: Date.now() + 1,
        text: responseText,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Error in chat communication:', error);
      
      toast({
        title: "Connection Error",
        description: "Unable to connect to AI service. Please check your connection and try again.",
        variant: "destructive",
      });
      
      const errorResponse = {
        id: Date.now() + 1,
        text: "I'm experiencing technical difficulties. Please try again in a moment.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const handleAgentConfigSaved = (agentName: string, agentId?: string, llmProvider?: string, model?: string, config?: any, apiKey?: string) => {
    // Enhanced null safety for agent configuration
    const safeAgentConfig = {
      name: agentName && typeof agentName === 'string' ? agentName : 'AI Agent',
      llmProvider: llmProvider && typeof llmProvider === 'string' ? llmProvider : 'OpenAI',
      model: model && typeof model === 'string' ? model : 'gpt-4o-mini',
      config: config && typeof config === 'object' ? config : {},
      apiKey: apiKey && typeof apiKey === 'string' ? apiKey : ''
    };

    setCurrentAgentConfig(safeAgentConfig);
    
    toast({
      title: "AI Agent Configured",
      description: `AI Agent "${safeAgentConfig.name}" is now active for this chat session.`,
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Header with navigation */}
      <div className="absolute top-6 right-6 z-20 flex gap-4">
        {/* Agent Status Display */}
        {currentAgentConfig && (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">
              Active Agent: {currentAgentConfig.name || 'AI Agent'}
            </div>
            <div className="text-xs text-gray-500">
              {currentAgentConfig.llmProvider || 'OpenAI'} - {currentAgentConfig.model || 'gpt-4o-mini'}
            </div>
          </div>
        )}
        
        {user ? (
          <div className="flex gap-4">
            <SettingsDropdown />
            <Button 
              onClick={() => navigate("/automations")}
              className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0" 
              style={{
                boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)'
              }}
            >
              Automations
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => navigate("/auth")}
            className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0" 
            style={{
              boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)'
            }}
          >
            Sign In
          </Button>
        )}
      </div>
      
      <div className="max-w-6xl mx-auto h-full flex flex-col relative z-10">
        {/* Main Chat Card */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <ChatCard 
            messages={messages} 
            isLoading={isLoading}
          />
        </div>
        
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex gap-4 items-end px-[108px]">
            {/* AI Agent Button */}
            <Button 
              onClick={() => setShowAgentForm(true)} 
              className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 border-0" 
              style={{
                boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)'
              }}
            >
              <Bot className="w-6 h-6" />
            </Button>
            
            {/* Message Input */}
            <div className="flex-1 relative">
              <Input 
                value={message} 
                onChange={e => setMessage(e.target.value || "")} 
                onKeyPress={handleKeyPress} 
                placeholder={isLoading ? "YusrAI is thinking..." : "Type your message here..."} 
                disabled={isLoading}
                className="rounded-3xl bg-white/80 backdrop-blur-sm border-0 px-6 py-4 text-lg focus:outline-none focus:ring-0 shadow-lg" 
                style={{
                  boxShadow: '0 0 25px rgba(154, 94, 255, 0.2)'
                }} 
              />
            </div>
            
            {/* Send Button */}
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 border-0 disabled:opacity-50" 
              style={{
                boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)'
              }}
            >
              <Send className={`w-6 h-6 ${isLoading ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* AI Agent Form Modal */}
      {showAgentForm && (
        <AIAgentForm 
          onClose={() => setShowAgentForm(false)} 
          onAgentSaved={handleAgentConfigSaved}
        />
      )}
    </div>
  );
};

export default Index;
