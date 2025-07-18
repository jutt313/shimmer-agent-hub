
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, X, TestTube, Play, Settings } from "lucide-react";
import { YusrAIStructuredResponse } from "@/utils/jsonParser";

interface YusrAIStructuredDisplayProps {
  data: YusrAIStructuredResponse;
  onAgentAdd?: (agent: any) => void;
  onAgentDismiss?: (agentName: string) => void;
  dismissedAgents?: Set<string>;
  onPlatformCredentialClick?: (platformName: string) => void;
  platformCredentialStatus?: { [key: string]: 'saved' | 'tested' | 'missing' };
  onTestCredentials?: (platformName: string, testPayload: any) => void;
  onExecuteAutomation?: () => void;
  isReadyForExecution?: boolean;
}

const YusrAIStructuredDisplay: React.FC<YusrAIStructuredDisplayProps> = ({
  data,
  onAgentAdd,
  onAgentDismiss,
  dismissedAgents = new Set(),
  onPlatformCredentialClick,
  platformCredentialStatus = {},
  onTestCredentials,
  onExecuteAutomation,
  isReadyForExecution = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    steps: true,
    platforms: true,
    clarification_questions: true,
    agents: true,
    test_payloads: false,
    execution_blueprint: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPlatformButtonColor = (platformName: string) => {
    const status = platformCredentialStatus[platformName] || 'missing';
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
    <div className="space-y-4">
      {/* 1. Summary Section */}
      <Collapsible open={expandedSections.summary} onOpenChange={() => toggleSection('summary')}>
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
            <p className="text-gray-800 leading-relaxed">{data.summary}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 2. Steps Section */}
      <Collapsible open={expandedSections.steps} onOpenChange={() => toggleSection('steps')}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-green-800">🔄 Steps ({data.steps.length})</h3>
            </div>
            {expandedSections.steps ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 p-3 bg-white rounded-lg border">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {data.steps.map((step, index) => (
                <li key={index} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 3. Platforms & Credentials Section */}
      {data.platforms.length > 0 && (
        <Collapsible open={expandedSections.platforms} onOpenChange={() => toggleSection('platforms')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h3 className="font-semibold text-purple-800">🔗 Platforms & Credentials ({data.platforms.length})</h3>
              </div>
              {expandedSections.platforms ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <div className="grid grid-cols-6 gap-2 mb-4">
                {data.platforms.map((platform, index) => (
                  <Button
                    key={`platform-${index}`}
                    size="sm"
                    variant="outline"
                    onClick={() => onPlatformCredentialClick?.(platform.name)}
                    className={`text-xs h-8 px-2 rounded-lg ${getPlatformButtonColor(platform.name)} transition-colors`}
                  >
                    {platform.name}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-3">
                {data.platforms.map((platform, index) => (
                  <div key={`platform-detail-${index}`} className="bg-blue-50/30 p-3 rounded-lg border border-blue-200/50">
                    <p className="font-medium text-gray-800 mb-2">{platform.name}</p>
                    {platform.credentials.length > 0 && (
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
                            {cred.example && (
                              <p className="text-xs text-gray-500 mt-1">Example: {cred.example}</p>
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
      )}

      {/* 4. Clarification Questions Section */}
      {data.clarification_questions.length > 0 && (
        <Collapsible open={expandedSections.clarification_questions} onOpenChange={() => toggleSection('clarification_questions')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <h3 className="font-semibold text-yellow-800">❓ Clarification Questions ({data.clarification_questions.length})</h3>
              </div>
              {expandedSections.clarification_questions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <ul className="space-y-2">
                {data.clarification_questions.map((question, index) => (
                  <li key={index} className="text-gray-700 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 5. AI Agents Section */}
      {data.agents.length > 0 && (
        <Collapsible open={expandedSections.agents} onOpenChange={() => toggleSection('agents')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <h3 className="font-semibold text-indigo-800">🤖 AI Agents ({data.agents.length})</h3>
              </div>
              {expandedSections.agents ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <div className="space-y-3">
                {data.agents.map((agent, index) => {
                  const isAgentDismissed = dismissedAgents.has(agent.name);
                  
                  if (isAgentDismissed) {
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
                            onClick={() => onAgentAdd?.(agent)}
                            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-3 py-1 text-xs h-7"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onAgentDismiss?.(agent.name)}
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
                })}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 6. Test Payloads Section */}
      {Object.keys(data.test_payloads).length > 0 && (
        <Collapsible open={expandedSections.test_payloads} onOpenChange={() => toggleSection('test_payloads')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 cursor-pointer hover:bg-cyan-100 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <h3 className="font-semibold text-cyan-800">🧪 Test Payloads ({Object.keys(data.test_payloads).length})</h3>
              </div>
              {expandedSections.test_payloads ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <div className="space-y-3">
                {Object.entries(data.test_payloads).map(([platformName, testConfig]) => (
                  <div key={platformName} className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{platformName}</h4>
                      <Button
                        size="sm"
                        onClick={() => onTestCredentials?.(platformName, testConfig)}
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
      )}

      {/* 7. Execution Blueprint Section */}
      <Collapsible open={expandedSections.execution_blueprint} onOpenChange={() => toggleSection('execution_blueprint')}>
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
                <p className="text-sm text-gray-600">Type: {data.execution_blueprint.trigger.type}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <h4 className="font-medium text-blue-800 mb-1">Workflow</h4>
                <p className="text-sm text-gray-600">{data.execution_blueprint.workflow.length} steps defined</p>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <h4 className="font-medium text-purple-800 mb-1">Performance</h4>
                <p className="text-sm text-gray-600">
                  Rate Limiting: {data.execution_blueprint.performance_optimization.rate_limit_handling} | 
                  Timeout: {data.execution_blueprint.performance_optimization.timeout_seconds_per_step}s
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Execution Ready Button */}
      {isReadyForExecution && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-green-800">🎉 YusrAI Automation Ready!</p>
                <p className="text-sm text-green-600">All 7 sections configured and ready for execution</p>
              </div>
            </div>
            <Button
              onClick={onExecuteAutomation}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute Automation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default YusrAIStructuredDisplay;
