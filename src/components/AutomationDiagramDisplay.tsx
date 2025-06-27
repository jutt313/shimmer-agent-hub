import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  ReactFlowProvider,
  Position,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, AlertCircle, RefreshCw, Eye, EyeOff, Bug } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { globalErrorLogger } from '@/utils/errorLogger';
import ActionNode from './diagram/ActionNode';
import PlatformNode from './diagram/PlatformNode';
import ConditionNode from './diagram/ConditionNode';
import LoopNode from './diagram/LoopNode';
import DelayNode from './diagram/DelayNode';
import AIAgentNode from './diagram/AIAgentNode';
import RetryNode from './diagram/RetryNode';
import FallbackNode from './diagram/FallbackNode';
import { AutomationBlueprint } from "@/types/automation";

interface AutomationDiagramDisplayProps {
  automationBlueprint?: AutomationBlueprint | null;
  automationDiagramData?: { nodes: Node[]; edges: Edge[]; warning?: string } | null;
  messages?: any[];
  onAgentAdd?: (agent: any) => void;
  onAgentDismiss?: (agentName: string) => void;
  dismissedAgents?: Set<string>;
  isGenerating?: boolean;
  onRegenerateDiagram?: () => void;
}

const nodeTypes = {
  actionNode: ActionNode,
  platformNode: PlatformNode,
  conditionNode: ConditionNode,
  loopNode: LoopNode,
  delayNode: DelayNode,
  aiAgentNode: AIAgentNode,
  retryNode: RetryNode,
  fallbackNode: FallbackNode,
  triggerNode: PlatformNode,
};

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
  const [aiAgentRecommendations, setAiAgentRecommendations] = useState<any[]>([]);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [diagramSource, setDiagramSource] = useState<'ai' | 'fallback' | 'none'>('none');
  const [showDetails, setShowDetails] = useState(false);
  const [componentStats, setComponentStats] = useState<any>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);

  // ENHANCED BLUEPRINT ANALYSIS with detailed logging
  const analyzeBlueprint = useCallback((blueprint: AutomationBlueprint) => {
    console.log('🔍 FRONTEND: Starting comprehensive blueprint analysis');
    console.log('🔍 FRONTEND: Blueprint received:', !!blueprint);
    console.log('🔍 FRONTEND: Blueprint steps:', blueprint?.steps?.length || 0);
    
    if (!blueprint || !blueprint.steps) {
      console.warn('⚠️ FRONTEND: No blueprint or steps to analyze');
      return null;
    }

    let totalSteps = 0;
    const platforms = new Set<string>();
    const agents = new Set<string>();
    let conditions = 0;
    let loops = 0;
    let delays = 0;
    let retries = 0;
    let fallbacks = 0;
    const detailedAnalysis: any[] = [];

    const processSteps = (steps: any[], depth = 0, parentPath = '') => {
      console.log(`🔍 FRONTEND: Processing ${steps.length} steps at depth ${depth}`);
      
      steps.forEach((step, index) => {
        const stepPath = `${parentPath}step-${index}`;
        totalSteps++;
        
        console.log(`📝 FRONTEND: Step ${totalSteps}: ${step.name || step.type} (${step.type})`);
        
        detailedAnalysis.push({
          path: stepPath,
          name: step.name || `Step ${totalSteps}`,
          type: step.type,
          depth: depth,
          hasAction: !!step.action,
          hasAgent: !!step.ai_agent_call,
          platform: step.action?.integration
        });
        
        if (step.action?.integration) {
          platforms.add(step.action.integration);
          console.log(`🔌 FRONTEND: Found platform: ${step.action.integration}`);
        }
        
        if (step.ai_agent_call?.agent_id) {
          agents.add(step.ai_agent_call.agent_id);
          console.log(`🤖 FRONTEND: Found agent: ${step.ai_agent_call.agent_id}`);
        }
        
        switch (step.type) {
          case 'condition':
            conditions++;
            if (step.condition?.if_true) processSteps(step.condition.if_true, depth + 1, `${stepPath}-true-`);
            if (step.condition?.if_false) processSteps(step.condition.if_false, depth + 1, `${stepPath}-false-`);
            break;
          case 'loop':
            loops++;
            if (step.loop?.steps) processSteps(step.loop.steps, depth + 1, `${stepPath}-loop-`);
            break;
          case 'delay':
            delays++;
            break;
          case 'retry':
            retries++;
            if (step.retry?.steps) processSteps(step.retry.steps, depth + 1, `${stepPath}-retry-`);
            break;
          case 'fallback':
            fallbacks++;
            if (step.fallback?.primary_steps) processSteps(step.fallback.primary_steps, depth + 1, `${stepPath}-primary-`);
            if (step.fallback?.fallback_steps) processSteps(step.fallback.fallback_steps, depth + 1, `${stepPath}-fallback-`);
            break;
        }
      });
    };

    processSteps(blueprint.steps);
    
    const analysis = {
      totalSteps,
      platforms: Array.from(platforms),
      agents: Array.from(agents),
      conditions,
      loops,
      delays,
      retries,
      fallbacks,
      expectedMinNodes: totalSteps + platforms.size + agents.size + 1,
      detailedAnalysis
    };
    
    console.log('📊 FRONTEND: Final analysis:', analysis);
    
    // Log detailed breakdown
    globalErrorLogger.log('INFO', 'Blueprint Analysis Complete', {
      totalSteps: analysis.totalSteps,
      platforms: analysis.platforms,
      agents: analysis.agents,
      expectedNodes: analysis.expectedMinNodes,
      detailedBreakdown: analysis.detailedAnalysis
    });
    
    return analysis;
  }, []);

  // Extract AI agent recommendations from messages
  useEffect(() => {
    const recommendations: any[] = [];
    messages.forEach(message => {
      if (message.isBot && message.structuredData?.ai_agents) {
        message.structuredData.ai_agents.forEach((agent: any) => {
          if (agent && agent.name && !dismissedAgents.has(agent.name)) {
            recommendations.push(agent);
          }
        });
      }
    });
    setAiAgentRecommendations(recommendations);
  }, [messages, dismissedAgents]);

  // ENHANCED diagram loading with comprehensive validation
  useEffect(() => {
    console.log('🔄 FRONTEND: Loading diagram data...');
    console.log('🔄 AI diagram available:', !!automationDiagramData);
    console.log('🔄 Blueprint available:', !!automationBlueprint);
    
    setDiagramError(null);
    setDiagnosticInfo(null);

    // Analyze blueprint
    if (automationBlueprint) {
      const stats = analyzeBlueprint(automationBlueprint);
      setComponentStats(stats);
      
      if (stats) {
        console.log('📊 FRONTEND: Component expectations:', {
          totalSteps: stats.totalSteps,
          platforms: stats.platforms,
          agents: stats.agents,
          expectedNodes: stats.expectedMinNodes
        });
      }
    }

    if (automationDiagramData && automationDiagramData.nodes && automationDiagramData.edges) {
      const nodeCount = automationDiagramData.nodes.length;
      const edgeCount = automationDiagramData.edges.length;
      const expectedNodes = componentStats?.expectedMinNodes || 0;
      
      console.log('🎨 FRONTEND: Loading AI diagram:', {
        nodes: nodeCount,
        edges: edgeCount,
        expectedNodes: expectedNodes,
        warning: automationDiagramData.warning
      });

      // COMPREHENSIVE VALIDATION
      const validation = {
        hasNodes: nodeCount > 0,
        hasEdges: edgeCount > 0,
        meetsMinimum: nodeCount >= expectedNodes * 0.7,
        platformCoverage: 0,
        agentCoverage: 0,
        nodeTypes: [...new Set(automationDiagramData.nodes.map(n => n.type))]
      };

      // Check platform coverage
      if (componentStats) {
        const platformNodes = automationDiagramData.nodes.filter(n => n.type === 'platformNode');
        validation.platformCoverage = platformNodes.length / Math.max(componentStats.platforms.length, 1);
        
        const agentNodes = automationDiagramData.nodes.filter(n => n.type === 'aiAgentNode');
        validation.agentCoverage = agentNodes.length / Math.max(componentStats.agents.length, 1);
      }

      setDiagnosticInfo(validation);
      
      console.log('📊 FRONTEND: Diagram validation:', validation);

      // Set warnings based on validation
      let errorMessages = [];
      
      if (automationDiagramData.warning) {
        errorMessages.push(automationDiagramData.warning);
      }
      
      if (!validation.meetsMinimum) {
        errorMessages.push(`Generated ${nodeCount} nodes but expected around ${expectedNodes}`);
      }
      
      if (validation.platformCoverage < 0.8) {
        errorMessages.push(`Missing platform nodes: ${Math.round(validation.platformCoverage * 100)}% coverage`);
      }
      
      if (validation.agentCoverage < 0.8 && componentStats?.agents.length > 0) {
        errorMessages.push(`Missing agent nodes: ${Math.round(validation.agentCoverage * 100)}% coverage`);
      }

      if (errorMessages.length > 0) {
        setDiagramError(errorMessages.join('; '));
      }
      
      // Process nodes for agent recommendations
      const processedNodes = automationDiagramData.nodes.map(node => {
        const recommendation = aiAgentRecommendations.find(agent => 
          node.type === 'aiAgentNode' && 
          agent && 
          agent.name && 
          node.data?.agent && 
          typeof node.data.agent === 'object' && 
          'agent_id' in node.data.agent &&
          agent.name === node.data.agent.agent_id
        );
        
        if (recommendation) {
          return {
            ...node,
            data: {
              ...node.data,
              isRecommended: true,
              onAdd: () => onAgentAdd?.(recommendation),
              onDismiss: () => onAgentDismiss?.(recommendation.name)
            }
          };
        }
        
        return node;
      });
      
      setNodes(processedNodes);
      setEdges(automationDiagramData.edges);
      setDiagramSource('ai');
      
    } else if (automationBlueprint && automationBlueprint.steps && automationBlueprint.steps.length > 0) {
      console.log('⚠️ FRONTEND: No AI diagram, creating enhanced fallback');
      setDiagramError('AI diagram failed - using enhanced fallback with all components');
      createEnhancedFallbackDiagram();
      setDiagramSource('fallback');
    } else {
      console.log('📝 FRONTEND: No data available');
      setNodes([]);
      setEdges([]);
      setDiagramSource('none');
    }
  }, [automationDiagramData, automationBlueprint, aiAgentRecommendations, analyzeBlueprint, componentStats]);

  // ENHANCED FALLBACK DIAGRAM that ensures ALL components are shown
  const createEnhancedFallbackDiagram = () => {
    if (!automationBlueprint?.steps || !componentStats) return;

    console.log('🏗️ FRONTEND: Creating ENHANCED fallback diagram');
    console.log('🏗️ FRONTEND: Will create nodes for:', componentStats);
    
    const fallbackNodes: Node[] = [];
    const fallbackEdges: Edge[] = [];
    let nodeCounter = 0;
    let xPosition = 100;

    // Add trigger node
    const triggerNode: Node = {
      id: 'enhanced-trigger',
      type: 'triggerNode',  
      position: { x: xPosition, y: 300 },
      data: {
        label: automationBlueprint.trigger?.type === 'scheduled' ? 'Scheduled Trigger' : 
               automationBlueprint.trigger?.type === 'webhook' ? 'Webhook Trigger' : 'Manual Trigger',
        explanation: 'Automation starting point',
        platform: 'system',
        icon: 'play',
        stepType: 'trigger'
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    fallbackNodes.push(triggerNode);
    xPosition += 400;

    let lastNodeId = 'enhanced-trigger';

    // Create nodes for ALL platforms
    componentStats.platforms.forEach((platform: string, index: number) => {
      const platformNodeId = `enhanced-platform-${index}`;
      const platformNode: Node = {
        id: platformNodeId,
        type: 'platformNode',
        position: { x: xPosition, y: 300 },
        data: {
          label: `${platform} Integration`,
          explanation: `Connects to ${platform} for data operations`,
          platform: platform,
          icon: platform.toLowerCase(),
          stepType: 'platform'
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
      
      fallbackNodes.push(platformNode);
      
      // Connect to previous node
      fallbackEdges.push({
        id: `enhanced-edge-${lastNodeId}-${platformNodeId}`,
        source: lastNodeId,
        target: platformNodeId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      });
      
      lastNodeId = platformNodeId;
      xPosition += 400;
    });

    // Create nodes for ALL agents
    componentStats.agents.forEach((agent: string, index: number) => {
      const agentNodeId = `enhanced-agent-${index}`;
      const agentNode: Node = {
        id: agentNodeId,
        type: 'aiAgentNode',
        position: { x: xPosition, y: 200 },
        data: {
          label: `AI Agent: ${agent}`,
          explanation: `AI-powered agent for automated processing`,
          agent: { agent_id: agent },
          stepType: 'ai_agent_call',
          isRecommended: false
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
      
      fallbackNodes.push(agentNode);
      
      fallbackEdges.push({
        id: `enhanced-edge-${lastNodeId}-${agentNodeId}`,
        source: lastNodeId,
        target: agentNodeId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 }
      });
      
      xPosition += 400;
    });

    // Process ALL automation steps comprehensively
    const processSteps = (steps: any[], startX: number, startY: number, parentId?: string) => {
      let currentX = startX;
      let currentLastNodeId = parentId || lastNodeId;

      steps.forEach((step, index) => {
        const nodeId = `enhanced-${step.id || `step-${nodeCounter++}`}`;
        
        let nodeType = 'actionNode';
        let yPos = startY;
        
        // Determine node type and position
        switch (step.type) {
          case 'condition':
            nodeType = 'conditionNode';
            break;
          case 'loop':
            nodeType = 'loopNode';
            break;
          case 'delay':
            nodeType = 'delayNode';
            break;
          case 'ai_agent_call':
            nodeType = 'aiAgentNode';
            yPos = startY - 100;
            break;
          case 'retry':
            nodeType = 'retryNode';
            break;
          case 'fallback':
            nodeType = 'fallbackNode';
            break;
          default:
            if (step.action?.integration) {
              nodeType = 'platformNode';
            }
        }
        
        const node: Node = {
          id: nodeId,
          type: nodeType,
          position: { x: currentX, y: yPos },
          data: {
            label: getEnhancedStepLabel(step),
            explanation: getEnhancedStepExplanation(step),
            platform: step.action?.integration || 'system',
            icon: step.action?.integration?.toLowerCase() || 'settings',
            stepType: step.type,
            ...getStepSpecificData(step)
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };

        fallbackNodes.push(node);

        // Connect to previous node
        if (currentLastNodeId) {
          fallbackEdges.push({
            id: `enhanced-edge-${currentLastNodeId}-${nodeId}`,
            source: currentLastNodeId,
            target: nodeId,
            type: 'smoothstep',
            animated: true,
            style: getEdgeStyle(step.type)
          });
        }

        // Process nested steps
        if (step.condition) {
          if (step.condition.if_true?.length > 0) {
            processSteps(step.condition.if_true, currentX + 400, startY - 200, nodeId);
          }
          if (step.condition.if_false?.length > 0) {
            processSteps(step.condition.if_false, currentX + 400, startY + 200, nodeId);
          }
        }

        if (step.loop?.steps?.length > 0) {
          processSteps(step.loop.steps, currentX + 400, startY - 100, nodeId);
        }

        if (step.retry?.steps?.length > 0) {
          processSteps(step.retry.steps, currentX + 400, startY, nodeId);
        }

        if (step.fallback) {
          if (step.fallback.primary_steps?.length > 0) {
            processSteps(step.fallback.primary_steps, currentX + 400, startY - 100, nodeId);
          }
          if (step.fallback.fallback_steps?.length > 0) {
            processSteps(step.fallback.fallback_steps, currentX + 400, startY + 100, nodeId);
          }
        }

        currentX += 400;
        currentLastNodeId = nodeId;
      });

      return currentLastNodeId;
    };

    // Process all steps
    processSteps(automationBlueprint.steps, xPosition, 300);

    console.log(`✅ FRONTEND: Enhanced fallback created: ${fallbackNodes.length} nodes, ${fallbackEdges.length} edges`);
    console.log('✅ FRONTEND: Node types created:', [...new Set(fallbackNodes.map(n => n.type))]);
    
    setNodes(fallbackNodes);
    setEdges(fallbackEdges);
  };

  const getEnhancedStepLabel = (step: any): string => {
    switch (step.type) {
      case 'action':
        return `${step.action?.integration || 'Action'}: ${step.action?.method || 'Execute'}`;
      case 'condition':
        return `Decision: ${step.condition?.expression || 'Check condition'}`;
      case 'loop':
        return `Loop: ${step.loop?.array_source || 'Iterate items'}`;
      case 'ai_agent_call':
        return `AI Agent: ${step.ai_agent_call?.agent_id || 'Agent Call'}`;
      case 'delay':
        return `Wait: ${step.delay?.duration_seconds || 0}s`;
      case 'retry':
        return `Retry: ${step.retry?.max_attempts || 3}x max`;
      case 'fallback':
        return 'Fallback: Primary + Backup';
      default:
        return step.name || `Step: ${step.type || 'Unknown'}`;
    }
  };

  const getEnhancedStepExplanation = (step: any): string => {
    switch (step.type) {
      case 'action':
        return `Execute ${step.action?.method || 'action'} on ${step.action?.integration || 'platform'}`;
      case 'condition':
        return `Evaluate: ${step.condition?.expression || 'condition'} and branch accordingly`;
      case 'loop':
        return `Iterate through ${step.loop?.array_source || 'data'} executing sub-steps`;
      case 'ai_agent_call':
        return `Call AI Agent "${step.ai_agent_call?.agent_id || 'unknown'}" for processing`;
      case 'delay':
        return `Pause execution for ${step.delay?.duration_seconds || 0} seconds`;
      case 'retry':
        return `Retry up to ${step.retry?.max_attempts || 3} times with error handling`;
      case 'fallback':
        return 'Execute primary steps, fall back to alternates on failure';
      default:
        return step.name || `Process step of type: ${step.type || 'unknown'}`;
    }
  };

  const getStepSpecificData = (step: any) => {
    const data: any = {};
    
    switch (step.type) {
      case 'condition':
        data.condition = step.condition;
        break;
      case 'loop':
        data.loop = step.loop;
        break;
      case 'delay':
        data.delay = step.delay;
        break;
      case 'ai_agent_call':
        data.agent = step.ai_agent_call;
        break;
      case 'retry':
        data.retry = step.retry;
        break;
      case 'fallback':
        data.fallback = step.fallback;
        break;
      case 'action':
        data.action = step.action;
        break;
    }
    
    return data;
  };

  const getEdgeStyle = (stepType: string) => {
    switch (stepType) {
      case 'condition':
        return { stroke: '#f97316', strokeWidth: 3 };
      case 'loop':
        return { stroke: '#8b5cf6', strokeWidth: 2 };
      case 'ai_agent_call':
        return { stroke: '#10b981', strokeWidth: 2 };
      case 'retry':
        return { stroke: '#f59e0b', strokeWidth: 2 };
      case 'fallback':
        return { stroke: '#6366f1', strokeWidth: 2 };
      default:
        return { stroke: '#94a3b8', strokeWidth: 2 };
    }
  };

  const onConnect = useCallback((params: any) => {
    console.log('Connection attempt:', params);
  }, []);

  const minimapStyle = {
    height: 160,
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  };

  if (isGenerating) {
    return (
      <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">AI is Creating Your Enhanced Diagram</h3>
              <p className="text-sm text-gray-600">
                Analyzing all {componentStats?.totalSteps || 0} steps, {componentStats?.platforms?.length || 0} platforms, 
                {componentStats?.agents?.length || 0} agents with comprehensive validation...
              </p>
              {componentStats && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Expected minimum nodes: {componentStats.expectedMinNodes}</div>
                  <div>Platforms: {componentStats.platforms.join(', ')}</div>
                  <div>System components: {componentStats.conditions + componentStats.loops + componentStats.delays + componentStats.retries + componentStats.fallbacks}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!nodes.length && !automationBlueprint?.steps?.length) {
    return (
      <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">No Automation Blueprint Yet</h3>
              <p className="text-sm text-gray-600">
                Start chatting with YusrAI to build your automation, and an enhanced comprehensive diagram will be generated automatically.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden relative">
      {/* ENHANCED header with comprehensive diagnostics */}
      <div className="absolute top-4 left-4 z-20 flex items-start gap-3 flex-wrap max-w-3xl">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-white/90 text-gray-700 border border-gray-200/50">
            <Sparkles className="w-3 h-3 mr-1" />
            {diagramSource === 'ai' ? 'AI-Enhanced Comprehensive Flow' : 'Enhanced Fallback Layout'}
          </Badge>
          
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {nodes.length} Nodes
            {componentStats && ` (${componentStats.expectedMinNodes} Expected)`}
          </Badge>
          
          {diagnosticInfo && (
            <Badge variant="outline" className={`${
              diagnosticInfo.meetsMinimum ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <Bug className="w-3 h-3 mr-1" />
              {Math.round((nodes.length / (componentStats?.expectedMinNodes || 1)) * 100)}% Complete
            </Badge>
          )}
          
          {componentStats && (
            <Button
              onClick={() => setShowDetails(!showDetails)}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
            >
              {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              Diagnostics
            </Button>
          )}
        </div>

        {showDetails && componentStats && diagnosticInfo && (
          <div className="w-full bg-white/95 rounded-lg p-3 border border-gray-200/50 text-xs space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="font-medium text-gray-700">Total Steps:</span>
                <span className="ml-1 text-gray-600">{componentStats.totalSteps}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Platforms:</span>
                <span className="ml-1 text-gray-600">{componentStats.platforms.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">AI Agents:</span>
                <span className="ml-1 text-gray-600">{componentStats.agents.length}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div>
                <span className="font-medium text-gray-700">Platform Coverage:</span>
                <span className={`ml-1 ${diagnosticInfo.platformCoverage >= 0.8 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.round(diagnosticInfo.platformCoverage * 100)}%
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Node Types:</span>
                <span className="ml-1 text-gray-600">{diagnosticInfo.nodeTypes.join(', ')}</span>
              </div>
            </div>
            {componentStats.platforms.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Platforms:</span>
                <span className="ml-1 text-gray-600">{componentStats.platforms.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {diagramSource === 'ai' ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              AI Enhanced
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Enhanced Fallback
            </Badge>
          )}

          {diagramError && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Issues Detected
            </Badge>
          )}
        </div>
      </div>

      {/* Enhanced error message with detailed diagnostics */}
      {diagramError && onRegenerateDiagram && (
        <div className="absolute top-24 left-4 z-20 bg-red-50 border border-red-200 rounded-lg p-3 max-w-2xl">
          <p className="text-sm text-red-700 mb-2">{diagramError}</p>
          {diagnosticInfo && (
            <div className="text-xs text-red-600 mb-2 space-y-1">
              <div>Generated: {nodes.length} nodes, Expected: {componentStats?.expectedMinNodes}</div>
              <div>Platform coverage: {Math.round(diagnosticInfo.platformCoverage * 100)}%</div>
              <div>Agent coverage: {Math.round(diagnosticInfo.agentCoverage * 100)}%</div>
            </div>
          )}
          <Button 
            onClick={onRegenerateDiagram}
            size="sm"
            className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate Enhanced
          </Button>
        </div>
      )}

      {/* React Flow with enhanced styling */}
      <ReactFlowProvider>
        <div className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.15,
              minZoom: 0.05,
              maxZoom: 2.5
            }}
            className="bg-gradient-to-br from-slate-50/50 to-blue-50/30"
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnScroll={true}
            selectionOnDrag={true}
            panOnDrag={[1, 2]}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={true}
            attributionPosition="bottom-right"
            proOptions={{ hideAttribution: true }}
          >
            <Background 
              color="#e2e8f0" 
              gap={25} 
              size={1.5}
              variant={BackgroundVariant.Dots}
            />
            <Controls 
              className="bg-white/90 border border-gray-200/50 rounded-lg shadow-lg"
              position="bottom-left"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            <MiniMap 
              style={minimapStyle}
              nodeColor={(node) => {
                switch (node.type) {
                  case 'platformNode': return '#3b82f6';
                  case 'conditionNode': return '#f97316';
                  case 'loopNode': return '#8b5cf6';
                  case 'aiAgentNode': return '#10b981';
                  case 'delayNode': return '#64748b';
                  case 'retryNode': return '#f59e0b';
                  case 'fallbackNode': return '#6366f1';
                  case 'triggerNode': return '#dc2626';
                  default: return '#6b7280';
                }
              }}
              nodeStrokeColor="#374151"
              nodeStrokeWidth={1}
              maskColor="rgba(255, 255, 255, 0.8)"
              position="bottom-right"
              zoomable
              pannable
            />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </Card>
  );
};

export default AutomationDiagramDisplay;
