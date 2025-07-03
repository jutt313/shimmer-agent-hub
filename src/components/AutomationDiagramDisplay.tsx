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

// Import enhanced node components
import ActionNode from './diagram/ActionNode';
import PlatformNode from './diagram/PlatformNode';
import DynamicConditionNode from './diagram/DynamicConditionNode';
import LoopNode from './diagram/LoopNode';
import DelayNode from './diagram/DelayNode';
import AIAgentNode from './diagram/AIAgentNode';
import RetryNode from './diagram/RetryNode';
import FallbackNode from './diagram/FallbackNode';
import TriggerNode from './diagram/TriggerNode';
import PlatformTriggerNode from './diagram/PlatformTriggerNode';
import { AutomationBlueprint } from "@/types/automation";
import { parseStructuredResponse, cleanDisplayText, StructuredResponse } from "@/utils/jsonParser";
import ExpandableNode from './diagram/ExpandableNode';

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

// Enhanced Node Types Mapping
const nodeTypes = {
  actionNode: ExpandableNode,
  platformNode: ExpandableNode,
  conditionNode: ExpandableNode,
  loopNode: ExpandableNode,
  delayNode: DelayNode,
  aiAgentNode: ExpandableNode,
  retryNode: ExpandableNode,
  fallbackNode: ExpandableNode,
  triggerNode: ExpandableNode,
  platformTriggerNode: ExpandableNode,
  default: ExpandableNode
};

// Enhanced Layouting with better positioning
const NODE_WIDTH = 280;  // Reduced from 320
const NODE_HEIGHT = 120; // Reduced from 140
const HORIZONTAL_GAP = 200; // Reduced from 280
const VERTICAL_GAP = 150;   // Reduced from 180
const START_X = 50;
const START_Y = 100;

const getDynamicLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  console.log('🎨 Compact layout calculation for', nodes.length, 'nodes');
  
  if (!nodes || nodes.length === 0) return { nodes: [], edges };

  // Build adjacency graph for better positioning
  const graph = new Map<string, string[]>();
  const inDegrees = new Map<string, number>();
  const processed = new Set<string>();

  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegrees.set(node.id, 0);
  });

  edges.forEach(edge => {
    if (graph.has(edge.source) && graph.has(edge.target)) {
      graph.get(edge.source)?.push(edge.target);
      inDegrees.set(edge.target, (inDegrees.get(edge.target) || 0) + 1);
    }
  });

  // Topological sort for layers
  const queue: string[] = [];
  const layers = new Map<string, number>();
  
  // Find root nodes
  nodes.forEach(node => {
    if (inDegrees.get(node.id) === 0) {
      queue.push(node.id);
      layers.set(node.id, 0);
    }
  });

  let head = 0;
  while (head < queue.length) {
    const nodeId = queue[head++];
    const currentLayer = layers.get(nodeId) || 0;
    
    graph.get(nodeId)?.forEach(childId => {
      const newInDegree = (inDegrees.get(childId) || 0) - 1;
      inDegrees.set(childId, newInDegree);
      
      if (newInDegree === 0) {
        queue.push(childId);
        layers.set(childId, Math.max(layers.get(childId) || 0, currentLayer + 1));
      }
    });
  }

  // Handle orphaned nodes
  nodes.forEach(node => {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  });

  // Group nodes by layer
  const layerGroups = new Map<number, string[]>();
  layers.forEach((layer, nodeId) => {
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)?.push(nodeId);
  });

  // Enhanced positioning with tighter spacing
  const layoutedNodes = nodes.map(node => {
    const layer = layers.get(node.id) || 0;
    const layerNodes = layerGroups.get(layer) || [];
    const nodeIndex = layerNodes.indexOf(node.id);
    
    const x = START_X + (layer * (NODE_WIDTH + HORIZONTAL_GAP));
    const layerHeight = layerNodes.length * NODE_HEIGHT + (layerNodes.length - 1) * VERTICAL_GAP;
    const layerStartY = START_Y + (layerHeight > 0 ? -layerHeight / 2 : 0);
    const y = layerStartY + nodeIndex * (NODE_HEIGHT + VERTICAL_GAP) + 200; // Reduced offset
    
    return { 
      ...node, 
      position: { x, y },
      draggable: true,
      selectable: true,
      connectable: false
    };
  });

  // Enhanced edge styling
  const layoutedEdges = edges.map(edge => {
    let edgeStyle = {
      stroke: '#3b82f6',
      strokeWidth: 2,
      ...edge.style
    };

    // Enhanced edge colors based on handles
    if (edge.sourceHandle) {
      switch (edge.sourceHandle) {
        case 'true':
        case 'yes':
        case 'success':
        case 'existing':
          edgeStyle.stroke = '#10b981';
          break;
        case 'false':
        case 'no':
        case 'error':
          edgeStyle.stroke = '#ef4444';
          break;
        case 'urgent':
          edgeStyle.stroke = '#ef4444';
          break;
        case 'task':
        case 'new':
          edgeStyle.stroke = '#10b981';
          break;
        case 'followup':
          edgeStyle.stroke = '#f59e0b';
          break;
        default:
          edgeStyle.stroke = '#6b7280';
      }
    }

    return {
      ...edge,
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
    };
  });

  console.log('✅ Enhanced layout completed:', {
    finalNodes: layoutedNodes.length,
    finalEdges: layoutedEdges.length,
    layers: Math.max(...Array.from(layers.values())) + 1
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

// Internal Flow Component
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
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      console.log('🔍 Fitting view for', nodes.length, 'compact nodes');
      const timer = setTimeout(() => {
        fitView({ 
          padding: 0.15, // Tighter padding for compact view
          minZoom: 0.3, 
          maxZoom: 1.2,
          duration: 800
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView]);

  return (
    <div className="w-full h-full relative">
      {/* Enhanced header with compact layout info */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="bg-white/95 text-gray-700 border border-gray-200/50 shadow-md backdrop-blur">
            <Sparkles className="w-3 h-3 mr-1" />
            Compact Flow
          </Badge>
          
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
            {nodes.length} Nodes
          </Badge>
          
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-sm">
            {edges.length} Connections
          </Badge>
          
          {nodes.filter(n => n.data?.stepType === 'condition').length > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 shadow-sm">
              {nodes.filter(n => n.data?.stepType === 'condition').length} Conditions
            </Badge>
          )}
          
          {nodes.filter(n => n.data?.stepType === 'ai_agent_call').length > 0 && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm">
              {nodes.filter(n => n.data?.stepType === 'ai_agent_call').length} AI Agents
            </Badge>
          )}

          {componentStats && (
            <Button
              onClick={() => setShowDetails(!showDetails)}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs bg-white/90 shadow-sm hover:bg-white"
            >
              {showDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              Details
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onLayout}
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white text-gray-700 shadow-sm"
          >
            <LayoutTemplate className="w-3 h-3 mr-1" />
            Compact Layout
          </Button>
          
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

      {/* Enhanced details panel with compact layout info */}
      {showDetails && componentStats && (
        <div className="absolute top-16 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-xl max-w-sm">
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-800 mb-2">Compact Layout Details</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Total Steps:</span>
                <span className="ml-2 text-gray-600">{componentStats.totalSteps}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Platforms:</span>
                <span className="ml-2 text-gray-600">{componentStats.platforms.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">AI Agents:</span>
                <span className="ml-2 text-gray-600">{componentStats.agents.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Conditions:</span>
                <span className="ml-2 text-gray-600">{componentStats.conditions}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
              💡 Click on any node to expand and see detailed information
            </div>
            {componentStats.platforms.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 text-sm">Integrations:</span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {componentStats.platforms.map((platform: string) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced error message */}
      {diagramError && (
        <div className="absolute top-4 right-4 z-20 bg-red-50 border border-red-200 rounded-lg p-3 max-w-md shadow-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{diagramError}</p>
          </div>
        </div>
      )}

      {/* Enhanced React Flow with compact settings */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.15, // Tighter padding
          minZoom: 0.2,
          maxZoom: 1.5,
        }}
        className="bg-gradient-to-br from-slate-50/30 to-blue-50/20"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnScroll={true}
        selectionOnDrag={false}
        panOnDrag={[1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
      >
        <Background 
          color="#e2e8f0" 
          gap={20}  // Smaller gap for compact view
          size={1}   // Smaller dots
          variant={BackgroundVariant.Dots}
        />
        <Controls 
          className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg"
          position="bottom-left"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        <MiniMap 
          style={{
            height: 120, // Smaller minimap
            width: 180,
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
          nodeColor={(node) => {
            if (node.data?.branchContext) {
              return node.data.branchContext.type === 'csv' ? '#10b981' : '#3b82f6';
            }
            switch (node.data?.stepType) {
              case 'condition': return '#f97316';
              case 'ai_agent_call': return '#10b981';
              case 'retry': return '#f59e0b';
              case 'notification': return '#a855f7';
              default: return '#6b7280';
            }
          }}
          nodeStrokeColor="#374151"
          nodeStrokeWidth={1}
          maskColor="rgba(255, 255, 255, 0.7)"
          position="bottom-right"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};

// Main Enhanced Component
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

  // Enhanced debugging
  useEffect(() => {
    console.log('📊 Enhanced AutomationDiagramDisplay - Data Flow:', {
      hasBlueprint: !!automationBlueprint,
      blueprintSteps: automationBlueprint?.steps?.length || 0,
      hasDiagramData: !!automationDiagramData,
      diagramNodes: automationDiagramData?.nodes?.length || 0,
      diagramEdges: automationDiagramData?.edges?.length || 0,
      messagesCount: messages.length,
      isGenerating
    });
  }, [automationBlueprint, automationDiagramData, messages, isGenerating]);

  // Extract AI agent recommendations
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
    console.log('🤖 Enhanced AI agent recommendations:', recommendations.length);
    setAiAgentRecommendations(recommendations);
  }, [messages, dismissedAgents]);

  // Enhanced blueprint analysis
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
        
        // Enhanced platform detection
        if (step.action && typeof step.action === 'object') {
          const platform = step.action.integration || step.action.platform || step.action.service;
          if (platform) platforms.add(platform);
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
    
    const stats = {
      totalSteps,
      platforms: Array.from(platforms),
      agents: Array.from(agents),
      conditions,
      loops,
      expectedNodes: totalSteps + platforms.size + agents.size + 1 
    };

    console.log('📈 Enhanced blueprint analysis:', stats);
    return stats;
  }, []);

  // Enhanced diagram data processing
  useEffect(() => {
    console.log('🔄 Processing enhanced diagram data with AI agents...');
    setDiagramError(null);

    // Analyze blueprint
    if (automationBlueprint) {
      const stats = analyzeBlueprint(automationBlueprint);
      setComponentStats(stats);
    }

    if (automationDiagramData?.nodes && automationDiagramData?.edges) {
      console.log('🎨 Loading compact diagram with', automationDiagramData.nodes.length, 'nodes');
      
      // Enhanced node processing with AI agent integration
      const processedNodes = automationDiagramData.nodes.map((node, index) => {
        console.log(`🔍 Enhanced processing node ${index + 1}:`, {
          id: node.id,
          type: node.type,
          hasData: !!node.data,
          platform: node.data?.platform,
          stepType: node.data?.stepType
        });

        // Enhanced node type validation
        const nodeType = nodeTypes[node.type as keyof typeof nodeTypes] ? node.type : 'actionNode';
        
        // Enhanced AI agent integration
        const isAIAgentNode = node.type === 'aiAgentNode' || node.data?.stepType === 'ai_agent_call';
        let aiAgentRecommendation = null;
        
        if (isAIAgentNode) {
          // Look for FileProcessingAgent or similar recommendations
          aiAgentRecommendation = aiAgentRecommendations.find(agent => 
            agent?.name && (
              agent.name.toLowerCase().includes('fileprocessing') ||
              agent.name.toLowerCase().includes('processing') ||
              node.data?.agent?.agent_id === agent.name
            )
          );
        }
        
        const processedNode = {
          ...node,
          id: node.id || `node-${Date.now()}-${index}`,
          type: nodeType,
          position: {
            x: typeof node.position?.x === 'number' ? node.position.x : 50 + (index * NODE_WIDTH),
            y: typeof node.position?.y === 'number' ? node.position.y : 100
          },
          data: {
            ...node.data,
            label: node.data?.label || node.data?.explanation || `Step ${index + 1}`,
            clickToExpand: true,
            ...(aiAgentRecommendation && {
              isRecommended: true,
              onAdd: () => onAgentAdd?.(aiAgentRecommendation),
              onDismiss: () => onAgentDismiss?.(aiAgentRecommendation.name)
            })
          },
          draggable: true,
          selectable: true,
          connectable: false
        };
        
        console.log('✅ Enhanced processed node:', {
          id: processedNode.id,
          type: processedNode.type,
          label: processedNode.data.label,
          platform: processedNode.data.platform
        });
        
        return processedNode;
      });
      
      // Enhanced edge processing
      const processedEdges = automationDiagramData.edges.map((edge, index) => {
        console.log(`🔗 Enhanced processing edge ${index + 1}:`, {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        });

        return {
          ...edge,
          id: edge.id || `edge-${Date.now()}-${index}`,
          type: edge.type || 'smoothstep',
          animated: edge.animated !== false,
          style: {
            stroke: edge.style?.stroke || '#3b82f6',
            strokeWidth: edge.style?.strokeWidth || 2,
            ...edge.style
          },
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined
        };
      });
      
      // Enhanced edge validation
      const nodeIds = new Set(processedNodes.map(n => n.id));
      const validEdges = processedEdges.filter(edge => {
        const isValid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
        if (!isValid) {
          console.warn(`⚠️ Invalid edge: ${edge.source} -> ${edge.target}`);
        }
        return isValid;
      });
      
      if (validEdges.length < processedEdges.length) {
        console.warn(`⚠️ Filtered out ${processedEdges.length - validEdges.length} invalid edges`);
      }
      
      // Apply compact layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getDynamicLayoutedElements(
        processedNodes, 
        validEdges
      );
      
      console.log('✅ Setting compact diagram with AI integration:', {
        nodes: layoutedNodes.length,
        edges: layoutedEdges.length,
        aiAgentNodes: layoutedNodes.filter(n => n.data?.stepType === 'ai_agent_call').length
      });
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      if (automationDiagramData.warning) {
        console.warn('⚠️ Diagram warning:', automationDiagramData.warning);
        setDiagramError(automationDiagramData.warning);
      }
      
    } else if (automationBlueprint?.steps?.length > 0) {
      console.log('⚠️ No diagram available - should regenerate with compact layout');
      setDiagramError('Compact diagram needs to be generated. Click "Regenerate" to create a complete flow diagram with proper spacing and expandable nodes.');
      setNodes([]);
      setEdges([]);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [automationDiagramData, automationBlueprint, aiAgentRecommendations, analyzeBlueprint, onAgentAdd, onAgentDismiss]);

  const onConnect = useCallback((params: any) => {
    console.log('🔗 Connection attempt (read-only):', params);
  }, []);

  // Enhanced manual layout
  const onLayout = useCallback(() => {
    console.log('🎯 Manual enhanced re-layout triggered');
    const { nodes: layoutedNodes, edges: layoutedEdges } = getDynamicLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges]);

  // Enhanced loading state
  if (isGenerating) {
    return (
      <Card className="h-full bg-gradient-to-br from-white/95 to-blue-50/30 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden" 
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 60px rgba(59, 130, 246, 0.15)' }}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="animate-spin w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-purple-200 border-b-purple-600 rounded-full mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.8s' }}></div>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Generating Enhanced Flow Diagram
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Creating all automation nodes with proper connections and platform icons...
              </p>
              {componentStats && (
                <div className="text-sm text-gray-500 space-y-2 bg-white/50 rounded-lg p-4 border border-gray-200">
                  <div>Expected steps: <span className="font-medium">{componentStats.totalSteps}</span></div>
                  <div>Platforms: <span className="font-medium">{componentStats.platforms.length}</span></div>
                  <div>Conditions: <span className="font-medium">{componentStats.conditions}</span></div>
                  <div>AI Agents: <span className="font-medium">{componentStats.agents.length}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Enhanced empty state
  if (!nodes.length && !automationBlueprint?.steps?.length) {
    return (
      <Card className="h-full bg-gradient-to-br from-white/95 to-purple-50/30 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 60px rgba(147, 51, 234, 0.15)' }}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-8 max-w-lg">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <Sparkles className="w-12 h-12 text-purple-600" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Ready to Build Enhanced Flow
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Start describing your automation, and I'll generate a complete visual flow diagram with all steps, conditions, and platform integrations.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-gradient-to-br from-white/98 to-blue-50/20 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden relative"
          style={{ 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 80px rgba(59, 130, 246, 0.1)',
            minHeight: '600px'
          }}>
      
      {/* Enhanced React Flow */}
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
