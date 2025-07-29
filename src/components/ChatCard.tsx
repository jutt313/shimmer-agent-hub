
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { User, CheckCircle2 } from 'lucide-react';
import { parseYusrAIStructuredResponse, YusrAIStructuredResponse } from "@/utils/jsonParser";
import { useEffect, useRef } from "react";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { agentStateManager } from '@/utils/agentStateManager';
import ErrorHelpButton from './ErrorHelpButton';
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const processMessage = (message: Message): Message => {
    if (message.isBot && !message.structuredData) {
      try {
        const parseResult = parseYusrAIStructuredResponse(message.text);
        return {
          ...message,
          structuredData: parseResult.structuredData,
          yusrai_powered: parseResult.metadata.yusrai_powered,
          seven_sections_validated: parseResult.metadata.seven_sections_validated,
          error_help_available: parseResult.metadata.error_help_available
        };
      } catch (error) {
        console.error('❌ Error processing message:', error);
      }
    }
    return message;
  };

  const renderMessageContent = (message: Message): React.ReactNode => {
    const processedMessage = processMessage(message);
    
    if (processedMessage.structuredData) {
      const data = processedMessage.structuredData;
      
      return (
        <div className="space-y-4">
          {/* Summary */}
          {data.summary && (
            <div className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">Summary:</div>
              <div className="text-gray-700 leading-relaxed">{data.summary}</div>
            </div>
          )}
          
          {/* Steps */}
          {data.steps && data.steps.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">Steps:</div>
              <div className="text-gray-700 leading-relaxed">
                {data.steps.map((step, index) => (
                  <div key={index} className="mb-1">{index + 1}. {step}</div>
                ))}
              </div>
            </div>
          )}
          
          {/* Platforms */}
          {data.platforms && data.platforms.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">Platforms:</div>
              <div className="text-gray-700 leading-relaxed">
                {data.platforms.map((platform, index) => (
                  <div key={index} className="mb-2">
                    <div className="font-medium">{platform.name}</div>
                    {platform.credentials && platform.credentials.length > 0 && (
                      <div className="ml-4 text-sm text-gray-600">
                        <div className="text-xs font-medium mb-1">Required credentials:</div>
                        {platform.credentials.map((cred, credIndex) => (
                          <div key={credIndex} className="text-xs mb-1">
                            • <strong>{cred.field}:</strong> {cred.why_needed}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Clarification Questions */}
          {data.clarification_questions && data.clarification_questions.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">Clarification Questions:</div>
              <div className="text-gray-700 leading-relaxed">
                {data.clarification_questions.map((question, index) => (
                  <div key={index} className="mb-1">{index + 1}. {question}</div>
                ))}
              </div>
            </div>
          )}
          
          {/* AI Agents */}
          {data.agents && data.agents.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">AI Agents:</div>
              <div className="text-gray-700 leading-relaxed">
                {data.agents.map((agent, index) => (
                  <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-800">{agent.name}</div>
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
                          onClick={() => handleAgentDismiss(agent.name)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300 text-xs px-3 py-1"
                          variant="outline"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Role:</strong> {agent.role}</div>
                      <div><strong>Rule:</strong> {agent.rule}</div>
                      <div><strong>Goal:</strong> {agent.goal}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Fallback to plain text display
    return (
      <div className="leading-relaxed whitespace-pre-wrap break-words">
        {message.text}
      </div>
    );
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

  const getLatestPlatforms = () => {
    const latestBotMessage = messages.filter(msg => msg.isBot).pop();
    if (latestBotMessage) {
      const processedMessage = processMessage(latestBotMessage);
      if (processedMessage.structuredData?.platforms) {
        return processedMessage.structuredData.platforms.map(platform => ({
          name: platform.name,
          credentials: platform.credentials.map(cred => ({
            field: cred.field,
            placeholder: `Enter ${cred.field}`,
            link: '#',
            why_needed: cred.why_needed
          }))
        }));
      }
    }
    return [];
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
            {messages.map(message => (
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

                  {renderMessageContent(message)}
                  
                  {message.isBot && message.error_help_available && (
                    <ErrorHelpButton 
                      errorMessage={message.text}
                      onHelpRequest={() => handleErrorHelp(message.text)}
                    />
                  )}
                  
                  <p className={`text-xs mt-3 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
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
    </div>
  );
};

export default ChatCard;
