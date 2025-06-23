
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

    // Summary
    if (structuredData.summary) {
      content.push(
        <div key="summary" className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Automation Summary</h3>
          <p className="text-gray-700 break-words">{structuredData.summary}</p>
        </div>
      );
    }

    // Steps
    if (structuredData.steps && structuredData.steps.length > 0) {
      content.push(
        <div key="steps" className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Step-by-Step Workflow</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-700">
            {structuredData.steps.map((step, index) => (
              <li key={index} className="break-words">{step}</li>
            ))}
          </ol>
        </div>
      );
    }

    // Platforms
    if (structuredData.platforms && structuredData.platforms.length > 0) {
      content.push(
        <div key="platforms" className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Required Platform Credentials</h3>
          {structuredData.platforms.map((platform, index) => (
            <div key={index} className="mb-3">
              <h4 className="font-medium text-gray-800 break-words">{platform.name}</h4>
              {platform.credentials && platform.credentials.length > 0 && (
                <ul className="list-disc list-inside ml-4 text-gray-700">
                  {platform.credentials.map((cred, credIndex) => (
                    <li key={credIndex} className="break-words">
                      <strong>{cred.field.replace(/_/g, ' ').toUpperCase()}</strong>: {cred.why_needed}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Clarification Questions
    if (structuredData.clarification_questions && structuredData.clarification_questions.length > 0) {
      content.push(
        <div key="clarification" className="mb-4">
          <h3 className="font-semibold text-yellow-800 mb-2">I need some clarification:</h3>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700">
            {structuredData.clarification_questions.map((question, index) => (
              <li key={index} className="break-words">{question}</li>
            ))}
          </ol>
        </div>
      );
    }

    // AI Agents (only these get cards)
    if (structuredData.agents && structuredData.agents.length > 0) {
      content.push(
        <div key="agents" className="mb-4">
          <h3 className="font-semibold text-blue-800 mb-3">Recommended AI Agents</h3>
          <div className="space-y-3">
            {structuredData.agents.map((agent, index) => {
              if (dismissedAgents.has(agent.name)) return null;
              
              return (
                <div key={index} className="border rounded-lg p-4 bg-blue-50/50 border-blue-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-blue-800 break-words">{agent.name}</h4>
                      <p className="text-sm text-blue-600 break-words">{agent.role}</p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <Button
                        size="sm"
                        onClick={() => onAgentAdd?.(agent)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded-md"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAgentDismiss?.(agent.name)}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1 text-xs rounded-md"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="break-words"><strong>Goal:</strong> {agent.goal}</p>
                    <p className="break-words"><strong>Why needed:</strong> {agent.why_needed}</p>
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
      style={{
        boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
      }} 
      className="w-full max-w-6xl h-[75vh] bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-0 relative"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
      
      <ScrollArea className="h-full relative z-10" ref={scrollAreaRef}>
        <div className="space-y-6 pr-4">
          {messages.map(message => {
            let structuredData = message.structuredData;
            if (message.isBot && !structuredData) {
              structuredData = parseStructuredResponse(message.text);
            }

            return (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-4xl px-6 py-4 rounded-2xl ${
                  message.isBot 
                    ? 'bg-gradient-to-r from-blue-100/80 to-purple-100/80 text-gray-800 border border-blue-200/50' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  } transition-all duration-300 overflow-hidden`} 
                  style={!message.isBot ? {
                    boxShadow: '0 0 20px rgba(92, 142, 246, 0.3)'
                  } : {}}
                >
                  {/* Render structured content for bot messages */}
                  {message.isBot && structuredData ? (
                    <div className="text-sm leading-relaxed break-words">
                      {renderStructuredContent(structuredData)}
                    </div>
                  ) : (
                    /* Show formatted text for user messages or if no structured data */
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {formatMessageText(message.text)}
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
              <div className="max-w-4xl px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-100/80 to-purple-100/80 text-gray-800 border border-blue-200/50">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">YusrAI is thinking...</span>
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
