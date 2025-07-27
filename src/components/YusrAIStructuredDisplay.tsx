import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronDown, 
  ChevronRight, 
  MessageSquare, 
  List, 
  Database, 
  HelpCircle, 
  Bot
} from 'lucide-react';
import { YusrAIStructuredResponse } from '@/utils/jsonParser';

// Extended interfaces to handle all field variations from different AI responses
interface FlexiblePlatform {
  name?: string;
  platform_name?: string;
  platform?: string;
  credentials?: any[];
  required_credentials?: any[];
  credential_requirements?: any[];
}

interface FlexibleAgent {
  name?: string;
  agent_name?: string;
  role?: string;
  agent_role?: string;
  rule?: string;
  agent_rules?: string;
  instruction?: string;
  goal?: string;
  agent_goal?: string;
  objective?: string;
  memory?: string;
  agent_memory?: string;
  context?: string;
  why_needed?: string;
  purpose?: string;
  description?: string;
}

interface FlexibleYusrAIData extends Omit<YusrAIStructuredResponse, 'platforms' | 'agents'> {
  platforms?: FlexiblePlatform[];
  agents?: FlexibleAgent[];
}

interface YusrAIStructuredDisplayProps {
  data: FlexibleYusrAIData;
  className?: string;
  onAgentAdd?: (agent: any) => void;
  onAgentDismiss?: (agentName: string) => void;
  dismissedAgents?: Set<string>;
  onPlatformCredentialClick?: (platformName: string) => void;
  platformCredentialStatus?: { [key: string]: 'saved' | 'tested' | 'missing' };
  onTestCredentials?: (platformName: string, testPayload: any) => Promise<boolean>;
  onExecuteAutomation?: () => void;
  isReadyForExecution?: boolean;
}

