
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Database, 
  Settings, 
  Bot,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code,
  Play,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { AutomationAgentManager } from '@/utils/automationAgentManager';
import { agentStateManager } from '@/utils/agentStateManager';
import YusrAIStructuredDisplay from './YusrAIStructuredDisplay';
import FixedPlatformButtons from './FixedPlatformButtons';
import AIAgentForm from './AIAgentForm';
import { toast } from 'sonner';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: string;
  message_content: string;
  structuredData?: any;
  response_type?: 'text' | 'structured' | 'diagram';
  yusrai_powered?: boolean;
  seven_sections_validated?: boolean;
}

interface ChatCardProps {
  message: Message;
  automationId?: string;
  onCredentialChange?: () => void;
}

const ChatCard: React.FC<ChatCardProps> = ({ message, automationId, onCredentialChange }) => {
  const { user } = useAuth();
  const [platformCredentialStatus, setPlatformCredentialStatus] = useState<{ [key: string]: 'saved' | 'tested' | 'missing' }>({});
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [selectedAgentData, setSelectedAgentData] = useState<any>(null);

  // Extract platforms from structured data
  const platforms = message.structuredData?.platforms || [];
  const agents = message.structuredData?.agents || [];

  useEffect(() => {
    if (automationId && platforms.length > 0) {
      checkPlatformCredentialStatus();
    }
  }, [automationId, platforms]);

  const checkPlatformCredentialStatus = async () => {
    if (!automationId || !user?.id) return;
    
    try {
      const platformNames = platforms.map((p: any) => p.name || p.platform_name || p.platform);
      const validation = await AutomationCredentialManager.validateAutomationCredentials(
        automationId,
        platformNames,
        user.id
      );
      
      console.log('🔍 Platform credential validation result:', validation);
      setPlatformCredentialStatus(validation.status);
    } catch (error) {
      console.error('❌ Error checking platform credentials:', error);
    }
  };

  const handleAgentAdd = async (agent: any) => {
    const agentName = agent.name || agent.agent_name || `Agent ${Date.now()}`;
    
    console.log('🤖 Adding agent:', agentName);
    
    // Prepare agent data for auto-fill
    const agentData = {
      name: agentName,
      role: agent.role || agent.agent_role || 'Assistant',
      goal: agent.goal || agent.agent_goal || agent.objective || 'Process automation data',
      rules: agent.rule || agent.agent_rules || agent.instruction || 'Follow automation requirements',
      memory: agent.memory || agent.agent_memory || agent.context || 'Store task context and results',
      why_needed: agent.why_needed || agent.purpose || agent.description || 'Enhances automation intelligence'
    };

    console.log('📝 Agent data prepared for auto-fill:', agentData);
    
    // Set the agent data and show the form
    setSelectedAgentData(agentData);
    setShowAgentForm(true);
    
    // Update agent state manager
    agentStateManager.addAgent(agentName, agentData);
    
    // Track in database if automation ID exists
    if (automationId && user?.id) {
      try {
        await AutomationAgentManager.trackAgentRecommendation(
          automationId,
          agentName,
          agentData,
          user.id
        );
      } catch (error) {
        console.error('❌ Error tracking agent recommendation:', error);
      }
    }
  };

  const handleAgentDismiss = async (agentName: string) => {
    console.log('❌ Dismissing agent:', agentName);
    
    // Add to dismissed agents set
    setDismissedAgents(prev => new Set(prev).add(agentName));
    
    // Update agent state manager
    agentStateManager.dismissAgent(agentName);
    
    // Update in database if automation ID exists
    if (automationId && user?.id) {
      try {
        await AutomationAgentManager.updateAgentDecision(
          automationId,
          agentName,
          'dismissed',
          user.id
        );
      } catch (error) {
        console.error('❌ Error updating agent decision:', error);
      }
    }
  };

  const handleAgentSaved = (agentName: string) => {
    console.log('✅ Agent saved:', agentName);
    setShowAgentForm(false);
    setSelectedAgentData(null);
    toast.success(`AI Agent "${agentName}" saved successfully!`);
  };

  const handleCloseAgentForm = () => {
    setShowAgentForm(false);
    setSelectedAgentData(null);
  };

  // Check if automation is ready for execution
  const isReadyForExecution = () => {
    if (!automationId || platforms.length === 0) return false;
    
    const allPlatformsTested = platforms.every((platform: any) => {
      const platformName = platform.name || platform.platform_name || platform.platform;
      return platformCredentialStatus[platformName] === 'tested';
    });
    
    return allPlatformsTested;
  };

  const handleExecuteAutomation = () => {
    if (!automationId) return;
    
    console.log('🚀 Executing automation:', automationId);
    toast.success('Automation execution started!');
    // Add execution logic here
  };

  if (!message.isBot) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-md">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <Card className="w-full max-w-4xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Bot className="w-5 h-5" />
            YusrAI Response
            {message.yusrai_powered && (
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-600">
                YusrAI Powered
              </Badge>
            )}
            {message.seven_sections_validated && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-600">
                7 Sections Validated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Show structured data if available */}
          {message.structuredData ? (
            <YusrAIStructuredDisplay 
              data={message.structuredData}
              onAgentAdd={handleAgentAdd}
              onAgentDismiss={handleAgentDismiss}
              dismissedAgents={dismissedAgents}
              onPlatformCredentialClick={(platformName) => {
                console.log('🔧 Platform credential click:', platformName);
              }}
              platformCredentialStatus={platformCredentialStatus}
              onExecuteAutomation={handleExecuteAutomation}
              isReadyForExecution={isReadyForExecution()}
            />
          ) : (
            /* Fallback to text display */
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {message.text}
              </div>
            </div>
          )}
          
          {/* Platform credentials section */}
          {platforms.length > 0 && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
              <FixedPlatformButtons
                platforms={platforms}
                automationId={automationId}
                onCredentialChange={() => {
                  checkPlatformCredentialStatus();
                  onCredentialChange?.();
                }}
              />
            </div>
          )}
          
          {/* Execution ready indicator */}
          {isReadyForExecution() && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Automation is ready for execution!
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* AI Agent Form Modal */}
      {showAgentForm && selectedAgentData && (
        <AIAgentForm
          automationId={automationId}
          initialAgentData={selectedAgentData}
          onClose={handleCloseAgentForm}
          onAgentSaved={handleAgentSaved}
        />
      )}
    </div>
  );
};

export default ChatCard;
