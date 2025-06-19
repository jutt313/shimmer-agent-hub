
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bot, Plus, X, Info } from "lucide-react";

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
          {agent.rules && (
            <p className="text-indigo-600"><span className="font-medium">Rules:</span> {agent.rules}</p>
          )}
          {agent.memory && (
            <p className="text-indigo-600"><span className="font-medium">Memory:</span> {agent.memory}</p>
          )}
        </div>
      </div>
    );
  };

  const renderClarificationQuestions = (questions: string[]) => {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
        <div className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs">?</span>
          I need some clarification:
        </div>
        <div className="space-y-2">
          {questions.map((question, index) => (
            <p key={index} className="text-orange-700 font-medium text-sm">
              <span className="font-bold">{index + 1}.</span> {question}
            </p>
          ))}
        </div>
      </div>
    );
  };

  const renderPlatformCredentials = (platforms: any[]) => {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
        <div className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-purple-600" />
          Required Platform Credentials:
        </div>
        <div className="space-y-3">
          {platforms.map((platform, index) => (
            <div key={index} className="border border-purple-200 rounded-lg p-3 bg-white/50">
              <h4 className="font-semibold text-purple-800 mb-2">{platform.name}</h4>
              <div className="space-y-1">
                {platform.credentials?.map((cred: any, credIndex: number) => (
                  <div key={credIndex} className="text-sm text-purple-700">
                    <span className="font-medium">{cred.field}:</span> {cred.why_needed}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSummary = (summary: string) => {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
        <div className="text-sm font-semibold text-blue-800 mb-2">Summary</div>
        <p className="text-blue-700 text-sm">{summary}</p>
      </div>
    );
  };

  const renderSteps = (steps: string[]) => {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="text-sm font-semibold text-green-800 mb-3">Step-by-Step Workflow</div>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3 text-sm">
              <span className="min-w-[20px] h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <p className="text-green-700">{step}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatMessageText = (text: string) => {
    // Convert markdown-style formatting to HTML-like styling for display
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '\n')
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
      className="w-full max-w-6xl h-[75vh] bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-0 relative"
    >
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
                {/* Only show formatted text if there's no structured data, or if there is structured data, show a simplified version */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.isBot && message.structuredData ? (
                    // Show simplified text when we have structured data
                    <span>Here's what I found for your automation:</span>
                  ) : (
                    formatMessageText(message.text)
                  )}
                </div>
                
                {/* Render structured data components */}
                {message.isBot && message.structuredData && (
                  <div className="mt-4 space-y-3">
                    {/* Render summary first */}
                    {message.structuredData.summary && (
                      renderSummary(message.structuredData.summary)
                    )}
                    
                    {/* Render steps */}
                    {message.structuredData.steps && Array.isArray(message.structuredData.steps) && message.structuredData.steps.length > 0 && (
                      renderSteps(message.structuredData.steps)
                    )}
                    
                    {/* Render clarification questions */}
                    {message.structuredData.clarification_questions && message.structuredData.clarification_questions.length > 0 && (
                      renderClarificationQuestions(message.structuredData.clarification_questions)
                    )}
                    
                    {/* Render platform credentials */}
                    {message.structuredData.platforms && Array.isArray(message.structuredData.platforms) && message.structuredData.platforms.length > 0 && (
                      renderPlatformCredentials(message.structuredData.platforms)
                    )}
                    
                    {/* Render agent recommendations */}
                    {message.structuredData.agents && Array.isArray(message.structuredData.agents) && message.structuredData.agents.length > 0 && (
                      <div className="border-t border-indigo-200 pt-3">
                        <div className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                          <Bot className="w-5 h-5" />
                          Recommended AI Agents:
                        </div>
                        {message.structuredData.agents.map((agent: any) => renderAgentRecommendation(agent))}
                      </div>
                    )}
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
