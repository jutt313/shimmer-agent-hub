
import React, { useCallback, useMemo, useEffect, useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Import custom node components
import ActionNode from './diagram/ActionNode';
import ConditionNode from './diagram/ConditionNode';
import LoopNode from './diagram/LoopNode';
import DelayNode from './diagram/DelayNode';
import AIAgentNode from './diagram/AIAgentNode';

interface AutomationDiagramDisplayProps {
  automationBlueprint: any;
}

const AutomationDiagramDisplay: React.FC<AutomationDiagramDisplayProps> = ({ automationBlueprint }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Transform blueprint to diagram format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!automationBlueprint) return { nodes: [], edges: [] };
    return blueprintToDiagram(automationBlueprint);
  }, [automationBlueprint]);

  // ReactFlow hooks for managing nodes and edges state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Custom node types using our new components
  const nodeTypes = useMemo(() => ({
    default: ActionNode,
    actionNode: ActionNode,
    conditionNode: ConditionNode,
    loopNode: LoopNode,
    delayNode: DelayNode,
    aiAgentNode: AIAgentNode,
  }), []);

  // Callback for connecting nodes
  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Enhanced edge options with dynamic styling
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
      strokeDasharray: '8,4',
    },
  }), []);

  // Auto-save functionality
  const saveDiagramLayout = useCallback(async (updatedNodes: any[], updatedEdges: any[]) => {
    if (!user || !automationBlueprint) return;

    try {
      const diagramData = {
        nodes: updatedNodes,
        edges: updatedEdges,
        viewport: { x: 0, y: 0, zoom: 1 },
        savedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('automation_diagrams')
        .upsert({
          automation_id: automationBlueprint.id || 'temp',
          user_id: user.id,
          diagram_data: diagramData,
          layout_version: '1.0'
        });

      if (error) {
        console.error('Error saving diagram:', error);
      }
    } catch (error) {
      console.error('Error saving diagram layout:', error);
    }
  }, [user, automationBlueprint]);

  // Load saved diagram layout
  useEffect(() => {
    const loadDiagramLayout = async () => {
      if (!user || !automationBlueprint) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('automation_diagrams')
          .select('diagram_data')
          .eq('automation_id', automationBlueprint.id || 'temp')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading diagram:', error);
          return;
        }

        if (data && data.diagram_data) {
          const savedDiagram = data.diagram_data as any;
          if (savedDiagram.nodes && savedDiagram.edges) {
            setNodes(savedDiagram.nodes);
            setEdges(savedDiagram.edges);
          }
        }
      } catch (error) {
        console.error('Error loading diagram layout:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDiagramLayout();
  }, [user, automationBlueprint, setNodes, setEdges]);

  // Auto-save when nodes or edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const timeoutId = setTimeout(() => {
        saveDiagramLayout(nodes, edges);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, saveDiagramLayout]);

  // Show message if no blueprint
  if (!automationBlueprint) {
    return (
      <div className="w-full h-[75vh] flex flex-col rounded-3xl overflow-hidden bg-white/90 backdrop-blur-md shadow-2xl border-0 relative">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-100/40 to-blue-100/40 pointer-events-none"></div>
        
        <CardHeader className="pb-3 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-blue-50/80 rounded-t-3xl relative z-10">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Workflow Diagram
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="text-8xl mb-6">🎯</div>
            <h3 className="text-xl font-bold text-gray-700 mb-3">No Automation Blueprint Yet</h3>
            <p className="text-gray-600">Create your automation through chat first, then view the visual diagram here!</p>
          </div>
        </CardContent>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[75vh] flex flex-col rounded-3xl overflow-hidden bg-white/90 backdrop-blur-md shadow-2xl border-0 relative">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-100/40 to-blue-100/40 pointer-events-none"></div>
        
        <CardHeader className="pb-3 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-blue-50/80 rounded-t-3xl relative z-10">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Workflow Diagram
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading diagram...</p>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="w-full h-[75vh] flex flex-col rounded-3xl overflow-hidden bg-white/90 backdrop-blur-md shadow-2xl border-0 relative">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-100/40 to-blue-100/40 pointer-events-none"></div>
      
      <CardHeader className="pb-3 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-blue-50/80 rounded-t-3xl relative z-10">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
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
          style={{ backgroundColor: 'transparent' }}
        >
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'input') return '#a855f7';
              if (n.type === 'output') return '#ef4444';
              if (n.type === 'conditionNode') return '#f97316';
              if (n.type === 'aiAgentNode') return '#10b981';
              if (n.type === 'loopNode') return '#8b5cf6';
              if (n.type === 'delayNode') return '#6b7280';
              return '#9333ea';
            }}
            className="!bg-white/90 !border-2 !border-purple-200 !rounded-lg !shadow-lg"
          />
          <Controls 
            className="!bg-white/90 !border-2 !border-purple-200 !rounded-lg !shadow-lg" 
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <Background 
            variant={BackgroundVariant.Dots}
            gap={30} 
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
