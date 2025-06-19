
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

  const parseStructuredDataFromText = (text: string) => {
    console.log('🔍 Attempting to parse structured data from:', text.substring(0, 200));
    
    try {
      // Method 1: Look for JSON in code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          console.log('✅ Found JSON in code block:', parsed);
          return parsed;
        } catch (e) {
          console.log('❌ JSON in code block is malformed, trying to fix...');
          // Try to fix common JSON issues
          const fixedJson = fixMalformedJson(jsonMatch[1]);
          if (fixedJson) {
            const parsed = JSON.parse(fixedJson);
            console.log('✅ Fixed and parsed JSON from code block:', parsed);
            return parsed;
          }
        }
      }

      // Method 2: Extract and fix JSON patterns
      const jsonObjectMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonObjectMatch) {
        let jsonStr = jsonObjectMatch[0];
        
        // Find the complete JSON object
        let braceCount = 0;
        let endIndex = -1;
        
        for (let i = 0; i < jsonStr.length; i++) {
          if (jsonStr[i] === '{') {
            braceCount++;
          } else if (jsonStr[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        
        if (endIndex > 0) {
          jsonStr = jsonStr.substring(0, endIndex);
          
          try {
            const parsed = JSON.parse(jsonStr);
            console.log('✅ Parsed JSON object:', parsed);
            return parsed;
          } catch (e) {
            console.log('❌ JSON object is malformed, trying to fix...');
            const fixedJson = fixMalformedJson(jsonStr);
            if (fixedJson) {
              try {
                const parsed = JSON.parse(fixedJson);
                console.log('✅ Fixed and parsed JSON object:', parsed);
                return parsed;
              } catch (e2) {
                console.log('❌ Could not fix JSON:', e2);
              }
            }
          }
        }
      }

      // Method 3: Try to extract specific data patterns even without valid JSON
      const extractedData = extractDataFromText(text);
      if (extractedData) {
        console.log('✅ Extracted data from text patterns:', extractedData);
        return extractedData;
      }

      console.log('❌ No structured data found in text');
      return null;
    } catch (error) {
      console.error('❌ Error parsing structured data:', error);
      return null;
    }
  };

  const fixMalformedJson = (jsonStr: string): string | null => {
    try {
      // Fix common JSON issues
      let fixed = jsonStr
        // Fix unquoted property names
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Fix single quotes to double quotes
        .replace(/'/g, '"')
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix newlines in strings
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');

      // Try to parse the fixed JSON
      JSON.parse(fixed);
      return fixed;
    } catch (e) {
      console.log('❌ Could not fix malformed JSON');
      return null;
    }
  };

  const extractDataFromText = (text: string): any => {
    const data: any = {};

    // Extract summary
    const summaryMatch = text.match(/Summary[:\s]*([^#\n]*)/i);
    if (summaryMatch) {
      data.summary = summaryMatch[1].trim();
    }

    // Extract steps
    const stepsSection = text.match(/Steps?[:\s]*\n((?:\d+\..*\n?)*)/i);
    if (stepsSection) {
      const steps = stepsSection[1]
        .split(/\d+\./)
        .filter(step => step.trim())
        .map(step => step.trim());
      if (steps.length > 0) {
        data.steps = steps;
      }
    }

    // Extract platforms
    const platformMatches = text.match(/(?:Gmail|Asana|Slack|OpenAI)/gi);
    if (platformMatches) {
      const uniquePlatforms = [...new Set(platformMatches)];
      data.platforms = uniquePlatforms.map(platform => ({
        name: platform,
        credentials: [
          {
            field: platform === 'Gmail' ? 'email' : platform === 'Asana' ? 'api_token' : platform === 'Slack' ? 'webhook_url' : 'api_key',
            placeholder: `Enter your ${platform} credentials`,
            link: `https://${platform.toLowerCase()}.com`,
            why_needed: `Required to connect to ${platform}`
          }
        ]
      }));
    }

    return Object.keys(data).length > 0 ? data : null;
  };

  const formatMessageText = (text: string) => {
    // Clean up JSON artifacts and format the text properly
    let cleanText = text;
    
    // Remove JSON code blocks if they exist
    cleanText = cleanText.replace(/```json\n[\s\S]*?\n```/g, '');
    
    // Remove standalone JSON objects
    cleanText = cleanText.replace(/\{[\s\S]*?\}/g, '');
    
    // Clean up extra whitespace
    cleanText = cleanText.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleanText = cleanText.trim();
    
    // If text is empty after cleaning, provide a default message
    if (!cleanText) {
      cleanText = "Here's what I found for your automation:";
    }
    
    // Convert markdown-style formatting to HTML-like styling for display
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
              structuredData = parseStructuredDataFromText(message.text);
              console.log('🔄 Parsed structured data for message:', message.id, structuredData);
            }

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
                  {/* Show formatted text */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {formatMessageText(message.text)}
                  </div>
                  
                  {/* Render structured data components */}
                  {message.isBot && structuredData && (
                    <div className="mt-4 space-y-3">
                      {/* Render summary first */}
                      {structuredData.summary && (
                        renderSummary(structuredData.summary)
                      )}
                      
                      {/* Render steps */}
                      {structuredData.steps && Array.isArray(structuredData.steps) && structuredData.steps.length > 0 && (
                        renderSteps(structuredData.steps)
                      )}
                      
                      {/* Render clarification questions */}
                      {structuredData.clarification_questions && Array.isArray(structuredData.clarification_questions) && structuredData.clarification_questions.length > 0 && (
                        renderClarificationQuestions(structuredData.clarification_questions)
                      )}
                      
                      {/* Render platform credentials */}
                      {structuredData.platforms && Array.isArray(structuredData.platforms) && structuredData.platforms.length > 0 && (
                        renderPlatformCredentials(structuredData.platforms)
                      )}
                      
                      {/* Render agent recommendations */}
                      {structuredData.agents && Array.isArray(structuredData.agents) && structuredData.agents.length > 0 && (
                        <div className="border-t border-indigo-200 pt-3">
                          <div className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            Recommended AI Agents:
                          </div>
                          {structuredData.agents.map((agent: any) => renderAgentRecommendation(agent))}
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
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatCard;
