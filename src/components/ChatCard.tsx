
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bot, Plus, X } from "lucide-react";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: any;
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
  const renderAgentRecommendation = (agent: any) => {
    if (dismissedAgents.has(agent.name)) {
      return null;
    }

    return (
      <div key={agent.name} className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-indigo-800">{agent.name}</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onAgentAdd?.(agent)}
              size="sm"
              className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Agent
            </Button>
            <Button
              onClick={() => onAgentDismiss?.(agent.name)}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-indigo-700"><span className="font-medium">Role:</span> {agent.role}</p>
          <p className="text-indigo-700"><span className="font-medium">Goal:</span> {agent.goal}</p>
          <p className="text-indigo-600"><span className="font-medium">Why needed:</span> {agent.why_needed}</p>
        </div>
      </div>
    );
  };

  const formatMessageText = (text: string) => {
    // Convert markdown-style formatting to HTML-like styling for display
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
      .replace(/\n\n/g, '\n')  // Reduce double line breaks
      .split('\n')
      .map((line, index) => (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {index < text.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  return (
    <div 
      style={{
        boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
      }} 
      className="w-full max-w-5xl h-[70vh] bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-0 relative"
    >
      {/* Subtle glow effect inside */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
      
      <ScrollArea className="h-full relative z-10">
        <div className="space-y-6 pr-4">
          {messages.map(message => (
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
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {formatMessageText(message.text)}
                </div>
                
                {/* Render agent recommendations inline within bot messages */}
                {message.isBot && message.structuredData?.agents && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-semibold text-indigo-800 border-t border-indigo-200 pt-3">
                      🤖 Recommended AI Agents:
                    </div>
                    {message.structuredData.agents.map((agent: any) => renderAgentRecommendation(agent))}
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatCard;
