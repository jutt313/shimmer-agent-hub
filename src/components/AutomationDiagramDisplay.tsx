import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  MarkerType,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, CheckCircle } from 'lucide-react';
import { generateLayoutData } from '@/utils/diagramLayout';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AutomationBlueprint } from '@/types/automation';
import DiagramErrorRecovery from './DiagramErrorRecovery';

interface AutomationDiagramDisplayProps {
  automationBlueprint?: AutomationBlueprint | null;
  automationId: string;
}

const CustomNode = ({ data }: any) => {
  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 w-60">
      <h4 className="text-sm font-semibold text-gray-800">{data.label}</h4>
      <p className="text-xs text-gray-600 mt-1">{data.description}</p>
      {data.type === 'step' && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">
            Step {data.stepNumber}: {data.platform} - {data.action}
          </p>
        </div>
      )}
    </div>
  );
};

const AutomationDiagramDisplay: React.FC<AutomationDiagramDisplayProps> = ({
  automationBlueprint,
  automationId
}) => {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (automationBlueprint) {
      const { nodes: newNodes, edges: newEdges } = generateLayoutData(automationBlueprint);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [automationBlueprint, setNodes, setEdges]);

  const nodeTypes = React.useMemo(() => ({
    custom: CustomNode,
  }), []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Automation Flow</h3>
            <p className="text-sm text-slate-600">Visual representation of your automation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Production Ready
          </Badge>
        </div>
      </div>

      <div className="relative h-[calc(100%-80px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gradient-to-br from-slate-50 to-white"
          defaultEdgeOptions={{
            style: {
              stroke: '#10b981',
              strokeWidth: 3,
              strokeDasharray: '8 4',
              filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
            },
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#10b981',
            }
          }}
          connectionMode={ConnectionMode.Loose}
          snapToGrid={true}
          snapGrid={[20, 20]}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="#e2e8f0"
          />
          <Controls 
            position="bottom-right"
            className="bg-white border border-slate-200 rounded-lg shadow-sm"
          />
          <MiniMap 
            position="bottom-left"
            className="bg-white border border-slate-200 rounded-lg shadow-sm"
            nodeColor="#8b5cf6"
            maskColor="rgba(255, 255, 255, 0.8)"
          />
        </ReactFlow>

        {!automationBlueprint && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <Network className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Automation Blueprint</h3>
              <p className="text-slate-500">Create an automation to see the visual flow diagram</p>
            </div>
          </div>
        )}

        <DiagramErrorRecovery />
      </div>
    </div>
  );
};

export default AutomationDiagramDisplay;
