import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { User, Code, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseYusrAIStructuredResponse, cleanDisplayText, YusrAIStructuredResponse } from "@/utils/jsonParser";
import { useEffect, useRef, useState } from "react";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { agentStateManager } from '@/utils/agentStateManager';
import ErrorHelpButton from './ErrorHelpButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import YusrAIStructuredDisplay from './YusrAIStructuredDisplay';
import ExecutionBlueprintVisualizer from './ExecutionBlueprintVisualizer';

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

interface ChatCardProps {
  messages: Message[];
  onAgentAdd?: (agent: any) => void;
  dismissedAgents?: Set<string>;
  onAgentDismiss?: (agentName: string) => void;
  automationId?: string;
  isLoading?: boolean;
  onSendMessage?: (message: string) => void;
  onExecuteAutomation?: () => void;
  platformCredentialStatus?: { [key: string]: 'saved' | 'tested' | 'missing' };
  onPlatformCredentialChange?: () => void;
  yusrai_powered?: boolean;
  seven_sections_validated?: boolean;
}

const ChatCard = ({
  messages,
  onAgentAdd,
  dismissedAgents = new Set(),
  onAgentDismiss,
  automationId = "temp-automation-id",
  isLoading = false,
  onSendMessage,
  onExecuteAutomation,
  platformCredentialStatus = {},
  onPlatformCredentialChange,
  yusrai_powered = false,
  seven_sections_validated = false
}: ChatCardProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { handleError } = useErrorRecovery();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const optimizedMessages = messages.slice(-50);

  const safeFormatMessageText = (inputText: string | undefined | null): React.ReactNode[] => {
    try {
      if (!inputText || typeof inputText !== 'string') {
        return [<span key="fallback-input-error">Message content unavailable.</span>];
      }

      const cleanHtmlString = cleanDisplayText(inputText);
      const processedText = cleanHtmlString.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const lines = processedText.split('\n');
      
      return lines.map((line, index) => (
        <span key={`line-${index}`}>
          <span dangerouslySetInnerHTML={{ __html: String(line || '') }} />
          {index < lines.length - 1 && <br />}
        </span>
      ));

    } catch (error: any) {
      handleError(error, 'Text formatting in ChatCard');
      return [<span key="processing-error">Processing your YusrAI automation request...</span>];
    }
  };

  const handleAgentAdd = (agent: any) => {
    console.log(`🤖 User adding YusrAI agent: ${agent.name}`);
    agentStateManager.addAgent(agent.name, agent);
    if (onAgentAdd) {
      onAgentAdd(agent);
    }
  };

  const handleAgentDismiss = (agentName: string) => {
    console.log(`❌ User dismissing YusrAI agent: ${agentName}`);
    agentStateManager.dismissAgent(agentName);
    if (onAgentDismiss) {
      onAgentDismiss(agentName);
    }
  };

  const handleErrorHelp = (errorMessage?: string) => {
    const helpMessage = errorMessage ? 
      `I encountered this error: "${errorMessage}". Can you help me resolve it and continue with my YusrAI automation?` :
      "I need help with an error I encountered. Can you assist me?";
    
    if (onSendMessage) {
      onSendMessage(helpMessage);
    }
  };

  const handlePlatformCredentialClick = (platformName: string) => {
    if (onPlatformCredentialChange) {
      console.log(`🔧 Opening YusrAI credential form for ${platformName}`);
      onPlatformCredentialChange();
    }
  };

  const testPlatformCredentials = async (platformName: string, testPayload: any) => {
    try {
      console.log(`🧪 Testing YusrAI credentials for ${platformName}`);
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platform: platformName,
          testConfig: testPayload
        }
      });

      if (error) throw error;

      toast({
        title: data.success ? "✅ YusrAI Test Successful" : "❌ YusrAI Test Failed",
        description: data.message || `YusrAI credential test for ${platformName} completed`,
        variant: data.success ? "default" : "destructive",
      });

      return data.success;
    } catch (error: any) {
      console.error('YusrAI test error:', error);
      toast({
        title: "YusrAI Test Error",
        description: `Failed to test ${platformName} credentials`,
        variant: "destructive",
      });
      return false;
    }
  };

  const checkReadyForExecution = () => {
    const latestBotMessage = messages.filter(msg => msg.isBot && msg.yusrai_powered).pop();
    if (!latestBotMessage?.structuredData?.platforms) return false;

    const platforms = latestBotMessage.structuredData.platforms;
    const allPlatformsConfigured = platforms.every(platform => 
      platformCredentialStatus[platform.name] === 'saved' || 
      platformCredentialStatus[platform.name] === 'tested'
    );

    const agents = latestBotMessage.structuredData.agents || [];
    const allAgentsHandled = agents.every(agent => 
      dismissedAgents.has(agent.name)
    );

    return allPlatformsConfigured && allAgentsHandled && platforms.length > 0;
  };

  const handleExecuteAutomation = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to execute YusrAI automations",
        variant: "destructive",
      });
      return;
    }

    const latestBotMessage = messages.filter(msg => msg.isBot && msg.yusrai_powered).pop();
    if (!latestBotMessage?.structuredData) {
      toast({
        title: "No YusrAI Automation Found",
        description: "Please create a YusrAI automation first",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Executing YusrAI automation');
      
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          automation_data: latestBotMessage.structuredData,
          trigger_data: {
            executed_at: new Date().toISOString(),
            trigger_type: 'manual',
            triggered_by: user.id
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "🎉 YusrAI Automation Executed!",
        description: `YusrAI automation completed successfully. Run ID: ${data.run_id}`,
      });

    } catch (error: any) {
      console.error('💥 YusrAI execution error:', error);
      toast({
        title: "YusrAI Execution Error",
        description: "An unexpected error occurred during YusrAI automation execution",
        variant: "destructive",
      });
    }
  };

  const getCompleteAutomationJSON = () => {
    const latestBotMessage = messages.filter(msg => msg.isBot && msg.yusrai_powered).pop();
    if (!latestBotMessage?.structuredData) return null;

    return {
      automation_id: automationId,
      created_at: new Date().toISOString(),
      yusrai_response: latestBotMessage.structuredData,
      yusrai_powered: true,
      seven_sections_validated: latestBotMessage.seven_sections_validated || false,
      ready_for_execution: checkReadyForExecution(),
      credential_status: platformCredentialStatus
    };
  };

  return (
    <div 
      className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-0 relative mx-auto flex flex-col overflow-hidden"
      style={{
        boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)',
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none"></div>
      
      {/* View Code and Blueprint buttons */}
      {getCompleteAutomationJSON() && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Dialog open={showBlueprintModal} onOpenChange={setShowBlueprintModal}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/90 backdrop-blur-sm border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 shadow-lg"
              >
                Blueprint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-purple-600">
                  YusrAI Execution Blueprint Visualizer
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] w-full">
                <ExecutionBlueprintVisualizer 
                  blueprint={getCompleteAutomationJSON()?.yusrai_response?.execution_blueprint} 
                />
              </ScrollArea>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/90 backdrop-blur-sm border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-lg"
              >
                <Code className="w-4 h-4 mr-1" />
                View Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-blue-600">
                  Complete YusrAI Automation JSON - 7 Sections Validated
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] w-full">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                  <code>
                    {JSON.stringify(getCompleteAutomationJSON(), null, 2)}
                  </code>
                </pre>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      <ScrollArea className="flex-1 relative z-10 p-6 max-h-[calc(100vh-200px)]" ref={scrollAreaRef}>
        <div className="space-y-6 pb-4">
          {optimizedMessages.map(message => {
            let structuredData = message.structuredData;
            
            // Enhanced parsing for bot messages using new parser
            if (message.isBot && !structuredData) {
              try {
                const parseResult = parseYusrAIStructuredResponse(message.text);
                structuredData = parseResult.structuredData;
                
                // Update message metadata
                if (!message.yusrai_powered && parseResult.metadata.yusrai_powered) {
                  message.yusrai_powered = parseResult.metadata.yusrai_powered;
                }
                if (!message.seven_sections_validated && parseResult.metadata.seven_sections_validated) {
                  message.seven_sections_validated = parseResult.metadata.seven_sections_validated;
                }
                
                console.log('🔄 Enhanced runtime parsing for message:', {
                  hasStructuredData: !!structuredData,
                  yusraiPowered: message.yusrai_powered,
                  sevenSectionsValidated: message.seven_sections_validated
                });
              } catch (error: any) {
                console.log('Could not parse YusrAI structured data from message:', error);
                structuredData = null;
              }
            }

            return (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-4xl px-6 py-4 rounded-2xl ${
                  message.isBot 
                    ? 'bg-white border border-blue-100/50 text-gray-800 shadow-lg backdrop-blur-sm' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  } transition-all duration-300 overflow-hidden`}
                >
                  {message.isBot && (
                    <div className="flex items-center gap-2 mb-3">
                      <img 
                        src="/lovable-uploads/cf9c8f76-d8e9-4790-b043-40ba7239140d.png" 
                        alt="YusrAI" 
                        className="w-5 h-5 object-contain"
                      />
                      <span className="text-sm font-medium text-blue-600">
                        YusrAI {message.yusrai_powered ? '(7-Section Validated)' : '(Processing)'}
                      </span>
                      {message.seven_sections_validated && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  )}
                  
                  {!message.isBot && (
                    <div className="flex items-start gap-2 mb-2">
                      <User className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span className="text-sm">You</span>
                    </div>
                  )}

                  {/* Enhanced rendering for YusrAI structured content */}
                  {message.isBot && structuredData && message.yusrai_powered ? (
                    <div className="leading-relaxed space-y-4">
                      <YusrAIStructuredDisplay
                        data={structuredData}
                        onAgentAdd={handleAgentAdd}
                        onAgentDismiss={handleAgentDismiss}
                        dismissedAgents={dismissedAgents}
                        onPlatformCredentialClick={handlePlatformCredentialClick}
                        platformCredentialStatus={platformCredentialStatus}
                        onTestCredentials={testPlatformCredentials}
                        onExecuteAutomation={onExecuteAutomation || handleExecuteAutomation}
                        isReadyForExecution={checkReadyForExecution()}
                      />
                    </div>
                  ) : (
                    <div className="leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {safeFormatMessageText(message.text)}
                      {message.isBot && message.error_help_available && (
                        <ErrorHelpButton 
                          errorMessage={message.text}
                          onHelpRequest={() => handleErrorHelp(message.text)}
                        />
                      )}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-3 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-4xl px-6 py-4 rounded-2xl bg-white border border-blue-100/50 text-gray-800 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <img 
                    src="/lovable-uploads/cf9c8f76-d8e9-4790-b043-40ba7239140d.png" 
                    alt="YusrAI" 
                    className="w-5 h-5 object-contain animate-pulse"
                  />
                  <span className="font-medium">YusrAI is creating your comprehensive 7-section automation...</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatCard;
