
import { memo, useMemo } from 'react';
import { parseStructuredResponse, cleanDisplayText, StructuredResponse } from "@/utils/jsonParser";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: StructuredResponse;
}

interface OptimizedMessageProps {
  message: Message;
  onAgentAdd?: (agent: any) => void;
  dismissedAgents?: Set<string>;
  onAgentDismiss?: (agentName: string) => void;
}

const OptimizedMessage = memo(({ message, onAgentAdd, dismissedAgents, onAgentDismiss }: OptimizedMessageProps) => {
  const processedData = useMemo(() => {
    if (!message.isBot) return { cleanText: message.text, structuredData: null };
    
    let structuredData = message.structuredData;
    if (!structuredData) {
      try {
        structuredData = parseStructuredResponse(message.text);
      } catch (error) {
        console.warn('Error parsing structured response:', error);
        structuredData = null;
      }
    }

    const cleanText = cleanDisplayText(message.text);
    return { cleanText, structuredData };
  }, [message.text, message.isBot, message.structuredData]);

  return (
    <div className="message-container">
      {processedData.structuredData ? (
        <div className="structured-content">
          {/* Render structured content */}
          {processedData.structuredData.summary && (
            <p className="text-gray-800 leading-relaxed mb-4">{processedData.structuredData.summary}</p>
          )}
          
          {processedData.structuredData.steps && processedData.structuredData.steps.length > 0 && (
            <div className="mb-4">
              <p className="font-medium text-gray-800 mb-2">Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                {processedData.structuredData.steps.map((step, index) => (
                  <li key={index} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {processedData.structuredData.agents && processedData.structuredData.agents.length > 0 && (
            <div className="mb-4">
              <p className="font-medium text-gray-800 mb-3">Recommended AI Agents:</p>
              <div className="space-y-3">
                {processedData.structuredData.agents.map((agent, index) => {
                  if (dismissedAgents?.has(agent.name)) return null;
                  
                  return (
                    <div key={index} className="border border-blue-200/50 rounded-lg p-4 bg-blue-50/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">{agent.name}</h4>
                          <p className="text-sm text-gray-600">{agent.role}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAgentAdd?.(agent)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Add Agent
                          </button>
                          <button
                            onClick={() => onAgentDismiss?.(agent.name)}
                            className="border border-gray-300 text-gray-600 px-3 py-1 rounded text-xs hover:bg-gray-100"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><strong>Goal:</strong> {agent.goal}</p>
                        <p><strong>Why needed:</strong> {agent.why_needed}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="plain-text whitespace-pre-wrap break-words">
          {processedData.cleanText}
        </div>
      )}
    </div>
  );
});

OptimizedMessage.displayName = 'OptimizedMessage';

export default OptimizedMessage;
