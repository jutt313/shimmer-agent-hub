
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, X, Play, User, Code, TestTube, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseYusrAIStructuredResponse, cleanDisplayText, YusrAIStructuredResponse } from "@/utils/jsonParser";
import { useEffect, useRef, useState } from "react";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { agentStateManager } from '@/utils/agentStateManager';
import ErrorHelpButton from './ErrorHelpButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: YusrAIStructuredResponse;
  error_help_available?: boolean;
}

interface ChatCardProps {
  messages: Message[];
  onAgentAdd?: (agent: any) => void;
  dismissedAgents?: Set<string>;
  onAgentDismiss?: (agentName: string) => void;
  automationId?: string;
  isLoading?: boolean;
  onSendMessage?: (message: string) => void;
  onExecuteAutomation?: () => void;
  platformCredentialStatus?: { [key: string]: 'saved' | 'tested' | 'missing' };
  onPlatformCredentialChange?: () => void;
}

const ChatCard = ({
  messages,
  onAgentAdd,
  dismissedAgents = new Set(),
  onAgentDismiss,
  automationId = "temp-automation-id",
  isLoading = false,
  onSendMessage,
  onExecuteAutomation,
  platformCredentialStatus = {},
  onPlatformCredentialChange
}: ChatCardProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { handleError } = useErrorRecovery();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    steps: true,
    platforms: true,
    clarification_questions: true,
    agents: true,
    test_payloads: false,
    execution_blueprint: false
  });

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const optimizedMessages = messages.slice(-50);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const safeFormatMessageText = (inputText: string | undefined | null): React.ReactNode[] => {
    try {
      if (!inputText || typeof inputText !== 'string') {
        return [<span key="fallback-input-error">Message content unavailable.</span>];
      }

      const cleanHtmlString = cleanDisplayText(inputText);
      const processedText = cleanHtmlString.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const lines = processedText.split('\n');
      
      return lines.map((line, index) => (
        <span key={`line-${index}`}>
          <span dangerouslySetInnerHTML={{ __html: String(line || '') }} />
          {index < lines.length - 1 && <br />}
        </span>
      ));

    } catch (error: any) {
      handleError(error, 'Text formatting in ChatCard');
      return [<span key="processing-error">Processing your automation request...</span>];
    }
  };

  const handleAgentAdd = (agent: any) => {
    console.log(`🤖 User adding agent: ${agent.name}`);
    agentStateManager.addAgent(agent.name, agent);
    if (onAgentAdd) {
      onAgentAdd(agent);
    }
  };

  const handleAgentDismiss = (agentName: string) => {
    console.log(`❌ User dismissing agent: ${agentName}`);
    agentStateManager.dismissAgent(agentName);
    if (onAgentDismiss) {
      onAgentDismiss(agentName);
    }
  };

  const handleErrorHelp = (errorMessage?: string) => {
    const helpMessage = errorMessage ? 
      `I encountered this error: "${errorMessage}". Can you help me resolve it and continue with my automation?` :
      "I need help with an error I encountered. Can you assist me?";
    
    if (onSendMessage) {
      onSendMessage(helpMessage);
    }
  };

  const handlePlatformCredentialClick = (platformName: string, platforms: any[]) => {
    const platform = platforms.find(p => p.name === platformName);
    if (platform && onPlatformCredentialChange) {
      console.log(`🔧 Opening credential form for ${platformName}`);
      onPlatformCredentialChange();
    }
  };

  const testPlatformCredentials = async (platformName: string, testPayload: any) => {
    try {
      console.log(`🧪 Testing credentials for ${platformName}`);
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platform: platformName,
          testConfig: testPayload
        }
      });

      if (error) throw error;

      toast({
        title: data.success ? "✅ Test Successful" : "❌ Test Failed",
        description: data.message || `Credential test for ${platformName} completed`,
        variant: data.success ? "default" : "destructive",
      });

      return data.success;
    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "Test Error",
        description: `Failed to test ${platformName} credentials`,
        variant: "destructive",
      });
      return false;
    }
  };

  const checkReadyForExecution = () => {
    const latestBotMessage = messages.filter(msg => msg.isBot).pop();
    if (!latestBotMessage?.structuredData?.platforms) return false;

    const platforms = latestBotMessage.structuredData.platforms;
    const allPlatformsConfigured = platforms.every(platform => 
      platformCredentialStatus[platform.name] === 'saved' || 
      platformCredentialStatus[platform.name] === 'tested'
    );

    const agents = latestBotMessage.structuredData.agents || [];
    const allAgentsHandled = agents.every(agent => 
      dismissedAgents.has(agent.name)
    );

    return allPlatformsConfigured && allAgentsHandled && platforms.length > 0;
  };

  const handleExecuteAutomation = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to execute automations",
        variant: "destructive",
      });
      return;
    }

    const latestBotMessage = messages.filter(msg => msg.isBot).pop();
    if (!latestBotMessage?.structuredData) {
      toast({
        title: "No Automation Found",
        description: "Please create an automation first",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Executing automation');
      
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          automation_data: latestBotMessage.structuredData,
          trigger_data: {
            executed_at: new Date().toISOString(),
            trigger_type: 'manual',
            triggered_by: user.id
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "🎉 Automation Executed!",
        description: `Automation completed successfully. Run ID: ${data.run_id}`,
      });

    } catch (error: any) {
      console.error('💥 Execution error:', error);
      toast({
        title: "Execution Error",
        description: "An unexpected error occurred during execution",
        variant: "destructive",
      });
    }
  };

  const getCompleteAutomationJSON = () => {
    const latestBotMessage = messages.filter(msg => msg.isBot).pop();
    if (!latestBotMessage?.structuredData) return null;

    return {
      automation_id: automationId,
      created_at: new Date().toISOString(),
      yusrai_response: latestBotMessage.structuredData,
      ready_for_execution: checkReadyForExecution(),
      credential_status: platformCredentialStatus
    };
  };

  const renderYusrAIStructuredContent = (structuredData: YusrAIStructuredResponse, showErrorHelp: boolean = false) => {
    const content = [];

    try {
      // 1. Summary Section
      if (structuredData.summary) {
        content.push(
          <Collapsible key="summary" open={expandedSections.summary} onOpenChange={() => toggleSection('summary')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="font-semibold text-blue-800">📋 Summary</h3>
                </div>
                {expandedSections.summary ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <p className="text-gray-800 leading-relaxed">{structuredData.summary}</p>
                {showErrorHelp && (
                  <ErrorHelpButton 
                    errorMessage={structuredData.summary}
                    onHelpRequest={() => handleErrorHelp(structuredData.summary)}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      // 2. Steps Section
      if (Array.isArray(structuredData.steps) && structuredData.steps.length > 0) {
        content.push(
          <Collapsible key="steps" open={expandedSections.steps} onOpenChange={() => toggleSection('steps')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-green-800">🔄 Steps ({structuredData.steps.length})</h3>
                </div>
                {expandedSections.steps ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  {structuredData.steps.map((step, index) => (
                    <li key={index} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      // 3. Platforms & Credentials Section
      if (Array.isArray(structuredData.platforms) && structuredData.platforms.length > 0) {
        content.push(
          <Collapsible key="platforms" open={expandedSections.platforms} onOpenChange={() => toggleSection('platforms')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <h3 className="font-semibold text-purple-800">🔗 Platforms & Credentials ({structuredData.platforms.length})</h3>
                </div>
                {expandedSections.platforms ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {structuredData.platforms.map((platform, index) => {
                    const platformName = platform.name || 'Unknown Platform';
                    const status = platformCredentialStatus[platformName] || 'missing';
                    
                    const getButtonColor = () => {
                      switch (status) {
                        case 'tested':
                          return 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300';
                        case 'saved':
                          return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300';
                        case 'missing':
                        default:
                          return 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300 cursor-pointer';
                      }
                    };
                    
                    return (
                      <Button
                        key={`platform-${index}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handlePlatformCredentialClick(platformName, structuredData.platforms!)}
                        className={`text-xs h-8 px-2 rounded-lg ${getButtonColor()} transition-colors`}
                      >
                        {platformName}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="space-y-3">
                  {structuredData.platforms.map((platform, index) => (
                    <div key={`platform-detail-${index}`} className="bg-blue-50/30 p-3 rounded-lg border border-blue-200/50">
                      <p className="font-medium text-gray-800 mb-2">{platform.name}</p>
                      {Array.isArray(platform.credentials) && platform.credentials.length > 0 && (
                        <div className="text-sm text-gray-600 space-y-2">
                          {platform.credentials.map((cred, credIndex) => (
                            <div key={`cred-${credIndex}`} className="bg-white p-2 rounded border">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-xs">{cred.field}</Badge>
                                {cred.link && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(cred.link, '_blank')}
                                    className="h-6 px-2 py-1 text-xs"
                                  >
                                    Get
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{cred.why_needed}</p>
                              {cred.where_to_get && (
                                <p className="text-xs text-blue-600 mt-1">{cred.where_to_get}</p>
                              )}
                              {cred.options && cred.options.length > 0 && (
                                <div className="mt-1">
                                  <span className="text-xs text-gray-500">Options: </span>
                                  {cred.options.map((option, optIndex) => (
                                    <Badge key={optIndex} variant="secondary" className="text-xs mr-1">{option}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      // 4. Clarification Questions Section
      if (Array.isArray(structuredData.clarification_questions) && structuredData.clarification_questions.length > 0) {
        content.push(
          <Collapsible key="clarification" open={expandedSections.clarification_questions} onOpenChange={() => toggleSection('clarification_questions')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <h3 className="font-semibold text-yellow-800">❓ Clarification Questions ({structuredData.clarification_questions.length})</h3>
                </div>
                {expandedSections.clarification_questions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <ul className="space-y-2">
                  {structuredData.clarification_questions.map((question, index) => (
                    <li key={index} className="text-gray-700 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      // 5. AI Agents Section
      if (Array.isArray(structuredData.agents) && structuredData.agents.length > 0) {
        content.push(
          <Collapsible key="agents" open={expandedSections.agents} onOpenChange={() => toggleSection('agents')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <h3 className="font-semibold text-indigo-800">🤖 AI Agents ({structuredData.agents.length})</h3>
                </div>
                {expandedSections.agents ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <div className="space-y-3">
                  {structuredData.agents.map((agent, index) => {
                    const agentStatus = agentStateManager.getAgentStatus(agent.name);
                    
                    if (agentStatus !== 'pending') {
                      return null;
                    }
                    
                    return (
                      <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-blue-50/40 to-purple-50/40 border border-blue-200/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{agent.name}</h4>
                            <Badge variant="secondary" className="text-xs mt-1">{agent.role}</Badge>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleAgentAdd(agent)}
                              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-3 py-1 text-xs h-7"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAgentDismiss(agent.name)}
                              className="border-gray-300 text-gray-600 hover:bg-gray-100 px-2 py-1 text-xs h-7"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Rule:</strong> {agent.rule}</p>
                          <p><strong>Goal:</strong> {agent.goal}</p>
                          <p><strong>Memory:</strong> {agent.memory}</p>
                          <p><strong>Why Needed:</strong> {agent.why_needed}</p>
                          {agent.test_scenarios && agent.test_scenarios.length > 0 && (
                            <div>
                              <strong>Test Scenarios:</strong>
                              <ul className="list-disc list-inside ml-2 text-xs">
                                {agent.test_scenarios.map((scenario, idx) => (
                                  <li key={idx}>{scenario}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      // 6. Test Payloads Section
      if (structuredData.test_payloads && Object.keys(structuredData.test_payloads).length > 0) {
        content.push(
          <Collapsible key="test_payloads" open={expandedSections.test_payloads} onOpenChange={() => toggleSection('test_payloads')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 cursor-pointer hover:bg-cyan-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <h3 className="font-semibold text-cyan-800">🧪 Test Payloads ({Object.keys(structuredData.test_payloads).length})</h3>
                </div>
                {expandedSections.test_payloads ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <div className="space-y-3">
                  {Object.entries(structuredData.test_payloads).map(([platformName, testConfig]) => (
                    <div key={platformName} className="p-3 bg-gray-50 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">{platformName}</h4>
                        <Button
                          size="sm"
                          onClick={() => testPlatformCredentials(platformName, testConfig)}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          <TestTube className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Method:</strong> {testConfig.method}</p>
                        <p><strong>Endpoint:</strong> {testConfig.endpoint}</p>
                        {testConfig.error_patterns && (
                          <div>
                            <strong>Common Errors:</strong>
                            {Object.entries(testConfig.error_patterns).map(([code, meaning]) => (
                              <span key={code} className="block ml-2">{code}: {meaning}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      // 7. Execution Blueprint Section
      if (structuredData.execution_blueprint) {
        content.push(
          <Collapsible key="execution" open={expandedSections.execution_blueprint} onOpenChange={() => toggleSection('execution_blueprint')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-semibold text-emerald-800">⚡ Execution Blueprint</h3>
                </div>
                {expandedSections.execution_blueprint ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <div className="space-y-3">
                  <div className="p-2 bg-emerald-50 rounded">
                    <h4 className="font-medium text-emerald-800 mb-1">Trigger</h4>
                    <p className="text-sm text-gray-600">Type: {structuredData.execution_blueprint.trigger.type}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <h4 className="font-medium text-blue-800 mb-1">Workflow</h4>
                    <p className="text-sm text-gray-600">{structuredData.execution_blueprint.workflow.length} steps defined</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <h4 className="font-medium text-purple-800 mb-1">Performance</h4>
                    <p className="text-sm text-gray-600">
                      Rate Limiting: {structuredData.execution_blueprint.performance_optimization.rate_limit_handling} | 
                      Timeout: {structuredData.execution_blueprint.performance_optimization.timeout_seconds_per_step}s
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      // Execution button when ready
      if (checkReadyForExecution()) {
        content.push(
          <div key="execution-ready" className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">🎉 Automation Ready!</p>
                  <p className="text-sm text-green-600">All platforms configured and ready for execution</p>
                </div>
              </div>
              <Button
                onClick={onExecuteAutomation || handleExecuteAutomation}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Automation
              </Button>
            </div>
          </div>
        );
      }

      return content;
    } catch (error: any) {
      console.error('Critical error in renderYusrAIStructuredContent:', error);
      handleError(error, 'YusrAI structured content rendering');
      return [
        <div key="error" className="text-blue-600 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>I'm processing your automation request. Please wait...</span>
          </div>
          {showErrorHelp && (
            <ErrorHelpButton 
              errorMessage="Content rendering error"
              onHelpRequest={() => handleErrorHelp("I encountered an error while displaying the automation details.")}
            />
          )}
        </div>
      ];
    }
  };

  return (
    <div 
      className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-0 relative mx-auto flex flex-col overflow-hidden"
      style={{
        boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)',
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none"></div>
      
      {/* View Code button */}
      {getCompleteAutomationJSON() && (
        <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-lg"
            >
              <Code className="w-4 h-4 mr-1" />
              View Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-blue-600">
                Complete YusrAI Automation JSON - Ready for Execution
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] w-full">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                <code>
                  {JSON.stringify(getCompleteAutomationJSON(), null, 2)}
                </code>
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
      
      <ScrollArea className="flex-1 relative z-10 p-6 max-h-[calc(100vh-200px)]" ref={scrollAreaRef}>
        <div className="space-y-6 pb-4">
          {optimizedMessages.map(message => {
            let structuredData = message.structuredData;
            
            // Try to parse structured data from bot messages
            if (message.isBot && !structuredData) {
              try {
                structuredData = parseYusrAIStructuredResponse(message.text);
              } catch (error: any) {
                console.log('Could not parse YusrAI structured data from message:', error);
                structuredData = null;
              }
            }

            return (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-4xl px-6 py-4 rounded-2xl ${
                  message.isBot 
                    ? 'bg-white border border-blue-100/50 text-gray-800 shadow-lg backdrop-blur-sm' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  } transition-all duration-300 overflow-hidden`}
                >
                  {message.isBot && (
                    <div className="flex items-center gap-2 mb-3">
                      <img 
                        src="/lovable-uploads/cf9c8f76-d8e9-4790-b043-40ba7239140d.png" 
                        alt="YusrAI" 
                        className="w-5 h-5 object-contain"
                      />
                      <span className="text-sm font-medium text-blue-600">YusrAI (Fresh AI)</span>
                    </div>
                  )}
                  
                  {!message.isBot && (
                    <div className="flex items-start gap-2 mb-2">
                      <User className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span className="text-sm">You</span>
                    </div>
                  )}

                  {/* Render YusrAI structured content for bot messages if available */}
                  {message.isBot && structuredData ? (
                    <div className="leading-relaxed space-y-4">
                      {renderYusrAIStructuredContent(structuredData, message.error_help_available)}
                    </div>
                  ) : (
                    <div className="leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {safeFormatMessageText(message.text)}
                      {message.isBot && message.error_help_available && (
                        <ErrorHelpButton 
                          errorMessage={message.text}
                          onHelpRequest={() => handleErrorHelp(message.text)}
                        />
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
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-4xl px-6 py-4 rounded-2xl bg-white border border-blue-100/50 text-gray-800 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <img 
                    src="/lovable-uploads/cf9c8f76-d8e9-4790-b043-40ba7239140d.png" 
                    alt="YusrAI" 
                    className="w-5 h-5 object-contain animate-pulse"
                  />
                  <span className="font-medium">YusrAI is creating your comprehensive automation...</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatCard;
