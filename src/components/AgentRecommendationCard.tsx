
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Target, Shield, Brain, Database, Plus, X } from "lucide-react";

interface AgentRecommendationCardProps {
  agent: {
    name: string;
    role: string;
    rule?: string;
    goal: string;
    memory?: string;
    why_needed?: string;
  };
  onAdd: (agentData: any) => void;
  onDismiss: (agentName: string) => void;
  status: 'pending' | 'added' | 'dismissed';
}

const AgentRecommendationCard = ({ agent, onAdd, onDismiss, status }: AgentRecommendationCardProps) => {
  if (status === 'dismissed') {
    return null;
  }

  return (
    <Card className="border border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-purple-900">{agent.name}</CardTitle>
              <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-700">
                {agent.role}
              </Badge>
            </div>
          </div>
          {status === 'added' && (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <Plus className="w-3 h-3 mr-1" />
              Added
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Goal */}
        <div className="flex items-start gap-3">
          <Target className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 text-sm">Goal</h4>
            <p className="text-sm text-blue-700">{agent.goal}</p>
          </div>
        </div>

        {/* Rule */}
        {agent.rule && (
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-purple-900 text-sm">Rule</h4>
              <p className="text-sm text-purple-700">{agent.rule}</p>
            </div>
          </div>
        )}

        {/* Memory */}
        {agent.memory && (
          <div className="flex items-start gap-3">
            <Brain className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-indigo-900 text-sm">Memory</h4>
              <p className="text-sm text-indigo-700">{agent.memory}</p>
            </div>
          </div>
        )}

        {/* Default Memory */}
        <div className="flex items-start gap-3">
          <Database className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-900 text-sm">Default Memory</h4>
            <p className="text-sm text-gray-700">
              Context-aware automation assistant with workflow integration capabilities
            </p>
          </div>
        </div>

        {/* Why Needed */}
        {agent.why_needed && (
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
            <p className="text-sm text-blue-800">
              <strong>Why needed:</strong> {agent.why_needed}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onAdd(agent)}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
            <Button
              onClick={() => onDismiss(agent.name)}
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50 rounded-lg"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentRecommendationCard;
