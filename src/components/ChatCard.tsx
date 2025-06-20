
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bot, Plus, X, Info } from "lucide-react";
import { parseStructuredResponse, cleanDisplayText, StructuredResponse } from "@/utils/jsonParser";
import AutomationResponseDisplay from "./AutomationResponseDisplay";

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
}

const ChatCard = ({
  messages,
  onAgentAdd,
  dismissedAgents = new Set(),
  onAgentDismiss
}: ChatCardProps) => {
  const formatMessageText = (text: string) => {
    // Clean the text and convert markdown-style formatting
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

  return (
    <div 
      style={{
        boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
      }} 
      className="w-full max-w-6xl h-[75vh] bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-0 relative"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
      
      <ScrollArea className="h-full relative z-10">
        <div className="space-y-6 pr-4">
          {messages.map(message => {
            // Parse structured data from message text if not already parsed
            let structuredData = message.structuredData;
            if (message.isBot && !structuredData) {
              structuredData = parseStructuredResponse(message.text);
              console.log('🔄 Parsed structured data for message:', message.id, !!structuredData);
            }

            console.log('💬 Rendering message:', {
              id: message.id,
              isBot: message.isBot,
              hasStructuredData: !!structuredData,
              structuredDataKeys: structuredData ? Object.keys(structuredData) : []
            });

            return (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-4xl px-6 py-4 rounded-2xl ${
                  message.isBot 
                    ? 'bg-gradient-to-r from-blue-100/80 to-purple-100/80 text-gray-800 border border-blue-200/50' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  } transition-all duration-300`} 
                  style={!message.isBot ? {
                    boxShadow: '0 0 20px rgba(92, 142, 246, 0.3)'
                  } : {}}
                >
                  {/* Render structured data using AutomationResponseDisplay for bot messages */}
                  {message.isBot && structuredData && (
                    <div className="w-full mb-4">
                      <AutomationResponseDisplay 
                        data={structuredData} 
                        onAgentAdd={onAgentAdd || (() => {})}
                        dismissedAgents={dismissedAgents}
                      />
                    </div>
                  )}
                  
                  {/* Show formatted text if no structured data or if it's a user message or if there's additional text */}
                  {(!message.isBot || !structuredData || cleanDisplayText(message.text).length > 0) && (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
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
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatCard;
