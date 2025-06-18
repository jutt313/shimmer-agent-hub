
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
      <div key={agent.name} className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span className="font-medium text-indigo-800 text-sm">{agent.name}</span>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() => onAgentAdd?.(agent)}
              size="sm"
              className="h-6 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
            <Button
              onClick={() => onAgentDismiss?.(agent.name)}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs border-red-300 text-red-600 hover:bg-red-50"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-indigo-600 mb-1">{agent.role}</p>
        <p className="text-xs text-gray-600">{agent.why_needed}</p>
      </div>
    );
  };

  return (
    <div 
      style={{
        boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
      }} 
      className="w-full max-w-5xl h-[70vh] bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-0 relative px-[12px] py-[9px]"
    >
      {/* Subtle glow effect inside */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
      
      <ScrollArea className="h-full relative z-10">
        <div className="space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.isBot 
                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                } transition-all duration-300`} 
                style={!message.isBot ? {
                  boxShadow: '0 0 20px rgba(92, 142, 246, 0.3)'
                } : {}}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                
                {/* Render agent recommendations inline within bot messages */}
                {message.isBot && message.structuredData?.agents && (
                  <div className="mt-2 space-y-2">
                    {message.structuredData.agents.map((agent: any) => renderAgentRecommendation(agent))}
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
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
