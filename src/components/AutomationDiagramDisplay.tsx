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

// Define proper interface for node data
interface NodeData {
  label: string;
  stepType: string;
  explanation: string;
  platform: string;
  icon: string;
  isRecommended?: boolean;
  ai_agent_call?: any;
  onAdd?: () => void;
  onDismiss?: () => void;
}

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

  const processNodeData = useCallback((nodeData: any): NodeData | null => {
    console.log('🎯 Processing node:', { 
      label: nodeData.label, 
      stepType: nodeData.stepType, 
      platform: nodeData.platform,
      isRecommended: nodeData.isRecommended 
    });

    const processedData: NodeData = {
      label: nodeData.label || 'Unknown Step',
      stepType: nodeData.stepType || 'action',
      explanation: nodeData.explanation || 'No explanation available',
      platform: nodeData.platform || 'System',
      icon: nodeData.icon || 'PlugZap',
      isRecommended: nodeData.isRecommended || false,
      ai_agent_call: nodeData.ai_agent_call,
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

  // Enhanced fallback diagram creation from blueprint
  const handleFallbackDiagram = useCallback(() => {
    const blueprintToUse = automationBlueprint;
    
    if (!blueprintToUse?.steps) {
      console.warn('❌ No blueprint available for fallback diagram');
      toast({
        title: "No Blueprint Data",
        description: "Cannot create fallback diagram without blueprint steps",
        variant: "destructive",
      });
      return;
    }
    
    console.log('🛠️ Creating enhanced fallback diagram from blueprint');
    
    // Create a comprehensive fallback diagram structure
    const fallbackNodes = [
      {
        id: "fallback-trigger",
        type: "triggerNode",
        position: { x: 100, y: 300 },
        data: {
          label: `${blueprintToUse.trigger?.type || 'Manual'} Trigger`,
          stepType: "trigger",
          explanation: "This automation starts here",
          platform: blueprintToUse.trigger?.platform || "System",
          icon: "Play",
          isRecommended: false
        } as NodeData
      }
    ];

    const fallbackEdges: any[] = [];
    let currentX = 600;

    // Enhanced step processing with better node types
    blueprintToUse.steps.forEach((step, index) => {
      const nodeId = `fallback-step-${index}`;
      
      // Determine node type based on step type
      let nodeType = 'actionNode';
      let stepIcon = 'PlugZap';
      
      switch (step.type) {
        case 'condition':
          nodeType = 'conditionNode';
          stepIcon = 'GitFork';
          break;
        case 'ai_agent_call':
          nodeType = 'aiAgentNode';
          stepIcon = 'Bot';
          break;
        case 'loop':
          nodeType = 'loopNode';
          stepIcon = 'RotateCcw';
          break;
        case 'delay':
          nodeType = 'delayNode';
          stepIcon = 'Clock';
          break;
        case 'retry':
          nodeType = 'retryNode';
          stepIcon = 'RefreshCw';
          break;
        case 'fallback':
          nodeType = 'fallbackNode';
          stepIcon = 'Shield';
          break;
        default:
          nodeType = 'actionNode';
          stepIcon = 'PlugZap';
      }
      
      fallbackNodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: currentX, y: 300 },
        data: {
          label: step.name || `Step ${index + 1}`,
          stepType: step.type,
          explanation: `${step.type} step: ${step.name || 'Automation step'}`,
          platform: (step.action as any)?.integration || 'System',
          icon: stepIcon,
          isRecommended: step.ai_recommended || false,
          ai_agent_call: step.ai_agent_call || undefined
        } as NodeData
      });

      // Connect to previous node
      const sourceId = index === 0 ? "fallback-trigger" : `fallback-step-${index - 1}`;
      fallbackEdges.push({
        id: `fallback-edge-${index}`,
        source: sourceId,
        target: nodeId,
        type: 'straight',
        animated: true,
        style: { 
          stroke: '#8b5cf6', 
          strokeWidth: 3,
          strokeDasharray: '8,4'
        }
      });

      currentX += 500;
    });

    // Add end node
    fallbackNodes.push({
      id: "fallback-end",
      type: "actionNode",
      position: { x: currentX, y: 300 },
      data: {
        label: "✅ Complete",
        stepType: "end",
        explanation: "Automation completed successfully",
        platform: "System",
        icon: "CheckCircle",
        isRecommended: false
      } as NodeData
    });

    fallbackEdges.push({
      id: "fallback-edge-end",
      source: fallbackNodes[fallbackNodes.length - 2].id,
      target: "fallback-end",
      type: 'straight',
      animated: true,
      style: { 
        stroke: '#10b981', 
        strokeWidth: 3,
        strokeDasharray: '8,4'
      }
    });

    setNodes(fallbackNodes);
    setEdges(fallbackEdges);
    setDiagramError(null);
    
    const stats = {
      totalNodes: fallbackNodes.length,
      totalEdges: fallbackEdges.length,
      conditionNodes: fallbackNodes.filter(n => n.type?.includes('condition')).length,
      aiAgentNodes: fallbackNodes.filter(n => n.data?.isRecommended).length,
      platformNodes: fallbackNodes.filter(n => n.data?.platform && n.data.platform !== 'System').length,
      stopNodes: 1
    };
    
    setDiagramStats(stats);
    
    toast({
      title: "🛠️ Fallback Diagram Created",
      description: `Generated diagram with ${stats.totalNodes} nodes from blueprint`,
    });
  }, [automationBlueprint, toast]);

  useEffect(() => {
    console.log('🎯 Processing diagram data with enhanced validation');
    
    try {
      // Enhanced diagram data processing with fallback logic
      if (automationDiagramData?.nodes && automationDiagramData?.edges) {
        console.log('✅ Using diagram data:', {
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

        console.log('📊 Processed nodes:', {
          original: automationDiagramData.nodes.length,
          processed: processedNodes.length,
          aiRecommendations: processedNodes.filter(n => n.data?.isRecommended).length
        });

        // Apply enhanced layout with animated dotted lines
        const { nodes: layoutedNodes, edges: layoutedEdges } = calculateEnhancedLayout(
          processedNodes,
          automationDiagramData.edges.map(edge => ({
            ...edge,
            animated: true,
            type: 'straight',
            style: {
              stroke: '#8b5cf6',
              strokeWidth: 3,
              strokeDasharray: '8,4',
              filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))',
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
        
        console.log('📊 Diagram statistics:', stats);
        
        if (stats.aiAgentNodes > 0) {
          toast({
            title: "🤖 AI Recommendations Found",
            description: `${stats.aiAgentNodes} AI agent recommendations detected`,
          });
        }
        
      } else if (automationBlueprint?.steps?.length > 0) {
        // Enhanced handling when diagram data is missing but blueprint exists
        console.log('⚠️ No diagram data available, but blueprint exists - creating fallback');
        setDiagramError('No diagram visualization available. Creating from blueprint...');
        
        // Auto-create fallback diagram from blueprint
        setTimeout(() => {
          handleFallbackDiagram();
        }, 1000);
        
      } else {
        console.log('❌ No diagram data or blueprint available');
        setDiagramError('No automation data available to display. Please ensure your automation has been properly configured.');
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
      console.error('💥 Error processing diagram:', error);
      setDiagramError(`Error processing diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setNodes([]);
      setEdges([]);
    }
  }, [automationDiagramData, automationBlueprint, processNodeData, handleFallbackDiagram]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleRegenerateWithInput = async () => {
    if (onRegenerateDiagram) {
      setIsRegenerating(true);
      try {
        console.log('🎯 Regenerating diagram with feedback:', regenerateInput);
        await onRegenerateDiagram(regenerateInput.trim() || undefined);
        setShowRegenerateForm(false);
        setRegenerateInput('');
        toast({
          title: "🎯 Creating Enhanced Diagram",
          description: "Generating with your specific feedback and improvements",
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
      console.log('🎯 Quick regenerating diagram');
      onRegenerateDiagram();
      toast({
        title: "🎯 Regenerating Diagram",
        description: "Creating improved visualization with AI",
      });
    }
  };

  return (
    <div className="h-full w-full relative bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* MOBILE-OPTIMIZED Header Controls */}
      <div className="absolute top-1 sm:top-2 md:top-4 right-1 sm:right-2 md:right-4 z-10 flex flex-col sm:flex-row gap-1 sm:gap-2">
        <Button
          onClick={() => setShowJsonDebug(true)}
          size="sm"
          variant="outline"
          className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-purple-200 hover:border-purple-300 rounded-xl text-xs px-2 py-1 sm:px-4 sm:py-2"
        >
          <Code className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          <span className="hidden md:inline">Debug</span>
        </Button>
        
        <Dialog open={showRegenerateForm} onOpenChange={setShowRegenerateForm}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-orange-200 hover:border-orange-300 rounded-xl text-xs px-2 py-1 sm:px-4 sm:py-2"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden md:inline">Enhance</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                Enhance Your Diagram
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedback" className="text-xs sm:text-sm font-medium">
                  Enhancement Request (Optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="e.g., 'Add more detail to steps', 'Show error handling', 'Include platform integrations'..."
                  value={regenerateInput}
                  onChange={(e) => setRegenerateInput(e.target.value)}
                  className="mt-2 min-h-[100px] text-xs sm:text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleRegenerateWithInput} 
                  className="flex-1 text-xs sm:text-sm"
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Enhance
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowRegenerateForm(false)} className="text-xs sm:text-sm">
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
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg rounded-xl text-xs px-2 py-1 sm:px-4 sm:py-2"
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            )}
            <span className="hidden sm:inline">{isGenerating ? 'Creating...' : 'Regenerate'}</span>
          </Button>
        )}
      </div>

      {/* MOBILE-OPTIMIZED Statistics Badge */}
      {diagramStats.totalNodes > 0 && (
        <div className="absolute top-1 sm:top-2 md:top-4 left-1 sm:left-2 md:left-4 z-10">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm shadow-lg text-gray-700 px-2 py-1 rounded-xl text-xs font-medium">
            <span className="hidden lg:inline">
              {diagramStats.totalNodes} steps • {diagramStats.totalEdges} connections
            </span>
            <span className="hidden sm:inline lg:hidden">
              {diagramStats.totalNodes} • {diagramStats.totalEdges}
            </span>
            <span className="sm:hidden">
              {diagramStats.totalNodes}/{diagramStats.totalEdges}
            </span>
            {diagramStats.aiAgentNodes > 0 && (
              <span className="ml-1 sm:ml-2 text-emerald-600 font-bold">
                • {diagramStats.aiAgentNodes} 🤖
              </span>
            )}
          </Badge>
        </div>
      )}

      {/* MOBILE-OPTIMIZED Diagram Container */}
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
            padding: 0.05,
            minZoom: 0.2,
            maxZoom: 1.5
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          className="bg-gradient-to-br from-blue-50 via-white to-purple-50"
          panOnScroll
          panOnDrag={[1, 2]}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'straight',
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
            gap={24}
            size={1}
            color="#e5e7eb"
            style={{ opacity: 0.3 }}
          />
          
          <Controls 
            position="bottom-right"
            showInteractive={false}
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 [&>button]:!bg-white/90 [&>button]:hover:!bg-gray-100 [&>button]:text-xs [&>button]:p-1 sm:[&>button]:p-2"
          />
          
          <MiniMap 
            nodeStrokeColor="#8b5cf6"
            nodeColor="#f8fafc"
            nodeBorderRadius={16}
            maskColor="rgba(139, 92, 246, 0.1)"
            position="bottom-left"
            pannable
            zoomable
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 hidden lg:block"
            style={{
              width: '220px',
              height: '140px'
            }}
          />
        </ReactFlow>
      </div>

      {/* Enhanced error state with better recovery options */}
      {diagramError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm p-2 sm:p-4">
          <DiagramErrorRecovery
            error={diagramError}
            onRetry={handleRetryDiagram}
            onFallbackDiagram={handleFallbackDiagram}
            isRetrying={isGenerating}
          />
        </div>
      )}

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
