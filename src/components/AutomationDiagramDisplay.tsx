
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

// Import all custom node components
import ActionNode from './diagram/ActionNode';
import ConditionNode from './diagram/ConditionNode';
import LoopNode from './diagram/LoopNode';
import DelayNode from './diagram/DelayNode';
import AIAgentNode from './diagram/AIAgentNode';
import RetryNode from './diagram/RetryNode';
import FallbackNode from './diagram/FallbackNode';

interface AutomationDiagramDisplayProps {
  automationBlueprint: any;
  messages?: any[];
  onAgentAdd?: (agent: any) => void;
  onAgentDismiss?: (agentName: string) => void;
  dismissedAgents?: Set<string>;
}

// Generate a proper UUID v4 with error handling
const generateUUID = (): string => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(uuid)) {
      return uuid;
    } else {
      throw new Error('Generated UUID failed validation');
    }
  } catch (error) {
    console.error('UUID generation error:', error);
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-4xxx-yxxx-${Math.random().toString(36).substr(2, 12)}`;
  }
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
    
    if (!messages || !Array.isArray(messages)) {
      setRecommendedAgents([]);
      return;
    }

    messages.forEach(message => {
      if (!message || typeof message !== 'object') return;
      
      if (message.isBot) {
        let structuredData = message.structuredData;
        if (!structuredData && message.text && typeof message.text === 'string') {
          try {
            structuredData = parseStructuredResponse(message.text);
          } catch (parseError) {
            console.error('Error parsing message structured data:', parseError);
            structuredData = null;
          }
        }
        if (structuredData?.agents && Array.isArray(structuredData.agents)) {
          agents.push(...structuredData.agents.filter(agent => agent && typeof agent === 'object'));
        }
      }
    });
    
    const uniqueAgents = agents.filter((agent, index, self) => 
      agent && 
      typeof agent === 'object' &&
      agent.name &&
      typeof agent.name === 'string' &&
      index === self.findIndex(a => a && a.name === agent.name) && 
      !dismissedAgents.has(agent.name)
    );
    
    setRecommendedAgents(uniqueAgents);
  }, [messages, dismissedAgents]);

  // Transform blueprint to diagram format with enhanced error handling
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!automationBlueprint) return { nodes: [], edges: [] };
    
    try {
      console.log('🔄 Converting blueprint to diagram:', automationBlueprint);
      const result = blueprintToDiagram(automationBlueprint);
      
      // Add recommended agents as overlay nodes if any exist
      if (recommendedAgents.length > 0) {
        recommendedAgents.forEach((agent, index) => {
          if (!dismissedAgents.has(agent.name)) {
            const agentNode = {
              id: `recommended-agent-${index}`,
              type: 'aiAgentNode',
              position: { x: 100 + (index * 300), y: 100 },
              data: {
                label: agent.name || 'Recommended Agent',
                explanation: agent.description || 'AI Agent recommendation',
                isRecommended: true,
                onAdd: () => onAgentAdd?.(agent),
                onDismiss: () => onAgentDismiss?.(agent.name)
              }
            };
            result.nodes.push(agentNode);
          }
        });
      }
      
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
  }, [automationBlueprint, recommendedAgents, dismissedAgents, onAgentAdd, onAgentDismiss, toast]);

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
    retryNode: RetryNode,
    fallbackNode: FallbackNode,
  }), []);

  // Callback for connecting nodes
  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Enhanced edge options with soft colors
  const defaultEdgeOptions = useMemo(() => ({
    animated: false,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: '#a8b5ff',
    },
    style: {
      strokeWidth: 2.5,
      stroke: '#a8b5ff',
    },
  }), []);

  // Auto-save functionality with proper automation ID handling
  const saveDiagramLayout = useCallback(async (updatedNodes: any[], updatedEdges: any[]) => {
    if (!user || !automationBlueprint) {
      console.log('⚠️ Cannot save diagram: missing user or blueprint');
      return;
    }

    try {
      const automationId = automationBlueprint.id || generateUUID();
      
      console.log('💾 Attempting to save diagram with automation_id:', automationId);

      const diagramData = {
        nodes: Array.isArray(updatedNodes) ? updatedNodes : [],
        edges: Array.isArray(updatedEdges) ? updatedEdges : [],
        viewport: { x: 0, y: 0, zoom: 1 },
        savedAt: new Date().toISOString()
      };

      // Check if automation exists, if not create a minimal one
      const { data: existingAutomation, error: checkError } = await supabase
        .from('automations')
        .select('id')
        .eq('id', automationId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking automation:', checkError);
        return;
      }

      if (!existingAutomation) {
        console.log('🔧 Creating automation entry for diagram');
        const { error: createError } = await supabase
          .from('automations')
          .insert({
            id: automationId,
            title: 'Generated Automation',
            description: 'Automation created for diagram',
            user_id: user.id,
            status: 'draft'
          });

        if (createError) {
          console.error('❌ Error creating automation:', createError);
          return;
        }
      }

      // Save the diagram
      const { data, error } = await supabase
        .from('automation_diagrams')
        .upsert({
          automation_id: automationId,
          user_id: user.id,
          diagram_data: diagramData,
          layout_version: '2.0'
        }, {
          onConflict: 'automation_id,user_id'
        })
        .select('id');

      if (error) {
        console.error('❌ Error saving diagram:', error);
      } else {
        console.log('✅ Diagram saved successfully');
        if (data && Array.isArray(data) && data.length > 0 && data[0]?.id) {
          setDiagramId(data[0].id);
        }
      }
    } catch (error) {
      console.error('❌ Error saving diagram layout:', error);
    }
  }, [user, automationBlueprint]);

  // Load saved diagram layout
  useEffect(() => {
    const loadDiagramLayout = async () => {
      if (!user || !automationBlueprint?.id) return;

      try {
        setLoading(true);
        
        const automationId = automationBlueprint.id;
        console.log('🔄 Loading diagram layout for:', automationId);

        const { data, error } = await supabase
          .from('automation_diagrams')
          .select('id, diagram_data')
          .eq('automation_id', automationId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
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
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, saveDiagramLayout]);

  // Show message if no blueprint
  if (!automationBlueprint) {
    return (
      <div className="w-full h-[65vh] flex flex-col rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl border border-slate-200/50 relative">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50/60 to-purple-50/60 pointer-events-none"></div>
        
        <CardHeader className="pb-3 border-b border-slate-200/50 bg-gradient-to-r from-blue-50/90 to-purple-50/90 rounded-t-3xl relative z-10">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Workflow Diagram
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="text-8xl mb-6">🎯</div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">No Automation Blueprint Yet</h3>
            <p className="text-slate-600">Create your automation through chat first, then view the visual diagram here!</p>
          </div>
        </CardContent>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[65vh] flex flex-col rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl border border-slate-200/50 relative">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50/60 to-purple-50/60 pointer-events-none"></div>
        
        <CardHeader className="pb-3 border-b border-slate-200/50 bg-gradient-to-r from-blue-50/90 to-purple-50/90 rounded-t-3xl relative z-10">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Workflow Diagram
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-700 font-medium">Loading diagram...</p>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="w-full h-[65vh] flex flex-col rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl border border-slate-200/50 relative">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50/60 to-purple-50/60 pointer-events-none"></div>
      
      <CardHeader className="pb-3 border-b border-slate-200/50 bg-gradient-to-r from-blue-50/90 to-purple-50/90 rounded-t-3xl relative z-10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Workflow Diagram
          </CardTitle>
          
          {/* Recommended Agents with soft colors */}
          {recommendedAgents.length > 0 && (
            <div className="flex gap-2">
              {recommendedAgents.map((agent, index) => (
                <div key={index} className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-3 py-2">
                  <span className="text-sm font-medium text-emerald-700">{agent.name || 'Unnamed Agent'}</span>
                  <Button
                    size="sm"
                    onClick={() => onAgentAdd?.(agent)}
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white px-2 py-1 text-xs h-6 rounded-lg"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAgentDismiss?.(agent.name || 'Unnamed Agent')}
                    className="border-emerald-200/60 text-emerald-600 hover:bg-emerald-50/50 px-2 py-1 text-xs h-6 rounded-lg"
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
              // Soft color palette for minimap
              if (n.type === 'conditionNode') return '#fbbf24';      // Soft amber
              if (n.type === 'aiAgentNode') return '#10b981';       // Soft emerald
              if (n.type === 'loopNode') return '#8b5cf6';          // Soft purple
              if (n.type === 'delayNode') return '#6b7280';         // Soft gray
              if (n.type === 'retryNode') return '#f59e0b';         // Soft orange
              if (n.type === 'fallbackNode') return '#6366f1';     // Soft indigo
              return '#a8b5ff';                                     // Soft blue
            }}
            className="!bg-white/95 !border-2 !border-slate-200/50 !rounded-xl !shadow-lg"
          />
          <Controls 
            className="!bg-white/95 !border-2 !border-slate-200/50 !rounded-xl !shadow-lg" 
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <Background 
            variant={BackgroundVariant.Dots}
            gap={24} 
            size={1.2} 
            color="#e2e8f0"
            className="opacity-40"
          />
        </ReactFlow>
      </CardContent>
    </div>
  );
};

export default AutomationDiagramDisplay;
