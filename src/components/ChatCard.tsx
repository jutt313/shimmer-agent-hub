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
import { FlagPropagationLogger } from '@/utils/flagPropagationLogger';
import FixedPlatformButtons from './FixedPlatformButtons';
import { GHQ } from '@/utils/GHQ';

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
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
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
              console.log('🔍 Extracting platforms from message for credential buttons:', message.text.substring(0, 200));
              
              // Extract platforms from structured JSON response
              const platformNames: any[] = [];
              
              try {
                const parseResult = parseYusrAIStructuredResponse(message.text);
                if (parseResult.structuredData && parseResult.structuredData.platforms && Array.isArray(parseResult.structuredData.platforms)) {
                  // Extract platforms from structured data
                  parseResult.structuredData.platforms.forEach(platform => {
                    if (platform && typeof platform === 'object' && platform.name) {
                      const safePlatform = {
                        name: String(platform.name || 'Unknown Platform'),
                        credentials: Array.isArray(platform.credentials) ? platform.credentials.map(cred => ({
                          field: String(cred?.field || 'api_key'),
                          placeholder: String(cred?.field || 'api_key').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          link: String(cred?.link || cred?.where_to_get || '#'),
                          why_needed: String(cred?.why_needed || `Required for ${platform.name} integration`)
                        })) : []
                      };
                      platformNames.push(safePlatform);
                    }
                  });
                  
                  console.log('✅ Extracted platforms from structured data:', platformNames.map(p => p.name));
                }
              } catch (e) {
                console.log('📝 No structured data found');
              }
            
            // Only set basic platform data if found
            if (platformNames.length > 0) {
              const updatedMessage = {
                ...message,
                platformData: platformNames
              };
              
              console.log('✅ Platforms extracted:', platformNames.map(p => p.name));
              return updatedMessage;
            }
            } catch (error) {
              console.log('❌ Platform extraction error:', error);
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

  const safeFormatMessageText = (inputText: string | undefined | null): React.ReactNode[] => {
    try {
      if (!inputText || typeof inputText !== 'string') {
        return [<span key="fallback-input-error">Message content unavailable.</span>];
      }

      // Try to parse JSON first
      let structuredData = null;
      
      try {
        const parseResult = parseYusrAIStructuredResponse(inputText);
        structuredData = parseResult.structuredData;
      } catch (e) {
        // Not JSON, continue with text processing
      }

      // If we have structured data, display it properly
      if (structuredData) {
        const sections = [];
        
        // Summary section - NO EMOJIS
        if (structuredData.summary && typeof structuredData.summary === 'string') {
          sections.push(
            <div key="summary" className="mb-4">
              <div className="font-semibold text-blue-600 mb-2">Summary</div>
              <div className="text-gray-700 leading-relaxed">{structuredData.summary}</div>
            </div>
          );
        }
        
        // Steps section - NO EMOJIS
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
        
        // Platforms section - NO EMOJIS, REAL NAMES
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
        
        // Clarification Questions section - NO EMOJIS
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
        
        // AI Agents section - NO EMOJIS, WITH ADD/DISMISS BUTTONS
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
                        {agent?.role && <span> ({String(agent.role)})</span>}
                        {agent?.why_needed && (
                          <div className="text-sm text-gray-600">{String(agent.why_needed)}</div>
                        )}
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

      // Fallback: Look for text-based structured sections
      const structuredSections = [];
      const text = inputText.trim();
      
      // Look for summary section
      if (text.includes('## Summary') || text.includes('**Summary**') || text.toLowerCase().includes('summary:')) {
        const summaryMatch = text.match(/(## Summary|Summary:|\*\*Summary\*\*)(.*?)(?=##|\*\*[A-Z]|$)/s);
        if (summaryMatch) {
          structuredSections.push(
            <div key="summary" className="mb-4">
              <div className="font-semibold text-blue-600 mb-2">Summary</div>
              <div className="text-gray-700 leading-relaxed">{summaryMatch[2].trim()}</div>
            </div>
          );
        }
      }
      
      // Look for steps section
      if (text.includes('## Steps') || text.includes('**Steps**') || text.toLowerCase().includes('steps:')) {
        const stepsMatch = text.match(/(## Steps|Steps:|\*\*Steps\*\*)(.*?)(?=##|\*\*[A-Z]|$)/s);
        if (stepsMatch) {
          structuredSections.push(
            <div key="steps" className="mb-4">
              <div className="font-semibold text-green-600 mb-2">Steps</div>
              <div className="text-gray-700 leading-relaxed">{stepsMatch[2].trim()}</div>
            </div>
          );
        }
      }
      
      // If no structured sections found, show raw text with basic formatting
      if (structuredSections.length === 0) {
        const processedText = inputText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const lines = processedText.split('\n');
        
        return lines.map((line, index) => (
          <span key={`line-${index}`}>
            <span dangerouslySetInnerHTML={{ __html: String(line || '') }} />
            {index < lines.length - 1 && <br />}
          </span>
        ));
      }
      
      return structuredSections;

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

  const handleExecuteAutomation = async () => {
    console.log('🚀 GHQ execution will be handled by GHQAutomationExecuteButton');
  };

  const getCompleteAutomationJSON = () => {
    const latestBotMessage = optimizedMessages.filter(msg => msg.isBot && msg.structuredData).pop();
    if (!latestBotMessage?.structuredData) return null;

    return {
      automation_id: automationId,
      created_at: new Date().toISOString(),
      yusrai_response: latestBotMessage.structuredData,
      yusrai_powered: latestBotMessage.yusrai_powered || true,
      seven_sections_validated: latestBotMessage.seven_sections_validated || true,
      ready_for_execution: checkReadyForExecution(),
      credential_status: platformCredentialStatus
    };
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

  const transformPlatformsForButtons = (yusraiPlatforms: any[]) => {
    console.log('🔄 Transforming platforms for buttons:', yusraiPlatforms);
    
    if (!Array.isArray(yusraiPlatforms)) {
      console.log('⚠️ No platforms array found, returning empty array');
      return [];
    }
    
    const transformedPlatforms = yusraiPlatforms.map((platform, index) => {
      console.log(`🔄 Processing platform ${index + 1}:`, platform);
      
      const credentials = platform.credentials || 
                         platform.required_credentials || 
                         platform.credential_requirements ||
                         platform.fields ||
                         [];
      
      const transformedPlatform = {
        name: platform.name || platform.platform_name || platform.platform || `Platform ${index + 1}`,
        credentials: Array.isArray(credentials) ? credentials.map((cred: any) => ({
          field: cred.field || cred.name || cred.key || 'api_key',
          placeholder: cred.example || cred.placeholder || cred.description || `Enter ${cred.field || 'credential'}`,
          link: cred.link || cred.where_to_get || cred.documentation_url || cred.url || '#',
          why_needed: cred.why_needed || cred.description || cred.purpose || 'Authentication required'
        })) : [],
        test_payloads: platform.test_payloads || platform.test_payload || platform.test_data || []
      };
      
      console.log(`✅ Transformed platform:`, transformedPlatform);
      return transformedPlatform;
    });
    
    console.log('🎯 Final transformed platforms:', transformedPlatforms);
    return transformedPlatforms;
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
                      {safeFormatMessageText(message.text)}
                      
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
    </div>
  );
};

export default ChatCard;
