import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, Bug, RefreshCw } from 'lucide-react';
import { globalErrorLogger } from '@/utils/errorLogger';
import { Node, Edge } from '@xyflow/react'; // Import Node and Edge types

// --- Constants for Layout Checks (should match AutomationDiagramDisplay.tsx's approximations) ---
const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;
const HORIZONTAL_GAP = 150;
const VERTICAL_GAP = 100;

interface DiagramDiagnosticsProps {
  automationBlueprint?: any;
  diagramData?: { nodes: Node[]; edges: Edge[]; warning?: string } | null; // Use React Flow's Node/Edge types
  componentStats?: any;
  onRegenerateDiagram?: () => void;
}

// Helper to calculate node bounds (assuming default node size if not provided by React Flow)
const getNodeBounds = (node: Node, defaultWidth = NODE_WIDTH, defaultHeight = NODE_HEIGHT) => {
  // Use node.width and node.height if available (after React Flow renders them), else use defaults
  const width = node.width || defaultWidth;
  const height = node.height || defaultHeight;
  const x = node.position.x;
  const y = node.position.y;
  return {
    left: x,
    right: x + width,
    top: y,
    bottom: y + height,
    width,
    height
  };
};

const DiagramDiagnostics: React.FC<DiagramDiagnosticsProps> = ({
  automationBlueprint,
  diagramData,
  componentStats,
  onRegenerateDiagram
}) => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    // Ensure all necessary data is present before running diagnostics
    if (!componentStats || !diagramData || !diagramData.nodes || !diagramData.edges) {
      setDiagnostics(null);
      setIssues([]);
      return;
    }

    const runDiagnostics = () => {
      console.log('🔬 Running comprehensive diagram diagnostics');
      
      const nodeCount = diagramData.nodes.length;
      const edgeCount = diagramData.edges.length;
      const expectedNodes = componentStats.expectedNodes || 0; // Correctly reference componentStats.expectedNodes
      
      // Filter nodes by type, ensuring type safety with Node casting
      const platformNodes = diagramData.nodes.filter((n: Node) => n.type === 'platformNode');
      const agentNodes = diagramData.nodes.filter((n: Node) => n.type === 'aiAgentNode');
      const conditionNodes = diagramData.nodes.filter((n: Node) => n.type === 'conditionNode');
      const triggerNodes = diagramData.nodes.filter((n: Node) => n.type === 'triggerNode'); // Include trigger nodes in count
      
      const diagnosticResults = {
        totalNodes: nodeCount,
        totalEdges: edgeCount,
        expectedNodes: expectedNodes,
        completeness: nodeCount / Math.max(expectedNodes, 1),
        platformCoverage: platformNodes.length / Math.max(componentStats.platforms.length, 1),
        agentCoverage: agentNodes.length / Math.max(componentStats.agents.length, 1),
        conditionCoverage: conditionNodes.length / Math.max(componentStats.conditions, 1),
        nodeTypes: [...new Set(diagramData.nodes.map((n: Node) => n.type))],
        missingPlatforms: componentStats.platforms.filter((p: string) => 
          !platformNodes.some((n: Node) => n.data?.platform === p)
        ),
        missingAgents: componentStats.agents.filter((a: string) => {
            // Corrected: Ensure 'agent' property exists and has 'agent_id' before accessing
            return !agentNodes.some((n: Node) => {
                if (n.data && typeof n.data === 'object' && 'agent' in n.data && n.data.agent && typeof n.data.agent === 'object' && 'agent_id' in n.data.agent) {
                    return (n.data.agent as { agent_id: string }).agent_id === a;
                }
                return false;
            });
        }),
      };
      
      setDiagnostics(diagnosticResults);
      
      // Identify issues
      const foundIssues = [];
      
      if (diagnosticResults.completeness < 0.95 && expectedNodes > 0) { // Slightly stricter completeness
        foundIssues.push({
          type: 'error',
          title: 'Incomplete Diagram',
          message: `Only ${Math.round(diagnosticResults.completeness * 100)}% of expected components are shown`,
          details: `Generated ${nodeCount} nodes but expected at least ${expectedNodes}`
        });
      }
      
      if (diagnosticResults.platformCoverage < 1.0) {
        foundIssues.push({
          type: 'warning',
          title: 'Missing Platforms',
          message: `${diagnosticResults.missingPlatforms.length} platform(s) not shown`,
          details: `Missing: ${diagnosticResults.missingPlatforms.join(', ')}`
        });
      }
      
      if (diagnosticResults.agentCoverage < 1.0 && componentStats.agents.length > 0) {
        foundIssues.push({
          type: 'warning',
          title: 'Missing AI Agents',
          message: `${diagnosticResults.missingAgents.length} AI agent(s) not shown`,
          details: `Missing: ${diagnosticResults.missingAgents.join(', ')}`
        });
      }
      
      if (edgeCount < (nodeCount - triggerNodes.length)) { // Check for minimum edges for a connected graph
        foundIssues.push({
          type: 'warning',
          title: 'Potentially Disconnected Nodes',
          message: 'Some nodes may not be properly connected in the flow',
          details: `${nodeCount} nodes but only ${edgeCount} edges. Expected more connections.`
        });
      }

      // --- NEW LAYOUT DIAGNOSTICS ---
      const detectedOverlaps = checkNodeOverlap(diagramData.nodes);
      if (detectedOverlaps.length > 0) {
        foundIssues.push({
          type: 'error', // High severity for overlaps
          title: 'Node Overlap Detected',
          message: `${detectedOverlaps.length} node(s) are overlapping`,
          details: `Overlapping node IDs: ${detectedOverlaps.map(issue => `${issue.node1Id} & ${issue.node2Id}`).join(', ')}. Please refine AI prompt or layout algorithm.`
        });
      }

      const layoutQuality = checkLayoutQuality(diagramData.nodes, diagramData.edges, conditionNodes); // Pass conditionNodes
      if (!layoutQuality.isClean) {
        foundIssues.push({
          type: layoutQuality.severity,
          title: layoutQuality.title,
          message: layoutQuality.message,
          details: layoutQuality.details
        });
      }
      // --- END NEW LAYOUT DIAGNOSTICS ---
      
      setIssues(foundIssues);
      
      // Log diagnostics
      globalErrorLogger.log('INFO', 'Diagram Diagnostics Complete', {
        diagnostics: diagnosticResults,
        issues: foundIssues
      });
    };

    // --- NEW: Layout-specific Diagnostic Functions ---
    const checkNodeOverlap = (nodes: Node[]) => {
      const overlaps: { node1Id: string; node2Id: string }[] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];

          if (!node1.position || !node2.position) continue; // Skip if position is missing

          const bounds1 = getNodeBounds(node1);
          const bounds2 = getNodeBounds(node2);

          // Check for intersection (with a small tolerance)
          const tolerance = 5; // Pixels
          if (
            bounds1.left < bounds2.right - tolerance &&
            bounds1.right > bounds2.left + tolerance &&
            bounds1.top < bounds2.bottom - tolerance &&
            bounds1.bottom > bounds2.top + tolerance
          ) {
            overlaps.push({ node1Id: node1.id, node2Id: node2.id });
          }
        }
      }
      return overlaps;
    };

    // Generalized layout quality check
    const checkLayoutQuality = (nodes: Node[], edges: Edge[], conditionNodes: Node[]) => {
      let poorLayoutCount = 0;
      let title = 'Diagram Layout Good';
      let message = 'The diagram layout appears organized.';
      let severity: 'info' | 'warning' | 'error' = 'info';
      let details = [];

      // 1. Check for general left-to-right flow consistency (simplified)
      nodes.sort((a, b) => a.position.x - b.position.x); // Sort by x-position
      for (let i = 0; i < nodes.length - 1; i++) {
        const node1 = nodes[i];
        const node2 = nodes[i+1];
        // If connected nodes unexpectedly go backwards on X
        if (edges.some(e => e.source === node2.id && e.target === node1.id) && node2.position.x < node1.position.x) {
            poorLayoutCount++;
            details.push(`Backwards connection from ${node2.id} to ${node1.id}`);
        }
      }
      
      // 2. Check for sufficient vertical divergence in conditional branches
      conditionNodes.forEach(condNode => {
        const outgoingEdges = edges.filter(e => e.source === condNode.id);
        const yesEdge = outgoingEdges.find(e => e.label === 'Yes' || e.sourceHandle === 'success');
        const noEdge = outgoingEdges.find(e => e.label === 'No' || e.sourceHandle === 'error');

        if (yesEdge && noEdge) {
          const targetNodeYes = nodes.find(n => n.id === yesEdge.target);
          const targetNodeNo = nodes.find(n => n.id === noEdge.target);

          if (targetNodeYes && targetNodeNo) {
            const verticalDifference = Math.abs(targetNodeYes.position.y - targetNodeNo.position.y);
            // Expect a minimum vertical separation to avoid crowding
            if (verticalDifference < (NODE_HEIGHT + VERTICAL_GAP * 0.5)) { 
              poorLayoutCount++;
              details.push(`Conditional branches from '${condNode.id}' are too close vertically.`);
            }
          }
        }
      });

      if (poorLayoutCount > 0) {
        severity = 'warning';
        title = 'Suboptimal Layout Quality';
        message = `Detected ${poorLayoutCount} potential layout inconsistencies.`;
      }
      
      const isClean = poorLayoutCount === 0;

      return { isClean, severity, title, message, details: details.join('; ') };
    };
    // --- END NEW DIAGNOSTIC FUNCTIONS ---

    runDiagnostics();
  }, [componentStats, diagramData]); // Dependencies for useEffect

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
        {issues.length === 0 ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : issues.some(issue => issue.type === 'error') ? (
          <XCircle className="w-4 h-4 text-red-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-500" />
        )}
        <span className="text-sm font-medium">
          Overall Diagram Health: {issues.length === 0 ? 'Good' : issues.some(issue => issue.type === 'error') ? 'Critical Issues' : 'Warnings Present'}
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
            <span className="text-gray-600">Expected Nodes (from blueprint):</span>
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
      {diagnostics.nodeTypes.length > 0 && (
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
      )}
    </Card>
  );
};

export default DiagramDiagnostics;