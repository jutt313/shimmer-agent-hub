import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronDown, 
  ChevronRight, 
  MessageSquare, 
  List, 
  Database, 
  HelpCircle, 
  Bot,
  Code,
  Settings,
  Play,
  TestTube
} from 'lucide-react';
import { YusrAIStructuredResponse } from '@/utils/jsonParser';
import AIAgentTestScriptModal from './AIAgentTestScriptModal';

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
  system_prompt?: string;
  agent_system_prompt?: string;
  llm_provider?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
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
  onUpdateTestCredentials?: () => void;
  onDatabaseSchemaUpdate?: () => void;
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
  isReadyForExecution = false,
  onUpdateTestCredentials,
  onDatabaseSchemaUpdate
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    steps: true,
    platforms: true,
    clarification_questions: false,
    agents: false,
    pending_implementations: false
  });

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedLLMProvider, setSelectedLLMProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');

  const llmProviders = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'] },
    { value: 'claude', label: 'Claude', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
    { value: 'gemini', label: 'Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
    { value: 'grok', label: 'Grok', models: ['grok-beta', 'grok-vision-beta'] },
    { value: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] }
  ];

  React.useEffect(() => {
    console.log('🎯 YusrAI sections rendering with your consistent JSON data:', {
      hasSummary: !!data?.summary,
      stepsCount: data?.steps?.length || 0,
      platformsCount: data?.platforms?.length || 0,
      agentsCount: data?.agents?.length || 0,
      hasTestPayloads: !!data?.test_payloads,
      hasExecutionBlueprint: !!data?.execution_blueprint,
      totalSections: data ? Object.keys(data).length : 0
    });
    console.log('Full structuredData from your chat-ai JSON:', data);
  }, [data]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTestAgent = (agent: any) => {
    setSelectedAgent(agent);
    setTestModalOpen(true);
  };

  const getStepDisplayText = (step: unknown, index: number): string => {
    if (typeof step === 'string') {
      return step;
    }
    if (typeof step === 'object' && step !== null) {
      const stepObj = step as any;
      if (stepObj.description) return stepObj.description;
      if (stepObj.action) return stepObj.action;
      if (stepObj.name) return stepObj.name;
      try {
        return JSON.stringify(stepObj, null, 2);
      } catch (e) {
        console.error('Error stringifying step object:', e);
        return `[Unrenderable Step Object ${index + 1}]`;
      }
    }
    return `Step ${index + 1}`;
  };

  const getQuestionDisplayText = (question: unknown, index: number): string => {
    if (typeof question === 'string') {
      return question;
    }
    if (typeof question === 'object' && question !== null) {
      const questionObj = question as any;
      if (questionObj.question) return questionObj.question;
      if (questionObj.text) return questionObj.text;
      if (questionObj.description) return questionObj.description;
      try {
        return JSON.stringify(questionObj, null, 2);
      } catch (e) {
        console.error('Error stringifying question object:', e);
        return `[Unrenderable Question Object ${index + 1}]`;
      }
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
                <span className="font-bold text-green-600 text-lg min-w-[60px]">Step {index + 1}:</span>
                <span className="flex-1 whitespace-pre-wrap">{getStepDisplayText(step, index)}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      key: 'platforms',
      title: 'Platforms & Credentials',
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      show: Array.isArray(data.platforms) && data.platforms.length > 0,
      component: (
        <div className="space-y-4">
          <div className="text-gray-700 leading-relaxed space-y-2">
            {(Array.isArray(data.platforms) ? data.platforms : []).map((platform, index) => {
              const platformName = platform.name || platform.platform_name || platform.platform || `Platform ${index + 1}`;
              const credentials = platform.credentials || platform.required_credentials || platform.credential_requirements || [];
              
              return (
                <div key={index} className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-purple-600" />
                      <div className="font-bold text-purple-800 text-xl">
                        {platformName}
                      </div>
                    </div>
                    <Button
                      onClick={() => onPlatformCredentialClick?.(platformName)}
                      size="sm"
                      className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300"
                      variant="outline"
                    >
                      Configure Credentials
                    </Button>
                  </div>
                  
                  {Array.isArray(credentials) && credentials.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-purple-700">Required Credentials:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {credentials.map((cred, credIndex) => (
                          <div key={credIndex} className="text-xs bg-purple-50 px-2 py-1 rounded border">
                            {typeof cred === 'string' ? cred : (cred.field || cred.name || `Field ${credIndex + 1}`)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
                <span className="flex-1 whitespace-pre-wrap">{getQuestionDisplayText(question, index)}</span>
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
          {(Array.isArray(data.agents) ? data.agents : []).map((agent, index) => {
            const agentName = agent.name || (agent as any).agent_name || `Agent ${index + 1}`;
            const agentRole = agent.role || (agent as any).agent_role || 'Assistant';
            const systemPrompt = agent.system_prompt || (agent as any).agent_system_prompt;
            
            return (
              <Card key={index} className="border border-gray-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bot className="w-4 h-4 text-pink-600" />
                    {agentName}
                    <Button
                      onClick={() => handleTestAgent(agent)}
                      size="sm"
                      variant="ghost"
                      className="ml-auto p-1 h-8 w-8 hover:bg-pink-100"
                      title="Test Agent Script"
                    >
                      <TestTube className="w-4 h-4 text-pink-600" />
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      {agentRole}
                    </Badge>
                    {agent.llm_provider && (
                      <Badge variant="secondary" className="text-xs">
                        {agent.llm_provider} - {agent.model || 'default'}
                      </Badge>
                    )}
                    {onAgentAdd && onAgentDismiss && (
                      <div className="ml-auto flex gap-2">
                        {!dismissedAgents.has(agentName) ? (
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
                              onClick={() => onAgentDismiss(agentName)}
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
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="text-xs">
                      <span className="font-medium text-gray-700">LLM Provider:</span>
                      <Select value={selectedLLMProvider} onValueChange={setSelectedLLMProvider}>
                        <SelectTrigger className="w-full mt-1 h-8">
                          <SelectValue placeholder="Select LLM Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {llmProviders.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value}>
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium text-gray-700">Model:</span>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-full mt-1 h-8">
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                          {llmProviders.find(p => p.value === selectedLLMProvider)?.models.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {systemPrompt && (
                    <div className="mt-4 p-3 bg-pink-50 rounded-lg border border-pink-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-pink-600" />
                        <span className="font-medium text-pink-700 text-sm">Complete System Prompt:</span>
                      </div>
                      <ScrollArea className="h-32 w-full">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white p-2 rounded border">
                          {systemPrompt}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {(agent.temperature || agent.max_tokens) && (
                    <div className="mt-3 flex gap-4 text-xs text-gray-600">
                      {agent.temperature && (
                        <span>Temperature: <strong>{agent.temperature}</strong></span>
                      )}
                      {agent.max_tokens && (
                        <span>Max Tokens: <strong>{agent.max_tokens}</strong></span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )
    },
    {
      key: 'pending_implementations',
      title: 'Pending Implementations',
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      show: true, // Always show this section
      component: (
        <div className="space-y-4">
          <div className="text-sm text-indigo-700 mb-4">
            Complete these remaining implementation steps to enhance your automation system:
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-indigo-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TestTube className="w-4 h-4 text-indigo-600" />
                  Test Credentials Function
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 mb-3">
                  Update the test-credential function for better ChatAI integration and enhanced platform testing.
                </p>
                <Button
                  onClick={onUpdateTestCredentials}
                  size="sm"
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300 w-full"
                  variant="outline"
                  disabled={!onUpdateTestCredentials}
                >
                  Implement Test Credentials
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border border-indigo-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Database Schema Update
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 mb-3">
                  Add database fields for storing ChatAI system prompts and enhanced agent configurations.
                </p>
                <Button
                  onClick={onDatabaseSchemaUpdate}
                  size="sm"
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300 w-full"
                  variant="outline"
                  disabled={!onDatabaseSchemaUpdate}
                >
                  Update Database Schema
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-sm text-indigo-700">
              <strong>🚀 Next Steps:</strong> Complete these implementations to unlock full ChatAI integration capabilities.
            </p>
          </div>
        </div>
      )
    }
  ];

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
              <Play className="w-5 h-5 mr-2" />
              Execute Automation
            </Button>
          </div>
        </div>
      )}

      {selectedAgent && (
        <AIAgentTestScriptModal
          isOpen={testModalOpen}
          onClose={() => setTestModalOpen(false)}
          agentData={selectedAgent}
          llmProvider={selectedLLMProvider}
          model={selectedModel}
          apiKey={apiKey}
        />
      )}
    </div>
  );
};

export default YusrAIStructuredDisplay;
