
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bot, Plus, X } from "lucide-react";
import { parseStructuredResponse, cleanDisplayText, StructuredResponse } from "@/utils/jsonParser";
import { useEffect, useRef } from "react";

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

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const safeFormatMessageText = (inputText: string | undefined | null) => {
    // ULTIMATE SAFETY: Multiple layers of protection
    if (!inputText || typeof inputText !== 'string') {
      console.warn('safeFormatMessageText: Invalid input, using fallback');
      return [<span key="fallback">Message could not be displayed</span>];
    }

    try {
      // Clean the text with enhanced safety
      let cleanText = cleanDisplayText(inputText);
      
      // CRITICAL: Triple-check the cleaned text
      if (!cleanText || typeof cleanText !== 'string') {
        console.error('safeFormatMessageText: cleanDisplayText failed, using original');
        cleanText = String(inputText || '');
      }

      // FINAL SAFETY: Ensure we have a valid string before any operations
      if (typeof cleanText !== 'string') {
        console.error('safeFormatMessageText: Final safety check failed');
        return [<span key="error">Error displaying message</span>];
      }

      // Safe string operations with additional checks
      const processedText = cleanText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .split('\n')
        .map((line, index) => {
          // Ensure line is a string
          const safeLine = typeof line === 'string' ? line : String(line || '');
          
          return (
            <span key={`line-${index}`}>
              <span dangerouslySetInnerHTML={{ __html: safeLine }} />
              {index < cleanText.split('\n').length - 1 && <br />}
            </span>
          );
        });

      return processedText;
    } catch (error) {
      console.error('safeFormatMessageText: Critical error:', error);
      return [<span key="critical-error">Error processing message</span>];
    }
  };

  const renderStructuredContent = (structuredData: StructuredResponse) => {
    const content = [];

    // Summary - Clean simple text
    if (structuredData.summary) {
      content.push(
        <div key="summary" className="mb-4">
          <p className="text-gray-800 leading-relaxed">{structuredData.summary}</p>
        </div>
      );
    }

    // Steps - Simple numbered list
    if (structuredData.steps && structuredData.steps.length > 0) {
      content.push(
        <div key="steps" className="mb-4">
          <p className="font-medium text-gray-800 mb-2">Steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
            {structuredData.steps.map((step, index) => (
              <li key={index} className="leading-relaxed">{step}</li>
            ))}
          </ol>
        </div>
      );
    }

    // Platforms - Simple text list
    if (structuredData.platforms && structuredData.platforms.length > 0) {
      content.push(
        <div key="platforms" className="mb-4">
          <p className="font-medium text-gray-800 mb-2">Required Platform Credentials:</p>
          <div className="text-gray-700 ml-4 space-y-2">
            {structuredData.platforms.map((platform, index) => (
              <div key={index}>
                <p className="font-medium text-gray-800">{platform.name}</p>
                {platform.credentials && platform.credentials.length > 0 && (
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {platform.credentials.map((cred, credIndex) => (
                      <li key={credIndex} className="text-sm">
                        <strong>{cred.field.replace(/_/g, ' ').toUpperCase()}</strong>: {cred.why_needed}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Clarification Questions - Simple list
    if (structuredData.clarification_questions && structuredData.clarification_questions.length > 0) {
      content.push(
        <div key="clarification" className="mb-4">
          <p className="font-medium text-gray-800 mb-2">I need some clarification:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
            {structuredData.clarification_questions.map((question, index) => (
              <li key={index} className="leading-relaxed">{question}</li>
            ))}
          </ol>
        </div>
      );
    }

    // AI Agents - Separate cards as requested
    if (structuredData.agents && structuredData.agents.length > 0) {
      content.push(
        <div key="agents" className="mb-4">
          <p className="font-medium text-gray-800 mb-3">Recommended AI Agents:</p>
          <div className="space-y-3">
            {structuredData.agents.map((agent, index) => {
              if (dismissedAgents.has(agent.name)) return null;
              
              return (
                <div key={index} className="border border-blue-200/50 rounded-lg p-4 bg-blue-50/30 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800">{agent.name}</h4>
                      <p className="text-sm text-gray-600">{agent.role}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => onAgentAdd?.(agent)}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-3 py-1 text-xs border-0"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Agent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAgentDismiss?.(agent.name)}
                        className="border-gray-300 text-gray-600 hover:bg-gray-100 px-3 py-1 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong className="text-gray-800">Goal:</strong> {agent.goal}</p>
                    <p><strong className="text-gray-800">Why needed:</strong> {agent.why_needed}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return content;
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
          {messages.map(message => {
            let structuredData = message.structuredData;
            if (message.isBot && !structuredData) {
              structuredData = parseStructuredResponse(message.text);
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
