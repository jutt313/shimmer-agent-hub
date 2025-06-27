
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
import { Sparkles, Zap, AlertCircle, RefreshCw } from 'lucide-react';
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
  automationDiagramData?: { nodes: Node[]; edges: Edge[] } | null;
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

  // Count all steps in blueprint including nested ones
  const countAllSteps = useCallback((steps: any[]): number => {
    let count = 0;
    steps.forEach(step => {
      count++;
      if (step.condition) {
        if (step.condition.if_true) count += countAllSteps(step.condition.if_true);
        if (step.condition.if_false) count += countAllSteps(step.condition.if_false);
      }
      if (step.loop && step.loop.steps) count += countAllSteps(step.loop.steps);
      if (step.retry && step.retry.steps) count += countAllSteps(step.retry.steps);
      if (step.fallback) {
        if (step.fallback.primary_steps) count += countAllSteps(step.fallback.primary_steps);
        if (step.fallback.fallback_steps) count += countAllSteps(step.fallback.fallback_steps);
      }
    });
    return count;
  }, []);

  // Load diagram data when available
  useEffect(() => {
    console.log('🔄 AutomationDiagramDisplay - Loading diagram data');
    console.log('🔄 AI diagram data available:', !!automationDiagramData);
    console.log('🔄 Blueprint available:', !!automationBlueprint);
    
    setDiagramError(null);

    if (automationDiagramData && automationDiagramData.nodes && automationDiagramData.edges) {
      const nodeCount = automationDiagramData.nodes.length;
      const edgeCount = automationDiagramData.edges.length;
      const expectedSteps = automationBlueprint?.steps ? countAllSteps(automationBlueprint.steps) : 0;
      
      console.log('🎨 Loading AI-generated diagram:', {
        nodes: nodeCount,
        edges: edgeCount,
        expectedSteps: expectedSteps
      });

      // Validate the AI diagram
      if (nodeCount < expectedSteps * 0.7) {
        console.warn(`⚠️ AI diagram incomplete: ${nodeCount} nodes vs ${expectedSteps} expected steps`);
        setDiagramError(`AI diagram is incomplete: Generated ${nodeCount} nodes but expected around ${expectedSteps} steps`);
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
      console.log('⚠️ No AI diagram data, creating fallback layout');
      setDiagramError('AI diagram generation failed - using fallback layout');
      createComprehensiveFallbackDiagram();
      setDiagramSource('fallback');
    } else {
      console.log('📝 No blueprint or diagram data available');
      setNodes([]);
      setEdges([]);
      setDiagramSource('none');
    }
  }, [automationDiagramData, automationBlueprint, aiAgentRecommendations, countAllSteps]);

  const createComprehensiveFallbackDiagram = () => {
    if (!automationBlueprint?.steps) return;

    console.log('🏗️ Creating comprehensive fallback diagram');
    
    const fallbackNodes: Node[] = [];
    const fallbackEdges: Edge[] = [];
    let nodeCounter = 0;

    // Process all steps including nested ones
    const processSteps = (steps: any[], startX: number, startY: number, parentId?: string) => {
      let currentX = startX;
      let lastNodeId = parentId;

      steps.forEach((step, index) => {
        const nodeId = step.id || `fallback-step-${nodeCounter++}`;
        
        // Determine node type based on step type - CRITICAL: Use platformNode for actions
        let nodeType = 'platformNode'; // default for actions
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
            label: step.name || getStepLabel(step),
            explanation: getStepExplanation(step),
            platform: step.action?.integration || 'unknown',
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
            id: `fallback-${lastNodeId}-${nodeId}`,
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

        // Process nested steps with proper branching
        if (step.condition) {
          if (step.condition.if_true) {
            const trueBranchLastNode = processSteps(step.condition.if_true, currentX + 400, startY - 150, nodeId);
            // Add green edge for true branch
            if (step.condition.if_true.length > 0) {
              fallbackEdges.push({
                id: `condition-true-${nodeId}-${step.condition.if_true[0].id || `fallback-step-${nodeCounter}`}`,
                source: nodeId,
                target: step.condition.if_true[0].id || `fallback-step-${nodeCounter}`,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5,5' },
                label: 'Yes',
                labelStyle: { fill: '#10b981', fontWeight: 600 }
              });
            }
          }
          if (step.condition.if_false) {
            const falseBranchLastNode = processSteps(step.condition.if_false, currentX + 400, startY + 150, nodeId);
            // Add red edge for false branch
            if (step.condition.if_false.length > 0) {
              fallbackEdges.push({
                id: `condition-false-${nodeId}-${step.condition.if_false[0].id || `fallback-step-${nodeCounter}`}`,
                source: nodeId,
                target: step.condition.if_false[0].id || `fallback-step-${nodeCounter}`,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,5' },
                label: 'No',
                labelStyle: { fill: '#ef4444', fontWeight: 600 }
              });
            }
          }
        }

        if (step.loop && step.loop.steps) {
          processSteps(step.loop.steps, currentX + 400, startY - 80, nodeId);
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

    // Start processing from the main steps
    processSteps(automationBlueprint.steps, 100, 300);

    console.log(`📊 Created comprehensive fallback diagram with ${fallbackNodes.length} nodes and ${fallbackEdges.length} edges`);
    setNodes(fallbackNodes);
    setEdges(fallbackEdges);
  };

  const getNodeType = (stepType: string): string => {
    switch (stepType) {
      case 'condition': return 'conditionNode';
      case 'loop': return 'loopNode';
      case 'delay': return 'delayNode';
      case 'ai_agent_call': return 'aiAgentNode';
      case 'retry': return 'retryNode';
      case 'fallback': return 'fallbackNode';
      case 'action':
      default: return 'platformNode';
    }
  };

  const getStepLabel = (step: any): string => {
    switch (step.type) {
      case 'action':
        return step.action?.integration || 'Action';
      case 'condition':
        return 'Condition Check';
      case 'loop':
        return 'Loop Process';
      case 'ai_agent_call':
        return `AI Agent: ${step.ai_agent_call?.agent_id || 'Agent'}`;
      case 'delay':
        return 'Delay';
      case 'retry':
        return 'Retry Logic';
      case 'fallback':
        return 'Fallback Handler';
      default:
        return step.name || 'Step';
    }
  };

  const getStepExplanation = (step: any): string => {
    switch (step.type) {
      case 'action':
        return `${step.action?.method || 'Action'} on ${step.action?.integration || 'platform'}`;
      case 'condition':
        return `If ${step.condition?.expression || 'condition'}`;
      case 'loop':
        return `For each in ${step.loop?.array_source || 'data'}`;
      case 'ai_agent_call':
        return `AI Agent: ${step.ai_agent_call?.agent_id || 'unknown'}`;
      case 'delay':
        return `Wait ${step.delay?.duration_seconds || 0}s`;
      case 'retry':
        return `Retry up to ${step.retry?.max_attempts || 3} times`;
      case 'fallback':
        return 'Primary with fallback';
      default:
        return step.name || 'Automation step';
    }
  };

  const onConnect = useCallback((params: any) => {
    console.log('Connection attempt:', params);
  }, []);

  const minimapStyle = {
    height: 140,
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  };

  const expectedSteps = automationBlueprint?.steps ? countAllSteps(automationBlueprint.steps) : 0;

  if (isGenerating) {
    return (
      <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">AI is Creating Your Complete Diagram</h3>
              <p className="text-sm text-gray-600">Analyzing all {expectedSteps} automation steps and generating comprehensive visual flow...</p>
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
      {/* Enhanced header with comprehensive information */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="bg-white/90 text-gray-700 border border-gray-200/50">
          <Sparkles className="w-3 h-3 mr-1" />
          {diagramSource === 'ai' ? 'AI-Generated Flow' : 'Fallback Layout'}
        </Badge>
        
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {nodes.length} Nodes ({expectedSteps} Expected)
        </Badge>
        
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
            Error Detected
          </Badge>
        )}
      </div>

      {/* Error message and regenerate button */}
      {diagramError && onRegenerateDiagram && (
        <div className="absolute top-16 left-4 z-20 bg-red-50 border border-red-200 rounded-lg p-3 max-w-md">
          <p className="text-sm text-red-700 mb-2">{diagramError}</p>
          <Button 
            onClick={onRegenerateDiagram}
            size="sm"
            className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
        </div>
      )}

      {/* React Flow Diagram - Enhanced with better controls */}
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
              minZoom: 0.1,
              maxZoom: 1.5
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
              gap={20} 
              size={1}
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
              nodeColor="#8b5cf6"
              nodeStrokeColor="#7c3aed"
              nodeStrokeWidth={2}
              maskColor="rgba(255, 255, 255, 0.7)"
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
