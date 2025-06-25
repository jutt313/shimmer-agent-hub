
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
        <div key="summary" className="mb-6">
          <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Automation Summary
          </h3>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-gray-700 leading-relaxed">{structuredData.summary}</p>
          </div>
        </div>
      );
    }

    // Steps
    if (structuredData.steps && structuredData.steps.length > 0) {
      content.push(
        <div key="steps" className="mb-6">
          <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Step-by-Step Workflow
          </h3>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {structuredData.steps.map((step, index) => (
                <li key={index} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
        </div>
      );
    }

    // Platforms
    if (structuredData.platforms && structuredData.platforms.length > 0) {
      content.push(
        <div key="platforms" className="mb-6">
          <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
            Required Platform Credentials
          </h3>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg space-y-4">
            {structuredData.platforms.map((platform, index) => (
              <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-2">{platform.name}</h4>
                {platform.credentials && platform.credentials.length > 0 && (
                  <ul className="list-disc list-inside ml-4 text-gray-700 space-y-1">
                    {platform.credentials.map((cred, credIndex) => (
                      <li key={credIndex}>
                        <strong className="text-orange-700">{cred.field.replace(/_/g, ' ').toUpperCase()}</strong>: {cred.why_needed}
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

    // Clarification Questions
    if (structuredData.clarification_questions && structuredData.clarification_questions.length > 0) {
      content.push(
        <div key="clarification" className="mb-6">
          <h3 className="font-bold text-lg text-yellow-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
            I need some clarification:
          </h3>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <ol className="list-decimal list-inside space-y-2 text-yellow-700">
              {structuredData.clarification_questions.map((question, index) => (
                <li key={index} className="leading-relaxed">{question}</li>
              ))}
            </ol>
          </div>
        </div>
      );
    }

    // AI Agents
    if (structuredData.agents && structuredData.agents.length > 0) {
      content.push(
        <div key="agents" className="mb-6">
          <h3 className="font-bold text-lg text-blue-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Recommended AI Agents
          </h3>
          <div className="space-y-4">
            {structuredData.agents.map((agent, index) => {
              if (dismissedAgents.has(agent.name)) return null;
              
              return (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-blue-800 text-lg mb-1">{agent.name}</h4>
                      <p className="text-sm text-blue-600 font-medium">{agent.role}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => onAgentAdd?.(agent)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 text-sm rounded-lg shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Agent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAgentDismiss?.(agent.name)}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 text-sm rounded-lg"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="bg-white p-3 rounded-lg">
                      <p><strong className="text-blue-700">Goal:</strong> {agent.goal}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p><strong className="text-blue-700">Why needed:</strong> {agent.why_needed}</p>
                    </div>
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
      className="w-full max-w-7xl h-[80vh] bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-0 relative mx-auto"
      style={{
        boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)'
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none"></div>
      
      <ScrollArea className="h-full relative z-10" ref={scrollAreaRef}>
        <div className="space-y-8 pr-4">
          {messages.map(message => {
            let structuredData = message.structuredData;
            if (message.isBot && !structuredData) {
              structuredData = parseStructuredResponse(message.text);
            }

            return (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-5xl px-6 py-5 rounded-2xl ${
                  message.isBot 
                    ? 'bg-gradient-to-br from-blue-50/90 to-purple-50/90 text-gray-800 border border-blue-200/60 shadow-sm' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  } transition-all duration-300 overflow-hidden`} 
                  style={!message.isBot ? {
                    boxShadow: '0 0 25px rgba(92, 142, 246, 0.25)'
                  } : {}}
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
                  
                  <p className={`text-xs mt-4 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
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
              <div className="max-w-5xl px-6 py-5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-purple-50/90 text-gray-800 border border-blue-200/60 shadow-sm">
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
