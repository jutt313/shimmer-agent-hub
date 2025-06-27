
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, Info, Bug, RefreshCw } from 'lucide-react';
import { globalErrorLogger } from '@/utils/errorLogger';

interface DiagramDiagnosticsProps {
  automationBlueprint?: any;
  diagramData?: any;
  componentStats?: any;
  onRegenerateDiagram?: () => void;
}

const DiagramDiagnostics: React.FC<DiagramDiagnosticsProps> = ({
  automationBlueprint,
  diagramData,
  componentStats,
  onRegenerateDiagram
}) => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    if (!componentStats || !diagramData) return;

    const runDiagnostics = () => {
      console.log('🔬 Running comprehensive diagram diagnostics');
      
      const nodeCount = diagramData.nodes?.length || 0;
      const edgeCount = diagramData.edges?.length || 0;
      const expectedNodes = componentStats.expectedMinNodes || 0;
      
      const platformNodes = diagramData.nodes?.filter((n: any) => n.type === 'platformNode') || [];
      const agentNodes = diagramData.nodes?.filter((n: any) => n.type === 'aiAgentNode') || [];
      const conditionNodes = diagramData.nodes?.filter((n: any) => n.type === 'conditionNode') || [];
      
      const diagnosticResults = {
        totalNodes: nodeCount,
        totalEdges: edgeCount,
        expectedNodes: expectedNodes,
        completeness: nodeCount / Math.max(expectedNodes, 1),
        platformCoverage: platformNodes.length / Math.max(componentStats.platforms.length, 1),
        agentCoverage: agentNodes.length / Math.max(componentStats.agents.length, 1),
        conditionCoverage: conditionNodes.length / Math.max(componentStats.conditions, 1),
        nodeTypes: [...new Set(diagramData.nodes?.map((n: any) => n.type) || [])],
        missingPlatforms: componentStats.platforms.filter((p: string) => 
          !platformNodes.some((n: any) => n.data?.platform === p)
        ),
        missingAgents: componentStats.agents.filter((a: string) => 
          !agentNodes.some((n: any) => n.data?.agent?.agent_id === a)
        )
      };
      
      setDiagnostics(diagnosticResults);
      
      // Identify issues
      const foundIssues = [];
      
      if (diagnosticResults.completeness < 0.8) {
        foundIssues.push({
          type: 'error',
          title: 'Incomplete Diagram',
          message: `Only ${Math.round(diagnosticResults.completeness * 100)}% of expected components are shown`,
          details: `Generated ${nodeCount} nodes but expected ${expectedNodes}`
        });
      }
      
      if (diagnosticResults.platformCoverage < 1.0) {
        foundIssues.push({
          type: 'warning',
          title: 'Missing Platforms',
          message: `${diagnosticResults.missingPlatforms.length} platforms not shown`,
          details: `Missing: ${diagnosticResults.missingPlatforms.join(', ')}`
        });
      }
      
      if (diagnosticResults.agentCoverage < 1.0 && componentStats.agents.length > 0) {
        foundIssues.push({
          type: 'warning',
          title: 'Missing AI Agents',
          message: `${diagnosticResults.missingAgents.length} agents not shown`,
          details: `Missing: ${diagnosticResults.missingAgents.join(', ')}`
        });
      }
      
      if (edgeCount < nodeCount - 1) {
        foundIssues.push({
          type: 'warning',
          title: 'Disconnected Nodes',
          message: 'Some nodes may not be connected',
          details: `${nodeCount} nodes but only ${edgeCount} edges`
        });
      }
      
      setIssues(foundIssues);
      
      // Log diagnostics
      globalErrorLogger.log('INFO', 'Diagram Diagnostics Complete', {
        diagnostics: diagnosticResults,
        issues: foundIssues
      });
    };

    runDiagnostics();
  }, [componentStats, diagramData]);

  if (!diagnostics) return null;

  return (
    <Card className="p-4 space-y-4 bg-white/95 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <Bug className="w-4 h-4 mr-2" />
          Diagram Diagnostics
        </h3>
        {onRegenerateDiagram && (
          <Button
            onClick={onRegenerateDiagram}
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
        )}
      </div>
      
      {/* Overall Health */}
      <div className="flex items-center gap-2">
        {diagnostics.completeness >= 0.9 ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : diagnostics.completeness >= 0.7 ? (
          <AlertCircle className="w-4 h-4 text-yellow-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className="text-sm font-medium">
          Overall Completeness: {Math.round(diagnostics.completeness * 100)}%
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Nodes Generated:</span>
            <span className="font-medium">{diagnostics.totalNodes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Expected Nodes:</span>
            <span className="font-medium">{diagnostics.expectedNodes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Edges:</span>
            <span className="font-medium">{diagnostics.totalEdges}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Platform Coverage:</span>
            <Badge variant={diagnostics.platformCoverage >= 1.0 ? "default" : "destructive"} className="h-4 text-xs">
              {Math.round(diagnostics.platformCoverage * 100)}%
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Agent Coverage:</span>
            <Badge variant={diagnostics.agentCoverage >= 1.0 ? "default" : "destructive"} className="h-4 text-xs">
              {Math.round(diagnostics.agentCoverage * 100)}%
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Node Types:</span>
            <span className="font-medium">{diagnostics.nodeTypes.length}</span>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Issues Found ({issues.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {issues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                {issue.type === 'error' ? (
                  <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-800">{issue.title}</div>
                  <div className="text-gray-600">{issue.message}</div>
                  <div className="text-gray-500 text-xs mt-1">{issue.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Node Type Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700">Node Types Generated</h4>
        <div className="flex flex-wrap gap-1">
          {diagnostics.nodeTypes.map((type: string) => (
            <Badge key={type} variant="secondary" className="text-xs h-5">
              {type}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default DiagramDiagnostics;
