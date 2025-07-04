
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
    console.log('🎨 Starting ENHANCED diagram generation with conditional logic support')
    
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
    
    let yPosition = 100
    const xSpacing = 400
    const ySpacing = 200
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

    // Helper function to get detailed node data
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

      // Add condition-specific data
      if (step.type === 'condition' && step.condition) {
        baseData.condition = step.condition
        baseData.branches = generateConditionBranches(step.condition)
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

    // Helper function to generate explanation
    const generateExplanation = (step: any): string => {
      if (step.type === 'condition') {
        return `Evaluates: ${step.condition?.expression || 'conditional logic'} and routes to different paths based on the result.`
      }
      if (step.type === 'ai_agent_call') {
        return `AI Agent processes: ${step.ai_agent_call?.input_prompt || 'intelligent analysis'} and provides intelligent insights.`
      }
      if (step.action?.integration) {
        return `Performs ${step.action.method || 'action'} in ${step.action.integration} with parameters: ${JSON.stringify(step.action.parameters || {}).substring(0, 100)}`
      }
      return `Executes ${step.type} step: ${step.name}`
    }

    // Helper function to generate condition branches
    const generateConditionBranches = (condition: any) => {
      const branches = []
      
      if (condition.if_true) {
        branches.push({
          label: 'True',
          handle: 'true',
          color: '#10b981',
          stepsKey: 'if_true'
        })
      }
      
      if (condition.if_false) {
        branches.push({
          label: 'False', 
          handle: 'false',
          color: '#ef4444',
          stepsKey: 'if_false'
        })
      }

      // For complex conditions, add more specific labels
      if (condition.expression) {
        const expr = condition.expression.toLowerCase()
        if (expr.includes('urgent')) {
          branches[0] = { ...branches[0], label: 'Urgent' }
          branches[1] = { ...branches[1], label: 'Normal' }
        } else if (expr.includes('billing')) {
          branches[0] = { ...branches[0], label: 'Billing' }
          branches[1] = { ...branches[1], label: 'Other' }
        } else if (expr.includes('technical')) {
          branches[0] = { ...branches[0], label: 'Technical' }
          branches[1] = { ...branches[1], label: 'Other' }
        } else if (expr.includes('premium')) {
          branches[0] = { ...branches[0], label: 'Premium' }
          branches[1] = { ...branches[1], label: 'Standard' }
        }
      }
      
      return branches
    }

    // Process steps recursively to handle conditional branching
    const processSteps = (steps: any[], parentId: string | null = null, xOffset: number = 0, yStart: number = yPosition): string[] => {
      const processedNodeIds: string[] = []
      let currentY = yStart

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        nodeCounter++
        const nodeId = `node-${nodeCounter}`
        
        // Create node
        const node: DiagramNode = {
          id: nodeId,
          type: getNodeType(step),
          position: { x: 200 + xOffset, y: currentY },
          data: getNodeData(step),
          sourcePosition: 'right',
          targetPosition: 'left'
        }

        nodes.push(node)
        processedNodeIds.push(nodeId)

        // Connect to parent if exists
        if (parentId) {
          edges.push({
            id: `edge-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            animated: step.is_recommended || false
          })
        }

        // Handle conditional branching
        if (step.type === 'condition' && step.condition) {
          let branchY = currentY + ySpacing
          let branchIndex = 0

          // Process if_true branch
          if (step.condition.if_true && Array.isArray(step.condition.if_true)) {
            console.log(`🔀 Processing TRUE branch for condition: ${step.name}`)
            const trueBranchIds = processSteps(
              step.condition.if_true, 
              nodeId, 
              xOffset + xSpacing, 
              branchY
            )
            
            // Connect condition to first node of true branch
            if (trueBranchIds.length > 0) {
              edges.push({
                id: `edge-${nodeId}-true-${trueBranchIds[0]}`,
                source: nodeId,
                target: trueBranchIds[0],
                sourceHandle: 'true',
                type: 'smoothstep',
                label: 'True',
                labelStyle: { fill: '#10b981', fontWeight: 'bold' },
                labelBgStyle: { fill: '#10b98120' },
                style: { stroke: '#10b981', strokeWidth: 2 }
              })
            }
            
            branchY += (trueBranchIds.length * ySpacing) + ySpacing
            branchIndex++
          }

          // Process if_false branch
          if (step.condition.if_false && Array.isArray(step.condition.if_false)) {
            console.log(`🔀 Processing FALSE branch for condition: ${step.name}`)
            const falseBranchIds = processSteps(
              step.condition.if_false, 
              nodeId, 
              xOffset + xSpacing, 
              branchY
            )
            
            // Connect condition to first node of false branch
            if (falseBranchIds.length > 0) {
              edges.push({
                id: `edge-${nodeId}-false-${falseBranchIds[0]}`,
                source: nodeId,
                target: falseBranchIds[0],
                sourceHandle: 'false',
                type: 'smoothstep',
                label: 'False',
                labelStyle: { fill: '#ef4444', fontWeight: 'bold' },
                labelBgStyle: { fill: '#ef444420' },
                style: { stroke: '#ef4444', strokeWidth: 2 }
              })
            }
          }

          currentY = branchY + ySpacing
        }
        // Handle retry logic
        else if (step.type === 'retry' && step.retry?.steps) {
          console.log(`🔄 Processing RETRY steps for: ${step.name}`)
          const retryIds = processSteps(
            step.retry.steps,
            nodeId,
            xOffset + xSpacing,
            currentY + ySpacing
          )
          
          // Connect retry to its steps
          if (retryIds.length > 0) {
            edges.push({
              id: `edge-${nodeId}-retry-${retryIds[0]}`,
              source: nodeId,
              target: retryIds[0],
              type: 'smoothstep',
              label: 'Retry',
              labelStyle: { fill: '#f59e0b', fontWeight: 'bold' },
              style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' }
            })
          }
          
          currentY += (retryIds.length * ySpacing) + ySpacing
        }
        // Handle loop logic
        else if (step.type === 'loop' && step.loop?.steps) {
          console.log(`🔁 Processing LOOP steps for: ${step.name}`)
          const loopIds = processSteps(
            step.loop.steps,
            nodeId,
            xOffset + xSpacing,
            currentY + ySpacing
          )
          
          // Connect loop to its steps
          if (loopIds.length > 0) {
            edges.push({
              id: `edge-${nodeId}-loop-${loopIds[0]}`,
              source: nodeId,  
              target: loopIds[0],
              type: 'smoothstep',
              label: 'Loop',
              labelStyle: { fill: '#8b5cf6', fontWeight: 'bold' },
              style: { stroke: '#8b5cf6', strokeWidth: 2 }
            })
          }
          
          currentY += (loopIds.length * ySpacing) + ySpacing
        }
        else {
          currentY += ySpacing
        }

        // Connect sequential nodes (non-branching)
        if (i < steps.length - 1 && step.type !== 'condition' && step.type !== 'retry' && step.type !== 'loop') {
          // Will be connected to next node in sequence
        }
      }

      return processedNodeIds
    }

    // Add trigger node if trigger exists
    if (automation_blueprint.trigger) {
      const triggerNode: DiagramNode = {
        id: 'trigger-node',
        type: 'triggerNode',
        position: { x: 200, y: 50 },
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
      
      // Process main steps starting from trigger
      const mainStepIds = processSteps(automation_blueprint.steps, 'trigger-node', 0, yPosition)
      
      console.log(`✅ Processed ${mainStepIds.length} main steps from trigger`)
    } else {
      // Process steps without trigger
      const mainStepIds = processSteps(automation_blueprint.steps, null, 0, yPosition)
      console.log(`✅ Processed ${mainStepIds.length} steps without trigger`)
    }

    // Add AI agent recommendation nodes
    const aiAgentSteps = automation_blueprint.steps.filter((step: any) => step.is_recommended || step.type === 'ai_agent_call')
    console.log(`🤖 Found ${aiAgentSteps.length} AI agent recommendations`)

    // Ensure proper connections between sequential steps
    for (let i = 0; i < nodes.length - 1; i++) {
      const currentNode = nodes[i]
      const nextNode = nodes[i + 1]
      
      // Skip if this is a condition node (already handled) or if edge already exists
      if (currentNode.type === 'conditionNode' || 
          edges.some(edge => edge.source === currentNode.id && edge.target === nextNode.id)) {
        continue
      }
      
      // Create sequential connection
      if (currentNode.id.includes('node-') && nextNode.id.includes('node-')) {
        const currentIndex = parseInt(currentNode.id.split('-')[1])
        const nextIndex = parseInt(nextNode.id.split('-')[1])
        
        if (nextIndex === currentIndex + 1) {
          edges.push({
            id: `edge-seq-${currentNode.id}-${nextNode.id}`,
            source: currentNode.id,
            target: nextNode.id,
            type: 'smoothstep'
          })
        }
      }
    }

    console.log('🎨 ENHANCED diagram generation completed!', {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      conditionNodes: nodes.filter(n => n.type === 'conditionNode').length,
      aiAgentNodes: nodes.filter(n => n.data.isRecommended).length,
      retryNodes: nodes.filter(n => n.type === 'retryNode').length,
      platformNodes: nodes.filter(n => n.type === 'platformNode').length
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
    console.error('💥 Error in ENHANCED diagram generation:', error)
    
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
