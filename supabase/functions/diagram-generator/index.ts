
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
    console.log('🎯 Starting ENHANCED diagram generation with dynamic triggers and intelligent routing')
    
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

    console.log('📊 Enhanced blueprint analysis:', {
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

    // Helper function to get dynamic trigger type and explanation
    const getTriggerInfo = (trigger: any) => {
      if (!trigger) return { type: 'MANUAL', explanation: 'Automation starts manually when triggered by user' }
      
      const triggerType = trigger.type?.toUpperCase() || 'MANUAL'
      let explanation = ''
      
      switch (trigger.type) {
        case 'webhook':
          explanation = `Automation triggered by incoming webhook from external service. Endpoint: ${trigger.webhook_endpoint || 'Generated webhook URL'}`
          break
        case 'scheduled':
          explanation = `Automation runs on schedule: ${trigger.cron_expression || 'Custom schedule'}. Runs automatically at specified times.`
          break
        case 'manual':
          explanation = 'Automation starts when manually triggered by user action or API call.'
          break
        case 'platform':
          explanation = `Automation triggered by ${trigger.platform || 'platform'} events. Monitors for specific platform activities.`
          break
        default:
          explanation = `Automation triggered by ${trigger.type} events. Starts when specified conditions are met.`
      }
      
      return { type: `${triggerType} TRIGGER`, explanation }
    }

    // Helper function to extract intelligent condition labels
    const getConditionBranches = (condition: any) => {
      if (!condition || !condition.expression) {
        return [
          { label: 'True', handle: 'true', color: '#8b5cf6' },
          { label: 'False', handle: 'false', color: '#8b5cf6' }
        ]
      }
      
      const expression = condition.expression.toLowerCase()
      
      // Extract meaningful labels from common condition patterns
      if (expression.includes('gender') || expression.includes('sex')) {
        return [
          { label: 'Male', handle: 'male', color: '#8b5cf6' },
          { label: 'Female', handle: 'female', color: '#8b5cf6' }
        ]
      } else if (expression.includes('age')) {
        return [
          { label: 'Young', handle: 'young', color: '#8b5cf6' },
          { label: 'Adult', handle: 'adult', color: '#8b5cf6' }
        ]
      } else if (expression.includes('priority') || expression.includes('urgent')) {
        return [
          { label: 'High Priority', handle: 'high', color: '#8b5cf6' },
          { label: 'Normal Priority', handle: 'normal', color: '#8b5cf6' }
        ]
      } else if (expression.includes('status') || expression.includes('active')) {
        return [
          { label: 'Active', handle: 'active', color: '#8b5cf6' },
          { label: 'Inactive', handle: 'inactive', color: '#8b5cf6' }
        ]
      } else if (expression.includes('type') || expression.includes('category')) {
        return [
          { label: 'Category A', handle: 'catA', color: '#8b5cf6' },
          { label: 'Category B', handle: 'catB', color: '#8b5cf6' }
        ]
      } else if (expression.includes('amount') || expression.includes('price') || expression.includes('cost')) {
        return [
          { label: 'High Value', handle: 'high_value', color: '#8b5cf6' },
          { label: 'Low Value', handle: 'low_value', color: '#8b5cf6' }
        ]
      } else {
        // Fallback to True/False for complex expressions
        return [
          { label: 'Yes', handle: 'true', color: '#8b5cf6' },
          { label: 'No', handle: 'false', color: '#8b5cf6' }
        ]
      }
    }

    // Helper function to get node type mapping
    const getNodeType = (step: any): string => {
      if (step.type === 'condition') return 'conditionNode'
      if (step.type === 'ai_agent_call' || step.is_recommended || step.ai_recommended) return 'aiAgentNode'
      if (step.type === 'retry') return 'retryNode'
      if (step.type === 'fallback') return 'fallbackNode'
      if (step.type === 'delay') return 'delayNode'
      if (step.type === 'loop') return 'loopNode'
      if (step.action?.integration) return 'platformNode'
      return 'actionNode'
    }

    // Helper function to generate enhanced explanations
    const generateEnhancedExplanation = (step: any): string => {
      if (step.type === 'condition') {
        return `This decision point evaluates "${step.condition?.expression || 'conditional logic'}" and routes the automation to different paths based on the result. Each path can have different actions and outcomes.`
      }
      if (step.type === 'ai_agent_call' || step.is_recommended || step.ai_recommended) {
        return `AI Agent intelligently processes "${step.ai_agent_call?.input_prompt || step.name || 'automation data'}" and provides smart analysis and decision-making. This enhances automation accuracy and handles complex scenarios.`
      }
      if (step.type === 'retry') {
        return `Retry mechanism ensures reliability by attempting the operation up to ${step.retry?.max_attempts || 3} times if failures occur. This improves automation success rates.`
      }
      if (step.action?.integration) {
        const integration = step.action.integration
        const method = step.action.method || 'action'
        return `Connects to ${integration} platform to perform "${method}" operation. This integrates your automation with external services and platforms.`
      }
      if (step.type === 'delay') {
        const seconds = step.delay?.duration_seconds || 0
        const time = seconds >= 60 ? `${Math.floor(seconds / 60)} minutes` : `${seconds} seconds`
        return `Pauses automation for ${time} to allow time for external processes or to avoid rate limits. This ensures proper timing and coordination.`
      }
      if (step.type === 'loop') {
        return `Repeats a set of actions for each item in "${step.loop?.array_source || 'data collection'}". This enables bulk processing and batch operations.`
      }
      return `Executes ${step.type} operation: ${step.name}. This step is part of your automation workflow and performs specific business logic.`
    }

    // Helper function to get clean node data
    const getNodeData = (step: any) => {
      const baseData = {
        label: step.name || 'Automation Step',
        stepType: step.type,
        explanation: step.description || generateEnhancedExplanation(step),
        isRecommended: Boolean(step.is_recommended || step.ai_recommended)
      }

      // Add platform-specific data
      if (step.action?.integration) {
        baseData.platform = step.action.integration
        baseData.action = step.action
        baseData.stepDetails = step.action
      }

      // Add condition-specific data with intelligent branches
      if (step.type === 'condition' && step.condition) {
        baseData.condition = step.condition
        baseData.branches = getConditionBranches(step.condition)
      }

      // Add AI agent data with recommendation flag
      if (step.type === 'ai_agent_call' && step.ai_agent_call) {
        baseData.agent = step.ai_agent_call
        baseData.isRecommended = true
      }

      // Add other step-specific data
      if (step.type === 'retry' && step.retry) {
        baseData.retry = step.retry
      }

      if (step.type === 'delay' && step.delay) {
        baseData.delay = step.delay
      }

      if (step.type === 'loop' && step.loop) {
        baseData.loop = step.loop
      }

      return baseData
    }

    // Create STOP node helper
    const createStopNode = (x: number, y: number): DiagramNode => {
      nodeCounter++
      return {
        id: `stop-node-${nodeCounter}`,
        type: 'fallbackNode',
        position: { x, y },
        data: {
          label: 'END',
          stepType: 'stop',
          explanation: 'Automation ends here. No further steps are executed in this path.',
          isRecommended: false
        },
        sourcePosition: 'right',
        targetPosition: 'left'
      }
    }

    // Create dynamic trigger node
    if (automation_blueprint.trigger) {
      const triggerInfo = getTriggerInfo(automation_blueprint.trigger)
      const triggerNode: DiagramNode = {
        id: 'trigger-node',
        type: 'triggerNode',
        position: { x: baseX, y: baseY },
        data: {
          label: triggerInfo.type,
          stepType: 'trigger',
          explanation: triggerInfo.explanation,
          trigger: automation_blueprint.trigger,
          platform: automation_blueprint.trigger.platform || automation_blueprint.trigger.integration
        },
        sourcePosition: 'right',
        targetPosition: 'left'
      }
      
      nodes.push(triggerNode)
    }

    // Enhanced step processing with complete route explanation
    const processStepsWithRouting = (steps: any[], startX: number, startY: number, parentId?: string, routePath: string = ''): { nodeIds: string[], endNodes: string[] } => {
      const processedNodeIds: string[] = []
      const endNodeIds: string[] = []
      let currentX = startX
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        nodeCounter++
        const nodeId = `node-${nodeCounter}`
        
        // Create node with enhanced positioning
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

        // Create sequential connection
        if (i === 0 && parentId) {
          edges.push({
            id: `edge-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 3 }
          })
        } else if (i > 0) {
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

        // Handle intelligent condition branching with STOP nodes
        if (step.type === 'condition' && step.condition) {
          const branches = getConditionBranches(step.condition)
          
          // Process true/first branch
          if (step.condition.if_true && Array.isArray(step.condition.if_true) && step.condition.if_true.length > 0) {
            const trueBranchY = startY - 150
            const trueBranchResult = processStepsWithRouting(
              step.condition.if_true,
              currentX + xSpacing,
              trueBranchY,
              nodeId,
              `${routePath} -> ${branches[0].label}`
            )
            
            if (trueBranchResult.nodeIds.length > 0) {
              edges.push({
                id: `edge-${nodeId}-true-${trueBranchResult.nodeIds[0]}`,
                source: nodeId,
                target: trueBranchResult.nodeIds[0],
                sourceHandle: branches[0].handle,
                type: 'smoothstep',
                animated: true,
                label: branches[0].label,
                style: { stroke: '#8b5cf6', strokeWidth: 3 }
              })
            }
            endNodeIds.push(...trueBranchResult.endNodes)
          } else {
            // Add STOP node for empty true branch
            const stopNode = createStopNode(currentX + xSpacing, startY - 150)
            nodes.push(stopNode)
            edges.push({
              id: `edge-${nodeId}-true-stop`,
              source: nodeId,
              target: stopNode.id,
              sourceHandle: branches[0].handle,
              type: 'smoothstep',
              animated: true,
              label: branches[0].label,
              style: { stroke: '#8b5cf6', strokeWidth: 3 }
            })
            endNodeIds.push(stopNode.id)
          }

          // Process false/second branch
          if (step.condition.if_false && Array.isArray(step.condition.if_false) && step.condition.if_false.length > 0) {
            const falseBranchY = startY + 150
            const falseBranchResult = processStepsWithRouting(
              step.condition.if_false,
              currentX + xSpacing,
              falseBranchY,
              nodeId,
              `${routePath} -> ${branches[1].label}`
            )
            
            if (falseBranchResult.nodeIds.length > 0) {
              edges.push({
                id: `edge-${nodeId}-false-${falseBranchResult.nodeIds[0]}`,
                source: nodeId,
                target: falseBranchResult.nodeIds[0],
                sourceHandle: branches[1].handle,
                type: 'smoothstep',
                animated: true,
                label: branches[1].label,
                style: { stroke: '#8b5cf6', strokeWidth: 3 }
              })
            }
            endNodeIds.push(...falseBranchResult.endNodes)
          } else {
            // Add STOP node for empty false branch
            const stopNode = createStopNode(currentX + xSpacing, startY + 150)
            nodes.push(stopNode)
            edges.push({
              id: `edge-${nodeId}-false-stop`,
              source: nodeId,
              target: stopNode.id,
              sourceHandle: branches[1].handle,
              type: 'smoothstep',
              animated: true,
              label: branches[1].label,
              style: { stroke: '#8b5cf6', strokeWidth: 3 }
            })
            endNodeIds.push(stopNode.id)
          }
          
          // This condition node doesn't continue linearly
          break
        }

        currentX += xSpacing
        
        // If this is the last step, mark it as an end node
        if (i === steps.length - 1) {
          endNodeIds.push(nodeId)
        }
      }

      return { nodeIds: processedNodeIds, endNodes: endNodeIds }
    }

    // Process all steps with enhanced routing
    const triggerParentId = automation_blueprint.trigger ? 'trigger-node' : undefined
    const startX = automation_blueprint.trigger ? baseX + xSpacing : baseX
    
    const mainResult = processStepsWithRouting(automation_blueprint.steps, startX, baseY, triggerParentId, 'Main Flow')

    console.log('✅ Enhanced diagram generation completed successfully!', {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      conditionNodes: nodes.filter(n => n.type === 'conditionNode').length,
      aiAgentNodes: nodes.filter(n => n.data.isRecommended).length,
      stopNodes: nodes.filter(n => n.data.stepType === 'stop').length,
      endNodes: mainResult.endNodes.length
    })

    const result = {
      nodes,
      edges,
      metadata: {
        totalSteps: automation_blueprint.steps.length,
        conditionalBranches: nodes.filter(n => n.type === 'conditionNode').length,
        aiAgentRecommendations: nodes.filter(n => n.data.isRecommended).length,
        platforms: [...new Set(nodes.map(n => n.data.platform).filter(Boolean))],
        routePaths: mainResult.endNodes.length,
        stopNodes: nodes.filter(n => n.data.stepType === 'stop').length,
        generatedAt: new Date().toISOString(),
        triggerType: automation_blueprint.trigger?.type || 'manual'
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Error in enhanced diagram generation:', error)
    
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
