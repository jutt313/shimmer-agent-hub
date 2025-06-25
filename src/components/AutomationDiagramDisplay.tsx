
import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { blueprintToDiagram } from "@/utils/blueprintToDiagram";
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Simple custom node component for Phase 1
const CustomDefaultNode = ({ data }: any) => (
  <div className="px-4 py-3 shadow-lg rounded-xl bg-white border-2 border-purple-200 hover:border-purple-300 transition-all duration-200">
    <div className="flex items-center space-x-2">
      {data.icon && <span className="text-lg">{data.icon}</span>}
      <div className="text-sm font-semibold text-gray-800">{data.label}</div>
    </div>
  </div>
);

interface AutomationDiagramDisplayProps {
  automationBlueprint: any;
}

const AutomationDiagramDisplay: React.FC<AutomationDiagramDisplayProps> = ({ automationBlueprint }) => {
  // Transform blueprint to diagram format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!automationBlueprint) return { nodes: [], edges: [] };
    return blueprintToDiagram(automationBlueprint);
  }, [automationBlueprint]);

  // ReactFlow hooks for managing nodes and edges state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Callback for connecting nodes
  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Custom node types
  const nodeTypes = useMemo(() => ({
    default: CustomDefaultNode,
    actionNode: CustomDefaultNode,
    conditionNode: CustomDefaultNode,
    loopNode: CustomDefaultNode,
    delayNode: CustomDefaultNode,
    aiAgentNode: CustomDefaultNode,
  }), []);

  // Default edge options for beautiful dot-dot connections
  const defaultEdgeOptions = useMemo(() => ({
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#9333ea',
    },
    style: {
      strokeWidth: 3,
      stroke: '#9333ea',
      strokeDasharray: '5,5', // Dot-dot style
    },
  }), []);

  // Show message if no blueprint
  if (!automationBlueprint) {
    return (
      <div className="w-[calc(100vw-6rem)] max-w-none h-full flex flex-col rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md shadow-2xl border-0 relative">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-100/30 to-blue-100/30 pointer-events-none"></div>
        
        <CardHeader className="pb-3 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-t-3xl relative z-10">
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Workflow Diagram
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Automation Blueprint Yet</h3>
            <p className="text-gray-500">Create your automation through chat first, then view the visual diagram here!</p>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="w-[calc(100vw-6rem)] max-w-none h-full flex flex-col rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md shadow-2xl border-0 relative">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-100/30 to-blue-100/30 pointer-events-none"></div>
      
      <CardHeader className="pb-3 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-t-3xl relative z-10">
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Workflow Diagram
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative z-10" style={{ height: 'calc(100% - 5rem)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          attributionPosition="bottom-right"
          className="rounded-b-3xl"
        >
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'input') return '#a855f7';
              if (n.type === 'output') return '#ef4444';
              if (n.type === 'conditionNode') return '#f97316';
              if (n.type === 'aiAgentNode') return '#10b981';
              return '#9333ea';
            }}
            className="!bg-white/80 !border-2 !border-purple-200 !rounded-lg"
          />
          <Controls className="!bg-white/80 !border-2 !border-purple-200 !rounded-lg" />
          <Background 
            variant={BackgroundVariant.Dots}
            gap={20} 
            size={2} 
            color="#c084fc"
            className="opacity-30"
          />
        </ReactFlow>
      </CardContent>
    </div>
  );
};

export default AutomationDiagramDisplay;
