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
import { Sparkles, Zap, AlertCircle } from 'lucide-react';
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
}

// Enhanced node types registry with new PlatformNode
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
  isGenerating = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [aiAgentRecommendations, setAiAgentRecommendations] = useState<any[]>([]);

  // Extract AI agent recommendations from messages
  useEffect(() => {
    const recommendations: any[] = [];
    messages.forEach(message => {
      if (message.isBot && message.structuredData?.ai_agents) {
        message.structuredData.ai_agents.forEach((agent: any) => {
          if (!dismissedAgents.has(agent.name)) {
            recommendations.push(agent);
          }
        });
      }
    });
    setAiAgentRecommendations(recommendations);
  }, [messages, dismissedAgents]);

  // Load diagram data when available
  useEffect(() => {
    if (automationDiagramData && automationDiagramData.nodes && automationDiagramData.edges) {
      console.log('🎨 Loading AI-generated diagram data:', {
        nodes: automationDiagramData.nodes.length,
        edges: automationDiagramData.edges.length
      });
      
      // Process nodes to add agent recommendations and handlers
      const processedNodes = automationDiagramData.nodes.map(node => {
        // Check if this is an AI agent node that matches a recommendation
        const recommendation = aiAgentRecommendations.find(agent => 
          node.type === 'aiAgentNode' && agent.name === node.data?.agent?.agent_id
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
    } else if (automationBlueprint && automationBlueprint.steps && automationBlueprint.steps.length > 0) {
      console.log('⚠️ No AI diagram data, creating enhanced fallback layout');
      createEnhancedFallbackDiagram();
    } else {
      console.log('📝 No blueprint or diagram data available');
      setNodes([]);
      setEdges([]);
    }
  }, [automationDiagramData, automationBlueprint, aiAgentRecommendations]);

  const createEnhancedFallbackDiagram = () => {
    if (!automationBlueprint?.steps) return;

    const fallbackNodes: Node[] = [];
    const fallbackEdges: Edge[] = [];

    automationBlueprint.steps.forEach((step, index) => {
      const nodeId = step.id || `step-${index}`;
      
      // Use platformNode for actions, appropriate node types for others
      const nodeType = step.type === 'action' ? 'platformNode' : getNodeType(step.type);
      
      const node: Node = {
        id: nodeId,
        type: nodeType,
        position: { x: 100 + (index * 350), y: 300 },
        data: {
          label: step.name || `Step ${index + 1}`,
          explanation: getStepExplanation(step),
          platform: step.action?.integration,
          icon: step.action?.integration?.toLowerCase(),
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

      // Create edge to next step with dotted lines
      if (index < automationBlueprint.steps.length - 1) {
        const nextStepId = automationBlueprint.steps[index + 1].id || `step-${index + 1}`;
        fallbackEdges.push({
          id: `${nodeId}-${nextStepId}`,
          source: nodeId,
          target: nextStepId,
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#94a3b8', 
            strokeWidth: 2,
            strokeDasharray: '5,5'
          }
        });
      }
    });

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
      default: return 'actionNode';
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
        return 'Automation step';
    }
  };

  const onConnect = useCallback((params: any) => {
    console.log('Connection attempt:', params);
  }, []);

  const minimapStyle = {
    height: 120,
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
              <h3 className="text-lg font-semibold text-gray-800">AI is Creating Your Diagram</h3>
              <p className="text-sm text-gray-600">Analyzing your automation blueprint and generating a clear visual flow...</p>
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
                Start chatting with YusrAI to build your automation, and an intelligent diagram will be generated automatically.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden relative">
      {/* Header with improved badges */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <Badge variant="secondary" className="bg-white/90 text-gray-700 border border-gray-200/50">
          <Sparkles className="w-3 h-3 mr-1" />
          AI-Generated Flow
        </Badge>
        
        {automationDiagramData ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {nodes.length} Steps • Clear Flow
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Fallback Layout
          </Badge>
        )}
      </div>

      {/* React Flow Diagram - Larger and cleaner */}
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
              minZoom: 0.2,
              maxZoom: 1.5
            }}
            className="bg-gradient-to-br from-slate-50/50 to-blue-50/30"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
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
            />
            <MiniMap 
              style={minimapStyle}
              nodeColor="#8b5cf6"
              nodeStrokeColor="#7c3aed"
              nodeStrokeWidth={2}
              maskColor="rgba(255, 255, 255, 0.8)"
              position="bottom-right"
            />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </Card>
  );
};

export default AutomationDiagramDisplay;
