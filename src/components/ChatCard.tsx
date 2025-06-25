
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

  const formatMessageText = (text: string) => {
    const cleanText = cleanDisplayText(text);
    
    return cleanText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n')
      .map((line, index) => (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {index < cleanText.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  const renderStructuredContent = (structuredData: StructuredResponse) => {
    const content = [];

    // Summary - Clean simple text
    if (structuredData.summary) {
      content.push(
        <div key="summary" className="mb-4">
          <p className="text-white leading-relaxed">{structuredData.summary}</p>
        </div>
      );
    }

    // Steps - Simple numbered list
    if (structuredData.steps && structuredData.steps.length > 0) {
      content.push(
        <div key="steps" className="mb-4">
          <p className="font-medium text-white mb-2">Steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-100 ml-4">
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
          <p className="font-medium text-white mb-2">Required Platform Credentials:</p>
          <div className="text-blue-100 ml-4 space-y-2">
            {structuredData.platforms.map((platform, index) => (
              <div key={index}>
                <p className="font-medium text-white">{platform.name}</p>
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
          <p className="font-medium text-white mb-2">I need some clarification:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-100 ml-4">
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
          <p className="font-medium text-white mb-3">Recommended AI Agents:</p>
          <div className="space-y-3">
            {structuredData.agents.map((agent, index) => {
              if (dismissedAgents.has(agent.name)) return null;
              
              return (
                <div key={index} className="border border-blue-300/30 rounded-lg p-4 bg-blue-400/20 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white">{agent.name}</h4>
                      <p className="text-sm text-blue-100">{agent.role}</p>
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
                        className="border-blue-300/50 text-blue-100 hover:bg-blue-400/20 px-3 py-1 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-blue-100">
                    <p><strong className="text-white">Goal:</strong> {agent.goal}</p>
                    <p><strong className="text-white">Why needed:</strong> {agent.why_needed}</p>
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
      className="w-full max-w-7xl h-[70vh] bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-0 relative mx-auto"
      style={{
        boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)'
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none"></div>
      
      <ScrollArea className="h-full relative z-10" ref={scrollAreaRef}>
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
                    ? 'bg-gradient-to-r from-blue-500/90 to-purple-600/90 text-white border-0 shadow-lg backdrop-blur-sm' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  } transition-all duration-300 overflow-hidden`} 
                  style={message.isBot ? {
                    boxShadow: '0 0 25px rgba(59, 130, 246, 0.3)'
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
                      {formatMessageText(message.text)}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-3 ${message.isBot ? 'text-blue-100' : 'text-blue-100'}`}>
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
              <div className="max-w-5xl px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500/90 to-purple-600/90 text-white border-0 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 animate-pulse text-blue-200" />
                  <span className="font-medium">YusrAI is creating your automation...</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
