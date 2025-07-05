
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
  Loader2,
  Code
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CustomNodeMapper from './diagram/CustomNodeMapper';
import JsonDebugModal from './diagram/JsonDebugModal';
import { AutomationBlueprint, AutomationDiagramData } from '@/types/automation';
import { calculateEnhancedLayout } from '@/utils/diagramLayout';

const nodeTypes = {
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
  const [showJsonDebug, setShowJsonDebug] = useState(false);
  const [diagramStats, setDiagramStats] = useState({
    totalNodes: 0,
    totalEdges: 0,
    conditionNodes: 0,
    aiAgentNodes: 0,
    platformNodes: 0
  });

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

    if (nodeData.isRecommended && dismissedAgents.has(nodeData.agent?.agent_id || nodeData.label)) {
      return null;
    }

    return processedData;
  }, [onAgentAdd, onAgentDismiss, dismissedAgents]);

  useEffect(() => {
    console.log('🔄 AutomationDiagramDisplay: Processing clean diagram data');
    
    try {
      if (automationDiagramData?.nodes && automationDiagramData?.edges) {
        console.log('✅ Using clean diagram data:', {
          nodes: automationDiagramData.nodes.length,
          edges: automationDiagramData.edges.length
        });

        const processedNodes = automationDiagramData.nodes
          .map(node => {
            const processedData = processNodeData(node.data);
            if (!processedData) return null;
            
            return {
              ...node,
              data: processedData,
              type: node.type || 'actionNode'
            };
          })
          .filter(Boolean) as Node[];

        // Use original positioning for clean left-to-right flow
        setNodes(processedNodes);
        setEdges(automationDiagramData.edges.map(edge => ({
          ...edge,
          animated: true,
          type: 'smoothstep',
          style: {
            stroke: '#8b5cf6',
            strokeWidth: 3,
            strokeDasharray: '8,4'
          }
        })));
        
        const stats = {
          totalNodes: processedNodes.length,
          totalEdges: automationDiagramData.edges.length,
          conditionNodes: processedNodes.filter(n => n.type?.includes('condition')).length,
          aiAgentNodes: processedNodes.filter(n => n.data?.isRecommended || n.type === 'aiAgentNode').length,
          platformNodes: processedNodes.filter(n => n.data?.platform).length
        };
        
        setDiagramStats(stats);
        setDiagramError(null);
        
        console.log('📊 Clean diagram statistics:', stats);
        
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

  return (
    <div className="h-full w-full relative">
      {/* Header Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          onClick={() => setShowJsonDebug(true)}
          size="sm"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border-purple-200 hover:border-purple-300 rounded-2xl"
        >
          <Code className="w-4 h-4 mr-2" />
          View JSON
        </Button>
        {onRegenerateDiagram && (
          <Button
            onClick={onRegenerateDiagram}
            size="sm"
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg rounded-2xl"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Regenerate'}
          </Button>
        )}
      </div>

      {/* Statistics Badge */}
      {diagramStats.totalNodes > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-lg text-gray-700 px-3 py-1 rounded-2xl">
            {diagramStats.totalNodes} nodes, {diagramStats.totalEdges} connections
          </Badge>
        </div>
      )}

      {/* Main Diagram Container */}
      <div className="h-full w-full rounded-3xl overflow-hidden shadow-xl border border-gray-200">
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
            padding: 0.3,
            minZoom: 0.2,
            maxZoom: 1.2
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          attributionPosition="bottom-left"
          className="bg-white"
          panOnScroll
          panOnDrag={[1, 2]}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: '#8b5cf6',
              strokeWidth: 3,
              strokeDasharray: '8,4'
            }
          }}
        >
          {/* Minimal background */}
          <Background 
            variant={BackgroundVariant.Dots}
            gap={20} 
            size={2}
            color="#e5e7eb"
            style={{ opacity: 0.1 }}
          />
          
          {/* Clean controls */}
          <Controls 
            position="bottom-right"
            showInteractive={false}
            className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200"
            style={{ 
              right: '20px',
              bottom: '20px'
            }}
          />
          
          {/* Responsive minimap */}
          <MiniMap 
            nodeStrokeColor="#8b5cf6"
            nodeColor="#f8fafc"
            nodeBorderRadius={12}
            maskColor="rgba(139, 92, 246, 0.1)"
            position="bottom-left"
            pannable
            zoomable
            className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200 hidden md:block"
            style={{
              left: '20px',
              bottom: '20px',
              width: '240px',
              height: '140px'
            }}
          />
        </ReactFlow>
      </div>

      {/* Error State */}
      {diagramError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-3xl">
          <Card className="max-w-md mx-4 shadow-xl border-orange-200 rounded-3xl">
            <CardHeader className="text-center">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <CardTitle className="text-orange-800">Diagram Loading</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">{diagramError}</p>
              {isGenerating && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-purple-600">Generating diagram...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* JSON Debug Modal */}
      {showJsonDebug && (
        <JsonDebugModal
          isOpen={showJsonDebug}
          onClose={() => setShowJsonDebug(false)}
          diagramData={automationDiagramData}
          blueprintData={automationBlueprint}
        />
      )}

      {/* Single color animated CSS */}
      <style>
        {`
        @keyframes dash {
          to {
            stroke-dashoffset: -12;
          }
        }
        
        .react-flow__edge-path {
          stroke: #8b5cf6 !important;
          stroke-width: 3px !important;
          stroke-dasharray: 8,4 !important;
          animation: dash 2s linear infinite;
        }
        
        .react-flow__node {
          border-radius: 24px !important;
        }
        
        .react-flow__controls {
          border-radius: 16px !important;
        }
        
        .react-flow__minimap {
          border-radius: 16px !important;
        }

        /* Responsive design for small screens */
        @media (max-width: 768px) {
          .react-flow__minimap {
            display: none !important;
          }
          
          .react-flow__controls {
            right: 10px !important;
            bottom: 10px !important;
          }
        }
        `}
      </style>
    </div>
  );
};

export default AutomationDiagramDisplay;
