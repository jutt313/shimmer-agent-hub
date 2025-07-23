
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

interface YusrAIStructuredDisplayProps {
  data: YusrAIStructuredResponse;
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
      return stepObj.name || stepObj.action || `Step ${index + 1}`;
    }
    return `Step ${index + 1}`;
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
      show: data.steps && data.steps.length > 0,
      component: (
        <div className="space-y-3">
          <div className="text-gray-700 leading-relaxed space-y-3">
            {data.steps.map((step, index) => (
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
      show: data.platforms && data.platforms.length > 0,
      component: (
        <div className="space-y-4">
          <div className="text-gray-700 leading-relaxed space-y-4">
            {data.platforms.map((platform, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-purple-100">
                <div className="space-y-3">
                  <div className="font-semibold text-purple-700 text-lg">
                    {platform.name}
                  </div>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium text-gray-900">Credentials:</span>{' '}
                      <span className="text-gray-600">
                        {(platform.credentials || []).map(cred => cred.field).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Why we need:</span>{' '}
                      <span className="text-gray-600">
                        {(platform.credentials || [])[0]?.why_needed || 'For platform authentication and API access'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700">
              <strong>Note:</strong> Platform credentials are configured separately below the chat for security.
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
      show: data.clarification_questions && data.clarification_questions.length > 0,
      component: (
        <div className="space-y-3">
          <div className="text-gray-700 leading-relaxed space-y-3">
            {data.clarification_questions.map((question, index) => (
              <div key={index} className="flex gap-3 text-sm">
                <span className="font-medium text-orange-600 text-lg">❓</span>
                <span className="flex-1">{question}</span>
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
      show: data.agents && data.agents.length > 0,
      component: (
        <div className="space-y-4">
          {data.agents.map((agent, index) => (
            <Card key={index} className="border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bot className="w-4 h-4 text-pink-600" />
                  {agent.name}
                  <Badge variant="outline" className="text-xs">{agent.role}</Badge>
                  {onAgentAdd && onAgentDismiss && (
                    <div className="ml-auto flex gap-2">
                      {!dismissedAgents.has(agent.name) ? (
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
                            onClick={() => onAgentDismiss(agent.name)}
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
                  <p className="text-gray-600 mt-1">{agent.rule}</p>
                </div>
                <div className="text-xs">
                  <span className="font-medium text-gray-700">Goal:</span>
                  <p className="text-gray-600 mt-1">{agent.goal}</p>
                </div>
                <div className="text-xs">
                  <span className="font-medium text-gray-700">Why Needed:</span>
                  <p className="text-gray-600 mt-1">{agent.why_needed}</p>
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
