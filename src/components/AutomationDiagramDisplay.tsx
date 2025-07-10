
import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { agentStateManager } from '@/utils/agentStateManager';

interface AutomationDiagramDisplayProps {
  automationBlueprint: any;
  automationDiagramData: { nodes: any[]; edges: any[] } | null;
  messages: any[];
  onAgentAdd?: (agent: any) => void;
  onAgentDismiss?: (agentName: string) => void;
  dismissedAgents?: Set<string>;
  isGenerating?: boolean;
  onRegenerateDiagram?: (userFeedback?: string) => void;
}

interface NodeData {
  label?: string;
  description?: string;
  stepType?: string;
  platform?: string;
  agentData?: any;
  showActions?: boolean;
  onAgentAdd?: (agent: any) => void;
  onAgentDismiss?: (agentName: string) => void;
  isRecommended?: boolean;
  status?: string;
}

const aiAgentNodeStyle: React.CSSProperties = {
  background: '#D4E3FF',
  border: '2px solid #7A9DDC',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '200px',
  textAlign: 'center' as const,
};

const triggerNodeStyle: React.CSSProperties = {
  background: '#E2F7D4',
  border: '2px solid #9DDC7A',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '200px',
  textAlign: 'center' as const,
};

const actionNodeStyle: React.CSSProperties = {
  background: '#FFF3CD',
  border: '2px solid #DDA64B',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '200px',
  textAlign: 'center' as const,
};

const conditionNodeStyle: React.CSSProperties = {
  background: '#FFD4D4',
  border: '2px solid #DC7A7A',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '200px',
  textAlign: 'center' as const,
};

const endNodeStyle: React.CSSProperties = {
  background: '#EEEEEE',
  border: '2px solid #999999',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '150px',
  textAlign: 'center' as const,
};

