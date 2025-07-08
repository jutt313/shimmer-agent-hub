
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefreshCw, Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { AutomationBlueprint } from '@/types/automation';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useToast } from '@/components/ui/use-toast';

interface AutomationDiagramDisplayProps {
  automationBlueprint?: AutomationBlueprint | null;
  automationDiagramData?: { nodes: any[]; edges: any[] } | null;
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

  // Load diagram data when it becomes available
  useEffect(() => {
    if (automationDiagramData?.nodes && automationDiagramData?.edges) {
      console.log('📊 Loading diagram data:', {
        nodes: automationDiagramData.nodes.length,
        edges: automationDiagramData.edges.length
      });
      
      setNodes(automationDiagramData.nodes);
      setEdges(automationDiagramData.edges);
    }
  }, [automationDiagramData, setNodes, setEdges]);

  const handleRegenerateClick = () => {
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = () => {
    if (onRegenerateDiagram) {
      onRegenerateDiagram(feedback.trim() || undefined);
    }
    setFeedback('');
    setShowFeedbackForm(false);
    
    toast({
      title: "Regenerating Diagram",
      description: "Creating an improved diagram based on your feedback...",
    });
  };

  const handleCancelFeedback = () => {
    setFeedback('');
    setShowFeedbackForm(false);
  };

  // Get AI agents from messages for recommendation display
  const getRecommendedAgents = () => {
    const agents: any[] = [];
    messages.forEach(msg => {
      if (msg.isBot && msg.structuredData?.agents) {
        agents.push(...msg.structuredData.agents);
      }
    });
    
    // Remove duplicates and dismissed agents
    const uniqueAgents = agents.filter((agent, index, self) => 
      index === self.findIndex(a => a.name === agent.name) &&
      !dismissedAgents.has(agent.name)
    );
    
    return uniqueAgents;
  };

  const recommendedAgents = getRecommendedAgents();

  return (
    <div className="h-full w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-0 overflow-hidden"
      style={{
        boxShadow: '0 0 60px rgba(92, 142, 246, 0.15), 0 0 120px rgba(154, 94, 255, 0.08)'
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none"></div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Automation Diagram
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Visual representation of your automation workflow
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Feedback Form */}
              {showFeedbackForm && (
                <Card className="absolute top-16 right-6 w-80 z-50 bg-white/95 backdrop-blur-sm shadow-xl border border-blue-200/50"
                  style={{
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Improve Diagram</CardTitle>
                    <p className="text-sm text-gray-600">Tell us what you'd like to see improved</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="feedback">What would you like to improve?</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="e.g., Add more detail to the API steps, show error handling paths, include timing information..."
                        className="mt-1 min-h-[80px] resize-none"
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">{feedback.length}/500 characters</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitFeedback}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Improve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelFeedback}
                        size="sm"
                        variant="outline"
                        disabled={isGenerating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Regenerate Button */}
              <Button
                onClick={handleRegenerateClick}
                size="sm"
                variant="outline"
                disabled={isGenerating || showFeedbackForm}
                className="bg-white/80 hover:bg-white border-blue-200 text-blue-600 hover:text-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Diagram Content */}
        <div className="flex-1 relative">
          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              connectionMode={ConnectionMode.Loose}
              fitView
              fitViewOptions={{
                padding: 0.2,
                includeHiddenNodes: false,
              }}
              className="bg-gradient-to-br from-blue-50/30 to-purple-50/30"
            >
              <Background color="#e2e8f0" gap={20} />
              <Controls className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg" />
              <MiniMap 
                className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg"
                nodeColor="#3b82f6"
                maskColor="rgba(59, 130, 246, 0.1)"
              />
            </ReactFlow>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                {isGenerating ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Generating AI-Powered Diagram
                      </h3>
                      <p className="text-gray-600">
                        Creating an intelligent visualization of your automation workflow...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        No Diagram Available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Create an automation first to see its visual workflow
                      </p>
                      {automationBlueprint && (
                        <Button
                          onClick={() => onRegenerateDiagram?.()}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Diagram
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recommended Agents Section */}
        {recommendedAgents.length > 0 && (
          <div className="p-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <h4 className="font-medium text-gray-800 mb-3">Recommended AI Agents for this Workflow:</h4>
            <div className="flex flex-wrap gap-2">
              {recommendedAgents.map((agent, index) => (
                <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-lg p-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800">{agent.name}</p>
                    <p className="text-xs text-gray-600">{agent.role || 'AI Agent'}</p>
                  </div>
                  <div className="flex gap-1">
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
                      className="border-gray-300 text-gray-600 hover:bg-gray-100 px-1 py-1 text-xs h-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationDiagramDisplay;
