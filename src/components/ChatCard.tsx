
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

  // SIMPLIFIED MESSAGE PROCESSING: Extract platforms for credential buttons only
  useEffect(() => {
    const processMessages = () => {
      const processed = messages.map((message) => {
        if (message.isBot && !message.structuredData) {
          try {
            console.log('🔍 Extracting platforms from message for credential buttons:', message.text.substring(0, 200));
            
            // PHASE 2: Enhanced credential field extraction from ChatAI text
            const platformNames = [];
            const text = message.text.toLowerCase();
            
            // Platform detection with better credential extraction
            const platformConfigs = {
              'discord': { 
                name: 'Discord', 
                credentials: [
                  { field: 'bot_token', placeholder: 'Bot Token', link: 'https://discord.com/developers/applications', why_needed: 'Bot authentication' },
                  { field: 'guild_id', placeholder: 'Server ID', link: '#', why_needed: 'Target server identification' }
                ]
              },
              'openai': { 
                name: 'OpenAI', 
                credentials: [
                  { field: 'api_key', placeholder: 'API Key', link: 'https://platform.openai.com/api-keys', why_needed: 'API access authentication' }
                ]
              },
              'typeform': { 
                name: 'Typeform', 
                credentials: [
                  { field: 'api_token', placeholder: 'Personal Access Token', link: 'https://admin.typeform.com/account#/section/tokens', why_needed: 'Access forms and responses' }
                ]
              },
              'slack': { 
                name: 'Slack', 
                credentials: [
                  { field: 'bot_token', placeholder: 'Bot User OAuth Token', link: 'https://api.slack.com/apps', why_needed: 'Bot authentication' },
                  { field: 'channel_id', placeholder: 'Channel ID', link: '#', why_needed: 'Target channel identification' }
                ]
              },
              'gmail': { 
                name: 'Gmail', 
                credentials: [
                  { field: 'client_id', placeholder: 'OAuth Client ID', link: 'https://console.cloud.google.com/', why_needed: 'OAuth authentication' },
                  { field: 'client_secret', placeholder: 'OAuth Client Secret', link: 'https://console.cloud.google.com/', why_needed: 'OAuth authentication' }
                ]
              },
              'google sheets': { 
                name: 'Google Sheets', 
                credentials: [
                  { field: 'service_account_key', placeholder: 'Service Account JSON', link: 'https://console.cloud.google.com/', why_needed: 'API access authentication' }
                ]
              }
            };
            
            // Check for each platform and extract credentials mentioned in the text
            Object.entries(platformConfigs).forEach(([key, config]) => {
              if (text.includes(key)) {
                // Try to extract specific credentials mentioned in the text
                let extractedCredentials = [...config.credentials];
                
                // Look for additional credentials mentioned in the text
                const credentialPatterns = [
                  /(\w+_token|token)/gi,
                  /(\w+_key|key)/gi,
                  /(\w+_id|id)/gi,
                  /(\w+_secret|secret)/gi,
                  /(\w+_code|code)/gi
                ];
                
                credentialPatterns.forEach(pattern => {
                  const matches = message.text.match(pattern);
                  if (matches) {
                    matches.forEach(match => {
                      const field = match.toLowerCase();
                      if (!extractedCredentials.some(cred => cred.field === field)) {
                        extractedCredentials.push({
                          field: field,
                          placeholder: `Enter your ${field}`,
                          link: config.credentials[0]?.link || '#',
                          why_needed: `${field} authentication`
                        });
                      }
                    });
                  }
                });
                
                platformNames.push({
                  name: config.name,
                  credentials: extractedCredentials
                });
              }
            });
            
            // Only set basic platform data if found
            if (platformNames.length > 0) {
              const updatedMessage = {
                ...message,
                platformData: platformNames // Simple platform data for credential buttons
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
    };

    processMessages();
  }, [messages]);

  const optimizedMessages = enhancedMessages.slice(-50);

  const safeFormatMessageText = (inputText: string | undefined | null): React.ReactNode[] => {
    try {
      if (!inputText || typeof inputText !== 'string') {
        return [<span key="fallback-input-error">Message content unavailable.</span>];
      }

      // PHASE 1: Structure the response as Summary → Steps → Platforms → Questions → Agents
      const structuredSections = [];
      
      // Split response into sections for better readability
      const text = inputText.trim();
      
      // Look for summary section
      if (text.includes('## Summary') || text.includes('**Summary**') || text.toLowerCase().includes('summary:')) {
        const summaryMatch = text.match(/(## Summary|Summary:|\*\*Summary\*\*)(.*?)(?=##|\*\*[A-Z]|$)/s);
        if (summaryMatch) {
          structuredSections.push(
            <div key="summary" className="mb-4">
              <div className="font-semibold text-blue-600 mb-2">📋 Summary</div>
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
              <div className="font-semibold text-green-600 mb-2">🔧 Steps</div>
              <div className="text-gray-700 leading-relaxed">{stepsMatch[2].trim()}</div>
            </div>
          );
        }
      }
      
      // Look for platforms section
      if (text.includes('## Platforms') || text.includes('**Platforms**') || text.toLowerCase().includes('platforms:')) {
        const platformsMatch = text.match(/(## Platforms|Platforms:|\*\*Platforms\*\*)(.*?)(?=##|\*\*[A-Z]|$)/s);
        if (platformsMatch) {
          structuredSections.push(
            <div key="platforms" className="mb-4">
              <div className="font-semibold text-purple-600 mb-2">🔗 Platforms</div>
              <div className="text-gray-700 leading-relaxed">{platformsMatch[2].trim()}</div>
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
    
    // CRITICAL FIX: Safe array handling to prevent "every is not a function" errors
    const platforms = Array.isArray(structuredData.platforms) ? structuredData.platforms : [];
    const agents = Array.isArray(structuredData.agents) ? structuredData.agents : [];
    
    // Check if all platforms have credentials saved/tested
    const allPlatformsConfigured = platforms.length === 0 || platforms.every(platform => 
      platformCredentialStatus[platform.name] === 'saved' || 
      platformCredentialStatus[platform.name] === 'tested'
    );

    // Check if all agents are handled (dismissed or added)
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
    // This method is now handled by GHQAutomationExecuteButton
    // which includes proper readiness validation
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

  // CRITICAL FIX: Add data persistence for automation responses
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

  // Get latest platforms from text extraction
  const getLatestPlatforms = () => {
    const latestBotMessage = optimizedMessages.filter(msg => msg.isBot && msg.platformData).pop();
    return latestBotMessage?.platformData || [];
  };

  // ENHANCED: Transform YusrAI platform format to PlatformButtons format with comprehensive data mapping
  const transformPlatformsForButtons = (yusraiPlatforms: any[]) => {
    console.log('🔄 Transforming platforms for buttons:', yusraiPlatforms);
    
    // CRITICAL FIX: Ensure safe array handling
    if (!Array.isArray(yusraiPlatforms)) {
      console.log('⚠️ No platforms array found, returning empty array');
      return [];
    }
    
    const transformedPlatforms = yusraiPlatforms.map((platform, index) => {
      console.log(`🔄 Processing platform ${index + 1}:`, platform);
      
      // ENHANCED: Handle multiple credential field name variations
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

                    {/* RAW TEXT DISPLAY: Show ChatAI responses as raw text only */}
                    <div className="leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {safeFormatMessageText(message.text)}
                      
                      {/* Simple agent buttons inline */}
                      {message.isBot && message.platformData && message.platformData.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-sm font-medium text-gray-600">Quick Actions:</div>
                          <div className="flex flex-wrap gap-2">
                            {message.platformData.map((platform: any, idx: number) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                onClick={() => handlePlatformCredentialClick(platform.name)}
                                className="text-xs"
                              >
                                Setup {platform.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
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

      {/* PHASE 3: Removed duplicate platform credentials section - keeping only inline buttons */}
    </div>
  );
};

export default ChatCard;
