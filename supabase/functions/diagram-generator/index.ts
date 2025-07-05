
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    icon?: string;
    platform?: string;
    stepType?: string;
    explanation?: string;
    isRecommended?: boolean;
    branches?: Array<{
      label: string;
      handle: string;
      color: string;
      stepsKey?: string;
    }>;
    onAdd?: () => void;
    onDismiss?: () => void;
    [key: string]: any;
  };
  sourcePosition?: string;
  targetPosition?: string;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  type?: string;
  style?: Record<string, any>;
  label?: string;
  sourceHandle?: string;
  labelStyle?: Record<string, any>;
  labelBgStyle?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎨 Starting CLEAN diagram generation with proper sequential flow')
    
    const { automation_blueprint } = await req.json()
    
    if (!automation_blueprint || !automation_blueprint.steps) {
      console.error('❌ No automation blueprint or steps provided')
      return new Response(JSON.stringify({ 
        error: 'No automation blueprint provided',
        source: 'diagram-generator'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📊 Blueprint analysis:', {
      totalSteps: automation_blueprint.steps.length,
      triggerType: automation_blueprint.trigger?.type,
      version: automation_blueprint.version
    })

    const nodes: DiagramNode[] = []
    const edges: DiagramEdge[] = []
    
    const baseX = 200
    const xSpacing = 400
    const baseY = 200
    let nodeCounter = 0

    // Helper function to get node type mapping
    const getNodeType = (step: any): string => {
      if (step.type === 'condition') return 'conditionNode'
      if (step.type === 'ai_agent_call' || step.is_recommended) return 'aiAgentNode'
      if (step.type === 'retry') return 'retryNode'
      if (step.type === 'fallback') return 'fallbackNode'
      if (step.type === 'delay') return 'delayNode'
      if (step.type === 'loop') return 'loopNode'
      if (step.action?.integration) return 'platformNode'
      return 'actionNode'
    }

    // Helper function to get clean node data without emojis
    const getNodeData = (step: any) => {
      const baseData = {
        label: step.name || 'Automation Step',
        stepType: step.type,
        explanation: step.description || generateExplanation(step),
        isRecommended: Boolean(step.is_recommended)
      }

      // Add platform-specific data
      if (step.action?.integration) {
        baseData.platform = step.action.integration
        baseData.action = step.action
        baseData.stepDetails = step.action
      }

      // Add condition-specific data with clean branches
      if (step.type === 'condition' && step.condition) {
        baseData.condition = step.condition
        baseData.branches = [
          { label: 'True', handle: 'true', color: '#8b5cf6' },
          { label: 'False', handle: 'false', color: '#8b5cf6' }
        ]
      }

      // Add AI agent data
      if (step.type === 'ai_agent_call' && step.ai_agent_call) {
        baseData.agent = step.ai_agent_call
      }

      // Add retry data
      if (step.type === 'retry' && step.retry) {
        baseData.retry = step.retry
      }

      // Add delay data
      if (step.type === 'delay' && step.delay) {
        baseData.delay = step.delay
      }

      // Add loop data
      if (step.type === 'loop' && step.loop) {
        baseData.loop = step.loop
      }

      return baseData
    }

    // Helper function to generate clean explanation
    const generateExplanation = (step: any): string => {
      if (step.type === 'condition') {
        return `Evaluates ${step.condition?.expression || 'conditional logic'} and routes to different paths based on the result.`
      }
      if (step.type === 'ai_agent_call') {
        return `AI Agent processes ${step.ai_agent_call?.input_prompt || 'intelligent analysis'} and provides intelligent insights.`
      }
      if (step.action?.integration) {
        return `Performs ${step.action.method || 'action'} in ${step.action.integration}`
      }
      return `Executes ${step.type} step: ${step.name}`
    }

    // Create trigger node if exists
    if (automation_blueprint.trigger) {
      const triggerNode: DiagramNode = {
        id: 'trigger-node',
        type: 'triggerNode',
        position: { x: baseX, y: baseY },
        data: {
          label: `${automation_blueprint.trigger.type?.toUpperCase() || 'MANUAL'} TRIGGER`,
          stepType: 'trigger',
          explanation: `Automation starts when ${automation_blueprint.trigger.type || 'manually triggered'}`,
          trigger: automation_blueprint.trigger
        },
        sourcePosition: 'right',
        targetPosition: 'left'
      }
      
      nodes.push(triggerNode)
    }

    // Process main steps sequentially for proper left-to-right flow
    const processStepsSequentially = (steps: any[], startX: number, startY: number, parentId?: string): string[] => {
      const processedNodeIds: string[] = []
      let currentX = startX
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        nodeCounter++
        const nodeId = `node-${nodeCounter}`
        
        // Create node with proper left-to-right positioning
        const node: DiagramNode = {
          id: nodeId,
          type: getNodeType(step),
          position: { x: currentX, y: startY },
          data: getNodeData(step),
          sourcePosition: 'right',
          targetPosition: 'left'
        }

        nodes.push(node)
        processedNodeIds.push(nodeId)

        // Create sequential connection to previous node
        if (i === 0 && parentId) {
          // Connect to parent (trigger or previous section)
          edges.push({
            id: `edge-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 3 }
          })
        } else if (i > 0) {
          // Connect to previous node in sequence
          const previousNodeId = processedNodeIds[i - 1]
          edges.push({
            id: `edge-${previousNodeId}-${nodeId}`,
            source: previousNodeId,
            target: nodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 3 }
          })
        }

        // Handle condition branching
        if (step.type === 'condition' && step.condition) {
          let branchY = startY - 150 // True branch above
          
          // Process true branch
          if (step.condition.if_true && Array.isArray(step.condition.if_true)) {
            const trueBranchIds = processStepsSequentially(
              step.condition.if_true,
              currentX + xSpacing,
              branchY,
              nodeId
            )
            
            if (trueBranchIds.length > 0) {
              edges.push({
                id: `edge-${nodeId}-true-${trueBranchIds[0]}`,
                source: nodeId,
                target: trueBranchIds[0],
                sourceHandle: 'true',
                type: 'smoothstep',
                animated: true,
                label: 'True',
                style: { stroke: '#8b5cf6', strokeWidth: 3 }
              })
            }
          }

          // Process false branch
          branchY = startY + 150 // False branch below
          if (step.condition.if_false && Array.isArray(step.condition.if_false)) {
            const falseBranchIds = processStepsSequentially(
              step.condition.if_false,
              currentX + xSpacing,
              branchY,
              nodeId
            )
            
            if (falseBranchIds.length > 0) {
              edges.push({
                id: `edge-${nodeId}-false-${falseBranchIds[0]}`,
                source: nodeId,
                target: falseBranchIds[0],
                sourceHandle: 'false',
                type: 'smoothstep',
                animated: true,
                label: 'False',
                style: { stroke: '#8b5cf6', strokeWidth: 3 }
              })
            }
          }
        }

        currentX += xSpacing
      }

      return processedNodeIds
    }

    // Process all steps starting from trigger
    const triggerParentId = automation_blueprint.trigger ? 'trigger-node' : undefined
    const startX = automation_blueprint.trigger ? baseX + xSpacing : baseX
    
    processStepsSequentially(automation_blueprint.steps, startX, baseY, triggerParentId)

    console.log('✅ Clean diagram generation completed!', {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      conditionNodes: nodes.filter(n => n.type === 'conditionNode').length,
      aiAgentNodes: nodes.filter(n => n.data.isRecommended).length
    })

    const result = {
      nodes,
      edges,
      metadata: {
        totalSteps: automation_blueprint.steps.length,
        conditionalBranches: nodes.filter(n => n.type === 'conditionNode').length,
        aiAgentRecommendations: nodes.filter(n => n.data.isRecommended).length,
        platforms: [...new Set(nodes.map(n => n.data.platform).filter(Boolean))],
        generatedAt: new Date().toISOString()
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Error in clean diagram generation:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'diagram-generator',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
