
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
  Maximize2, 
  Download, 
  Settings, 
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Diagram download functionality will be available soon.",
    });
  };

  // Empty state when no data
  if (!automationBlueprint && !automationDiagramData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Automation Diagram
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No automation configured</p>
            <p className="text-sm">Create an automation to see its visual workflow</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} overflow-hidden`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Automation Flow Diagram
            </CardTitle>
            
            {/* Diagram Statistics */}
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className="text-xs">
                {diagramStats.totalNodes} nodes
              </Badge>
              <Badge variant="outline" className="text-xs">
                {diagramStats.totalEdges} connections
              </Badge>
              {diagramStats.conditionNodes > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {diagramStats.conditionNodes} conditions
                </Badge>
              )}
              {diagramStats.aiAgentNodes > 0 && (
                <Badge variant="default" className="text-xs bg-emerald-500">
                  {diagramStats.aiAgentNodes} AI agents
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Regenerate Button */}
            <Button
              onClick={onRegenerateDiagram}
              disabled={isGenerating || !automationBlueprint}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Button>
            
            <Button onClick={handleDownload} size="sm" variant="outline">
              <Download className="w-4 h-4" />
            </Button>
            <Button onClick={handleFullscreen} size="sm" variant="outline">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {diagramError ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{diagramError}</span>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating enhanced diagram with AI recommendations...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Diagram ready - Click nodes to expand details</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-full">
        <div className={`${isFullscreen ? 'h-screen' : 'h-96'} w-full`}>
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
            selectionOnDrag
            panOnDrag={[1, 2]}
          >
            <Background 
              variant={BackgroundVariant.Dots}
              gap={20} 
              size={1}
              color="#e2e8f0"
            />
            <Controls 
              position="bottom-right"
              showInteractive={false}
            />
            <MiniMap 
              nodeStrokeColor="#374151"
              nodeColor="#f3f4f6"
              nodeBorderRadius={8}
              maskColor="rgba(0, 0, 0, 0.2)"
              position="top-right"
              pannable
              zoomable
            />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationDiagramDisplay;
