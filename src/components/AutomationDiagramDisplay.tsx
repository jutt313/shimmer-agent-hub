
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
  Zap,
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
  const [showJsonDebug, setShowJsonDebug] = useState(false);
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

        // Apply enhanced layout with better positioning
        const { nodes: layoutedNodes, edges: layoutedEdges } = calculateEnhancedLayout(
          processedNodes, 
          automationDiagramData.edges,
          {
            nodeWidth: 320,
            nodeHeight: 120,
            horizontalGap: 200,
            verticalGap: 150,
            startX: 100,
            startY: 50
          }
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        
        // Calculate diagram statistics
        const stats = {
          totalNodes: layoutedNodes.length,
          totalEdges: layoutedEdges.length,
          conditionNodes: layoutedNodes.filter(n => n.type?.includes('condition')).length,
          aiAgentNodes: layoutedNodes.filter(n => n.data?.isRecommended || n.type === 'aiAgentNode').length,
          platformNodes: layoutedNodes.filter(n => n.data?.platform).length
        };
        
        setDiagramStats(stats);
        setDiagramError(null);
        
        console.log('📊 Enhanced diagram statistics:', stats);
        
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

  // Custom edge styles with animated colorful dotted lines
  const edgeOptions = {
    style: {
      strokeWidth: 3,
      strokeDasharray: '8,4',
      animation: 'dash 2s linear infinite',
    },
  };

  return (
    <div className="h-full w-full relative">
      {/* Header with JSON Debug Button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          onClick={() => setShowJsonDebug(true)}
          size="sm"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border-purple-200 hover:border-purple-300"
        >
          <Code className="w-4 h-4 mr-2" />
          View JSON
        </Button>
        {onRegenerateDiagram && (
          <Button
            onClick={onRegenerateDiagram}
            size="sm"
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg"
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

      {/* Main Diagram */}
      <div className="h-full w-full rounded-2xl overflow-hidden shadow-xl border border-gray-200">
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
              strokeWidth: 3,
              strokeDasharray: '8,4',
              stroke: 'url(#gradient)',
            },
          }}
        >
          {/* Animated gradient definition for colorful lines */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="25%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="75%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="0 0;100 0;0 0"
                dur="3s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          
          {/* Subtle background dots */}
          <Background 
            variant={BackgroundVariant.Dots}
            gap={20} 
            size={2}
            color="#e5e7eb"
            style={{ opacity: 0.3 }}
          />
          
          {/* Enhanced controls */}
          <Controls 
            position="bottom-right"
            showInteractive={false}
            className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border border-gray-200"
            style={{ 
              right: '20px',
              bottom: '20px'
            }}
          />
          
          {/* Beautiful minimap */}
          <MiniMap 
            nodeStrokeColor="#8b5cf6"
            nodeColor="#f8fafc"
            nodeBorderRadius={12}
            maskColor="rgba(139, 92, 246, 0.1)"
            position="bottom-left"
            pannable
            zoomable
            className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border border-gray-200"
            style={{
              left: '20px',
              bottom: '20px',
              width: '240px',
              height: '140px'
            }}
          />
        </ReactFlow>
      </div>

      {/* Statistics Badge */}
      {diagramStats.totalNodes > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-lg text-gray-700 px-3 py-1">
            {diagramStats.totalNodes} nodes, {diagramStats.totalEdges} connections
          </Badge>
        </div>
      )}

      {/* Error State */}
      {diagramError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-2xl">
          <Card className="max-w-md mx-4 shadow-xl border-orange-200">
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

      {/* Custom CSS for animated edges */}
      <style>
        {`
        @keyframes dash {
          to {
            stroke-dashoffset: -12;
          }
        }
        
        .react-flow__edge-path {
          animation: dash 2s linear infinite;
        }
        
        .react-flow__node {
          border-radius: 16px !important;
        }
        
        .react-flow__controls {
          border-radius: 12px !important;
        }
        
        .react-flow__minimap {
          border-radius: 12px !important;
        }
        `}
      </style>
    </div>
  );
};

export default AutomationDiagramDisplay;
