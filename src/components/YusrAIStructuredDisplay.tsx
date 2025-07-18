
import React from 'react';
import { Settings, Bot, Play, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { YusrAIStructuredResponse } from '@/utils/jsonParser';
import PlatformButtons from './PlatformButtons';

interface YusrAIStructuredDisplayProps {
  data: YusrAIStructuredResponse;
  automationId?: string;
}

const YusrAIStructuredDisplay = ({ data, automationId }: YusrAIStructuredDisplayProps) => {
  console.log('🎯 Rendering YusrAI structured display with data:', data);

  if (!data) {
    console.log('❌ No structured data provided to YusrAIStructuredDisplay');
    return null;
  }

  const handleTestPayload = async (platformName: string, payload: any) => {
    console.log(`🧪 Testing payload for ${platformName}:`, payload);
    // This will be connected to the test-credential function
    try {
      // TODO: Implement actual test execution
      console.log('Test would be executed here');
    } catch (error) {
      console.error('Test execution failed:', error);
    }
  };

  const handleExecuteBlueprint = async () => {
    console.log('🚀 Executing automation blueprint:', data.execution_blueprint);
    // This will be connected to the execute-automation function
    try {
      // TODO: Implement actual blueprint execution
      console.log('Blueprint would be executed here');
    } catch (error) {
      console.error('Blueprint execution failed:', error);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/50 rounded-2xl border border-purple-200/50">
      {/* 1. SUMMARY SECTION */}
      {data.summary && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-blue-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Automation Summary</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* 2. STEPS SECTION */}
      {data.steps && data.steps.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Step-by-Step Process</h3>
          </div>
          <ol className="space-y-3">
            {data.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 3. PLATFORMS & CREDENTIALS SECTION */}
      {data.platforms && data.platforms.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-purple-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Platform Integration</h3>
          </div>
          <PlatformButtons 
            platforms={data.platforms} 
            onCredentialChange={() => console.log('Credential changed')}
          />
        </div>
      )}

      {/* 4. CLARIFICATION QUESTIONS SECTION */}
      {data.clarification_questions && data.clarification_questions.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-yellow-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">4</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Clarification Questions</h3>
          </div>
          <div className="space-y-3">
            {data.clarification_questions.map((question, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{question}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. AI AGENTS SECTION */}
      {data.agents && data.agents.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-indigo-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">5</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">AI Agents</h3>
          </div>
          <div className="grid gap-4">
            {data.agents.map((agent, index) => (
              <div key={index} className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-3 mb-3">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                    {agent.role}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Goal:</span> {agent.goal}</p>
                  <p><span className="font-medium">Rules:</span> {agent.rule}</p>
                  <p><span className="font-medium">Why Needed:</span> {agent.why_needed}</p>
                  {agent.test_scenarios && agent.test_scenarios.length > 0 && (
                    <div>
                      <span className="font-medium">Test Scenarios:</span>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {agent.test_scenarios.map((scenario, idx) => (
                          <li key={idx} className="text-gray-600">{scenario}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TEST PAYLOADS SECTION */}
      {data.test_payloads && Object.keys(data.test_payloads).length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-cyan-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">6</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">API Testing</h3>
          </div>
          <div className="grid gap-4">
            {Object.entries(data.test_payloads).map(([platformName, payload]) => (
              <div key={platformName} className="p-4 bg-cyan-50/50 rounded-lg border border-cyan-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{platformName}</h4>
                  <button
                    onClick={() => handleTestPayload(platformName, payload)}
                    className="px-3 py-1 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Test
                  </button>
                </div>
                <div className="text-sm space-y-2">
                  <p><span className="font-medium">Method:</span> {payload.method}</p>
                  <p><span className="font-medium">Endpoint:</span> {payload.endpoint}</p>
                  {payload.headers && Object.keys(payload.headers).length > 0 && (
                    <div>
                      <span className="font-medium">Headers:</span>
                      <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(payload.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. EXECUTION BLUEPRINT SECTION */}
      {data.execution_blueprint && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-emerald-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">7</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Execution Blueprint</h3>
            </div>
            <button
              onClick={handleExecuteBlueprint}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all flex items-center gap-2 font-medium"
            >
              <Play className="w-4 h-4" />
              Execute Automation
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Trigger Configuration */}
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <h4 className="font-semibold text-gray-900 mb-2">Trigger</h4>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Type:</span> {data.execution_blueprint.trigger.type}
              </p>
            </div>

            {/* Workflow Steps */}
            {data.execution_blueprint.workflow && data.execution_blueprint.workflow.length > 0 && (
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-gray-900 mb-3">Workflow Steps</h4>
                <div className="space-y-3">
                  {data.execution_blueprint.workflow.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-emerald-200">
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {step.step}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-gray-900">{step.action}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        <p className="text-xs text-gray-500">
                          Platform: {step.platform} • Method: {step.method}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Optimization */}
            {data.execution_blueprint.performance_optimization && (
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-gray-900 mb-2">Performance Settings</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">Rate Limit Handling:</span> {data.execution_blueprint.performance_optimization.rate_limit_handling}</p>
                  <p><span className="font-medium">Concurrency Limit:</span> {data.execution_blueprint.performance_optimization.concurrency_limit}</p>
                  <p><span className="font-medium">Timeout per Step:</span> {data.execution_blueprint.performance_optimization.timeout_seconds_per_step}s</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default YusrAIStructuredDisplay;