const YusrAIStructuredDisplay: React.FC<YusrAIStructuredDisplayProps> = ({ 
  data, 
  className = "",
  onAgentAdd,
  onAgentDismiss,
  dismissedAgents = new Set(),
  onPlatformCredentialClick,
  platformCredentialStatus = {},
  onTestCredentials,
  onExecuteAutomation,
  isReadyForExecution = false
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    steps: true,
    platforms: true,
    clarification_questions: false,
    agents: false
  });

  React.useEffect(() => {
    console.log('🎯 YusrAI sections rendering with data:', {
      hasSummary: !!data?.summary,
      stepsCount: data?.steps?.length || 0,
      platformsCount: data?.platforms?.length || 0,
      agentsCount: data?.agents?.length || 0,
      hasTestPayloads: !!data?.test_payloads,
      hasExecutionBlueprint: !!data?.execution_blueprint,
      totalSections: data ? Object.keys(data).length : 0
    });
    // Log the full structured data for debugging purposes
    console.log('Full structuredData received by YusrAIStructuredDisplay:', data);
  }, [data]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStepDisplayText = (step: unknown, index: number): string => {
    if (typeof step === 'string') {
      return step;
    }
    if (typeof step === 'object' && step !== null) {
      const stepObj = step as any;
      // Prioritize common properties for step description
      if (stepObj.description) return stepObj.description;
      if (stepObj.action) return stepObj.action;
      if (stepObj.name) return stepObj.name;
      // Fallback to JSON stringify for debugging if no specific property is found
      return JSON.stringify(stepObj);
    }
    return `Step ${index + 1}`;
  };

  // Helper function to get clarification question text
  const getQuestionDisplayText = (question: unknown, index: number): string => {
    if (typeof question === 'string') {
      return question;
    }
    if (typeof question === 'object' && question !== null) {
      const questionObj = question as any;
      // Prioritize common properties for question text
      if (questionObj.question) return questionObj.question;
      if (questionObj.text) return questionObj.text;
      if (questionObj.description) return questionObj.description;
      // Fallback to JSON stringify for debugging if no specific property is found
      return JSON.stringify(questionObj);
    }
    return `Question ${index + 1}`;
  };


  const sections = [
    {
      key: 'summary',
      title: 'Summary',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      show: !!data.summary,
      component: (
        <div className="prose prose-sm max-w-none">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {data.summary || "YusrAI is creating your comprehensive automation solution..."}
          </div>
        </div>
      )
    },
    {
      key: 'steps',
      title: 'Step-by-Step Process',
      icon: List,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      show: Array.isArray(data.steps) && data.steps.length > 0,
      component: (
        <div className="space-y-3">
          <div className="text-gray-700 leading-relaxed space-y-3">
            {(Array.isArray(data.steps) ? data.steps : []).map((step, index) => (
              <div key={index} className="flex gap-3 text-sm">
                <span className="font-bold text-green-600 text-lg min-w-[24px]">{index + 1}.</span>
                <span className="flex-1">{getStepDisplayText(step, index)}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      key: 'platforms',
      title: 'Platform Integrations',
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      show: Array.isArray(data.platforms) && data.platforms.length > 0,
      component: (
        <div className="space-y-4">
          <div className="text-gray-700 leading-relaxed space-y-4">
            {(Array.isArray(data.platforms) ? data.platforms : []).map((platform, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-purple-100">
                <div className="space-y-3">
                  <div className="font-semibold text-purple-700 text-lg">
                    {platform.name || platform.platform_name || platform.platform || `Platform ${index + 1}`}
                  </div>
                   <div className="text-sm space-y-2">
                     <div>
                       <span className="font-medium text-gray-900">Required Credentials:</span>
                       <div className="mt-1 space-y-1">
                          {(Array.isArray((platform as any).credentials) ? (platform as any).credentials : 
                            Array.isArray((platform as any).required_credentials) ? (platform as any).required_credentials :
                            Array.isArray((platform as any).credential_requirements) ? (platform as any).credential_requirements : []
                          ).map((cred: any, credIndex: number) => (
                           <div key={credIndex} className="text-xs bg-gray-50 p-2 rounded border">
                             <div className="font-medium text-purple-700">
                               {cred.field || cred.name || cred.key || 'API Key'}
                             </div>
                             <div className="text-gray-600">
                               {cred.why_needed || cred.description || cred.purpose || 'Authentication required'}
                             </div>
                             {(cred.where_to_get || cred.link || cred.documentation_url || cred.url) && (
                               <div className="text-blue-600 text-xs">
                                 Get from: {cred.where_to_get || cred.link || cred.documentation_url || cred.url}
                               </div>
                             )}
                           </div>
                         ))}
                          {(!(platform as any).credentials || (platform as any).credentials.length === 0) && 
                           (!(platform as any).required_credentials || (platform as any).required_credentials.length === 0) && (
                           <div className="text-xs bg-gray-50 p-2 rounded border">
                             <div className="font-medium text-purple-700">API Key</div>
                             <div className="text-gray-600">Authentication required for platform access</div>
                           </div>
                         )}
                       </div>
                     </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700">
              <strong>🔒 Secure Setup:</strong> Platform credentials are configured separately below the chat for security.
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'clarification_questions',
      title: 'Clarification Questions',
      icon: HelpCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      show: Array.isArray(data.clarification_questions) && data.clarification_questions.length > 0,
      component: (
        <div className="space-y-3">
          <div className="text-gray-700 leading-relaxed space-y-3">
            {(Array.isArray(data.clarification_questions) ? data.clarification_questions : []).map((question, index) => (
              <div key={index} className="flex gap-3 text-sm">
                <span className="font-medium text-orange-600 text-lg">❓</span>
                <span className="flex-1">{getQuestionDisplayText(question, index)}</span>
              </div>
            ))}
            
          </div>
        </div>
      )
    },
    {
      key: 'agents',
      title: 'AI Agents',
      icon: Bot,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      show: Array.isArray(data.agents) && data.agents.length > 0,
      component: (
        <div className="space-y-4">
          {(Array.isArray(data.agents) ? data.agents : []).map((agent, index) => (
            <Card key={index} className="border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bot className="w-4 h-4 text-pink-600" />
                   {agent.name || (agent as any).agent_name || `Agent ${index + 1}`}
                   <Badge variant="outline" className="text-xs">
                     {agent.role || (agent as any).agent_role || 'Assistant'}
                   </Badge>
                   {onAgentAdd && onAgentDismiss && (
                     <div className="ml-auto flex gap-2">
                       {!dismissedAgents.has(agent.name || (agent as any).agent_name || `Agent ${index + 1}`) ? (
                        <>
                          <Button
                            onClick={() => onAgentAdd(agent)}
                            size="sm"
                            className="bg-green-100 hover:bg-green-200 text-green-700 border-green-300 text-xs px-3 py-1"
                            variant="outline"
                          >
                            Add
                          </Button>
                           <Button
                             onClick={() => onAgentDismiss(agent.name || (agent as any).agent_name || `Agent ${index + 1}`)}
                             size="sm"
                            className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300 text-xs px-3 py-1"
                            variant="outline"
                          >
                            Dismiss
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Dismissed</Badge>
                      )}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
               <CardContent className="pt-0 space-y-2">
                 <div className="text-xs">
                   <span className="font-medium text-gray-700">Rule:</span>
                   <p className="text-gray-600 mt-1">
                     {agent.rule || (agent as any).agent_rules || (agent as any).instruction || 'Custom agent behavior'}
                   </p>
                 </div>
                 <div className="text-xs">
                   <span className="font-medium text-gray-700">Goal:</span>
                   <p className="text-gray-600 mt-1">
                     {agent.goal || (agent as any).agent_goal || (agent as any).objective || 'Process automation data'}
                   </p>
                 </div>
                 <div className="text-xs">
                   <span className="font-medium text-gray-700">Memory:</span>
                   <p className="text-gray-600 mt-1">
                     {agent.memory || (agent as any).agent_memory || (agent as any).context || 'Stores task context and results'}
                   </p>
                 </div>
                 <div className="text-xs">
                   <span className="font-medium text-gray-700">Why Needed:</span>
                   <p className="text-gray-600 mt-1">
                     {agent.why_needed || (agent as any).purpose || (agent as any).description || 'Enhances automation intelligence'}
                   </p>
                 </div>
               </CardContent>
            </Card>
          ))}
        </div>
      )
    }
  ];

  // Filter sections to only show available ones
  const availableSections = sections.filter(section => section.show);

  return (
    <div className={`space-y-4 ${className}`}>
      {availableSections.map((section) => {
        const IconComponent = section.icon;
        const isOpen = openSections[section.key];
        
        return (
          <Collapsible key={section.key} open={isOpen} onOpenChange={() => toggleSection(section.key)}>
            <Card className={`rounded-2xl border-2 ${section.borderColor} ${section.bgColor}`}>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-4 cursor-pointer hover:bg-white/50 transition-colors rounded-t-2xl">
                  <CardTitle className={`text-lg flex items-center gap-3 ${section.color}`}>
                    <IconComponent className="w-5 h-5" />
                    {section.title}
                    <Badge variant="outline" className="ml-auto">
                      {isOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 pb-6">
                  {section.component}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
      
      {/* Enhanced Execution Button */}
      {isReadyForExecution && onExecuteAutomation && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">🚀 YusrAI Automation Ready!</h3>
              <p className="text-sm text-green-700">All platforms configured and agents handled. Ready to execute your automation.</p>
            </div>
            <Button
              onClick={onExecuteAutomation}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 text-lg"
            >
              Execute Automation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default YusrAIStructuredDisplay;