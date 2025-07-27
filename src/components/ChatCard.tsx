
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { User, CheckCircle2 } from 'lucide-react';
import { parseYusrAIStructuredResponse, cleanDisplayText, YusrAIStructuredResponse } from "@/utils/jsonParser";
import { useEffect, useRef, useState } from "react";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { agentStateManager } from '@/utils/agentStateManager';
import ErrorHelpButton from './ErrorHelpButton';
import ExecutionBlueprintVisualizer from './ExecutionBlueprintVisualizer';
import { FlagPropagationLogger } from '@/utils/flagPropagationLogger';
import FixedPlatformButtons from './FixedPlatformButtons';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: YusrAIStructuredResponse;
  error_help_available?: boolean;
  yusrai_powered?: boolean;
  seven_sections_validated?: boolean;
  platformData?: Array<{
    name: string;
    credentials: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  }>;
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
  const [enhancedMessages, setEnhancedMessages] = useState<Message[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Enhanced message processing with platform extraction
  useEffect(() => {
    const processMessages = () => {
      try {
        const processed = messages.map((message) => {
          if (message.isBot && !message.structuredData) {
            try {
              console.log('🔍 Processing bot message for structured data:', message.text.substring(0, 200));
              
              // Parse structured data
              const parseResult = parseYusrAIStructuredResponse(message.text);
              if (parseResult.structuredData) {
                console.log('✅ Structured data found:', parseResult.structuredData);
                
                // Extract platform data for buttons with proper type mapping
                const platformData = parseResult.structuredData.platforms?.map(platform => ({
                  name: platform.name,
                  credentials: platform.credentials.map(cred => ({
                    field: cred.field,
                    placeholder: cred.example || cred.where_to_get || `Enter ${cred.field}`,
                    link: cred.link || cred.where_to_get || '#',
                    why_needed: cred.why_needed
                  }))
                })) || [];
                
                return {
                  ...message,
                  structuredData: parseResult.structuredData,
                  platformData: platformData,
                  yusrai_powered: parseResult.metadata.yusrai_powered,
                  seven_sections_validated: parseResult.metadata.seven_sections_validated
                };
              }
            } catch (error) {
              console.log('❌ Error processing message:', error);
            }
          }
          return message;
        });
        
        setEnhancedMessages(processed);
      } catch (error) {
        console.log('❌ Message processing error:', error);
        setEnhancedMessages(messages);
      }
    };

    processMessages();
  }, [messages]);

  const optimizedMessages = enhancedMessages.slice(-50);

  // CRITICAL FIX: Clean text display without cards or raw JSON
  const safeFormatMessageText = (inputText: string | undefined | null, structuredData?: YusrAIStructuredResponse): React.ReactNode[] => {
    try {
      if (!inputText || typeof inputText !== 'string') {
        return [<span key="fallback-input-error">Message content unavailable.</span>];
      }

      // If we have structured data, display it properly formatted
      if (structuredData) {
        const sections = [];
        
        // Summary section
        if (structuredData.summary && typeof structuredData.summary === 'string') {
          sections.push(
            <div key="summary" className="mb-4">
              <div className="font-semibold text-blue-600 mb-2">Summary</div>
              <div className="text-gray-700 leading-relaxed">{structuredData.summary}</div>
            </div>
          );
        }
        
        // Steps section
        if (structuredData.steps && Array.isArray(structuredData.steps) && structuredData.steps.length > 0) {
          sections.push(
            <div key="steps" className="mb-4">
              <div className="font-semibold text-green-600 mb-2">Steps</div>
              <div className="text-gray-700 leading-relaxed space-y-1">
                {structuredData.steps.map((step, index) => (
                  <div key={index}>{index + 1}. {String(step || '')}</div>
                ))}
              </div>
            </div>
          );
        }
        
        // Platforms section
        if (structuredData.platforms && Array.isArray(structuredData.platforms) && structuredData.platforms.length > 0) {
          sections.push(
            <div key="platforms" className="mb-4">
              <div className="font-semibold text-purple-600 mb-2">Platforms</div>
              <div className="text-gray-700 leading-relaxed">
                {structuredData.platforms.map((platform, index) => (
                  <div key={index} className="mb-2">
                    <strong>{String(platform?.name || `Platform ${index + 1}`)}</strong>
                    {platform?.credentials && Array.isArray(platform.credentials) && platform.credentials.length > 0 && (
                      <div className="ml-4 text-sm text-gray-600">
                        Required: {platform.credentials.map(c => String(c?.field || 'credential')).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        // Clarification Questions section
        if (structuredData.clarification_questions && Array.isArray(structuredData.clarification_questions) && structuredData.clarification_questions.length > 0) {
          sections.push(
            <div key="questions" className="mb-4">
              <div className="font-semibold text-orange-600 mb-2">Clarification Questions</div>
              <div className="text-gray-700 leading-relaxed space-y-1">
                {structuredData.clarification_questions.map((question, index) => (
                  <div key={index}>{index + 1}. {String(question || '')}</div>
                ))}
              </div>
            </div>
          );
        }
        
        // AI Agents section with Add/Dismiss buttons
        if (structuredData.agents && Array.isArray(structuredData.agents) && structuredData.agents.length > 0) {
          sections.push(
            <div key="agents" className="mb-4">
              <div className="font-semibold text-red-600 mb-2">AI Agents</div>
              <div className="text-gray-700 leading-relaxed space-y-2">
                {structuredData.agents.map((agent, index) => (
                  <div key={index} className="border-l-2 border-red-200 pl-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>{String(agent?.name || `Agent ${index + 1}`)}</strong>
                        <div className="text-sm text-gray-600">
                          <div><strong>Role:</strong> {agent?.role || 'Assistant'}</div>
                          <div><strong>Rule:</strong> {agent?.rule || 'No specific rules'}</div>
                          <div><strong>Goal:</strong> {agent?.goal || 'General assistance'}</div>
                          <div><strong>Memory:</strong> {agent?.memory || 'Standard memory'}</div>
                          {agent?.why_needed && (
                            <div><strong>Why Needed:</strong> {agent.why_needed}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAgentAdd(agent)}
                          className="bg-green-100 hover:bg-green-200 text-green-700 border-green-300 text-xs px-3 py-1"
                          variant="outline"
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAgentDismiss(agent?.name || `Agent ${index + 1}`)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300 text-xs px-3 py-1"
                          variant="outline"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        return sections.length > 0 ? sections : [<span key="no-sections">AI response processed successfully.</span>];
      }

      // For plain text, display clean formatted text
      const cleanText = cleanDisplayText(inputText);
      const lines = cleanText.split('\n');
      return lines.map((line, index) => (
        <span key={`line-${index}`}>
          {line}
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

  const checkReadyForExecution = () => {
    const latestBotMessage = optimizedMessages.filter(msg => msg.isBot && msg.structuredData).pop();
    if (!latestBotMessage?.structuredData) return false;

    const structuredData = latestBotMessage.structuredData;
    
    const platforms = Array.isArray(structuredData.platforms) ? structuredData.platforms : [];
    const agents = Array.isArray(structuredData.agents) ? structuredData.agents : [];
    
    const allPlatformsConfigured = platforms.length === 0 || platforms.every(platform => 
      platformCredentialStatus[platform.name] === 'saved' || 
      platformCredentialStatus[platform.name] === 'tested'
    );

    const allAgentsHandled = agents.length === 0 || agents.every(agent => 
      dismissedAgents.has(agent.name)
    );

    console.log('🔍 Execution readiness check:', {
      hasStructuredData: !!structuredData,
      platformsCount: platforms.length,
      agentsCount: agents.length,
      allPlatformsConfigured,
      allAgentsHandled,
      isReady: allPlatformsConfigured && allAgentsHandled
    });

    return allPlatformsConfigured && allAgentsHandled;
  };

  const saveAutomationResponse = async (messageData: Message) => {
    if (!user?.id || !messageData.isBot || !messageData.structuredData) return;
    
    try {
        const { error } = await supabase.from('automation_responses').insert({
          user_id: user.id,
          automation_id: automationId,
          chat_message_id: messageData.id,
          response_text: messageData.text,
          structured_data: messageData.structuredData as any,
          yusrai_powered: messageData.yusrai_powered || false,
          seven_sections_validated: messageData.seven_sections_validated || false,
          error_help_available: messageData.error_help_available || false,
          is_ready_for_execution: checkReadyForExecution()
        });
      
      if (error) {
        console.error('❌ Failed to save automation response:', error);
      } else {
        console.log('✅ Automation response saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving automation response:', error);
    }
  };

  const getLatestPlatforms = () => {
    const latestBotMessage = optimizedMessages.filter(msg => msg.isBot && msg.platformData).pop();
    return latestBotMessage?.platformData || [];
  };

  // CRITICAL FIX: Get latest execution blueprint for automatic diagram display
  const getLatestExecutionBlueprint = () => {
    const latestBotMessage = optimizedMessages.filter(msg => msg.isBot && msg.structuredData).pop();
    return latestBotMessage?.structuredData?.execution_blueprint || null;
  };

  return (
    <div className="space-y-6">
      <div 
        className="w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-0 relative mx-auto flex flex-col"
        style={{
          boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)',
          height: '600px'
        }}
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none"></div>
        
        <ScrollArea className="flex-1 relative z-10 p-6 overflow-y-auto" ref={scrollAreaRef}>
          <div className="space-y-6 pb-4 min-h-full">
            {optimizedMessages.map(message => {
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
                          YusrAI {message.yusrai_powered ? (message.seven_sections_validated ? '(Structured)' : '(Simple)') : '(Processing)'}
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

                    <div className="leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {safeFormatMessageText(message.text, message.structuredData)}
                      
                      {message.isBot && message.error_help_available && (
                        <ErrorHelpButton 
                          errorMessage={message.text}
                          onHelpRequest={() => handleErrorHelp(message.text)}
                        />
                      )}
                    </div>
                    
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
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-4xl px-6 py-4 rounded-2xl bg-white border border-blue-100/50 text-gray-800 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="/lovable-uploads/cf9c8f76-d8e9-4790-b043-40ba7239140d.png" 
                      alt="YusrAI" 
                      className="w-5 h-5 object-contain animate-pulse"
                    />
                    <span className="font-medium">YusrAI is processing your request...</span>
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

      {/* Platform credential buttons */}
      <div className="mt-4">
        <FixedPlatformButtons
          platforms={getLatestPlatforms()}
          automationId={automationId}
          onCredentialChange={onPlatformCredentialChange}
        />
      </div>

      {/* CRITICAL FIX: Automatic diagram display */}
      {getLatestExecutionBlueprint() && (
        <div className="mt-6">
          <ExecutionBlueprintVisualizer 
            blueprint={getLatestExecutionBlueprint()}
            isVisible={true}
          />
        </div>
      )}
    </div>
  );
};

export default ChatCard;
