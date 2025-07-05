
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
  Settings,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import CustomNodeMapper from './diagram/CustomNodeMapper';
import JsonDebugModal from './diagram/JsonDebugModal';
import { calculateEnhancedLayout } from '@/utils/diagramLayout';
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
  onRegenerateDiagram?: (userFeedback?: string) => void;
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
  const [isRegenerating, setIsRegenerating] = useState(false);
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
            name: nodeData.ai_agent_call?.agent_id || nodeData.label,
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
          onAgentDismiss(nodeData.ai_agent_call?.agent_id || nodeData.label);
          toast({
            title: "AI Agent Dismissed",
            description: "Agent recommendation has been dismissed",
          });
        }
      } : undefined
    };

    if (nodeData.isRecommended && dismissedAgents.has(nodeData.ai_agent_call?.agent_id || nodeData.label)) {
      return null;
    }

    return processedData;
  }, [onAgentAdd, onAgentDismiss, dismissedAgents, toast]);

  useEffect(() => {
    console.log('🔄 Processing OpenAI-generated CLEAR diagram data');
    
    try {
      if (automationDiagramData?.nodes && automationDiagramData?.edges) {
        console.log('✅ Using OpenAI CLEAR diagram data:', {
          nodes: automationDiagramData.nodes.length,
          edges: automationDiagramData.edges.length,
          source: automationDiagramData.metadata?.source || 'unknown'
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

        // Apply enhanced left-to-right layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = calculateEnhancedLayout(
          processedNodes,
          automationDiagramData.edges.map(edge => ({
            ...edge,
            animated: false,
            type: edge.type || 'smoothstep',
            style: {
              stroke: edge.style?.stroke || '#6366f1',
              strokeWidth: edge.style?.strokeWidth || 4,
              ...edge.style
            }
          }))
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        
        const stats = {
          totalNodes: layoutedNodes.length,
          totalEdges: layoutedEdges.length,
          conditionNodes: layoutedNodes.filter(n => n.type?.includes('condition')).length,
          aiAgentNodes: layoutedNodes.filter(n => n.data?.isRecommended || n.type === 'aiAgentNode').length,
          platformNodes: layoutedNodes.filter(n => n.data?.platform).length,
          stopNodes: layoutedNodes.filter(n => n.data?.stepType === 'stop' || n.data?.stepType === 'end').length
        };
        
        setDiagramStats(stats);
        setDiagramError(null);
        
        console.log('📊 CLEAR diagram statistics:', stats);
        
      } else if (automationBlueprint?.steps?.length > 0) {
        console.log('⚠️ No diagram data available, but blueprint exists - generating CLEAR diagram...');
        setDiagramError('Generating clear, easy-to-understand diagram...');
        
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
      console.error('💥 Error processing CLEAR diagram data:', error);
      setDiagramError(`Error processing diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setNodes([]);
      setEdges([]);
    }
  }, [automationDiagramData, automationBlueprint, processNodeData]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleRegenerateWithInput = async () => {
    if (onRegenerateDiagram) {
      setIsRegenerating(true);
      try {
        console.log('🔄 Regenerating CLEAR diagram with user feedback:', regenerateInput);
        await onRegenerateDiagram(regenerateInput.trim() || undefined);
        setShowRegenerateForm(false);
        setRegenerateInput('');
        toast({
          title: "Creating Better Diagram",
          description: "Making the diagram clearer and easier to understand",
        });
      } catch (error) {
        console.error('Error regenerating diagram:', error);
        toast({
          title: "Regeneration Failed",
          description: "Failed to regenerate diagram. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  const handleQuickRegenerate = () => {
    if (onRegenerateDiagram) {
      console.log('🔄 Quick regenerating CLEAR diagram');
      onRegenerateDiagram();
      toast({
        title: "Making Diagram Clearer",
        description: "Creating a better, easier-to-understand diagram",
      });
    }
  };

  return (
    <div className="h-full w-full relative bg-gray-50">
      {/* Enhanced Header Controls - Mobile Responsive */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => setShowJsonDebug(true)}
          size="sm"
          variant="outline"
          className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-purple-200 hover:border-purple-300 rounded-xl text-xs sm:text-sm"
        >
          <Code className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Debug</span>
          <span className="sm:hidden">JSON</span>
        </Button>
        
        <Dialog open={showRegenerateForm} onOpenChange={setShowRegenerateForm}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-orange-200 hover:border-orange-300 rounded-xl text-xs sm:text-sm"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Make Clearer</span>
              <span className="sm:hidden">Fix</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Make Diagram Clearer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedback" className="text-sm font-medium">
                  What should be clearer? (Optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="e.g., 'Show platform icons', 'Make flow left to right', 'Add more details to steps', 'Fix confusing connections'..."
                  value={regenerateInput}
                  onChange={(e) => setRegenerateInput(e.target.value)}
                  className="mt-2 min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleRegenerateWithInput} 
                  className="flex-1"
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Making Clearer...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Make Clearer
                    </>
                  )}
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
            onClick={handleQuickRegenerate}
            size="sm"
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg rounded-xl text-xs sm:text-sm"
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{isGenerating ? 'Creating...' : 'Regenerate'}</span>
            <span className="sm:hidden">{isGenerating ? 'Gen...' : 'Regen'}</span>
          </Button>
        )}
      </div>

      {/* Enhanced Statistics Badge - Mobile Responsive */}
      {diagramStats.totalNodes > 0 && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm shadow-lg text-gray-700 px-2 sm:px-3 py-1 rounded-xl text-xs sm:text-sm">
            <span className="hidden lg:inline">
              {diagramStats.totalNodes} steps • {diagramStats.totalEdges} connections
            </span>
            <span className="hidden sm:inline lg:hidden">
              {diagramStats.totalNodes} steps • {diagramStats.totalEdges} links
            </span>
            <span className="sm:hidden">
              {diagramStats.totalNodes}/{diagramStats.totalEdges}
            </span>
            {diagramStats.aiAgentNodes > 0 && (
              <span className="ml-1 sm:ml-2 text-emerald-600 font-bold">
                • {diagramStats.aiAgentNodes} AI
              </span>
            )}
            {diagramStats.conditionNodes > 0 && (
              <span className="ml-1 sm:ml-2 text-orange-600 font-bold hidden sm:inline">
                • {diagramStats.conditionNodes} decisions
              </span>
            )}
          </Badge>
        </div>
      )}

      {/* Main Diagram Container - Enhanced for Clarity */}
      <div className="h-full w-full rounded-none sm:rounded-xl overflow-hidden shadow-none sm:shadow-xl border-0 sm:border border-gray-200">
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
            padding: 0.1,
            minZoom: 0.2,
            maxZoom: 1.5
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          className="bg-gray-50"
          panOnScroll
          panOnDrag={[1, 2]}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#6366f1',
              strokeWidth: 4
            }
          }}
        >
          <Background 
            variant={BackgroundVariant.Dots}
            gap={32} 
            size={1.5}
            color="#e5e7eb"
            style={{ opacity: 0.5 }}
          />
          
          <Controls 
            position="bottom-right"
            showInteractive={false}
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200"
          />
          
          <MiniMap 
            nodeStrokeColor="#6366f1"
            nodeColor="#f8fafc"
            nodeBorderRadius={16}
            maskColor="rgba(99, 102, 241, 0.1)"
            position="bottom-left"
            pannable
            zoomable
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 hidden xl:block"
            style={{
              width: '240px',
              height: '160px'
            }}
          />
        </ReactFlow>
      </div>

      {/* Enhanced Error State */}
      {diagramError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm p-4">
          <Card className="max-w-sm sm:max-w-md mx-auto shadow-xl border-orange-200 rounded-2xl">
            <CardHeader className="text-center">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-2" />
              <CardTitle className="text-orange-800 text-sm sm:text-base">
                {isGenerating ? 'Creating Clear Diagram' : 'Loading Diagram'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4 text-sm">{diagramError}</p>
              {isGenerating && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-purple-600">AI is creating an easy-to-understand diagram...</span>
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
    </div>
  );
};

export default AutomationDiagramDisplay;
