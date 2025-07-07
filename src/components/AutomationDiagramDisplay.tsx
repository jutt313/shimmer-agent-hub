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
import DiagramErrorRecovery from './DiagramErrorRecovery';
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
  const [retryCount, setRetryCount] = useState(0);
  const [diagramStats, setDiagramStats] = useState({
    totalNodes: 0,
    totalEdges: 0,
    conditionNodes: 0,
    aiAgentNodes: 0,
    platformNodes: 0,
    stopNodes: 0
  });

  const processNodeData = useCallback((nodeData: any) => {
    console.log('🎯 Processing PERFECT node:', { 
      label: nodeData.label, 
      stepType: nodeData.stepType, 
      platform: nodeData.platform,
      isRecommended: nodeData.isRecommended 
    });

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
          console.log('➕ Adding AI agent:', agentData.name);
          onAgentAdd(agentData);
          toast({
            title: "🤖 AI Agent Added",
            description: `${agentData.name} has been added to your automation`,
          });
        }
      } : undefined,
      onDismiss: nodeData.isRecommended ? () => {
        if (onAgentDismiss) {
          const agentName = nodeData.ai_agent_call?.agent_id || nodeData.label;
          console.log('❌ Dismissing AI agent:', agentName);
          onAgentDismiss(agentName);
          toast({
            title: "AI Agent Dismissed",
            description: "Agent recommendation has been dismissed",
          });
        }
      } : undefined
    };

    if (nodeData.isRecommended && dismissedAgents.has(nodeData.ai_agent_call?.agent_id || nodeData.label)) {
      console.log('🚫 Node filtered out (dismissed):', nodeData.label);
      return null;
    }

    return processedData;
  }, [onAgentAdd, onAgentDismiss, dismissedAgents, toast]);

  // Enhanced error recovery functions
  const handleRetryDiagram = useCallback(() => {
    if (onRegenerateDiagram) {
      setRetryCount(prev => prev + 1);
      setDiagramError(null);
      console.log(`🔄 Retrying diagram generation (attempt ${retryCount + 1})`);
      onRegenerateDiagram();
      toast({
        title: "🔄 Retrying Generation",
        description: "Using enhanced AI model with improved error handling",
      });
    }
  }, [onRegenerateDiagram, retryCount, toast]);

  const handleFallbackDiagram = useCallback(() => {
    if (!automationBlueprint?.steps) return;
    
    console.log('🛠️ Creating fallback diagram');
    
    // Create a simple fallback diagram structure
    const fallbackNodes = [
      {
        id: "fallback-trigger",
        type: "triggerNode",
        position: { x: 100, y: 300 },
        data: {
          label: `${automationBlueprint.trigger?.type || 'Manual'} Trigger`,
          stepType: "trigger",
          explanation: "This automation starts here",
          platform: automationBlueprint.trigger?.platform || "System",
          icon: "Play"
        }
      }
    ];

    const fallbackEdges: any[] = [];
    let currentX = 600;

    // Add basic steps
    automationBlueprint.steps.forEach((step, index) => {
      const nodeId = `fallback-step-${index}`;
      fallbackNodes.push({
        id: nodeId,
        type: step.type === 'condition' ? 'conditionNode' : 'actionNode',
        position: { x: currentX, y: 300 },
        data: {
          label: step.name || `Step ${index + 1}`,
          stepType: step.type,
          explanation: `${step.type} step in the automation`,
          platform: (step.action as any)?.integration || 'System',
          icon: step.type === 'condition' ? 'GitFork' : 'PlugZap'
        }
      });

      // Connect to previous node
      const sourceId = index === 0 ? "fallback-trigger" : `fallback-step-${index - 1}`;
      fallbackEdges.push({
        id: `fallback-edge-${index}`,
        source: sourceId,
        target: nodeId,
        type: 'straight',
        style: { stroke: '#6366f1', strokeWidth: 3 }
      });

      currentX += 500;
    });

    // Add end node
    fallbackNodes.push({
      id: "fallback-end",
      type: "fallbackNode",
      position: { x: currentX, y: 300 },
      data: {
        label: "✅ Complete",
        stepType: "end",
        explanation: "Automation completed",
        platform: "System",
        icon: "Flag"
      }
    });

    fallbackEdges.push({
      id: "fallback-edge-end",
      source: fallbackNodes[fallbackNodes.length - 2].id,
      target: "fallback-end",
      type: 'straight',
      style: { stroke: '#6366f1', strokeWidth: 3 }
    });

    setNodes(fallbackNodes);
    setEdges(fallbackEdges);
    setDiagramError(null);
    
    const stats = {
      totalNodes: fallbackNodes.length,
      totalEdges: fallbackEdges.length,
      conditionNodes: fallbackNodes.filter(n => n.type?.includes('condition')).length,
      aiAgentNodes: 0,
      platformNodes: fallbackNodes.filter(n => n.data?.platform && n.data.platform !== 'System').length,
      stopNodes: 1
    };
    
    setDiagramStats(stats);
    
    toast({
      title: "📋 Fallback Diagram Created",
      description: "Basic diagram structure generated successfully",
    });
  }, [automationBlueprint, toast]);

  useEffect(() => {
    console.log('🎯 Processing PERFECT diagram with GREEN DOTTED lines');
    
    try {
      if (automationDiagramData?.nodes && automationDiagramData?.edges) {
        console.log('✅ Using PERFECT diagram data with GREEN styling:', {
          nodes: automationDiagramData.nodes.length,
          edges: automationDiagramData.edges.length,
          source: automationDiagramData.metadata?.source || 'unknown',
          greenDottedLines: true
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

        // Apply PERFECT left-to-right layout with GREEN DOTTED lines
        const { nodes: layoutedNodes, edges: layoutedEdges } = calculateEnhancedLayout(
          processedNodes,
          automationDiagramData.edges.map(edge => ({
            ...edge,
            animated: false,
            type: 'straight', // STRAIGHT LINES!
            style: {
              stroke: '#10b981', // GREEN COLOR
              strokeWidth: 3,
              strokeDasharray: '8 5', // DOTTED PATTERN
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
        
        console.log('📊 PERFECT diagram statistics:', stats);
        
        if (stats.aiAgentNodes > 0) {
          toast({
            title: "🤖 AI Recommendations Found",
            description: `${stats.aiAgentNodes} AI agent recommendations detected`,
          });
        }
        
      } else if (automationBlueprint?.steps?.length > 0) {
        console.log('⚠️ No diagram data available, generating PERFECT diagram with GREEN DOTTED lines...');
        setDiagramError('Creating perfect left-to-right diagram with green dotted lines...');
        
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
      console.error('💥 Error processing PERFECT diagram:', error);
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
        console.log('🎯 Regenerating PERFECT diagram with feedback:', regenerateInput);
        await onRegenerateDiagram(regenerateInput.trim() || undefined);
        setShowRegenerateForm(false);
        setRegenerateInput('');
        toast({
          title: "🎯 Creating Perfect Diagram",
          description: "Generating left-to-right flow with straight lines and AI recommendations",
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
      console.log('🎯 Quick regenerating PERFECT diagram');
      onRegenerateDiagram();
      toast({
        title: "🎯 Creating Perfect Diagram",
        description: "Generating crystal clear left-to-right flow with straight lines",
      });
    }
  };

  return (
    <div className="h-full w-full relative bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* PERFECT Mobile-Responsive Header Controls */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => setShowJsonDebug(true)}
          size="sm"
          variant="outline"
          className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-purple-200 hover:border-purple-300 rounded-xl text-xs sm:text-sm px-2 sm:px-4"
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
              className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-orange-200 hover:border-orange-300 rounded-xl text-xs sm:text-sm px-2 sm:px-4"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Perfect</span>
              <span className="sm:hidden">Fix</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Perfect Your Diagram
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedback" className="text-sm font-medium">
                  What needs improvement? (Optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="e.g., 'Make lines straighter', 'Add more AI recommendations', 'Fix platform icons', 'Better condition branches'..."
                  value={regenerateInput}
                  onChange={(e) => setRegenerateInput(e.target.value)}
                  className="mt-2 min-h-[120px]"
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
                      Perfecting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Perfect Diagram
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
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg rounded-xl text-xs sm:text-sm px-2 sm:px-4"
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

      {/* PERFECT Statistics Badge - Mobile-Responsive */}
      {diagramStats.totalNodes > 0 && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm shadow-lg text-gray-700 px-2 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-medium">
            <span className="hidden xl:inline">
              {diagramStats.totalNodes} steps • {diagramStats.totalEdges} connections
            </span>
            <span className="hidden sm:inline xl:hidden">
              {diagramStats.totalNodes} steps • {diagramStats.totalEdges} links
            </span>
            <span className="sm:hidden">
              {diagramStats.totalNodes}/{diagramStats.totalEdges}
            </span>
            {diagramStats.aiAgentNodes > 0 && (
              <span className="ml-1 sm:ml-2 text-emerald-600 font-bold">
                • {diagramStats.aiAgentNodes} 🤖
              </span>
            )}
            {diagramStats.conditionNodes > 0 && (
              <span className="ml-1 sm:ml-2 text-orange-600 font-bold hidden lg:inline">
                • {diagramStats.conditionNodes} decisions
              </span>
            )}
          </Badge>
        </div>
      )}

      {/* Enhanced Diagram Container */}
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
            minZoom: 0.3,
            maxZoom: 1.5
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          className="bg-gradient-to-br from-blue-50 via-white to-purple-50"
          panOnScroll
          panOnDrag={[1, 2]}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'straight',
            animated: false,
            style: {
              stroke: '#10b981', // GREEN COLOR
              strokeWidth: 3,
              strokeDasharray: '8 5' // DOTTED PATTERN
            }
          }}
        >
          <Background 
            variant={BackgroundVariant.Dots}
            gap={32} 
            size={1.5}
            color="#e5e7eb"
            style={{ opacity: 0.4 }}
          />
          
          <Controls 
            position="bottom-right"
            showInteractive={false}
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 [&>button]:!bg-white/90 [&>button]:hover:!bg-gray-100"
          />
          
          <MiniMap 
            nodeStrokeColor="#6366f1"
            nodeColor="#f8fafc"
            nodeBorderRadius={16}
            maskColor="rgba(99, 102, 241, 0.1)"
            position="bottom-left"
            pannable
            zoomable
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 hidden lg:block"
            style={{
              width: '280px',
              height: '180px'
            }}
          />
        </ReactFlow>
      </div>

      {/* Enhanced Error State with Comprehensive Recovery */}
      {diagramError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm p-4">
          <DiagramErrorRecovery
            error={diagramError}
            onRetry={handleRetryDiagram}
            onFallbackDiagram={handleFallbackDiagram}
            isRetrying={isGenerating}
          />
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
    </div>
  );
};

export default AutomationDiagramDisplay;
