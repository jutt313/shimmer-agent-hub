
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  ReactFlowProvider,
  Position,
  BackgroundVariant,
  useReactFlow,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, AlertCircle, RefreshCw, Eye, EyeOff, LayoutTemplate } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Import your custom node components
import ActionNode from './diagram/ActionNode';
import PlatformNode from './diagram/PlatformNode';
import ConditionNode from './diagram/ConditionNode';
import LoopNode from './diagram/LoopNode';
import DelayNode from './diagram/DelayNode';
import AIAgentNode from './diagram/AIAgentNode';
import RetryNode from './diagram/RetryNode';
import FallbackNode from './diagram/FallbackNode';
import TriggerNode from './diagram/TriggerNode';
import { AutomationBlueprint } from "@/types/automation";

interface AutomationDiagramDisplayProps {
  automationBlueprint?: AutomationBlueprint | null;
  automationDiagramData?: { nodes: Node[]; edges: Edge[]; warning?: string } | null;
  messages?: any[];
  onAgentAdd?: (agent: any) => void;
  onAgentDismiss?: (agentName: string) => void;
  dismissedAgents?: Set<string>;
  isGenerating?: boolean;
  onRegenerateDiagram?: () => void;
}

// --- Node Types Mapping ---
const nodeTypes = {
  actionNode: ActionNode,
  platformNode: PlatformNode,
  conditionNode: ConditionNode,
  loopNode: LoopNode,
  delayNode: DelayNode,
  aiAgentNode: AIAgentNode,
  retryNode: RetryNode,
  fallbackNode: FallbackNode,
  triggerNode: TriggerNode,
};

// --- Layouting Utility ---
const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;
const HORIZONTAL_GAP = 150;
const VERTICAL_GAP = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  if (!nodes || nodes.length === 0) return { nodes: [], edges };

  const graph = new Map<string, string[]>();
  const inDegrees = new Map<string, number>();

  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegrees.set(node.id, 0);
  });

  edges.forEach(edge => {
    graph.get(edge.source)?.push(edge.target);
    inDegrees.set(edge.target, (inDegrees.get(edge.target) || 0) + 1);
  });

  const queue: string[] = [];
  const layers = new Map<string, number>();
  let currentLayer = 0;

  nodes.forEach(node => {
    if (inDegrees.get(node.id) === 0) {
      queue.push(node.id);
      layers.set(node.id, currentLayer);
    }
  });

  let head = 0;
  while (head < queue.length) {
    const nodeId = queue[head++];
    const nextLayer = (layers.get(nodeId) || 0) + 1;

    graph.get(nodeId)?.forEach(childId => {
      inDegrees.set(childId, (inDegrees.get(childId) || 0) - 1);
      if (inDegrees.get(childId) === 0) {
        queue.push(childId);
        layers.set(childId, nextLayer);
      }
    });
  }

  const layerNodeOffsets = new Map<number, number>();
  layers.forEach(layer => layerNodeOffsets.set(layer, 0));

  const layoutedNodes = nodes.map(node => {
    const layer = layers.get(node.id) || 0;
    const x = layer * (NODE_WIDTH + HORIZONTAL_GAP) + 100;
    const y = (layerNodeOffsets.get(layer) || 0) + 150;
    layerNodeOffsets.set(layer, y + NODE_HEIGHT + VERTICAL_GAP);
    
    return { ...node, position: { x, y } };
  });

  const finalNodes = layoutedNodes.map(layoutedNode => {
    const originalNode = nodes.find(n => n.id === layoutedNode.id);
    if (originalNode && originalNode.position) {
      return { ...originalNode, position: originalNode.position };
    }
    return layoutedNode;
  });

  const layoutedEdges = edges.map(edge => ({
    ...edge,
    sourceHandle: edge.sourceHandle || Position.Right,
    targetHandle: edge.targetHandle || Position.Left,
  }));

  return { nodes: finalNodes, edges: layoutedEdges };
};

