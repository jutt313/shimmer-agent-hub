import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, X, Play, User, Code } from 'lucide-react';
import { parseStructuredResponse, cleanDisplayText, StructuredResponse } from "@/utils/jsonParser";
import { useEffect, useRef, useState } from "react";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { agentStateManager } from '@/utils/agentStateManager';
import ErrorHelpButton from './ErrorHelpButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: StructuredResponse;
  error_help_available?: boolean;
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
  onPlatformCredentialChange
}: ChatCardProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { handleError } = useErrorRecovery();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Initialize agent state manager
  useEffect(() => {
    agentStateManager.setAutomationId(automationId);
  }, [automationId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Optimize messages for performance
  const optimizeMessages = (msgs: Message[]) => {
    try {
      if (!Array.isArray(msgs)) {
        console.warn('Messages is not an array, using empty array');
        return [];
      }
      return msgs.slice(-50);
    } catch (error) {
      console.error('Error optimizing messages:', error);
      return [];
    }
  };

  const optimizedMessages = optimizeMessages(messages);

  // Enhanced safe text formatting
  const safeFormatMessageText = (inputText: string | undefined | null): React.ReactNode[] => {
    try {
      if (!inputText || typeof inputText !== 'string') {
        return [<span key="fallback-input-error">Message content unavailable.</span>];
      }

      // Clean and format text
      const cleanHtmlString = cleanDisplayText(inputText);
      
      if (typeof cleanHtmlString !== 'string') {
        return [<span key="processing-error">Processing automation details...</span>];
      }

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
      return [<span key="processing-error">Processing your automation request...</span>];
    }
  };

  // Enhanced agent handling
  const handleAgentAdd = (agent: any) => {
    console.log(`🤖 User adding agent: ${agent.name}`);
    agentStateManager.addAgent(agent.name, agent);
    if (onAgentAdd) {
      onAgentAdd(agent);
    }
  };

  const handleAgentDismiss = (agentName: string) => {
    console.log(`❌ User dismissing agent: ${agentName}`);
    agentStateManager.dismissAgent(agentName);
    if (onAgentDismiss) {
      onAgentDismiss(agentName);
    }
  };

  // Handle error help requests
  const handleErrorHelp = (errorMessage?: string) => {
    const helpMessage = errorMessage ? 
      `I encountered this error: "${errorMessage}". Can you help me resolve it and continue with my automation?` :
      "I need help with an error I encountered. Can you assist me?";
    
    if (onSendMessage) {
      onSendMessage(helpMessage);
    }
  };

  // ENHANCED: Handle platform credential button click
  const handlePlatformCredentialClick = (platformName: string, platforms: any[]) => {
    const platform = platforms.find(p => p.name === platformName);
    if (platform && onPlatformCredentialChange) {
      console.log(`🔧 Opening credential form for ${platformName} (Fresh AI system)`);
      // Trigger the platform credential form opening
      onPlatformCredentialChange();
    }
  };

  // Check if all platforms are configured and agents handled
  const checkReadyForExecution = () => {
    const latestBotMessage = messages.filter(msg => msg.isBot).pop();
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

  // Enhanced automation execution
  const handleExecuteAutomation = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to execute automations",
        variant: "destructive",
      });
      return;
    }

    const latestBotMessage = messages.filter(msg => msg.isBot).pop();
    if (!latestBotMessage?.structuredData) {
      toast({
        title: "No Automation Found",
        description: "Please create an automation first",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Executing automation with enhanced capabilities');
      
      const agentDecisions = agentStateManager.getAllDecisions();
      
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          automation_data: latestBotMessage.structuredData,
          agent_decisions: agentDecisions,
          trigger_data: {
            executed_at: new Date().toISOString(),
            trigger_type: 'manual',
            triggered_by: user.id
          }
        }
      });

      if (error) {
        console.error('❌ Automation execution error:', error);
        toast({
          title: "Execution Failed",
          description: error.message || "Failed to execute automation",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Automation executed successfully:', data);
      toast({
        title: "🎉 Automation Executed!",
        description: `Automation completed successfully. Run ID: ${data.run_id}`,
      });

    } catch (error: any) {
      console.error('💥 Critical execution error:', error);
      toast({
        title: "Execution Error",
        description: "An unexpected error occurred during execution",
        variant: "destructive",
      });
    }
  };

  // Get the complete automation JSON for the code viewer
  const getCompleteAutomationJSON = () => {
    const latestBotMessage = messages.filter(msg => msg.isBot).pop();
    if (!latestBotMessage?.structuredData) return null;

    const automationData = {
      automation_id: automationId,
      created_at: new Date().toISOString(),
      platforms: latestBotMessage.structuredData.platforms || [],
      api_configurations: latestBotMessage.structuredData.api_configurations || [],
      automation_blueprint: latestBotMessage.structuredData.automation_blueprint || {},
      agents: latestBotMessage.structuredData.agents || [],
      steps: latestBotMessage.structuredData.steps || [],
      summary: latestBotMessage.structuredData.summary || "",
      conversation_updates: latestBotMessage.structuredData.conversation_updates || {},
      ready_for_execution: checkReadyForExecution(),
      credential_status: platformCredentialStatus
    };

    return automationData;
  };

  const renderStructuredContent = (structuredData: StructuredResponse, showErrorHelp: boolean = false) => {
    const content = [];

    try {
      // Summary - Safe rendering
      if (structuredData.summary && typeof structuredData.summary === 'string') {
        content.push(
          <div key="summary" className="mb-4">
            <p className="text-gray-800 leading-relaxed">{structuredData.summary}</p>
            {showErrorHelp && (
              <ErrorHelpButton 
                errorMessage={structuredData.summary}
                onHelpRequest={() => handleErrorHelp(structuredData.summary)}
              />
            )}
          </div>
        );
      }

      // Steps - Safe array rendering
      if (Array.isArray(structuredData.steps) && structuredData.steps.length > 0) {
        content.push(
          <div key="steps" className="mb-4">
            <p className="font-medium text-gray-800 mb-2">Steps:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              {structuredData.steps.map((step, index) => {
                if (typeof step === 'string') {
                  return <li key={index} className="leading-relaxed">{step}</li>;
                }
                return null;
              }).filter(Boolean)}
            </ul>
          </div>
        );
      }

      // FIXED: Platforms rendering with FRESH AI credential buttons
      if (Array.isArray(structuredData.platforms) && structuredData.platforms.length > 0) {
        const validPlatforms = structuredData.platforms.filter(platform => 
          platform && typeof platform === 'object' && platform.name && typeof platform.name === 'string'
        );
        
        if (validPlatforms.length > 0) {
          content.push(
            <div key="platforms" className="mb-4">
              <p className="font-medium text-gray-800 mb-3">Fresh AI Platform Credentials (Universal Store Disabled):</p>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {validPlatforms.map((platform, index) => {
                  const platformName = platform.name || 'Unknown Platform';
                  const status = platformCredentialStatus[platformName] || 'unsaved';
                  
                  const getButtonColor = () => {
                    switch (status) {
                      case 'tested':
                        return 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300';
                      case 'saved':
                        return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300';
                      case 'missing':
                      default:
                        return 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300 cursor-pointer';
                    }
                  };
                  
                  return (
                    <Button
                      key={`platform-${index}`}
                      size="sm"
                      variant="outline"
                      onClick={() => handlePlatformCredentialClick(platformName, validPlatforms)}
                      className={`text-xs h-8 px-2 rounded-lg ${getButtonColor()} transition-colors`}
                    >
                      {platformName}
                    </Button>
                  );
                })}
              </div>
              
              {/* Fresh AI Platform details with credential information */}
              <div className="text-gray-700 space-y-2">
                {validPlatforms.map((platform, index) => {
                  const platformName = platform.name || 'Unknown Platform';
                  
                  return (
                    <div key={`platform-detail-${index}`} className="bg-blue-50/30 p-3 rounded-lg border border-blue-200/50">
                      <p className="font-medium text-gray-800 mb-2">{platformName} (Fresh AI Generated)</p>
                      {Array.isArray(platform.credentials) && platform.credentials.length > 0 && (
                        <div className="text-sm text-gray-600 space-y-1">
                          {platform.credentials.map((cred, credIndex) => {
                            if (cred && typeof cred === 'object' && cred.field) {
                              const fieldName = String(cred.field).replace(/_/g, ' ').toUpperCase();
                              return (
                                <div key={`cred-${credIndex}`} className="flex items-center justify-between">
                                  <span>• {fieldName}: {cred.why_needed || 'Required for fresh AI integration'}</span>
                                  {cred.link && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(cred.link, '_blank')}
                                      className="ml-2 h-6 px-2 py-1 text-xs"
                                    >
                                      Get
                                    </Button>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }).filter(Boolean)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
      }

      // Clarification Questions
      if (Array.isArray(structuredData.clarification_questions) && structuredData.clarification_questions.length > 0) {
        content.push(
          <div key="clarification" className="mb-4">
            <p className="font-medium text-gray-800 mb-2">I need some clarification:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              {structuredData.clarification_questions.map((question, index) => {
                if (typeof question === 'string') {
                  return <li key={index} className="leading-relaxed">{question}</li>;
                }
                return null;
              }).filter(Boolean)}
            </ul>
          </div>
        );
      }

      // Enhanced AI Agents rendering
      if (Array.isArray(structuredData.agents) && structuredData.agents.length > 0) {
        content.push(
          <div key="agents" className="mb-4">
            <p className="font-medium text-gray-800 mb-3">Recommended AI Agents:</p>
            <div className="space-y-3">
              {structuredData.agents.map((agent, index) => {
                if (!agent || typeof agent !== 'object' || typeof agent.name !== 'string') {
                  return null;
                }

                const agentStatus = agentStateManager.getAgentStatus(agent.name);
                
                if (agentStatus !== 'pending') {
                  return null;
                }
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50/40 to-purple-50/40 border border-blue-200/50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{agent.name}</h4>
                      <p className="text-sm text-gray-600">{agent.role || 'AI Agent'}</p>
                      <p className="text-xs text-gray-500 mt-1">{agent.why_needed || 'Recommended for this automation'}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleAgentAdd(agent)}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-3 py-1 text-xs h-7"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAgentDismiss(agent.name)}
                        className="border-gray-300 text-gray-600 hover:bg-gray-100 px-2 py-1 text-xs h-7"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        );
      }

      // ENHANCED: Show execution button when ready
      if (checkReadyForExecution()) {
        content.push(
          <div key="execution" className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">🎉 Automation Ready!</p>
                <p className="text-sm text-green-600">All platforms configured and agents handled</p>
              </div>
              <Button
                onClick={onExecuteAutomation || handleExecuteAutomation}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Automation
              </Button>
            </div>
          </div>
        );
      }

      return content;
    } catch (error: any) {
      console.error('Critical error in renderStructuredContent:', error);
      handleError(error, 'Structured content rendering');
      return [
        <div key="error" className="text-blue-600 p-4 bg-blue-50 rounded-lg">
          I'm processing your fresh AI automation request. Please wait...
          {showErrorHelp && (
            <ErrorHelpButton 
              errorMessage="Content rendering error"
              onHelpRequest={() => handleErrorHelp("I encountered an error while displaying the fresh AI automation details.")}
            />
          )}
        </div>
      ];
    }
  };

  return (
    <div 
      className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-0 relative mx-auto flex flex-col overflow-hidden"
      style={{
        boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)',
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none"></div>
      
      {/* FIXED: Top-right View Code button (connects to Fresh AI system) */}
      {getCompleteAutomationJSON() && (
        <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-lg"
            >
              <Code className="w-4 h-4 mr-1" />
              View Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-blue-600">
                Complete Fresh AI Automation JSON - Ready for Execution
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
      )}
      
      <ScrollArea className="flex-1 relative z-10 p-6 max-h-[calc(100vh-200px)]" ref={scrollAreaRef}>
        <div className="space-y-6 pb-4">
          {optimizedMessages.map(message => {
            let structuredData = message.structuredData;
            
            // Try to parse structured data from bot messages
            if (message.isBot && !structuredData) {
              try {
                structuredData = parseStructuredResponse(message.text);
              } catch (error: any) {
                console.log('Could not parse structured data from message:', error);
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
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src="/lovable-uploads/cf9c8f76-d8e9-4790-b043-40ba7239140d.png" 
                        alt="YusrAI" 
                        className="w-5 h-5 object-contain"
                      />
                      <span className="text-sm font-medium text-blue-600">YusrAI (Fresh AI)</span>
                    </div>
                  )}
                  
                  {!message.isBot && (
                    <div className="flex items-start gap-2 mb-2">
                      <User className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span className="text-sm">You</span>
                    </div>
                  )}

                  {/* Render structured content for bot messages if available */}
                  {message.isBot && structuredData ? (
                    <div className="leading-relaxed">
                      {renderStructuredContent(structuredData, message.error_help_available)}
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
          
          {/* Fresh AI loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-4xl px-6 py-4 rounded-2xl bg-white border border-blue-100/50 text-gray-800 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <img 
                    src="/lovable-uploads/cf9c8f76-d8e9-4790-b043-40ba7239140d.png" 
                    alt="YusrAI" 
                    className="w-5 h-5 object-contain animate-pulse"
                  />
                  <span className="font-medium">YusrAI is creating your fresh AI automation...</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Invisible div for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatCard;