const CustomAINodeComponent = ({ data }: NodeProps) => {
  const nodeData = data as NodeData;
  
  const handleAgentAdd = () => {
    if (nodeData?.agentData && nodeData?.showActions && nodeData?.onAgentAdd) {
      nodeData.onAgentAdd(nodeData.agentData);
    }
  };

  const handleAgentDismiss = () => {
    if (nodeData?.agentData && nodeData?.showActions && nodeData?.onAgentDismiss && nodeData?.agentData?.name) {
      nodeData.onAgentDismiss(nodeData.agentData.name);
    }
  };

  return (
    <div style={aiAgentNodeStyle}>
      <h4>{nodeData?.label || 'AI Agent'}</h4>
      <p>{nodeData?.description || 'AI Agent Description'}</p>
      {nodeData?.showActions && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={handleAgentAdd} className="bg-green-500 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
          <Button size="sm" variant="outline" onClick={handleAgentDismiss} className="border-red-500 text-red-500 hover:bg-red-100">
            <X className="w-4 h-4 mr-2" />
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
};

const CustomTriggerNodeComponent = ({ data }: NodeProps) => {
  const nodeData = data as NodeData;
  return (
    <div style={triggerNodeStyle}>
      <h4>{nodeData?.label || 'Trigger'}</h4>
      <p>{nodeData?.description || 'Trigger Description'}</p>
    </div>
  );
};

const CustomActionNodeComponent = ({ data }: NodeProps) => {
  const nodeData = data as NodeData;
  return (
    <div style={actionNodeStyle}>
      <h4>{nodeData?.label || 'Action'}</h4>
      <p>{nodeData?.description || 'Action Description'}</p>
    </div>
  );
};

const CustomConditionNodeComponent = ({ data }: NodeProps) => {
  const nodeData = data as NodeData;
  return (
    <div style={conditionNodeStyle}>
      <h4>{nodeData?.label || 'Condition'}</h4>
      <p>{nodeData?.description || 'Condition Description'}</p>
    </div>
  );
};

const CustomEndNodeComponent = ({ data }: NodeProps) => {
  const nodeData = data as NodeData;
  return (
    <div style={endNodeStyle}>
      <h4>{nodeData?.label || 'End'}</h4>
      <p>{nodeData?.description || 'End Description'}</p>
    </div>
  );
};

const AutomationDiagramDisplay = ({
  automationBlueprint,
  automationDiagramData,
  messages,
  onAgentAdd,
  onAgentDismiss,
  dismissedAgents = new Set(),
  isGenerating = false,
  onRegenerateDiagram
}: AutomationDiagramDisplayProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({
    aiAgentNode: CustomAINodeComponent,
    triggerNode: CustomTriggerNodeComponent,
    actionNode: CustomActionNodeComponent,
    conditionNode: CustomConditionNodeComponent,
    endNode: CustomEndNodeComponent,
  }), []);

  const processNodesWithAgentLogic = (nodes: Node[], messages: any[]) => {
    try {
      if (!Array.isArray(nodes)) return [];

      return nodes.map(node => {
        // Check if this is an AI agent node
        if (node.type === 'aiAgentNode' || node.data?.stepType === 'aiAgent' || node.data?.stepType === 'ai_agent_call') {
          console.log('🤖 Processing AI agent node:', node.id, node.data);
          
          // Get the latest agent recommendations from messages
          const latestBotMessage = messages?.filter(msg => msg.isBot).pop();
          const recommendedAgents = latestBotMessage?.structuredData?.agents || [];
          
          // Find matching agent from recommendations
          const matchingAgent = recommendedAgents.find((agent: any) => 
            agent.name && (
              String(node.data?.label || '').includes(String(agent.name)) ||
              String(node.data?.platform || '').includes(String(agent.name)) ||
              node.id?.includes(String(agent.name).toLowerCase().replace(/\s+/g, '-'))
            )
          );

          // Get agent status from state manager
          const agentName = matchingAgent?.name || node.data?.label || node.data?.platform || 'Unknown Agent';
          const agentStatus = agentStateManager.getAgentStatus(String(agentName));
          
          console.log('🔍 Agent status check:', {
            agentName,
            status: agentStatus,
            hasMatchingAgent: !!matchingAgent,
            nodeId: node.id
          });

          return {
            ...node,
            data: {
              ...node.data,
              isRecommended: true, // Always show AI agents as recommended
              agentData: matchingAgent || {
                name: agentName,
                role: node.data?.stepType || 'AI Agent',
                platform: node.data?.platform,
                why_needed: 'AI agent for automation enhancement'
              },
              status: agentStatus,
              showActions: agentStatus === 'pending', // Only show add/dismiss if pending
              onAgentAdd: onAgentAdd,
              onAgentDismiss: onAgentDismiss
            }
          };
        }

        return node;
      });
    } catch (error) {
      console.error('❌ Error processing nodes with agent logic:', error);
      return nodes || [];
    }
  };

  const isValidDiagramData = (data: any): boolean => {
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Diagram data is null or not an object');
      return false;
    }
  
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      console.warn('⚠️ Diagram data missing nodes or edges arrays');
      return false;
    }
  
    // Check if nodes and edges are non-empty arrays
    if (data.nodes.length === 0 || data.edges.length === 0) {
      console.warn('⚠️ Diagram data has empty nodes or edges');
      return false;
    }
  
    // Check if nodes have required properties
    for (const node of data.nodes) {
      if (!node.id || !node.type || !node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        console.warn('⚠️ Invalid node structure:', node);
        return false;
      }
    }
  
    // Check if edges have required properties
    for (const edge of data.edges) {
      if (!edge.id || !edge.source || !edge.target) {
        console.warn('⚠️ Invalid edge structure:', edge);
        return false;
      }
    }
  
    return true;
  };

  const applyLayout = (nodes: Node[], edges: Edge[]) => {
    if (!Array.isArray(nodes) || nodes.length === 0 || !Array.isArray(edges)) {
      console.warn('⚠️ No nodes or edges to apply layout');
      return { nodes: [], edges: [] };
    }
  
    const initialNodeY = 50;
    const nodeSpacingX = 300;
    const nodeSpacingY = 200;
  
    // Group nodes by their Y position
    const groupedNodes: { [y: number]: Node[] } = {};
    nodes.forEach(node => {
      const y = node.position.y || initialNodeY;
      if (!groupedNodes[y]) {
        groupedNodes[y] = [];
      }
      groupedNodes[y].push(node);
    });
  
    // Sort nodes within each group by their X position
    Object.keys(groupedNodes).forEach(y => {
      groupedNodes[Number(y)].sort((a, b) => (a.position.x || 0) - (b.position.x || 0));
    });
  
    let currentX = 50;
    let currentY = initialNodeY;
  
    const updatedNodes = nodes.map(node => {
      const y = node.position.y || initialNodeY;
      const group = groupedNodes[y];
      const index = group.findIndex(n => n.id === node.id);
  
      const updatedNode = {
        ...node,
        position: {
          x: currentX,
          y: currentY,
        },
      };
  
      currentX += nodeSpacingX;
  
      if (index === group.length - 1) {
        currentX = 50;
        currentY += nodeSpacingY;
      }
  
      return updatedNode;
    });
  
    return { nodes: updatedNodes, edges };
  };

  const processedNodes = useMemo(() => {
    if (!automationDiagramData?.nodes) return [];
    
    console.log('🔄 Processing diagram nodes with agent logic');
    const processed = processNodesWithAgentLogic(automationDiagramData.nodes, messages);
    console.log('✅ Processed nodes:', processed.length, 'agents found:', processed.filter(n => n.data?.isRecommended).length);
    
    return processed;
  }, [automationDiagramData?.nodes, messages, onAgentAdd, onAgentDismiss]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!isValidDiagramData(automationDiagramData)) {
      console.warn('⚠️ Invalid diagram data, using empty diagram');
      return { nodes: [], edges: [] };
    }
  
    console.log('📏 Applying layout to diagram');
    return applyLayout(processedNodes, automationDiagramData.edges);
  }, [processedNodes, automationDiagramData]);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const handleRegenerate = () => {
    if (onRegenerateDiagram) {
      onRegenerateDiagram();
    }
  };

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        className="bg-gray-50 rounded-lg"
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
      <div className="mt-4 flex justify-end">
        <Button onClick={handleRegenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Regenerate Diagram'}
        </Button>
      </div>
    </div>
  );
};

export default AutomationDiagramDisplay;
