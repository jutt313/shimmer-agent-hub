
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
import { parseYusrAIStructuredResponse } from "@/utils/jsonParser";

const Index = () => {
  const [message, setMessage] = useState("");
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgentConfig, setCurrentAgentConfig] = useState<any>(null);
  const [messages, setMessages] = useState([{
    id: 1,
    text: "I am YusrAI, your AI assistant powered by OpenAI. I'll help you create comprehensive automations with specific platform integrations. How can I help you today?",
    isBot: true,
    timestamp: new Date(),
    structuredData: null,
    yusrai_powered: true,
    seven_sections_validated: false,
    error_help_available: false
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
      timestamp: new Date(),
      structuredData: null,
      yusraiPowered: false,
      sevenSectionsValidated: false,
      error_help_available: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    const currentMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      console.log('🚀 Sending message to YusrAI:', currentMessage);
      
      // Convert frontend message format to OpenAI format
      const conversationHistory: Array<{role: 'user' | 'assistant'; content: string}> = messages
        .slice(-10)
        .map(msg => ({
          role: (msg.isBot ? 'assistant' : 'user') as 'user' | 'assistant',
          content: msg.text
        }));

      console.log('📋 Formatted conversation history:', conversationHistory);

      const result = await executeChatRequest(async () => {
        const response = await chatAIConnectionService.processConnectionRequest({
          userId: user?.id || 'anonymous',
          message: currentMessage,
          messages: conversationHistory,
          context: 'yusrai_automation_creation',
          automationContext: currentAgentConfig ? {
            agentConfig: currentAgentConfig.config || {},
            llmProvider: currentAgentConfig.llmProvider || 'OpenAI',
            model: currentAgentConfig.model || 'gpt-4o-mini'
          } : undefined
        });

        console.log('✅ Received response from YusrAI:', response);
        return response;
      }, {
        userAction: 'Creating YusrAI automation request',
        additionalContext: `Message: "${currentMessage}"`
      });

      console.log('🔍 Processing YusrAI result:', result);
      
      // Process the response with smart validation
      let responseText = "I'm YusrAI, ready to help you create comprehensive automations with the right platforms and credentials.";
      let structuredData = null;
      let errorHelpAvailable = false;
      
      if (result && typeof result === 'object') {
        if (result.response && 
            typeof result.response === 'string' && 
            result.response.trim() !== '' && 
            result.response.trim() !== 'null') {
          responseText = result.response;
          console.log('✅ Using response text from YusrAI service');
        }
        
        // Get structured data from result or parse from response
        if (result.structuredData && typeof result.structuredData === 'object') {
          structuredData = result.structuredData;
          console.log('✅ YusrAI structured data available from service');
        } else if (result.response) {
          // Parse structured data from response text with smart validation
          const parseResult = parseYusrAIStructuredResponse(result.response);
          // Only accept structured data if it has meaningful content
          if (parseResult.structuredData && parseResult.metadata.yusraiPowered) {
            structuredData = parseResult.structuredData;
            console.log('✅ YusrAI structured data parsed and validated:', !!structuredData);
          }
        }

        errorHelpAvailable = result.error_help_available || false;
      }
      
      // Fallback handling only for genuine failures
      if (!responseText || 
          responseText.trim() === '' || 
          responseText.toLowerCase().includes('null') || 
          responseText === 'null') {
        console.warn('⚠️ Safety fallback triggered - using default response');
        responseText = JSON.stringify({
          summary: "I'm YusrAI, ready to help you create comprehensive automations. Please specify what you'd like to automate and I'll provide detailed guidance."
        });
        
        // Parse the fallback as structured data
        const fallbackParseResult = parseYusrAIStructuredResponse(responseText);
        structuredData = fallbackParseResult.structuredData;
      }
      
      const botResponse = {
        id: Date.now() + 1,
        text: responseText,
        isBot: true,
        timestamp: new Date(),
        structuredData: structuredData,
        error_help_available: errorHelpAvailable,
        yusraiPowered: !!structuredData,
        sevenSectionsValidated: !!(structuredData?.step_by_step_explanation && structuredData?.platforms_and_credentials)
      };
      
      console.log('📤 Adding YusrAI bot response:', {
        textLength: botResponse.text.length,
        textPreview: botResponse.text.substring(0, 100),
        hasStructuredData: !!botResponse.structuredData,
        errorHelpAvailable: botResponse.error_help_available
      });
      
      setMessages(prev => [...prev, botResponse]);

    } catch (error: any) {
      console.error('❌ Error in YusrAI chat request:', error);
      handleError(error, 'YusrAI Chat message sending');
      
      const errorResponse = {
        id: Date.now() + 1,
        text: JSON.stringify({
          summary: "I encountered a technical issue, but I'm YusrAI and ready to help you create your automation. Please rephrase your request and I'll provide a complete solution."
        }),
        isBot: true,
        timestamp: new Date(),
        structuredData: null,
        error_help_available: true,
        yusraiPowered: true,
        sevenSectionsValidated: false
      };
      
      // Parse the error response as structured data
      const errorParseResult = parseYusrAIStructuredResponse(errorResponse.text);
      errorResponse.structuredData = errorParseResult.structuredData;
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
