import { useState, useCallback, useMemo } from "react";
import { Send, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatCard from "@/components/ChatCard";
import AIAgentForm from "@/components/AIAgentForm";
import SettingsDropdown from "@/components/SettingsDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { chatAIConnectionService } from "@/services/chatAIConnectionService";

const Index = () => {
  const [message, setMessage] = useState("");
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgentConfig, setCurrentAgentConfig] = useState<any>(null);
  const [messages, setMessages] = useState([{
    id: 1,
    text: "I am YusrAI, your AI assistant powered by OpenAI. I'll help you create comprehensive automations with specific platform integrations. How can I help you today?",
    isBot: true,
    timestamp: new Date()
  }]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorRecovery();
  
  const { execute: executeChatRequest } = useAsyncOperation('chat-request', {
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: "Unable to connect to AI service. Please check your connection and try again.",
        variant: "destructive",
      });
    },
    errorSeverity: 'medium'
  });

  const handleSendMessage = useCallback(async () => {
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
      console.log('🚀 Sending message via Enhanced ChatAIConnectionService:', currentMessage);
      
      const result = await executeChatRequest(async () => {
        const response = await chatAIConnectionService.processConnectionRequest({
          userId: user?.id || 'anonymous',
          message: currentMessage,
          messages: messages.slice(-10).map(msg => ({
            text: msg.text,
            isBot: msg.isBot,
            message_content: msg.text
          })),
          context: 'automation_creation',
          automationContext: currentAgentConfig ? {
            agentConfig: currentAgentConfig.config || {},
            llmProvider: currentAgentConfig.llmProvider || 'OpenAI',
            model: currentAgentConfig.model || 'gpt-4o-mini'
          } : undefined
        });

        console.log('✅ Received enhanced response from ChatAIConnectionService:', response);
        return response;
      }, {
        userAction: 'Creating automation request',
        additionalContext: `Message: "${currentMessage}"`
      });

      console.log('🔍 Processing enhanced result:', result);
      
      // Enhanced response processing
      let responseText = "I'm ready to help you create comprehensive automations with the right platforms and credentials.";
      let structuredData = null;
      let errorHelpAvailable = false;
      
      if (result && typeof result === 'object') {
        console.log('📊 Enhanced result analysis:', {
          hasResponse: !!result.response,
          responseType: typeof result.response,
          responseLength: result.response?.length || 0,
          hasStructuredData: !!result.structuredData,
          errorHelpAvailable: !!result.error_help_available,
          responsePreview: result.response?.substring(0, 50)
        });
        
        // Use response text if available and valid
        if (result.response && 
            typeof result.response === 'string' && 
            result.response.trim() !== '' && 
            result.response.trim() !== 'null') {
          responseText = result.response;
          console.log('✅ Using enhanced response text from service');
        }
        
        // Store structured data and error help status
        if (result.structuredData && typeof result.structuredData === 'object') {
          structuredData = result.structuredData;
          console.log('✅ Enhanced structured data available');
        }

        errorHelpAvailable = result.error_help_available || false;
      }
      
      // Final validation
      if (!responseText || 
          responseText.trim() === '' || 
          responseText.toLowerCase().includes('null') || 
          responseText === 'null') {
        console.warn('⚠️ Enhanced safety check triggered - using comprehensive fallback response');
        responseText = "I'm ready to help you create comprehensive automations. Please specify the platforms you'd like to integrate (like Gmail, Slack, HubSpot, etc.) and I'll provide complete setup instructions.";
      }
      
      const botResponse = {
        id: Date.now() + 1,
        text: responseText,
        isBot: true,
        timestamp: new Date(),
        structuredData: structuredData,
        error_help_available: errorHelpAvailable
      };
      
      console.log('📤 Adding enhanced bot response:', {
        textLength: botResponse.text.length,
        textPreview: botResponse.text.substring(0, 100),
        hasStructuredData: !!botResponse.structuredData,
        errorHelpAvailable: botResponse.error_help_available
      });
      
      setMessages(prev => [...prev, botResponse]);

    } catch (error: any) {
      console.error('❌ Error in enhanced chat request:', error);
      handleError(error, 'Enhanced chat message sending');
      
      const errorResponse = {
        id: Date.now() + 1,
        text: "I encountered a technical issue, but I'm ready to help you create your automation. Please rephrase your request with specific platform names (like Gmail, Slack, HubSpot, etc.) and I'll provide a complete solution.",
        isBot: true,
        timestamp: new Date(),
        error_help_available: true
      };
      setMessages(prev => [...prev, errorResponse]);
      
    } finally {
      setIsLoading(false);
    }
  }, [message, isLoading, messages, currentAgentConfig, executeChatRequest, handleError, user]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  }, [handleSendMessage, isLoading]);

  const handleAgentConfigSaved = useCallback((agentName: string, agentId?: string, llmProvider?: string, model?: string, config?: any, apiKey?: string) => {
    try {
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
    } catch (error: any) {
      handleError(error, 'Agent configuration saving');
      toast({
        title: "Configuration Error",
        description: "Failed to save agent configuration. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, handleError]);

  const agentStatusDisplay = useMemo(() => {
    if (!currentAgentConfig) return null;
    
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border border-blue-200">
        <div className="text-sm text-blue-600 font-medium">
          Active Agent: {currentAgentConfig.name || 'AI Agent'}
        </div>
        <div className="text-xs text-gray-500">
          {currentAgentConfig.llmProvider || 'OpenAI'} - {currentAgentConfig.model || 'gpt-4o-mini'}
        </div>
      </div>
    );
  }, [currentAgentConfig]);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Header with navigation */}
      <div className="absolute top-6 right-6 z-20 flex gap-4">
        {/* Agent Status Display */}
        {agentStatusDisplay}
        
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
            onSendMessage={(helpMessage) => {
              setMessage(helpMessage);
              // Automatically send the help message
              setTimeout(() => {
                if (!isLoading) {
                  handleSendMessage();
                }
              }, 100);
            }}
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
