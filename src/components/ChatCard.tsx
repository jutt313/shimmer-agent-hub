import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Sparkles, CheckCircle, AlertCircle, Settings, Play, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { parseYusrAIStructuredResponse } from "@/utils/jsonParser";
import { agentStateManager } from "@/utils/agentStateManager";
import YusrAIStructuredDisplay from "./YusrAIStructuredDisplay";
import FixedPlatformButtons from "./FixedPlatformButtons";
import AIAgentForm from "./AIAgentForm";
import AgentRecommendationCard from "./AgentRecommendationCard";

interface ChatCardProps {
  message: {
    id: number;
    content: string;
    role: "user" | "assistant";
    timestamp: string;
    user_id?: string;
    automation_id?: string;
  };
  automationId?: string;
}

const ChatCard = ({ message, automationId }: ChatCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAIAgentForm, setShowAIAgentForm] = useState(false);
  const [selectedAgentData, setSelectedAgentData] = useState<any>(null);
  const [structuredData, setStructuredData] = useState<any>(null);
  const [platformsData, setPlatformsData] = useState<any[]>([]);
  const [agentsData, setAgentsData] = useState<any[]>([]);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (message.role === "assistant") {
      setIsProcessing(true);
      processAssistantMessage(message.content);
    }
  }, [message.content, automationId]);

  const processAssistantMessage = async (rawText: string) => {
    try {
      const parseResult = parseYusrAIStructuredResponse(rawText);

      if (parseResult.structuredData) {
        setStructuredData(parseResult.structuredData);
        setPlatformsData(extractPlatformData(parseResult.structuredData));
        setAgentsData(extractAgentData(parseResult.structuredData));
      } else {
        setStructuredData(null);
        setPlatformsData([]);
        setAgentsData([]);
      }
    } catch (error: any) {
      console.error("Error processing assistant message:", error);
      toast({
        title: "Error",
        description: `Failed to process AI response: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const extractPlatformData = (structuredData: any): any[] => {
    if (!structuredData.platforms?.length) return [];

    return structuredData.platforms.map((platform: any) => ({
      name: platform.name || 'Unknown Platform',
      credentials: platform.credentials || [],
      test_payloads: platform.test_payloads || []
    }));
  };

  const extractAgentData = (structuredData: any): any[] => {
    if (!structuredData.agents?.length) return [];

    return structuredData.agents.map((agent: any) => ({
      name: agent.name || 'Unnamed Agent',
      role: agent.role || 'Assistant',
      rule: agent.rule || 'No specific rules',
      goal: agent.goal || 'General assistance',
      is_recommended: true
    }));
  };

  const handleAddAgent = async (agentData: any) => {
    if (!automationId || !user?.id) {
      toast({
        title: "Error",
        description: "Missing automation ID or user authentication",
        variant: "destructive",
      });
      return;
    }

    console.log('🤖 Adding agent via ChatCard:', agentData.name);
    agentStateManager.addAgent(agentData.name, agentData);
    
    setSelectedAgentData(agentData);
    setShowAIAgentForm(true);
  };

  const handleDismissAgent = (agentName: string) => {
    console.log('❌ Dismissing agent via ChatCard:', agentName);
    agentStateManager.dismissAgent(agentName);
    forceUpdate();
  };

  const handleAgentSaved = (agentName: string) => {
    console.log('✅ Agent saved successfully:', agentName);
    setShowAIAgentForm(false);
    setSelectedAgentData(null);
    
    toast({
      title: "Success",
      description: `AI Agent "${agentName}" has been configured and saved!`,
    });
  };

  return (
    <>
      <Card className={cn(
        "mb-4 transition-all duration-200 hover:shadow-md",
        message.role === "user" 
          ? "ml-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
          : "mr-8 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              message.role === "user"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                : "bg-gradient-to-r from-gray-500 to-slate-600 text-white"
            )}>
              {message.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {message.role === "user" ? "You" : "YusrAI Assistant"}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                </span>
              </div>

              {/* Message Content */}
              <div className="prose prose-sm max-w-none">
                {message.role === "assistant" && structuredData ? (
                  <YusrAIStructuredDisplay 
                    data={structuredData} 
                    automationId={automationId}
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>

              {/* Platform Buttons */}
              {message.role === "assistant" && platformsData.length > 0 && (
                <div className="pt-4 border-t border-gray-200/50">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    Configure Platform Credentials
                  </h4>
                  <FixedPlatformButtons 
                    platforms={platformsData}
                    automationId={automationId}
                  />
                </div>
              )}

              {/* Agent Recommendations */}
              {message.role === "assistant" && agentsData.length > 0 && (
                <div className="pt-4 border-t border-gray-200/50">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-600" />
                    Recommended AI Agents
                  </h4>
                  <div className="grid gap-3">
                    {agentsData.map((agent: any, index: number) => (
                      <AgentRecommendationCard
                        key={agent.name || index}
                        agent={agent}
                        onAdd={handleAddAgent}
                        onDismiss={handleDismissAgent}
                        status={agentStateManager.getAgentStatus(agent.name)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing automation response...
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Agent Form Modal */}
      {showAIAgentForm && selectedAgentData && (
        <AIAgentForm
          automationId={automationId}
          onClose={() => {
            setShowAIAgentForm(false);
            setSelectedAgentData(null);
          }}
          onAgentSaved={handleAgentSaved}
          initialAgentData={selectedAgentData}
        />
      )}
    </>
  );
};

export default ChatCard;
