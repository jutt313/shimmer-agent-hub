
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
  Bot, 
  TestTube, 
  Code,
  Sparkles
} from 'lucide-react';
import { YusrAIStructuredResponse } from '@/utils/jsonParser';
import ExecutionBlueprintVisualizer from './ExecutionBlueprintVisualizer';
import ExecutionBlueprintCodeDisplay from './ExecutionBlueprintCodeDisplay';

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
    agents: false,
    test_payloads: false,
    execution_blueprint: false,
    execution_code: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const sections = [
    {
      key: 'summary',
      title: 'Summary',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      component: (
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
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
      component: (
        <div className="space-y-3">
          {data.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <p className="text-gray-700 text-sm">{step}</p>
            </div>
          ))}
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
      component: (
        <div className="space-y-4">
          {data.platforms.map((platform, index) => (
            <Card key={index} className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {platform.name}
                  <Badge variant="outline" className="text-xs">
                    {platform.credentials.length} credential{platform.credentials.length !== 1 ? 's' : ''}
                  </Badge>
                  {onPlatformCredentialClick && (
                    <Button
                      onClick={() => onPlatformCredentialClick(platform.name)}
                      size="sm"
                      variant={platformCredentialStatus[platform.name] === 'tested' ? 'default' : 'outline'}
                      className="ml-auto"
                    >
                      {platformCredentialStatus[platform.name] === 'tested' ? 'Tested' : 'Configure'}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {platform.credentials.map((cred, credIndex) => (
                    <div key={credIndex} className="text-xs text-gray-600">
                      <span className="font-medium">{cred.field}:</span> {cred.why_needed}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
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
      component: (
        <div className="space-y-2">
          {data.clarification_questions.map((question, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">
                ?
              </div>
              <p className="text-gray-700 text-sm">{question}</p>
            </div>
          ))}
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
      component: (
        <div className="space-y-4">
          {data.agents.map((agent, index) => (
            <Card key={index} className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  {agent.name}
                  <Badge variant="outline" className="text-xs">{agent.role}</Badge>
                  {onAgentAdd && onAgentDismiss && (
                    <div className="ml-auto flex gap-2">
                      {!dismissedAgents.has(agent.name) ? (
                        <>
                          <Button
                            onClick={() => onAgentAdd(agent)}
                            size="sm"
                            variant="default"
                          >
                            Add
                          </Button>
                          <Button
                            onClick={() => onAgentDismiss(agent.name)}
                            size="sm"
                            variant="outline"
                          >
                            Dismiss
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary">Dismissed</Badge>
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
    },
    {
      key: 'test_payloads',
      title: 'Test Payloads',
      icon: TestTube,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      component: (
        <div className="space-y-4">
          {Object.entries(data.test_payloads).map(([platform, payload]) => (
            <Card key={platform} className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  {platform}
                  <Badge variant="outline" className="text-xs">
                    {payload.method || 'GET'}
                  </Badge>
                  {onTestCredentials && (
                    <Button
                      onClick={() => onTestCredentials(platform, payload)}
                      size="sm"
                      variant="outline"
                      className="ml-auto"
                    >
                      Test
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-32 w-full">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      key: 'execution_blueprint',
      title: 'Execution Blueprint',
      icon: Code,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      component: <ExecutionBlueprintVisualizer blueprint={data.execution_blueprint} />
    },
    {
      key: 'execution_code',
      title: 'Execution Code',
      icon: Sparkles,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      component: <ExecutionBlueprintCodeDisplay blueprint={data.execution_blueprint} />
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map((section) => {
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
      
      {/* Execution Button */}
      {isReadyForExecution && onExecuteAutomation && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">Ready for Execution!</h3>
              <p className="text-sm text-green-700">All platforms configured and agents handled.</p>
            </div>
            <Button
              onClick={onExecuteAutomation}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
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
