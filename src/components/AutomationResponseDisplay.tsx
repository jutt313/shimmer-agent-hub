import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, X, Info } from "lucide-react";
import { useState } from "react";
import PlatformCredentialForm from "./PlatformCredentialForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StructuredResponse {
  summary?: string;
  steps?: string[];
  platforms?: Array<{
    name: string;
    credentials: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  }>;
  agents?: Array<{
    name: string;
    role: string;
    goal: string;
    rules: string;
    memory: string;
    why_needed: string;
  }>;
  clarification_questions?: string[];
}

interface AutomationResponseDisplayProps {
  data: StructuredResponse;
  onAgentAdd: (agent: any) => void;
  dismissedAgents?: Set<string>;
}

const AutomationResponseDisplay = ({ data, onAgentAdd, dismissedAgents = new Set() }: AutomationResponseDisplayProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Clarification Questions */}
      {data.clarification_questions && data.clarification_questions.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Clarification Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.clarification_questions.map((question, index) => (
                <p key={index} className="text-orange-700 font-medium">
                  {index + 1}. {question}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {data.summary && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-800">Automation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">{data.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Explanation */}
      {data.steps && data.steps.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-800">Step-by-Step Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {data.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <Badge variant="outline" className="min-w-[24px] h-6 rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-green-700">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Platform Credentials */}
      {data.platforms && data.platforms.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-purple-800">Required Platform Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.platforms.map((platform, index) => (
                <div key={index} className="border border-purple-200 rounded-lg p-4 bg-white/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-purple-800">{platform.name}</h4>
                    <Button
                      onClick={() => setSelectedPlatform(platform)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Configure
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {platform.credentials.map((cred, credIndex) => (
                      <div key={credIndex} className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">{cred.field}</Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-purple-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-medium">Why needed:</p>
                                <p className="text-sm mb-2">{cred.why_needed}</p>
                                <p className="font-medium">Get it here:</p>
                                <a href={cred.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                  {cred.link}
                                </a>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Agent Recommendations */}
      {data.agents && data.agents.length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader>
            <CardTitle className="text-indigo-800 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Recommended AI Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.agents
                .filter(agent => !dismissedAgents.has(agent.name))
                .map((agent, index) => (
                <div key={index} className="border border-indigo-200 rounded-lg p-4 bg-white/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-indigo-800">{agent.name}</h4>
                      <p className="text-sm text-indigo-600 mb-2">{agent.role}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onAgentAdd(agent)}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-indigo-700">Goal:</span>
                      <p className="text-indigo-600">{agent.goal}</p>
                    </div>
                    <div>
                      <span className="font-medium text-indigo-700">Rules:</span>
                      <p className="text-indigo-600">{agent.rules}</p>
                    </div>
                    <div>
                      <span className="font-medium text-indigo-700">Why needed:</span>
                      <p className="text-indigo-600">{agent.why_needed}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Credential Form Modal */}
      {selectedPlatform && (
        <PlatformCredentialForm
          platform={selectedPlatform}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </div>
  );
};

export default AutomationResponseDisplay;
