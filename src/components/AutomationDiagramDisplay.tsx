
import React, { useEffect, useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  Controls, 
  Background, 
  BackgroundVariant,
  MiniMap,
  ConnectionMode,
  addEdge,
  Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CustomNodeMapper from './diagram/CustomNodeMapper';
import { AutomationBlueprint, AutomationDiagramData } from '@/types/automation';

const nodeTypes = {
  // All node types use the same CustomNodeMapper component
  triggerNode: CustomNodeMapper,
  platformTriggerNode: CustomNodeMapper,
  actionNode: CustomNodeMapper,
  platformNode: CustomNodeMapper,
  conditionNode: CustomNodeMapper,
  dynamicConditionNode: CustomNodeMapper,
  loopNode: CustomNodeMapper,
  retryNode: CustomNodeMapper,
  fallbackNode: CustomNodeMapper,
  aiAgentNode: CustomNodeMapper,
  delayNode: CustomNodeMapper,
  // Fallback for any unmapped types
  default: CustomNodeMapper
};

interface AutomationDiagramDisplayProps {
  automationBlueprint?: AutomationBlueprint | null;
  automationDiagramData?: AutomationDiagramData | null;
  messages?: any[];
  onAgentAdd?: (agent: any) => void;
  onAgentDismiss?: (agentName: string) => void;
  dismissedAgents?: Set<string>;
  isGenerating?: boolean;
  onRegenerateDiagram?: () => void;
}

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
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [diagramStats, setDiagramStats] = useState({
    totalNodes: 0,
    totalEdges: 0,
    conditionNodes: 0,
    aiAgentNodes: 0,
    platformNodes: 0
  });

  // Enhanced node data processing with AI agent recommendations
  const processNodeData = useCallback((nodeData: any) => {
    const processedData = {
      ...nodeData,
      onAdd: nodeData.isRecommended ? () => {
        if (onAgentAdd) {
          const agentData = {
            name: nodeData.agent?.agent_id || nodeData.label,
            role: 'AI automation specialist',
            goal: nodeData.explanation || 'Execute automation tasks intelligently',
            rules: 'Follow automation best practices and user requirements',
            memory: 'Remember automation context and patterns',
            why_needed: nodeData.explanation || 'Essential for intelligent automation execution'
          };
          onAgentAdd(agentData);
        }
      } : undefined,
      onDismiss: nodeData.isRecommended ? () => {
        if (onAgentDismiss) {
          onAgentDismiss(nodeData.agent?.agent_id || nodeData.label);
        }
      } : undefined
    };

    // Filter out dismissed agents
    if (nodeData.isRecommended && dismissedAgents.has(nodeData.agent?.agent_id || nodeData.label)) {
      return null;
    }

    return processedData;
  }, [onAgentAdd, onAgentDismiss, dismissedAgents]);

  // Load diagram data when available
  useEffect(() => {
    console.log('🔄 AutomationDiagramDisplay: Processing diagram data update');
    
    try {
      if (automationDiagramData?.nodes && automationDiagramData?.edges) {
        console.log('✅ Using provided diagram data:', {
          nodes: automationDiagramData.nodes.length,
          edges: automationDiagramData.edges.length
        });

        // Process nodes with enhanced data
        const processedNodes = automationDiagramData.nodes
          .map(node => {
            const processedData = processNodeData(node.data);
            if (!processedData) return null; // Filter out dismissed nodes
            
            return {
              ...node,
              data: processedData,
              type: node.type || 'actionNode' // Ensure all nodes have a type
            };
          })
          .filter(Boolean) as Node[];

        setNodes(processedNodes);
        setEdges(automationDiagramData.edges);
        
        // Calculate diagram statistics
        const stats = {
          totalNodes: processedNodes.length,
          totalEdges: automationDiagramData.edges.length,
          conditionNodes: processedNodes.filter(n => n.type?.includes('condition')).length,
          aiAgentNodes: processedNodes.filter(n => n.data?.isRecommended || n.type === 'aiAgentNode').length,
          platformNodes: processedNodes.filter(n => n.data?.platform).length
        };
        
        setDiagramStats(stats);
        setDiagramError(null);
        
        console.log('📊 Diagram statistics:', stats);
        
      } else if (automationBlueprint?.steps?.length > 0) {
        console.log('⚠️ No diagram data available, but blueprint exists');
        setDiagramError('Diagram is being generated from blueprint...');
        
      } else {
        console.log('❌ No diagram data or blueprint available');
        setDiagramError('No automation data available to display');
        setNodes([]);
        setEdges([]);
        setDiagramStats({
          totalNodes: 0,
          totalEdges: 0,
          conditionNodes: 0,
          aiAgentNodes: 0,
          platformNodes: 0
        });
      }
    } catch (error) {
      console.error('💥 Error processing diagram data:', error);
      setDiagramError(`Error processing diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setNodes([]);
      setEdges([]);
    }
  }, [automationDiagramData, automationBlueprint, processNodeData]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Always show fullscreen diagram without headers
  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-50 to-blue-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.5
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        attributionPosition="bottom-left"
        className="bg-gradient-to-br from-gray-50 to-blue-50"
        panOnScroll
        panOnDrag={[1, 2]}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={12} 
          size={3}
          color="#1e293b"
          style={{ opacity: 0.4 }}
        />
        <Controls 
          position="bottom-right"
          showInteractive={false}
          style={{ 
            right: '20px',
            bottom: '20px'
          }}
        />
        <MiniMap 
          nodeStrokeColor="#374151"
          nodeColor="#f3f4f6"
          nodeBorderRadius={8}
          maskColor="rgba(0, 0, 0, 0.2)"
          position="bottom-right"
          pannable
          zoomable
          style={{
            right: '20px',
            bottom: '80px',
            width: '200px',
            height: '120px'
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default AutomationDiagramDisplay;
