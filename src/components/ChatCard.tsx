import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bot, Plus, X } from "lucide-react";
import { parseStructuredResponse, cleanDisplayText, StructuredResponse } from "@/utils/jsonParser";
import { useEffect, useRef } from "react";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: StructuredResponse;
}

interface ChatCardProps {
  messages: Message[];
  onAgentAdd?: (agent: any) => void;
  dismissedAgents?: Set<string>;
  onAgentDismiss?: (agentName: string) => void;
  automationId?: string;
  isLoading?: boolean;
}

const ChatCard = ({
  messages,
  onAgentAdd,
  dismissedAgents = new Set(),
  onAgentDismiss,
  automationId = "temp-automation-id",
  isLoading = false
}: ChatCardProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { handleError } = useErrorRecovery();

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Optimize messages for performance with safe array handling
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

  // Ultra-safe text formatting with bulletproof error recovery
  const safeFormatMessageText = (inputText: string | undefined | null): React.ReactNode[] => {
    try {
      if (!inputText || typeof inputText !== 'string') {
        return [<span key="fallback-input-error">Message content unavailable.</span>];
      }

      const cleanHtmlString = cleanDisplayText(inputText);
      
      if (typeof cleanHtmlString !== 'string') {
        return [<span key="processing-error">Error displaying message content.</span>];
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
      return [<span key="processing-error">Error displaying message content.</span>];
    }
  };

  // BULLETPROOF credential validation function
  const validateCredential = (cred: any): boolean => {
    try {
      return (
        cred && 
        typeof cred === 'object' && 
        cred.field && 
        typeof cred.field === 'string' &&
        cred.field.trim().length > 0 &&
        cred.placeholder &&
        typeof cred.placeholder === 'string' &&
        cred.link &&
        typeof cred.link === 'string' &&
        cred.why_needed &&
        typeof cred.why_needed === 'string'
      );
    } catch (error) {
      console.error('Error validating credential:', error);
      return false;
    }
  };

  // BULLETPROOF platform validation function
  const validatePlatform = (platform: any): boolean => {
    try {
      return (
        platform && 
        typeof platform === 'object' && 
        platform.name && 
        typeof platform.name === 'string' &&
        platform.name.trim().length > 0
      );
    } catch (error) {
      console.error('Error validating platform:', error);
      return false;
    }
  };

  // ULTRA-SAFE credential field processing
  const safeProcessCredentialField = (field: any): string => {
    try {
      if (!field || typeof field !== 'string') {
        console.warn('Invalid credential field, using fallback:', field);
        return 'CREDENTIAL';
      }
      
      const trimmedField = field.trim();
      if (trimmedField.length === 0) {
        return 'CREDENTIAL';
      }
      
      return trimmedField.replace(/_/g, ' ').toUpperCase();
    } catch (error) {
      console.error('Error processing credential field:', error);
      return 'CREDENTIAL';
    }
  };

  // ULTRA-SAFE why_needed processing
  const safeProcessWhyNeeded = (whyNeeded: any): string => {
    try {
      if (!whyNeeded || typeof whyNeeded !== 'string') {
        return 'Required for platform integration';
      }
      
      const trimmed = whyNeeded.trim();
      return trimmed.length > 0 ? trimmed : 'Required for platform integration';
    } catch (error) {
      console.error('Error processing why_needed:', error);
      return 'Required for platform integration';
    }
  };

  const renderStructuredContent = (structuredData: StructuredResponse) => {
    const content = [];

    try {
      // Summary - Safe rendering
      if (structuredData.summary && typeof structuredData.summary === 'string') {
        content.push(
          <div key="summary" className="mb-4">
            <p className="text-gray-800 leading-relaxed">{structuredData.summary}</p>
          </div>
        );
      }

      // Steps - Safe array rendering
      if (Array.isArray(structuredData.steps) && structuredData.steps.length > 0) {
        content.push(
          <div key="steps" className="mb-4">
            <p className="font-medium text-gray-800 mb-2">Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
              {structuredData.steps.map((step, index) => {
                if (typeof step === 'string') {
                  return <li key={index} className="leading-relaxed">{step}</li>;
                }
                return null;
              }).filter(Boolean)}
            </ol>
          </div>
        );
      }

      // Enhanced Platforms rendering with comprehensive credential display
      if (Array.isArray(structuredData.platforms) && structuredData.platforms.length > 0) {
        try {
          const validPlatforms = structuredData.platforms.filter(validatePlatform);
          
          if (validPlatforms.length > 0) {
            content.push(
              <div key="platforms" className="mb-4">
                <p className="font-medium text-gray-800 mb-2">Required Platform Credentials:</p>
                <div className="text-gray-700 ml-4 space-y-3">
                  {validPlatforms.map((platform, index) => {
                    try {
                      const platformName = platform.name || 'Unknown Platform';
                      
                      return (
                        <div key={`platform-${index}`} className="bg-blue-50/30 p-3 rounded-lg border border-blue-200/50">
                          <p className="font-medium text-gray-800 mb-2">{platformName}</p>
                          {Array.isArray(platform.credentials) && platform.credentials.length > 0 && (
                            <div className="space-y-2">
                              {platform.credentials.map((cred, credIndex) => {
                                try {
                                  if (!validateCredential(cred)) {
                                    console.warn('Invalid credential skipped:', cred);
                                    return (
                                      <div key={`cred-fallback-${credIndex}`} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                        Credential configuration incomplete - please regenerate automation
                                      </div>
                                    );
                                  }

                                  const fieldName = safeProcessCredentialField(cred.field);
                                  const whyNeeded = safeProcessWhyNeeded(cred.why_needed);

                                  return (
                                    <div key={`cred-${credIndex}`} className="bg-white p-3 rounded border border-gray-200">
                                      <div className="flex items-start justify-between mb-2">
                                        <strong className="text-purple-700 font-semibold">{fieldName}</strong>
                                        <a 
                                          href={cred.link} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                                        >
                                          Get Credential
                                        </a>
                                      </div>
                                      <p className="text-sm text-gray-600">{whyNeeded}</p>
                                      <p className="text-xs text-gray-500 mt-1">Format: {cred.placeholder}</p>
                                    </div>
                                  );
                                } catch (credError) {
                                  console.error('Error rendering credential:', credError);
                                  handleError(credError, `Credential rendering for ${platform.name}`);
                                  return (
                                    <div key={`cred-error-${credIndex}`} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                      Error displaying credential - please regenerate automation
                                    </div>
                                  );
                                }
                              }).filter(Boolean)}
                            </div>
                          )}
                        </div>
                      );
                    } catch (platformError) {
                      console.error('Error rendering platform:', platformError);
                      handleError(platformError, `Platform rendering: ${platform?.name || 'unknown'}`);
                      return (
                        <div key={`platform-error-${index}`} className="text-red-600 text-sm bg-red-50 p-2 rounded">
                          Error displaying platform information - please regenerate automation
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            );
          }
        } catch (platformsError) {
          console.error('Error rendering platforms section:', platformsError);
          handleError(platformsError, 'Platforms section rendering');
          content.push(
            <div key="platforms-error" className="mb-4 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600 text-sm">Error displaying platform credentials. Please regenerate the automation.</p>
            </div>
          );
        }
      }

      // Clarification Questions - Safe rendering
      if (Array.isArray(structuredData.clarification_questions) && structuredData.clarification_questions.length > 0) {
        content.push(
          <div key="clarification" className="mb-4">
            <p className="font-medium text-gray-800 mb-2">I need some clarification:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
              {structuredData.clarification_questions.map((question, index) => {
                if (typeof question === 'string') {
                  return <li key={index} className="leading-relaxed">{question}</li>;
                }
                return null;
              }).filter(Boolean)}
            </ol>
          </div>
        );
      }

      // Enhanced AI Agents with comprehensive rules and memory display
      if (Array.isArray(structuredData.agents) && structuredData.agents.length > 0) {
        content.push(
          <div key="agents" className="mb-4">
            <p className="font-medium text-gray-800 mb-3">Recommended AI Agents:</p>
            <div className="space-y-4">
              {structuredData.agents.map((agent, index) => {
                if (!agent || typeof agent !== 'object' || typeof agent.name !== 'string') {
                  return null;
                }

                if (dismissedAgents.has(agent.name)) {
                  return null;
                }
                
                return (
                  <div key={index} className="border border-blue-200/50 rounded-xl p-5 bg-gradient-to-br from-blue-50/40 to-purple-50/40 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-lg">{agent.name}</h4>
                        <p className="text-sm text-blue-600 font-medium">{agent.role || 'AI Agent'}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => onAgentAdd?.(agent)}
                          className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 py-2 text-xs border-0 rounded-lg shadow-md"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Agent
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAgentDismiss?.(agent.name)}
                          className="border-gray-300 text-gray-600 hover:bg-gray-100 px-3 py-2 text-xs rounded-lg"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="bg-white/60 p-3 rounded-lg border border-gray-200/50">
                        <p><strong className="text-gray-800">Goal:</strong> <span className="text-gray-700">{agent.goal || 'Not specified'}</span></p>
                      </div>
                      
                      {agent.rules && (
                        <div className="bg-white/60 p-3 rounded-lg border border-gray-200/50">
                          <p><strong className="text-gray-800">Operating Rules:</strong> <span className="text-gray-700">{agent.rules}</span></p>
                        </div>
                      )}
                      
                      {agent.memory && (
                        <div className="bg-white/60 p-3 rounded-lg border border-gray-200/50">
                          <p><strong className="text-gray-800">Memory Context:</strong> <span className="text-gray-700">{agent.memory}</span></p>
                        </div>
                      )}
                      
                      <div className="bg-white/60 p-3 rounded-lg border border-gray-200/50">
                        <p><strong className="text-gray-800">Why needed:</strong> <span className="text-gray-700">{agent.why_needed || 'Not specified'}</span></p>
                      </div>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        );
      }

      return content;
    } catch (error: any) {
      console.error('Critical error in renderStructuredContent:', error);
      handleError(error, 'Structured content rendering');
      return [<div key="error" className="text-red-600 p-4 bg-red-50 rounded-lg">Error rendering content. Please refresh and regenerate the automation.</div>];
    }
  };

  return (
    <div 
      className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-0 relative mx-auto flex flex-col"
      style={{
        boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)'
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none"></div>
      
      <ScrollArea className="flex-1 relative z-10" ref={scrollAreaRef}>
        <div className="space-y-6 pr-4">
          {optimizedMessages.map(message => {
            let structuredData = message.structuredData;
            if (message.isBot && !structuredData) {
              try {
                structuredData = parseStructuredResponse(message.text);
              } catch (error: any) {
                handleError(error, `Parsing message ${message.id}`);
                structuredData = null;
              }
            }

            return (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-5xl px-6 py-4 rounded-2xl ${
                  message.isBot 
                    ? 'bg-white border border-blue-100/50 text-gray-800 shadow-lg backdrop-blur-sm' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  } transition-all duration-300 overflow-hidden`} 
                  style={message.isBot ? {
                    boxShadow: '0 0 25px rgba(59, 130, 246, 0.1)'
                  } : {
                    boxShadow: '0 0 25px rgba(92, 142, 246, 0.25)'
                  }}
                >
                  {/* Render structured content for bot messages */}
                  {message.isBot && structuredData ? (
                    <div className="leading-relaxed">
                      {renderStructuredContent(structuredData)}
                    </div>
                  ) : (
                    /* Show formatted text for user messages or if no structured data */
                    <div className="leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {safeFormatMessageText(message.text)} 
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
              <div className="max-w-5xl px-6 py-4 rounded-2xl bg-white border border-blue-100/50 text-gray-800 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 animate-pulse text-blue-500" />
                  <span className="font-medium">YusrAI is creating your automation...</span>
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
