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
import DebugCodeModal from './DebugCodeModal';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: YusrAIStructuredResponse;
  error_help_available?: boolean;
  yusraiPowered?: boolean;
  sevenSectionsValidated?: boolean;
  platformData?: Array<{
    name: string;
    credentials: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  }>;
  automationDiagramData?: any;
  executionBlueprint?: any;
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
  automationDiagramData?: any;
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
  automationDiagramData
}: ChatCardProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { handleError } = useErrorRecovery();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [enhancedMessages, setEnhancedMessages] = useState<Message[]>([]);
  const [debugModalData, setDebugModalData] = useState<any>(null);
  const [showDebugModal, setShowDebugModal] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // CRITICAL FIX: Enhanced platform name cleaning function
  const cleanPlatformName = (rawName: string | undefined | null): string => {
    if (!rawName || typeof rawName !== 'string') return 'Unknown Platform';
    
    // Remove all markdown formatting and clean the string
    return rawName
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
      .replace(/`(.*?)`/g, '$1')        // Remove `code`
      .replace(/__(.*?)__/g, '$1')      // Remove __underline__
      .replace(/_(.*?)_/g, '$1')        // Remove _emphasis_
      .replace(/[*_`#]/g, '')           // Remove remaining markdown symbols
      .replace(/^\d+\.\s*/, '')         // Remove numbered list prefixes
      .replace(/^[-•]\s*/, '')          // Remove bullet points
      .trim() || 'Unknown Platform';
  };

  // CRITICAL FIX: Enhanced step text extraction with better markdown cleaning
  const extractStepText = (step: any): string => {
    if (typeof step === 'string') {
      return cleanPlatformName(step.replace(/^\d+\.\s*/, ''));
    }
    
    if (typeof step === 'object' && step !== null) {
      const stepText = step.description || 
                     step.action || 
                     step.step || 
                     step.instruction || 
                     step.text ||
                     step.summary ||
                     step.task ||
                     step.name;
      
      if (stepText && typeof stepText === 'string') {
        return cleanPlatformName(stepText.replace(/^\d+\.\s*/, ''));
      }
      
      if (step.platform && step.method) {
        return `${step.method} request to ${cleanPlatformName(step.platform)}`;
      }
      
      return 'Processing automation step...';
    }
    
    return 'Step information unavailable';
  };

  useEffect(() => {
    const processMessages = () => {
      try {
        const processed = messages.map((message) => {
          if (message.isBot && !message.structuredData) {
            try {
              console.log('🔍 Processing bot message for structured data:', message.text.substring(0, 150));
              
              const parseResult = parseYusrAIStructuredResponse(message.text);
              if (parseResult.structuredData && !parseResult.isPlainText) {
                console.log('✅ Structured data found from YusrAI:', parseResult.structuredData);
                
                // CRITICAL FIX: Enhanced platform data extraction with complete ChatAI data preservation
                const platformsSource = parseResult.structuredData.platforms || 
                                       parseResult.structuredData.platforms_and_credentials || 
                                       parseResult.structuredData.required_platforms ||
                                       [];
                
                const platformData = platformsSource.map((platform: any, index: number) => {
                  console.log(`🔍 Processing platform ${index + 1}:`, platform);
                  
                  // CRITICAL FIX: Better platform name extraction and cleaning
                  const rawPlatformName = platform.name || 
                                         platform.platform || 
                                         platform.platform_name ||
                                         platform.service ||
                                         `Platform ${index + 1}`;
                  
                  const cleanedPlatformName = cleanPlatformName(rawPlatformName);
                  console.log(`🔧 Platform name cleaned: "${rawPlatformName}" → "${cleanedPlatformName}"`);
                  
                  // CRITICAL FIX: Extract credentials with multiple format support - REMOVE HARDCODED FALLBACKS
                  let credentials = [];
                  if (platform.credentials) {
                    if (Array.isArray(platform.credentials)) {
                      credentials = platform.credentials;
                    } else if (typeof platform.credentials === 'object') {
                      credentials = Object.entries(platform.credentials).map(([key, value]: [string, any]) => ({
                        field: key,
                        placeholder: value.example || value.placeholder || `Enter ${key}`,
                        link: value.link || value.url || value.where_to_get,
                        why_needed: value.description || value.why_needed
                      }));
                    }
                  } else if (platform.required_credentials) {
                    credentials = Array.isArray(platform.required_credentials) ? platform.required_credentials : [];
                  } else if (platform.authentication) {
                    // Handle authentication object format
                    credentials = [{
                      field: platform.authentication.field || 'api_key',
                      placeholder: platform.authentication.placeholder || 'Enter API key',
                      link: platform.authentication.link,
                      why_needed: platform.authentication.description
                    }];
                  }
                  
                  // CRITICAL FIX: Preserve complete ChatAI test configuration
                  const testConfig = platform.testConfig || 
                                   platform.test_config || 
                                   platform.testing || 
                                   platform.test_setup ||
                                   null;
                  
                  const testPayloads = platform.test_payloads || 
                                     platform.test_payload || 
                                     platform.test_data ||
                                     platform.testing_payload ||
                                     [];
                  
                  const finalPlatform = {
                    name: cleanedPlatformName,
                    credentials: credentials.map((cred: any) => ({
                      field: cred.field || cred.name || 'api_key',
                      placeholder: cred.example || cred.placeholder || `Enter ${cred.field || 'credential'}`,
                      link: cred.link || cred.where_to_get || cred.url, // FIXED: Remove hardcoded '#' fallback
                      why_needed: cred.why_needed || cred.description // FIXED: Remove hardcoded 'Authentication required' fallback
                    })),
                    // CRITICAL: Preserve ChatAI test configuration
                    testConfig: testConfig,
                    test_payloads: Array.isArray(testPayloads) ? testPayloads : (testPayloads ? [testPayloads] : []),
                    // Preserve additional ChatAI metadata
                    chatai_data: {
                      original_platform: platform,
                      base_url: platform.base_url || platform.api_base || platform.endpoint,
                      api_version: platform.api_version || platform.version,
                      authentication_type: platform.authentication_type || platform.auth_type
                    }
                  };
                  
                  console.log('🔗 Final processed platform with ChatAI data:', finalPlatform);
                  return finalPlatform;
                });
                
                console.log('🔗 Extracted platform data with ChatAI preservation:', platformData);
                
                const diagramData = automationDiagramData ||
                                  parseResult.structuredData.execution_blueprint || 
                                  parseResult.structuredData.blueprint ||
                                  parseResult.structuredData.automation_diagram;
                
                console.log('📊 Extracted diagram data:', diagramData);
                
                return {
                  ...message,
                  structuredData: parseResult.structuredData,
                  platformData: platformData,
                  yusraiPowered: parseResult.metadata.yusraiPowered,
                  sevenSectionsValidated: parseResult.metadata.sevenSectionsValidated,
                  automationDiagramData: diagramData,
                  executionBlueprint: parseResult.structuredData.execution_blueprint
                };
              } else {
                console.log('📄 No structured data found, keeping as plain text');
              }
            } catch (error) {
              console.log('❌ Error processing message:', error);
            }
          }
          return message;
        });
        
        setEnhancedMessages(processed);
        console.log('✅ Enhanced messages processed with ChatAI data preservation:', processed.length);
      } catch (error) {
        console.log('❌ Message processing error:', error);
        setEnhancedMessages(messages);
      }
    };

    processMessages();
  }, [messages, automationDiagramData]);

  const optimizedMessages = enhancedMessages.slice(-50);

  const safeFormatMessageText = (inputText: string | undefined | null, structuredData?: YusrAIStructuredResponse): React.ReactNode[] => {
    try {
      if (!inputText || typeof inputText !== 'string') {
        return [<span key="fallback-input-error">Message content unavailable.</span>];
      }

      if (structuredData) {
        const sections = [];
        
        if (structuredData.summary && typeof structuredData.summary === 'string') {
          sections.push(
            <div key="summary" className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">Summary:</div>
              <div className="text-gray-700 leading-relaxed">{cleanPlatformName(structuredData.summary)}</div>
            </div>
          );
        }
        
        // Handle both step_by_step_explanation and steps with FIXED markdown cleaning
        const stepsData = structuredData.step_by_step_explanation || structuredData.steps;
        if (stepsData && Array.isArray(stepsData) && stepsData.length > 0) {
          sections.push(
            <div key="steps" className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">Steps:</div>
              <div className="text-gray-700 leading-relaxed">
                {stepsData.map((step, index) => (
                  <div key={index} className="mb-1">
                    Step {index + 1}: {extractStepText(step)}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        // CRITICAL FIX: Enhanced platforms display with proper credential information and cleaned names
        const platformsData = structuredData.platforms_and_credentials || 
                             structuredData.platforms ||
                             structuredData.required_platforms;
        if (platformsData && Array.isArray(platformsData) && platformsData.length > 0) {
          sections.push(
            <div key="platforms" className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">Platforms:</div>
              <div className="text-gray-700 leading-relaxed">
                {platformsData.map((platform, index) => {
                  // CRITICAL FIX: Use the same cleaning function for consistency
                  const platformName = cleanPlatformName(
                    platform?.name || platform?.platform || platform?.platform_name || `Platform ${index + 1}`
                  );
                  
                  return (
                    <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-800 mb-2">{platformName}</div>
                      {platform?.credentials && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-600">Required credentials:</div>
                          {/* Handle both array and object credential formats */}
                          {Array.isArray(platform.credentials) ? (
                            platform.credentials.map((cred, credIndex) => (
                              <div key={credIndex} className="text-sm bg-white p-2 rounded border-l-4 border-blue-200">
                                <div className="font-medium text-gray-800">{cred.field || cred.name || 'API Key'}</div>
                                <div className="text-gray-600 text-xs mt-1">{cred.why_needed || cred.description || 'Required for authentication'}</div>
                                {(cred.link || cred.where_to_get || cred.url) && cred.link !== '#' && (
                                  <div className="text-blue-600 text-xs mt-1">
                                    <a href={cred.link || cred.where_to_get || cred.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                      Get it from: {cred.where_to_get || 'Documentation'}
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : typeof platform.credentials === 'object' ? (
                            Object.entries(platform.credentials).map(([key, value]: [string, any], credIndex) => (
                              <div key={credIndex} className="text-sm bg-white p-2 rounded border-l-4 border-blue-200">
                                <div className="font-medium text-gray-800">{key}</div>
                                <div className="text-gray-600 text-xs mt-1">{value?.description || value?.why_needed || `Required for ${key}`}</div>
                                {(value?.link || value?.where_to_get || value?.url) && value.link !== '#' && (
                                  <div className="text-blue-600 text-xs mt-1">
                                    <a href={value.link || value.where_to_get || value.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                      Get it from: {value.where_to_get || 'Documentation'}
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">Credential information not available</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        
        if (structuredData.clarification_questions && Array.isArray(structuredData.clarification_questions) && structuredData.clarification_questions.length > 0) {
          sections.push(
            <div key="questions" className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">Clarification Questions:</div>
              <div className="text-gray-700 leading-relaxed">
                {structuredData.clarification_questions.map((question, index) => (
                  <div key={index} className="mb-1">{index + 1}. {String(question || '')}</div>
                ))}
              </div>
            </div>
          );
        }
        
        // FIXED: Handle all agent field variants including automation_agents with DEBUG LOGGING
        const agentsData = structuredData.ai_agents || structuredData.agents || structuredData.automation_agents;
        console.log('🤖 AGENT DEBUG - Checking agent data:', {
          ai_agents: structuredData.ai_agents,
          agents: structuredData.agents,
          automation_agents: structuredData.automation_agents,
          agentsData: agentsData,
          isArray: Array.isArray(agentsData),
          length: agentsData?.length
        });
        
        if (agentsData && Array.isArray(agentsData) && agentsData.length > 0) {
          console.log('✅ AGENT DEBUG - Displaying agents section with data:', agentsData);
          sections.push(
            <div key="agents" className="mb-4">
              <div className="font-semibold text-gray-800 mb-2">AI Agents:</div>
              <div className="text-gray-700 leading-relaxed">
                {agentsData.map((agent, index) => (
                  <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-800">{cleanPlatformName(String(agent?.name || agent?.agent_name || `Agent ${index + 1}`))}</div>
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
                          onClick={() => handleAgentDismiss(agent?.name || agent?.agent_name || `Agent ${index + 1}`)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300 text-xs px-3 py-1"
                          variant="outline"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Role:</strong> {cleanPlatformName(agent?.role || 'Assistant')}</div>
                      <div><strong>Goal:</strong> {cleanPlatformName(agent?.goal || 'General assistance')}</div>
                      {agent?.rule && <div><strong>Rule:</strong> {cleanPlatformName(agent.rule)}</div>}
                      {agent?.why_needed && <div><strong>Why needed:</strong> {cleanPlatformName(agent.why_needed)}</div>}
                      {agent?.memory && <div><strong>Memory:</strong> {cleanPlatformName(agent.memory)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        } else {
          console.log('❌ AGENT DEBUG - No agents to display. Data:', {
            structuredData: !!structuredData,
            agentsData: agentsData,
            isArray: Array.isArray(agentsData),
            hasLength: agentsData?.length > 0
          });
        }
        
        return sections.length > 0 ? sections : [<span key="no-sections">AI response processed successfully.</span>];
      }

      const lines = inputText.split('\n');
      return lines.map((line, index) => (
        <span key={`line-${index}`}>
          {cleanPlatformName(line)}
          {index < lines.length - 1 && <br />}
        </span>
      ));

    } catch (error: any) {
      handleError(error, 'Text formatting in ChatCard');
      return [<span key="processing-error">Processing your YusrAI automation request...</span>];
    }
  };

  const handleAgentAdd = (agent: any) => {
    console.log(`🤖 User adding YusrAI agent with complete data:`, agent);
    
    const completeAgentData = {
      name: agent.name || 'Unnamed Agent',
      role: agent.role || 'Assistant',
      rule: agent.rule || agent.rules || '',
      goal: agent.goal || 'General assistance',
      memory: agent.memory || '',
      why_needed: agent.why_needed || ''
    };
    
    agentStateManager.addAgent(agent.name, completeAgentData);
    
    if (onAgentAdd) {
      onAgentAdd(completeAgentData);
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
    
    const platforms = Array.isArray(structuredData.platforms) ? structuredData.platforms : 
                     Array.isArray(structuredData.platforms_and_credentials) ? structuredData.platforms_and_credentials : [];
    const agents = Array.isArray(structuredData.agents) ? structuredData.agents : 
                  Array.isArray(structuredData.ai_agents) ? structuredData.ai_agents : [];
    
    const allPlatformsConfigured = platforms.length === 0 || platforms.every(platform => 
      platformCredentialStatus[platform.name || platform.platform] === 'saved' || 
      platformCredentialStatus[platform.name || platform.platform] === 'tested'
    );

    const allAgentsHandled = agents.length === 0 || agents.every(agent => 
      dismissedAgents.has(agent.name || agent.agent_name)
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
      yusraiPowered: latestBotMessage.yusraiPowered || true,
      sevenSectionsValidated: latestBotMessage.sevenSectionsValidated || true,
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
          yusraiPowered: messageData.yusraiPowered || false,
          sevenSectionsValidated: messageData.sevenSectionsValidated || false,
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
    if (latestBotMessage?.platformData) {
      console.log('🔍 Found platforms from enhanced processing with ChatAI data:', latestBotMessage.platformData);
      return latestBotMessage.platformData;
    }
    
    const latestStructuredMessage = optimizedMessages.filter(msg => msg.isBot && msg.structuredData).pop();
    if (latestStructuredMessage?.structuredData) {
      const platformsSource = latestStructuredMessage.structuredData.platforms || 
                             latestStructuredMessage.structuredData.platforms_and_credentials ||
                             latestStructuredMessage.structuredData.required_platforms || [];
      
      const transformedPlatforms = platformsSource.map((platform: any, index: number) => {
        // Use the same cleaning function for consistency
        const platformName = cleanPlatformName(
          platform.name || platform.platform || platform.platform_name || `Platform ${index + 1}`
        );
        
        let credentials = [];
        if (platform.credentials) {
          if (Array.isArray(platform.credentials)) {
            credentials = platform.credentials;
          } else if (typeof platform.credentials === 'object') {
            credentials = Object.entries(platform.credentials).map(([key, value]: [string, any]) => ({
              field: key,
              placeholder: value.example || value.placeholder || `Enter ${key}`,
              link: value.link || value.url || value.where_to_get,
              why_needed: value.description || value.why_needed
            }));
          }
        }
        
        return {
          name: platformName,
          credentials: credentials.map((cred: any) => ({
            field: cred.field || cred.name || 'api_key',
            placeholder: cred.example || cred.placeholder || `Enter ${cred.field}`,
            link: cred.link || cred.where_to_get || cred.url, // FIXED: Remove hardcoded '#' fallback
            why_needed: cred.why_needed || cred.description // FIXED: Remove hardcoded 'Authentication required' fallback
          })),
          // CRITICAL: Include ChatAI test configuration
          testConfig: platform.testConfig || platform.test_config,
          test_payloads: platform.test_payloads || platform.test_payload || [],
          chatai_data: {
            original_platform: platform,
            base_url: platform.base_url || platform.api_base,
            api_version: platform.api_version
          }
        };
      });
      
      console.log('🔄 Transformed platforms from structured data with ChatAI data:', transformedPlatforms);
      return transformedPlatforms;
    }
    
    console.log('⚠️ No platforms found in messages');
    return [];
  };

  const getLatestDiagramData = () => {
    const latestBotMessage = optimizedMessages.filter(msg => msg.isBot && msg.automationDiagramData).pop();
    return latestBotMessage?.automationDiagramData || automationDiagramData || null;
  };

  const transformPlatformsForButtons = (yusraiPlatforms: any[]) => {
    console.log('🔄 Transforming platforms for buttons with ChatAI data preservation:', yusraiPlatforms);
    
    if (!Array.isArray(yusraiPlatforms)) {
      console.log('⚠️ No platforms array found, returning empty array');
      return [];
    }
    
    const transformedPlatforms = yusraiPlatforms.map((platform, index) => {
      console.log(`🔄 Processing platform ${index + 1} for buttons:`, platform);
      
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
          link: cred.link || cred.where_to_get || cred.documentation_url || cred.url, // FIXED: Remove hardcoded '#' fallback
          why_needed: cred.why_needed || cred.description || cred.purpose // FIXED: Remove hardcoded 'Authentication required' fallback
        })) : [],
        // CRITICAL: Preserve all ChatAI test data
        testConfig: platform.testConfig || platform.test_config,
        test_payloads: platform.test_payloads || platform.test_payload || platform.test_data || [],
        chatai_data: platform.chatai_data || {}
      };
      
      console.log(`✅ Transformed platform with ChatAI data:`, transformedPlatform);
      return transformedPlatform;
    });
    
    console.log('🎯 Final transformed platforms with ChatAI data:', transformedPlatforms);
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
                          YusrAI {message.yusraiPowered ? (message.sevenSectionsValidated ? '(Complete)' : '(Processing)') : '(Basic)'}
                        </span>
                        {message.sevenSectionsValidated && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {message.structuredData && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 text-xs h-6 px-2"
                            onClick={() => {
                              setDebugModalData(message.structuredData);
                              setShowDebugModal(true);
                            }}
                          >
                            <Code className="w-3 h-3 mr-1" />
                            Code
                          </Button>
                        )}
                        {message.automationDiagramData && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="ml-2 text-xs h-6 px-2"
                              >
                                <Code className="w-3 h-3 mr-1" />
                                Diagram
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Automation Diagram</DialogTitle>
                              </DialogHeader>
                              <ExecutionBlueprintVisualizer
                                blueprint={message.automationDiagramData}
                              />
                            </DialogContent>
                          </Dialog>
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
                    <span className="text-sm font-medium text-blue-600">YusrAI is creating your automation...</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {getLatestPlatforms().length > 0 && (
        <div className="mt-4">
          <FixedPlatformButtons
            platforms={transformPlatformsForButtons(getLatestPlatforms())}
            automationId={automationId}
            onCredentialChange={onPlatformCredentialChange}
          />
        </div>
      )}

      <DebugCodeModal
        structuredData={debugModalData}
        isOpen={showDebugModal}
        onOpenChange={setShowDebugModal}
      />
    </div>
  );
};

export default ChatCard;
