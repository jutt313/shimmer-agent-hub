
import React, { useRef, useEffect } from 'react';
import { Bot, User, Copy, Share2, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { parseYusrAIStructuredResponse } from '@/utils/jsonParser';
import YusrAIStructuredDisplay from './YusrAIStructuredDisplay';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: any;
  error_help_available?: boolean;
}

interface ChatCardProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage?: (message: string) => void;
}

const ChatCard = ({ messages, isLoading, onSendMessage }: ChatCardProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleHelpClick = (message: Message) => {
    if (onSendMessage) {
      onSendMessage("I need help with this automation response. Can you provide more details or clarify the requirements?");
    }
  };

  const renderMessage = (message: Message) => {
    const isYusrAI = message.isBot;
    
    // For YusrAI responses, try to parse structured data
    let structuredData = message.structuredData;
    if (isYusrAI && !structuredData && message.text) {
      structuredData = parseYusrAIStructuredResponse(message.text);
      console.log('💭 Parsed structured data from message text:', structuredData);
    }

    return (
      <div key={message.id} className={`flex gap-4 ${isYusrAI ? 'justify-start' : 'justify-end'} mb-6`}>
        {isYusrAI && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
        
        <div className={`max-w-4xl ${isYusrAI ? 'mr-12' : 'ml-12'}`}>
          <div className={`rounded-2xl p-4 shadow-lg border ${
            isYusrAI 
              ? 'bg-white/95 backdrop-blur-sm border-blue-200/50' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400'
          }`} style={isYusrAI ? { boxShadow: '0 0 25px rgba(59, 130, 246, 0.15)' } : {}}>
            
            {/* Message Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isYusrAI ? (
                  <>
                    <span className="font-semibold text-blue-700">YusrAI</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Automation Specialist
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-white opacity-90">You</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(message.text)}
                  className={`p-1 rounded ${
                    isYusrAI 
                      ? 'hover:bg-blue-100 text-blue-600' 
                      : 'hover:bg-white/20 text-white/80'
                  }`}
                  title="Copy message"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                {message.error_help_available && (
                  <button
                    onClick={() => handleHelpClick(message)}
                    className="p-1 rounded hover:bg-yellow-100 text-yellow-600"
                    title="Get help with this response"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                )}
                
                <span className={`text-xs ${
                  isYusrAI ? 'text-gray-500' : 'text-white/70'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Message Content */}
            {isYusrAI && structuredData ? (
              <>
                {/* Show YusrAI structured display */}
                <YusrAIStructuredDisplay data={structuredData} />
              </>
            ) : (
              <>
                {/* Regular text message */}
                <div className={`prose max-w-none ${
                  isYusrAI ? 'text-gray-800' : 'text-white'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {!isYusrAI && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-200 overflow-hidden" 
         style={{ height: '600px', boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}>
      
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">YusrAI Automation Assistant</h2>
              <p className="text-blue-100 text-sm">Advanced AI Platform Integration Expert</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-100">Online</span>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: 'calc(600px - 120px)' }}>
        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="flex gap-4 justify-start mb-6">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="max-w-4xl mr-12">
              <div className="rounded-2xl p-4 bg-white/95 backdrop-blur-sm border border-blue-200/50 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-blue-700 text-sm font-medium">YusrAI is analyzing your automation requirements...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatCard;
