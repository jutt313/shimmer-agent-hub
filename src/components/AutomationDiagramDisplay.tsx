import React, { useMemo } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
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

const aiAgentNodeStyle = {
  background: '#D4E3FF',
  border: '2px solid #7A9DDC',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '200px',
  textAlign: 'center',
};

const triggerNodeStyle = {
  background: '#E2F7D4',
  border: '2px solid #9DDC7A',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '200px',
  textAlign: 'center',
};

const actionNodeStyle = {
  background: '#FFF3CD',
  border: '2px solid #DDA64B',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '200px',
  textAlign: 'center',
};

const conditionNodeStyle = {
  background: '#FFD4D4',
  border: '2px solid #DC7A7A',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '200px',
  textAlign: 'center',
};

const endNodeStyle = {
  background: '#EEEEEE',
  border: '2px solid #999999',
  borderRadius: '8px',
  padding: '10px',
  color: '#333',
  width: '150px',
  textAlign: 'center',
};

const CustomAINodeComponent = ({ data }: NodeProps) => {
  const handleAgentAdd = () => {
    if (data.agentData && data.showActions) {
      data.onAgentAdd(data.agentData);
    }
  };

  const handleAgentDismiss = () => {
    if (data.agentData && data.showActions) {
      data.onAgentDismiss(data.agentData.name);
    }
  };

  return (
    <div style={aiAgentNodeStyle}>
      <h4>{data.label}</h4>
      <p>{data.description}</p>
      {data.showActions && (
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

const CustomTriggerNodeComponent = ({ data }: NodeProps) => (
  <div style={triggerNodeStyle}>
    <h4>{data.label}</h4>
    <p>{data.description}</p>
  </div>
);

const CustomActionNodeComponent = ({ data }: NodeProps) => (
  <div style={actionNodeStyle}>
    <h4>{data.label}</h4>
    <p>{data.description}</p>
  </div>
);

const CustomConditionNodeComponent = ({ data }: NodeProps) => (
  <div style={conditionNodeStyle}>
    <h4>{data.label}</h4>
    <p>{data.description}</p>
  </div>
);

const CustomEndNodeComponent = ({ data }: NodeProps) => (
  <div style={endNodeStyle}>
    <h4>{data.label}</h4>
    <p>{data.description}</p>
  </div>
);

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
  const { fitView } = useReactFlow();

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
          const matchingAgent = recommendedAgents.find(agent => 
            agent.name && (
              node.data?.label?.includes(agent.name) ||
              node.data?.platform?.includes(agent.name) ||
              node.id?.includes(agent.name.toLowerCase().replace(/\s+/g, '-'))
            )
          );

          // Get agent status from state manager
          const agentName = matchingAgent?.name || node.data?.label || node.data?.platform || 'Unknown Agent';
          const agentStatus = agentStateManager.getAgentStatus(agentName);
          
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
    if (!diagramData?.nodes) return [];
    
    console.log('🔄 Processing diagram nodes with agent logic');
    const processed = processNodesWithAgentLogic(diagramData.nodes, messages);
    console.log('✅ Processed nodes:', processed.length, 'agents found:', processed.filter(n => n.data?.isRecommended).length);
    
    return processed;
  }, [diagramData?.nodes, messages, onAgentAdd, onAgentDismiss]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!isValidDiagramData(diagramData)) {
      console.warn('⚠️ Invalid diagram data, using empty diagram');
      return { nodes: [], edges: [] };
    }
  
    console.log('📏 Applying layout to diagram');
    return applyLayout(processedNodes, diagramData.edges);
  }, [processedNodes, diagramData]);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  useEffect(() => {
    fitView({ padding: 0.1 });
  }, [nodes, edges, fitView]);

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
