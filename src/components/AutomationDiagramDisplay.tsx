
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
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Plus, X } from 'lucide-react';
import { parseStructuredResponse } from '@/utils/jsonParser';

// Import custom node components
import ActionNode from './diagram/ActionNode';
import ConditionNode from './diagram/ConditionNode';
import LoopNode from './diagram/LoopNode';
import DelayNode from './diagram/DelayNode';
import AIAgentNode from './diagram/AIAgentNode';

interface AutomationDiagramDisplayProps {
  automationBlueprint: any;
  messages?: any[];
  onAgentAdd?: (agent: any) => void;
  onAgentDismiss?: (agentName: string) => void;
  dismissedAgents?: Set<string>;
}

// Generate a proper UUID v4
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const AutomationDiagramDisplay: React.FC<AutomationDiagramDisplayProps> = ({ 
  automationBlueprint, 
  messages = [],
  onAgentAdd,
  onAgentDismiss,
  dismissedAgents = new Set()
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recommendedAgents, setRecommendedAgents] = useState<any[]>([]);
  const [diagramId, setDiagramId] = useState<string | null>(null);

  // Extract recommended agents from messages
  useEffect(() => {
    const agents: any[] = [];
    messages.forEach(message => {
      if (message.isBot) {
        let structuredData = message.structuredData;
        if (!structuredData) {
          structuredData = parseStructuredResponse(message.text);
        }
        if (structuredData?.agents) {
          agents.push(...structuredData.agents);
        }
      }
    });
    
    // Remove duplicates and dismissed agents
    const uniqueAgents = agents.filter((agent, index, self) => 
      index === self.findIndex(a => a.name === agent.name) && 
      !dismissedAgents.has(agent.name)
    );
    
    setRecommendedAgents(uniqueAgents);
  }, [messages, dismissedAgents]);

  // Transform blueprint to diagram format with error handling
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!automationBlueprint) return { nodes: [], edges: [] };
    
    try {
      console.log('🔄 Converting blueprint to diagram:', automationBlueprint);
      const result = blueprintToDiagram(automationBlueprint);
      console.log('✅ Diagram conversion successful:', { 
        nodesCount: result.nodes.length, 
        edgesCount: result.edges.length 
      });
      return result;
    } catch (error) {
      console.error('❌ Error converting blueprint to diagram:', error);
      toast({
        title: "Diagram Error",
        description: "Failed to generate diagram from blueprint",
        variant: "destructive",
      });
      return { nodes: [], edges: [] };
    }
  }, [automationBlueprint, toast]);

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

  // Auto-save functionality with proper UUID handling
  const saveDiagramLayout = useCallback(async (updatedNodes: any[], updatedEdges: any[]) => {
    if (!user || !automationBlueprint) {
      console.log('⚠️ Cannot save diagram: missing user or blueprint');
      return;
    }

    try {
      // Ensure we have a proper automation ID
      let automationId = automationBlueprint.id;
      if (!automationId || typeof automationId !== 'string') {
        console.warn('⚠️ Invalid automation ID, generating new one');
        automationId = generateUUID();
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(automationId)) {
        console.error('❌ Invalid UUID format for automation_id:', automationId);
        automationId = generateUUID();
        console.log('✅ Generated new UUID:', automationId);
      }

      const diagramData = {
        nodes: updatedNodes,
        edges: updatedEdges,
        viewport: { x: 0, y: 0, zoom: 1 },
        savedAt: new Date().toISOString()
      };

      console.log('💾 Saving diagram layout:', { 
        automationId, 
        userId: user.id, 
        nodesCount: updatedNodes.length,
        edgesCount: updatedEdges.length 
      });

      const { data, error } = await supabase
        .from('automation_diagrams')
        .upsert({
          automation_id: automationId,
          user_id: user.id,
          diagram_data: diagramData,
          layout_version: '1.0'
        }, {
          onConflict: 'automation_id,user_id'
        });

      if (error) {
        console.error('❌ Error saving diagram:', error);
        toast({
          title: "Save Error",
          description: `Failed to save diagram: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('✅ Diagram saved successfully');
        if (data && data[0]) {
          setDiagramId(data[0].id);
        }
      }
    } catch (error) {
      console.error('❌ Error saving diagram layout:', error);
      toast({
        title: "Save Error",
        description: "Unexpected error while saving diagram",
        variant: "destructive",
      });
    }
  }, [user, automationBlueprint, toast]);

  // Load saved diagram layout with proper error handling
  useEffect(() => {
    const loadDiagramLayout = async () => {
      if (!user || !automationBlueprint) return;

      try {
        setLoading(true);
        
        let automationId = automationBlueprint.id;
        if (!automationId || typeof automationId !== 'string') {
          console.warn('⚠️ No valid automation ID for loading diagram');
          return;
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(automationId)) {
          console.warn('⚠️ Invalid UUID format, skipping load:', automationId);
          return;
        }

        console.log('🔄 Loading diagram layout:', { automationId, userId: user.id });

        const { data, error } = await supabase
          .from('automation_diagrams')
          .select('id, diagram_data')
          .eq('automation_id', automationId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('❌ Error loading diagram:', error);
          return;
        }

        if (data && data.diagram_data) {
          const savedDiagram = data.diagram_data as any;
          if (savedDiagram.nodes && savedDiagram.edges) {
            console.log('✅ Loaded saved diagram:', { 
              nodesCount: savedDiagram.nodes.length,
              edgesCount: savedDiagram.edges.length 
            });
            setNodes(savedDiagram.nodes);
            setEdges(savedDiagram.edges);
            setDiagramId(data.id);
          }
        } else {
          console.log('ℹ️ No saved diagram found, using generated layout');
        }
      } catch (error) {
        console.error('❌ Error loading diagram layout:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDiagramLayout();
  }, [user, automationBlueprint, setNodes, setEdges]);

  // Auto-save when nodes or edges change (debounced)
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const timeoutId = setTimeout(() => {
        saveDiagramLayout(nodes, edges);
      }, 2000); // 2 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, saveDiagramLayout]);

  // Show message if no blueprint
  if (!automationBlueprint) {
    return (
      <div className="w-full h-[65vh] flex flex-col rounded-3xl overflow-hidden bg-white/90 backdrop-blur-md shadow-2xl border-0 relative">
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
      <div className="w-full h-[65vh] flex flex-col rounded-3xl overflow-hidden bg-white/90 backdrop-blur-md shadow-2xl border-0 relative">
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
    <div className="w-full h-[65vh] flex flex-col rounded-3xl overflow-hidden bg-white/90 backdrop-blur-md shadow-2xl border-0 relative">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-100/40 to-blue-100/40 pointer-events-none"></div>
      
      <CardHeader className="pb-3 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-blue-50/80 rounded-t-3xl relative z-10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Workflow Diagram
          </CardTitle>
          
          {/* Recommended Agents */}
          {recommendedAgents.length > 0 && (
            <div className="flex gap-2">
              {recommendedAgents.map((agent, index) => (
                <div key={index} className="flex items-center gap-2 bg-blue-100/50 border border-blue-200/50 rounded-lg px-3 py-1">
                  <span className="text-sm font-medium text-blue-700">{agent.name}</span>
                  <Button
                    size="sm"
                    onClick={() => onAgentAdd?.(agent)}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-2 py-1 text-xs h-6"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAgentDismiss?.(agent.name)}
                    className="border-blue-300/50 text-blue-600 hover:bg-blue-100/50 px-2 py-1 text-xs h-6"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
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
          className="rounded-b-3xl"
          style={{ backgroundColor: 'transparent' }}
          proOptions={{ hideAttribution: true }}
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
            gap={20} 
            size={1.5} 
            color="#9333ea"
            className="opacity-50"
          />
        </ReactFlow>
      </CardContent>
    </div>
  );
};

export default AutomationDiagramDisplay;
