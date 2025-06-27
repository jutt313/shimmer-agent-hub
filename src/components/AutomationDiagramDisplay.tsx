
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
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ActionNode from './diagram/ActionNode';
import PlatformNode from './diagram/PlatformNode';
import ConditionNode from './diagram/ConditionNode';
import LoopNode from './diagram/LoopNode';
import DelayNode from './diagram/DelayNode';
import AIAgentNode from './diagram/AIAgentNode';
import RetryNode from './diagram/RetryNode';
import FallbackNode from './diagram/FallbackNode';
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

const nodeTypes = {
  actionNode: ActionNode,
  platformNode: PlatformNode,
  conditionNode: ConditionNode,
  loopNode: LoopNode,
  delayNode: DelayNode,
  aiAgentNode: AIAgentNode,
  retryNode: RetryNode,
  fallbackNode: FallbackNode,
  triggerNode: PlatformNode, // Use PlatformNode for triggers too
};

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
  const [diagramSource, setDiagramSource] = useState<'ai' | 'fallback' | 'none'>('none');
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

  // COMPREHENSIVE component counting
  const analyzeBlueprint = useCallback((blueprint: AutomationBlueprint) => {
    let totalSteps = 0;
    const platforms = new Set<string>();
    const agents = new Set<string>();
    let conditions = 0;
    let loops = 0;
    let delays = 0;
    let retries = 0;
    let fallbacks = 0;

    const processSteps = (steps: any[]) => {
      steps.forEach(step => {
        totalSteps++;
        
        if (step.action?.integration) platforms.add(step.action.integration);
        if (step.ai_agent_call?.agent_id) agents.add(step.ai_agent_call.agent_id);
        
        if (step.type === 'condition') {
          conditions++;
          if (step.condition?.if_true) processSteps(step.condition.if_true);
          if (step.condition?.if_false) processSteps(step.condition.if_false);
        }
        if (step.type === 'loop') {
          loops++;
          if (step.loop?.steps) processSteps(step.loop.steps);
        }
        if (step.type === 'delay') delays++;
        if (step.type === 'retry') {
          retries++;
          if (step.retry?.steps) processSteps(step.retry.steps);
        }
        if (step.type === 'fallback') {
          fallbacks++;
          if (step.fallback?.primary_steps) processSteps(step.fallback.primary_steps);
          if (step.fallback?.fallback_steps) processSteps(step.fallback.fallback_steps);
        }
      });
    };

    if (blueprint.steps) processSteps(blueprint.steps);
    
    return {
      totalSteps,
      platforms: Array.from(platforms),
      agents: Array.from(agents),
      conditions,
      loops,
      delays,
      retries,
      fallbacks,
      expectedMinNodes: totalSteps + platforms.size + agents.size + 1
    };
  }, []);

  // Load diagram data when available
  useEffect(() => {
    console.log('🔄 COMPREHENSIVE AutomationDiagramDisplay - Loading diagram data');
    console.log('🔄 AI diagram data available:', !!automationDiagramData);
    console.log('🔄 Blueprint available:', !!automationBlueprint);
    
    setDiagramError(null);

    // Analyze blueprint for comprehensive stats
    if (automationBlueprint) {
      const stats = analyzeBlueprint(automationBlueprint);
      setComponentStats(stats);
      console.log('📊 COMPREHENSIVE BLUEPRINT ANALYSIS:', stats);
    }

    if (automationDiagramData && automationDiagramData.nodes && automationDiagramData.edges) {
      const nodeCount = automationDiagramData.nodes.length;
      const edgeCount = automationDiagramData.edges.length;
      const expectedNodes = componentStats?.expectedMinNodes || 0;
      
      console.log('🎨 Loading COMPREHENSIVE AI-generated diagram:', {
        nodes: nodeCount,
        edges: edgeCount,
        expectedNodes: expectedNodes,
        warning: automationDiagramData.warning
      });

      // Check for AI warning
      if (automationDiagramData.warning) {
        setDiagramError(automationDiagramData.warning);
      } else if (nodeCount < expectedNodes * 0.7) {
        setDiagramError(`Incomplete diagram: Generated ${nodeCount} nodes but expected around ${expectedNodes} components`);
      }
      
      // Process nodes to add agent recommendations and handlers
      const processedNodes = automationDiagramData.nodes.map(node => {
        const recommendation = aiAgentRecommendations.find(agent => 
          node.type === 'aiAgentNode' && 
          agent && 
          agent.name && 
          node.data?.agent && 
          typeof node.data.agent === 'object' && 
          'agent_id' in node.data.agent &&
          agent.name === node.data.agent.agent_id
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
      
      setNodes(processedNodes);
      setEdges(automationDiagramData.edges);
      setDiagramSource('ai');
      
    } else if (automationBlueprint && automationBlueprint.steps && automationBlueprint.steps.length > 0) {
      console.log('⚠️ No AI diagram data, creating COMPREHENSIVE fallback layout');
      setDiagramError('AI diagram generation failed - using comprehensive fallback layout');
      createComprehensiveFallbackDiagram();
      setDiagramSource('fallback');
    } else {
      console.log('📝 No blueprint or diagram data available');
      setNodes([]);
      setEdges([]);
      setDiagramSource('none');
    }
  }, [automationDiagramData, automationBlueprint, aiAgentRecommendations, analyzeBlueprint, componentStats]);

  const createComprehensiveFallbackDiagram = () => {
    if (!automationBlueprint?.steps) return;

    console.log('🏗️ Creating COMPREHENSIVE fallback diagram');
    
    const fallbackNodes: Node[] = [];
    const fallbackEdges: Edge[] = [];
    let nodeCounter = 0;

    // Add trigger node first
    const triggerNode: Node = {
      id: 'trigger-node',
      type: 'triggerNode',
      position: { x: 100, y: 300 },
      data: {
        label: 'Manual Trigger',
        explanation: 'Automation trigger point',
        platform: 'system',
        icon: 'play',
        stepType: 'trigger'
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    fallbackNodes.push(triggerNode);

    // COMPREHENSIVE step processing
    const processSteps = (steps: any[], startX: number, startY: number, parentId?: string) => {
      let currentX = startX;
      let lastNodeId = parentId || 'trigger-node';

      steps.forEach((step, index) => {
        const nodeId = step.id || `comprehensive-step-${nodeCounter++}`;
        
        // Determine node type with COMPREHENSIVE coverage
        let nodeType = 'platformNode'; // default
        if (step.type === 'condition') nodeType = 'conditionNode';
        else if (step.type === 'loop') nodeType = 'loopNode';
        else if (step.type === 'delay') nodeType = 'delayNode';
        else if (step.type === 'ai_agent_call') nodeType = 'aiAgentNode';
        else if (step.type === 'retry') nodeType = 'retryNode';
        else if (step.type === 'fallback') nodeType = 'fallbackNode';
        
        const node: Node = {
          id: nodeId,
          type: nodeType,
          position: { x: currentX, y: startY },
          data: {
            label: step.name || getComprehensiveStepLabel(step),
            explanation: getComprehensiveStepExplanation(step),
            platform: step.action?.integration || 'system',
            icon: step.action?.integration?.toLowerCase() || 'settings',
            action: step.action,
            condition: step.condition,
            loop: step.loop,
            delay: step.delay,
            agent: step.ai_agent_call,
            retry: step.retry,
            fallback: step.fallback,
            stepType: step.type
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };

        fallbackNodes.push(node);

        // Connect to previous node
        if (lastNodeId) {
          fallbackEdges.push({
            id: `comprehensive-${lastNodeId}-${nodeId}`,
            source: lastNodeId,
            target: nodeId,
            type: 'smoothstep',
            animated: true,
            style: { 
              stroke: '#94a3b8', 
              strokeWidth: 2,
              strokeDasharray: '5,5'
            }
          });
        }

        // COMPREHENSIVE nested processing
        if (step.condition) {
          if (step.condition.if_true && step.condition.if_true.length > 0) {
            processSteps(step.condition.if_true, currentX + 400, startY - 200, nodeId);
          }
          if (step.condition.if_false && step.condition.if_false.length > 0) {
            processSteps(step.condition.if_false, currentX + 400, startY + 200, nodeId);
          }
        }

        if (step.loop && step.loop.steps) {
          processSteps(step.loop.steps, currentX + 400, startY - 100, nodeId);
        }

        if (step.retry && step.retry.steps) {
          processSteps(step.retry.steps, currentX + 400, startY, nodeId);
        }

        if (step.fallback) {
          if (step.fallback.primary_steps) {
            processSteps(step.fallback.primary_steps, currentX + 400, startY - 100, nodeId);
          }
          if (step.fallback.fallback_steps) {
            processSteps(step.fallback.fallback_steps, currentX + 400, startY + 100, nodeId);
          }
        }

        currentX += 400;
        lastNodeId = nodeId;
      });

      return lastNodeId;
    };

    // Start comprehensive processing
    processSteps(automationBlueprint.steps, 500, 300);

    console.log(`📊 Created COMPREHENSIVE fallback diagram with ${fallbackNodes.length} nodes and ${fallbackEdges.length} edges`);
    setNodes(fallbackNodes);
    setEdges(fallbackEdges);
  };

  const getComprehensiveStepLabel = (step: any): string => {
    switch (step.type) {
      case 'action':
        return `${step.action?.integration || 'Action'}: ${step.action?.method || 'Execute'}`;
      case 'condition':
        return `Decision: ${step.condition?.expression || 'Check condition'}`;
      case 'loop':
        return `Loop: ${step.loop?.array_source || 'Iterate items'}`;
      case 'ai_agent_call':
        return `AI Agent: ${step.ai_agent_call?.agent_id || 'Agent Call'}`;
      case 'delay':
        return `Wait: ${step.delay?.duration_seconds || 0}s`;
      case 'retry':
        return `Retry: ${step.retry?.max_attempts || 3}x max`;
      case 'fallback':
        return 'Fallback: Primary + Backup';
      default:
        return step.name || `Step: ${step.type || 'Unknown'}`;
    }
  };

  const getComprehensiveStepExplanation = (step: any): string => {
    switch (step.type) {
      case 'action':
        return `Execute ${step.action?.method || 'action'} on ${step.action?.integration || 'platform'} with specific parameters`;
      case 'condition':
        return `Evaluate: ${step.condition?.expression || 'condition'} and branch execution accordingly`;
      case 'loop':
        return `Iterate through ${step.loop?.array_source || 'data collection'} and execute sub-steps for each item`;
      case 'ai_agent_call':
        return `Call AI Agent "${step.ai_agent_call?.agent_id || 'unknown'}" with input and capture output`;
      case 'delay':
        return `Pause execution for ${step.delay?.duration_seconds || 0} seconds before continuing`;
      case 'retry':
        return `Attempt execution up to ${step.retry?.max_attempts || 3} times with error handling`;
      case 'fallback':
        return 'Execute primary steps, fall back to alternate steps if primary fails';
      default:
        return step.name || `Process automation step of type: ${step.type || 'unknown'}`;
    }
  };

  const onConnect = useCallback((params: any) => {
    console.log('Connection attempt:', params);
  }, []);

  const minimapStyle = {
    height: 160,
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  };

  if (isGenerating) {
    return (
      <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">AI is Creating Your COMPREHENSIVE Diagram</h3>
              <p className="text-sm text-gray-600">
                Analyzing all {componentStats?.totalSteps || 0} steps, {componentStats?.platforms?.length || 0} platforms, 
                {componentStats?.agents?.length || 0} agents and generating complete visual flow...
              </p>
              {componentStats && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Expected minimum nodes: {componentStats.expectedMinNodes}</div>
                  <div>Platforms: {componentStats.platforms.join(', ')}</div>
                  <div>System components: {componentStats.conditions + componentStats.loops + componentStats.delays + componentStats.retries + componentStats.fallbacks}</div>
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
      <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">No Automation Blueprint Yet</h3>
              <p className="text-sm text-gray-600">
                Start chatting with YusrAI to build your automation, and a comprehensive diagram will be generated automatically.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden relative">
      {/* COMPREHENSIVE header with detailed information */}
      <div className="absolute top-4 left-4 z-20 flex items-start gap-3 flex-wrap max-w-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-white/90 text-gray-700 border border-gray-200/50">
            <Sparkles className="w-3 h-3 mr-1" />
            {diagramSource === 'ai' ? 'AI-Generated Comprehensive Flow' : 'Comprehensive Fallback Layout'}
          </Badge>
          
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {nodes.length} Nodes
            {componentStats && ` (${componentStats.expectedMinNodes} Expected)`}
          </Badge>
          
          {componentStats && (
            <Button
              onClick={() => setShowDetails(!showDetails)}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
            >
              {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              Details
            </Button>
          )}
        </div>

        {showDetails && componentStats && (
          <div className="w-full bg-white/95 rounded-lg p-3 border border-gray-200/50 text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-gray-700">Total Steps:</span>
                <span className="ml-1 text-gray-600">{componentStats.totalSteps}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Platforms:</span>
                <span className="ml-1 text-gray-600">{componentStats.platforms.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">AI Agents:</span>
                <span className="ml-1 text-gray-600">{componentStats.agents.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Conditions:</span>
                <span className="ml-1 text-gray-600">{componentStats.conditions}</span>
              </div>
            </div>
            {componentStats.platforms.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Platforms:</span>
                <span className="ml-1 text-gray-600">{componentStats.platforms.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {diagramSource === 'ai' ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              AI Complete
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Fallback Mode
            </Badge>
          )}

          {diagramError && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Issue Detected
            </Badge>
          )}
        </div>
      </div>

      {/* Error message and regenerate button */}
      {diagramError && onRegenerateDiagram && (
        <div className="absolute top-20 left-4 z-20 bg-red-50 border border-red-200 rounded-lg p-3 max-w-lg">
          <p className="text-sm text-red-700 mb-2">{diagramError}</p>
          <Button 
            onClick={onRegenerateDiagram}
            size="sm"
            className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate Comprehensive
          </Button>
        </div>
      )}

      {/* React Flow Diagram - COMPREHENSIVE with enhanced controls */}
      <ReactFlowProvider>
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
              padding: 0.15,
              minZoom: 0.08,
              maxZoom: 2.0
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
            attributionPosition="bottom-right"
            proOptions={{ hideAttribution: true }}
          >
            <Background 
              color="#e2e8f0" 
              gap={25} 
              size={1.5}
              variant={BackgroundVariant.Dots}
            />
            <Controls 
              className="bg-white/90 border border-gray-200/50 rounded-lg shadow-lg"
              position="bottom-left"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            <MiniMap 
              style={minimapStyle}
              nodeColor={(node) => {
                switch (node.type) {
                  case 'platformNode': return '#3b82f6';
                  case 'conditionNode': return '#f97316';
                  case 'loopNode': return '#8b5cf6';
                  case 'aiAgentNode': return '#10b981';
                  case 'delayNode': return '#64748b';
                  case 'retryNode': return '#f59e0b';
                  case 'fallbackNode': return '#6366f1';
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
      </ReactFlowProvider>
    </Card>
  );
};

export default AutomationDiagramDisplay;