// --- Internal Flow Component (needs to be inside ReactFlowProvider) ---
const DiagramFlow: React.FC<{
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  componentStats: any;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
  diagramError: string | null;
  onRegenerateDiagram?: () => void;
  onLayout: () => void;
}> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  componentStats,
  showDetails,
  setShowDetails,
  diagramError,
  onRegenerateDiagram,
  onLayout
}) => {
  const { fitView } = useReactFlow(); // Now this is properly inside ReactFlowProvider

  // Auto-fit view when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      requestAnimationFrame(() => {
        fitView({ padding: 0.2, minZoom: 0.1, maxZoom: 1.5 });
      });
    }
  }, [nodes, fitView]);

  return (
    <>
      {/* Enhanced header with better styling */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="bg-white/90 text-gray-700 border border-gray-200/50 shadow-sm">
            <Sparkles className="w-3 h-3 mr-1" />
            Interactive Flow Diagram
          </Badge>
          
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
            {nodes.length} Nodes
          </Badge>
          
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-sm">
            {edges.length} Connections
          </Badge>

          {componentStats && (
            <Button
              onClick={() => setShowDetails(!showDetails)}
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs bg-white/80 shadow-sm"
            >
              {showDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              Details
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {onRegenerateDiagram && (
            <Button 
              onClick={onRegenerateDiagram}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* Details panel */}
      {showDetails && componentStats && (
        <div className="absolute top-20 left-6 z-20 bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 text-sm space-y-3 shadow-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">Total Steps:</span>
              <span className="ml-2 text-gray-600">{componentStats.totalSteps}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Platforms:</span>
              <span className="ml-2 text-gray-600">{componentStats.platforms.length}</span>
            </div>
          </div>
          {componentStats.platforms.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">Integrations:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {componentStats.platforms.map((platform: string) => (
                  <Badge key={platform} variant="outline" className="text-xs">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {diagramError && (
        <div className="absolute top-6 right-6 z-20 bg-red-50 border border-red-200 rounded-lg p-3 max-w-md shadow-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{diagramError}</p>
          </div>
        </div>
      )}

      {/* React Flow */}
      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.1,
            maxZoom: 1.5,
          }}
          className="bg-gradient-to-br from-slate-50/50 to-blue-50/30"
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnScroll={true}
          selectionOnDrag={true}
          panOnDrag={[1, 2]}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
          selectNodesOnDrag={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            color="#e2e8f0" 
            gap={30} 
            size={2}
            variant={BackgroundVariant.Dots}
          />
          <Controls 
            className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg"
            position="bottom-left"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <MiniMap 
            style={{
              height: 120,
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            nodeColor={(node) => {
              switch (node.type) {
                case 'platformNode': return '#3b82f6';
                case 'conditionNode': return '#f97316';
                case 'loopNode': return '#8b5cf6';
                case 'aiAgentNode': return '#10b981';
                case 'delayNode': return '#64748b';
                case 'retryNode': return '#f59e0b';
                case 'fallbackNode': return '#6366f1';
                case 'triggerNode': return '#dc2626';
                default: return '#6b7280';
              }
            }}
            nodeStrokeColor="#374151"
            nodeStrokeWidth={1}
            maskColor="rgba(255, 255, 255, 0.8)"
            position="bottom-right"
            zoomable
            pannable
          />
        </ReactFlow>
      </div>
    </>
  );
};

// --- Main Component ---
const AutomationDiagramDisplay: React.FC<AutomationDiagramDisplayProps> = ({
  automationBlueprint,
  automationDiagramData,
  messages = [],
  onAgentAdd,
  onAgentDismiss,
  dismissedAgents = new Set(),
  isGenerating = false,
  onRegenerateDiagram
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [aiAgentRecommendations, setAiAgentRecommendations] = useState<any[]>([]);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [componentStats, setComponentStats] = useState<any>(null);

  // Extract AI agent recommendations from messages
  useEffect(() => {
    const recommendations: any[] = [];
    messages.forEach(message => {
      if (message.isBot && message.structuredData?.ai_agents) {
        message.structuredData.ai_agents.forEach((agent: any) => {
          if (agent && agent.name && !dismissedAgents.has(agent.name)) {
            recommendations.push(agent);
          }
        });
      }
    });
    setAiAgentRecommendations(recommendations);
  }, [messages, dismissedAgents]);

  // Analyze blueprint for statistics
  const analyzeBlueprint = useCallback((blueprint: AutomationBlueprint) => {
    if (!blueprint?.steps) return null;

    let totalSteps = 0;
    const platforms = new Set<string>();
    const agents = new Set<string>();
    let conditions = 0;
    let loops = 0;

    const processSteps = (steps: any[]) => {
      steps.forEach((step) => {
        totalSteps++;
        
        if (step.action?.integration) {
          platforms.add(step.action.integration);
        }
        
        if (step.ai_agent_call?.agent_id) {
          agents.add(step.ai_agent_call.agent_id);
        }
        
        if (step.type === 'condition') {
          conditions++;
          if (step.condition?.if_true) processSteps(step.condition.if_true);
          if (step.condition?.if_false) processSteps(step.condition.if_false);
        }
        
        if (step.type === 'loop') {
          loops++;
          if (step.loop?.steps) processSteps(step.loop.steps);
        }
        if (step.retry?.steps) processSteps(step.retry.steps);
        if (step.fallback?.primary_steps) processSteps(step.fallback.primary_steps);
        if (step.fallback?.fallback_steps) processSteps(step.fallback.fallback_steps);
      });
    };

    processSteps(blueprint.steps);
    
    return {
      totalSteps,
      platforms: Array.from(platforms),
      agents: Array.from(agents),
      conditions,
      loops,
      expectedNodes: totalSteps + platforms.size + agents.size + 1 
    };
  }, []);

  // Load and process diagram data
  useEffect(() => {
    console.log('🔄 Loading diagram data...');
    setDiagramError(null);

    // Analyze blueprint
    if (automationBlueprint) {
      const stats = analyzeBlueprint(automationBlueprint);
      setComponentStats(stats);
    }

    if (automationDiagramData?.nodes && automationDiagramData?.edges) {
      console.log('🎨 Loading AI-generated diagram');
      
      // Process nodes for agent recommendations
      const processedNodes = automationDiagramData.nodes.map(node => {
        const recommendation = aiAgentRecommendations.find(agent => 
          node.type === 'aiAgentNode' && 
          agent?.name && 
          node.data?.agent && 
          typeof node.data.agent === 'object' && 
          'agent_id' in node.data.agent &&
          node.data.agent.agent_id === agent.name
        );
        
        if (recommendation) {
          return {
            ...node,
            data: {
              ...node.data,
              isRecommended: true,
              onAdd: () => onAgentAdd?.(recommendation),
              onDismiss: () => onAgentDismiss?.(recommendation.name)
            }
          };
        }
        
        return node;
      });
      
      // Apply Client-Side Layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        processedNodes, 
        automationDiagramData.edges
      );
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      // Check for warnings
      if (automationDiagramData.warning) {
        setDiagramError(automationDiagramData.warning);
      }
      
    } else if (automationBlueprint?.steps?.length > 0) {
      console.log('⚠️ No AI diagram available');
      setDiagramError('AI diagram generation failed or is not available. Please regenerate.');
      setNodes([]);
      setEdges([]);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [automationDiagramData, automationBlueprint, aiAgentRecommendations, analyzeBlueprint]);

  const onConnect = useCallback((params: any) => {
    console.log('Connection attempt (frontend cannot connect nodes, AI does):', params);
  }, []);

  // Layout button for manual re-layout
  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges]);

  if (isGenerating) {
    return (
      <Card className="h-full bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden" 
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(59, 130, 246, 0.15)' }}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-b-purple-600 rounded-full mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI is Creating Your Visual Flow
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Generating an interactive diagram that shows exactly how your automation works, step by step...
              </p>
              {componentStats && (
                <div className="text-xs text-gray-500 space-y-1 bg-white/50 rounded-lg p-3">
                  <div>Expected nodes: {componentStats.expectedNodes}</div>
                  <div>Platforms: {componentStats.platforms.join(', ')}</div>
                  <div>System flow: {componentStats.conditions} conditions, {componentStats.loops} loops</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!nodes.length && !automationBlueprint?.steps?.length) {
    return (
      <Card className="h-full bg-gradient-to-br from-white/90 to-purple-50/50 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(147, 51, 234, 0.15)' }}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <Sparkles className="w-10 h-10 text-purple-600" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                No Automation Flow Yet
              </h3>
              <p className="text-sm text-gray-600">
                Start chatting with YusrAI to build your automation, and a beautiful interactive flow diagram will be generated automatically.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-gradient-to-br from-white/95 to-blue-50/30 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden relative"
          style={{ 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(59, 130, 246, 0.15), 0 0 80px rgba(59, 130, 246, 0.1)',
            minHeight: '600px'
          }}>
      
      {/* React Flow with proper provider wrapper */}
      <ReactFlowProvider>
        <DiagramFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          componentStats={componentStats}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          diagramError={diagramError}
          onRegenerateDiagram={onRegenerateDiagram}
          onLayout={onLayout}
        />
      </ReactFlowProvider>
    </Card>
  );
};

export default AutomationDiagramDisplay;
