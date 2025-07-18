
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Bot, Zap, Shield, Clock } from 'lucide-react';
import { YusrAIStructuredResponse } from "@/utils/jsonParser";

interface ExecutionBlueprintVisualizerProps {
  blueprint: YusrAIStructuredResponse['execution_blueprint'];
}

const ExecutionBlueprintVisualizer: React.FC<ExecutionBlueprintVisualizerProps> = ({ blueprint }) => {
  return (
    <div className="space-y-6">
      {/* Trigger Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Trigger Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              {blueprint.trigger.type}
            </Badge>
            <span className="text-sm text-gray-600">
              {blueprint.trigger.type === 'manual' && 'Manually triggered by user'}
              {blueprint.trigger.type === 'webhook' && 'Triggered by incoming webhook'}
              {blueprint.trigger.type === 'schedule' && 'Triggered on schedule'}
              {blueprint.trigger.type === 'event' && 'Triggered by platform event'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-500" />
            Workflow Steps ({blueprint.workflow.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {blueprint.workflow.map((step, index) => (
              <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {step.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-800">{step.action}</h4>
                    <Badge variant="secondary" className="text-xs">{step.platform}</Badge>
                    {step.method && (
                      <Badge variant="outline" className="text-xs">{step.method}</Badge>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  )}
                  {step.ai_agent_integration && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                      <Bot className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-purple-700">
                        AI Agent: {step.ai_agent_integration.agent_name}
                      </span>
                    </div>
                  )}
                  {step.error_handling && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Error Handling:</span> {step.error_handling.retry_attempts} retries, 
                      fallback: {step.error_handling.fallback_action}
                    </div>
                  )}
                </div>
                {index < blueprint.workflow.length - 1 && (
                  <div className="flex-shrink-0 pt-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Error Handling & Recovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Retry Strategy</h4>
              <p className="text-sm text-gray-600">
                {blueprint.error_handling.retry_attempts} retry attempts before failure
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Fallback Actions</h4>
              <div className="flex flex-wrap gap-1">
                {blueprint.error_handling.fallback_actions.map((action, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Critical Failures</h4>
              <div className="flex flex-wrap gap-1">
                {blueprint.error_handling.critical_failure_actions.map((action, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Performance Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Rate Limiting</h4>
              <p className="text-sm text-gray-600">{blueprint.performance_optimization.rate_limit_handling}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Concurrency</h4>
              <p className="text-sm text-gray-600">{blueprint.performance_optimization.concurrency_limit} parallel tasks</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Timeout</h4>
              <p className="text-sm text-gray-600">{blueprint.performance_optimization.timeout_seconds_per_step}s per step</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutionBlueprintVisualizer;
