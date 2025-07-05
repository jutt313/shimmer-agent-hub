
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
  Code,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import CustomNodeMapper from './diagram/CustomNodeMapper';
import JsonDebugModal from './diagram/JsonDebugModal';
import { AutomationBlueprint, AutomationDiagramData } from '@/types/automation';

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
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [regenerateInput, setRegenerateInput] = useState('');
  const [diagramStats, setDiagramStats] = useState({
    totalNodes: 0,
    totalEdges: 0,
    conditionNodes: 0,
    aiAgentNodes: 0,
    platformNodes: 0,
    stopNodes: 0
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
          toast({
            title: "AI Agent Added",
            description: `${agentData.name} has been added to your automation`,
          });
        }
      } : undefined,
      onDismiss: nodeData.isRecommended ? () => {
        if (onAgentDismiss) {
          onAgentDismiss(nodeData.agent?.agent_id || nodeData.label);
          toast({
            title: "AI Agent Dismissed",
            description: "Agent recommendation has been dismissed",
          });
        }
      } : undefined
    };

    if (nodeData.isRecommended && dismissedAgents.has(nodeData.agent?.agent_id || nodeData.label)) {
      return null;
    }

    return processedData;
  }, [onAgentAdd, onAgentDismiss, dismissedAgents, toast]);

  useEffect(() => {
    console.log('🔄 Processing enhanced diagram data with AI recommendations');
    
    try {
      if (automationDiagramData?.nodes && automationDiagramData?.edges) {
        console.log('✅ Using enhanced diagram data:', {
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
          platformNodes: processedNodes.filter(n => n.data?.platform).length,
          stopNodes: processedNodes.filter(n => n.data?.stepType === 'stop').length
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
          platformNodes: 0,
          stopNodes: 0
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

  const handleRegenerateWithInput = () => {
    if (onRegenerateDiagram) {
      // Pass the user input to improve diagram generation
      console.log('🔄 Regenerating diagram with user input:', regenerateInput);
      onRegenerateDiagram();
      setShowRegenerateForm(false);
      setRegenerateInput('');
      toast({
        title: "Regenerating Diagram",
        description: "Creating improved diagram based on your feedback",
      });
    }
  };

  return (
    <div className="h-full w-full relative">
      {/* Enhanced Header Controls - Mobile Responsive */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => setShowJsonDebug(true)}
          size="sm"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border-purple-200 hover:border-purple-300 rounded-xl sm:rounded-2xl text-xs sm:text-sm"
        >
          <Code className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">View JSON</span>
          <span className="sm:hidden">JSON</span>
        </Button>
        
        <Dialog open={showRegenerateForm} onOpenChange={setShowRegenerateForm}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border-orange-200 hover:border-orange-300 rounded-xl sm:rounded-2xl text-xs sm:text-sm"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Improve</span>
              <span className="sm:hidden">Fix</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Improve Diagram</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Describe what's missing or needs to be fixed in the diagram..."
                value={regenerateInput}
                onChange={(e) => setRegenerateInput(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleRegenerateWithInput} className="flex-1">
                  Regenerate
                </Button>
                <Button variant="outline" onClick={() => setShowRegenerateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {onRegenerateDiagram && (
          <Button
            onClick={onRegenerateDiagram}
            size="sm"
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg rounded-xl sm:rounded-2xl text-xs sm:text-sm"
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{isGenerating ? 'Generating...' : 'Regenerate'}</span>
            <span className="sm:hidden">{isGenerating ? 'Gen...' : 'Regen'}</span>
          </Button>
        )}
      </div>

      {/* Enhanced Statistics Badge - Mobile Responsive */}
      {diagramStats.totalNodes > 0 && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-lg text-gray-700 px-2 sm:px-3 py-1 rounded-xl sm:rounded-2xl text-xs sm:text-sm">
            <span className="hidden sm:inline">
              {diagramStats.totalNodes} nodes • {diagramStats.totalEdges} connections
            </span>
            <span className="sm:hidden">
              {diagramStats.totalNodes}n • {diagramStats.totalEdges}c
            </span>
            {diagramStats.aiAgentNodes > 0 && (
              <span className="ml-1 sm:ml-2 text-emerald-600 font-bold">
                • {diagramStats.aiAgentNodes} AI
              </span>
            )}
          </Badge>
        </div>
      )}

      {/* Main Diagram Container - Enhanced Mobile Support */}
      <div className="h-full w-full rounded-xl sm:rounded-3xl overflow-hidden shadow-xl border border-gray-200">
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
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
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
          <Background 
            variant={BackgroundVariant.Dots}
            gap={20} 
            size={2}
            color="#e5e7eb"
            style={{ opacity: 0.1 }}
          />
          
          <Controls 
            position="bottom-right"
            showInteractive={false}
            className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl sm:rounded-2xl border border-gray-200"
            style={{ 
              right: '10px',
              bottom: '10px'
            }}
          />
          
          <MiniMap 
            nodeStrokeColor="#8b5cf6"
            nodeColor="#f8fafc"
            nodeBorderRadius={12}
            maskColor="rgba(139, 92, 246, 0.1)"
            position="bottom-left"
            pannable
            zoomable
            className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl sm:rounded-2xl border border-gray-200 hidden lg:block"
            style={{
              left: '10px',
              bottom: '10px',
              width: '200px',
              height: '120px'
            }}
          />
        </ReactFlow>
      </div>

      {/* Enhanced Error State */}
      {diagramError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-3xl p-4">
          <Card className="max-w-sm sm:max-w-md mx-auto shadow-xl border-orange-200 rounded-2xl sm:rounded-3xl">
            <CardHeader className="text-center">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-2" />
              <CardTitle className="text-orange-800 text-sm sm:text-base">Diagram Loading</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4 text-sm">{diagramError}</p>
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

      {/* Enhanced JSON Debug Modal */}
      {showJsonDebug && (
        <JsonDebugModal
          isOpen={showJsonDebug}
          onClose={() => setShowJsonDebug(false)}
          diagramData={automationDiagramData}
          blueprintData={automationBlueprint}
        />
      )}

      {/* Enhanced Mobile-First Animated CSS */}
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
          border-radius: 16px !important;
        }
        
        .react-flow__controls {
          border-radius: 12px !important;
        }
        
        .react-flow__minimap {
          border-radius: 12px !important;
        }

        /* Enhanced mobile responsiveness */
        @media (max-width: 768px) {
          .react-flow__minimap {
            display: none !important;
          }
          
          .react-flow__controls {
            right: 8px !important;
            bottom: 8px !important;
          }
          
          .react-flow__controls button {
            width: 32px !important;
            height: 32px !important;
          }
          
          .react-flow__node {
            min-width: 240px !important;
            max-width: 280px !important;
          }
        }
        
        @media (max-width: 480px) {
          .react-flow__node {
            min-width: 200px !important;
            max-width: 240px !important;
          }
        }
        `}
      </style>
    </div>
  );
};

export default AutomationDiagramDisplay;
