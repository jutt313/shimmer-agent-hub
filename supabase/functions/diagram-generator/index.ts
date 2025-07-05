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
    label: string; // Main label for the node
    icon?: string; // Name of the icon to display (e.g., 'Zap', 'GitFork')
    platform?: string; // Name of the integrated platform, if applicable
    stepType?: string; // Original blueprint step type (e.g., 'action', 'condition')
    explanation?: string; // Detailed description of the step
    isRecommended?: boolean; // Flag if this is an AI recommendation
    // 'branches' holds metadata for condition node's outgoing edges
    branches?: Array<{
      label: string;
      handle: string; // Unique handle for connection
      color: string;
      stepsKey?: string; 
    }>;
    // Specific data for each step type, used for frontend to show more details
    action?: any;
    condition?: any;
    loop?: any;
    delay?: any;
    ai_agent_call?: any;
    retry?: any;
    fallback?: any;
    trigger?: any;
    
    [key: string]: any; // Allow other dynamic properties
  };
  sourcePosition?: string; // Position of outgoing connections
  targetPosition?: string; // Position of incoming connections
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  type?: string;
  style?: Record<string, any>;
  label?: string; // Label displayed on the edge
  sourceHandle?: string; // Which source handle the edge connects to
  labelStyle?: Record<string, any>; // Styling for the edge label
  labelBgStyle?: Record<string, any>; // Styling for the edge label background
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
    
    // Adjusted spacing for potentially wider multi-branch diagrams
    const baseX = 200
    const xSpacing = 450 // Increased horizontal spacing between layers
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
          explanation = `Automation triggered by ${trigger.platform || trigger.integration || 'platform'} events. Monitors for specific platform activities.`
          break
        default:
          explanation = `Automation triggered by ${trigger.type} events. Starts when specified conditions are met.`
      }
      
      return { type: `${triggerType} TRIGGER`, explanation }
    }

    // MODIFIED: getConditionBranches to use the new 'cases' structure directly for labels
    // This will generate the sourceHandles for the edges from the condition node
    const getConditionBranches = (condition: any) => {
      // Ensure condition.cases exists and is an array
      if (!condition || !condition.cases || !Array.isArray(condition.cases)) {
        // Fallback for old structure or malformed condition (should not happen with updated blueprint)
        return [
          { label: 'True', handle: 'default-true', color: '#8b5cf6' },
          { label: 'False', handle: 'default-false', color: '#8b5cf6' }
        ]
      }
      
      const branches = condition.cases.map((caseItem: any, index: number) => ({
        label: caseItem.label || `Case ${index + 1}`, // Use blueprint's label for clarity
        handle: `case-${index}`, // Unique handle for each case
        color: '#8b5cf6' // Default color for case branches
      }))

      // Add default_steps as a distinct branch if present
      if (condition.default_steps && condition.default_steps.length > 0) {
        branches.push({ label: 'No Match Found', handle: 'default-case', color: '#ef4444' }) // Red for default/no match
      } else {
         // If no default_steps and no specific case matches, we still need a default exit point for diagram clarity
         // This can be represented as an implicit "No Match" leading to an END node
         // But for diagram clarity, it's better if explicit. Handled by subsequent END node creation.
      }

      return branches
    }

    // Helper function to get node type mapping
    const getNodeType = (step: any): string => {
      if (step.type === 'condition') return 'conditionNode'
      if (step.type === 'ai_agent_call' || step.is_recommended || step.ai_recommended) return 'aiAgentNode'
      if (step.type === 'retry') return 'retryNode'
      if (step.type === 'fallback') return 'fallbackNode'
      if (step.type === 'delay') return 'delayNode'
      if (step.type === 'loop') return 'loopNode'
      if (step.action?.integration) return 'platformNode' // Keeping platformNode distinct as requested
      return 'actionNode' // Default action node
    }

    // MODIFIED: generateEnhancedExplanation for more specific details as requested by user
    const generateEnhancedExplanation = (step: any): string => {
      if (step.type === 'condition') {
        let explanation = `Decision point: Evaluates multiple conditions and branches accordingly.`
        if (step.condition?.cases) {
          step.condition.cases.forEach((caseItem: any) => {
            explanation += `\n- '${caseItem.label}': if "${caseItem.expression}" is true.`
          })
        }
        if (step.condition?.default_steps) {
          explanation += `\n- 'No Match Found': if no specific condition is met.`
        }
        return explanation
      }
      if (step.type === 'ai_agent_call' || step.is_recommended || step.ai_recommended) {
        const agentName = step.ai_agent_call?.agent_id || 'AI Agent';
        const inputPrompt = step.ai_agent_call?.input_prompt || 'automation data';
        return `AI Agent "${agentName}" processes: "${inputPrompt}". Provides intelligent analysis and decision-making for enhanced automation. ${step.is_recommended ? "(AI Recommended)" : ""}`
      }
      if (step.type === 'retry') {
        const maxAttempts = step.retry?.max_attempts || 3;
        const retryFailPathInfo = step.retry?.on_retry_fail_steps ? 'Includes a specific path for when retries are exhausted.' : 'No explicit path for retry failures, defaults to END.';
        return `Reliability: Retries operation up to ${maxAttempts} times on failure. ${retryFailPathInfo}`
      }
      if (step.action?.integration) {
        const integration = step.action.integration;
        const method = step.action.method || 'perform action';
        // Displaying parameters might be too verbose, but can be added if needed
        // const params = JSON.stringify(step.action.parameters || {}); 
        return `Connects to ${integration} to "${method}". Integrates your automation with external services.`
      }
      if (step.type === 'delay') {
        const seconds = step.delay?.duration_seconds || 0;
        const time = seconds >= 60 ? `${Math.floor(seconds / 60)} minutes` : `${seconds} seconds`;
        return `Pause: Halts automation for ${time}. Used for timing or avoiding rate limits.`
      }
      if (step.type === 'loop') {
        return `Iteration: Repeats actions for each item from "${step.loop?.array_source || 'a data collection'}". Enables bulk processing.`
      }
      if (step.type === 'fallback') {
        return `Error Handling: Executes primary steps. If primary fails or errors, switches to predefined fallback steps for graceful error handling.`
      }
      return `Executes: ${step.name || 'Unnamed Step'} (${step.type}).`
    }

    // MODIFIED: getNodeData for more specific labels and icons based on user's request
    const getNodeData = (step: any) => {
      const baseData: Record<string, any> = {
        label: step.name || 'Automation Step',
        stepType: step.type,
        explanation: step.description || generateEnhancedExplanation(step),
        isRecommended: Boolean(step.is_recommended || step.ai_recommended)
      }

      // Set specific label and store full data for detailed view
      if (step.type === 'action' && step.action?.integration) {
        baseData.label = `Action: ${step.action.integration}`; 
        baseData.platform = step.action.integration;
        baseData.action = step.action; 
      } else if (step.type === 'action') {
        baseData.label = `Action: ${step.name || 'Generic Task'}`;
        baseData.action = step.action;
      }

      if (step.type === 'condition' && step.condition) {
        baseData.label = step.name || 'Conditional Logic'; 
        baseData.condition = step.condition;
        baseData.branches = getConditionBranches(step.condition); 
      }

      if (step.type === 'loop' && step.loop) {
        baseData.label = `Loop: ${step.loop.array_source || 'Collection'}`; 
        baseData.loop = step.loop;
      }

      if (step.type === 'retry' && step.retry) {
        baseData.label = `Retry (${step.retry.max_attempts || 3} attempts)`; 
        baseData.retry = step.retry;
      }

      if (step.type === 'fallback' && step.fallback) {
        baseData.label = 'Fallback Logic'; 
        baseData.fallback = step.fallback;
      }

      if (step.type === 'ai_agent_call' && step.ai_agent_call) {
        baseData.label = `AI Agent: ${step.ai_agent_call.agent_id || 'Recommended'}`; 
        baseData.agent = step.ai_agent_call;
        baseData.isRecommended = Boolean(step.ai_agent_call.is_recommended);
      }
      
      if (step.type === 'delay' && step.delay) {
        const seconds = step.delay.duration_seconds || 0;
        const timeDisplay = seconds >= 60 ? `${Math.floor(seconds / 60)} min` : `${seconds} sec`;
        baseData.label = `Delay: ${timeDisplay}`; 
        baseData.delay = step.delay;
      }

      // Add specific icons based on step type or platform for frontend rendering
      if (baseData.stepType === 'trigger') baseData.icon = 'Zap'; // Lightning bolt for triggers
      else if (baseData.stepType === 'condition') baseData.icon = 'GitFork'; // Fork for conditions
      else if (baseData.stepType === 'loop') baseData.icon = 'Repeat'; // Repeat for loops
      else if (baseData.stepType === 'retry') baseData.icon = 'RefreshCw'; // Refresh for retry
      else if (baseData.stepType === 'fallback') baseData.icon = 'CornerDownRight'; // Corner arrow for fallback
      else if (baseData.stepType === 'ai_agent_call') baseData.icon = 'Bot'; // Robot for AI agent
      else if (baseData.stepType === 'delay') baseData.icon = 'Clock'; // Clock for delay
      else if (baseData.platform) {
        // Here you would typically have a lookup for specific platform icons
        // For now, a generic plug or specific platform icon based on a utility
        baseData.icon = 'PlugZap'; // Generic plug icon for platforms
        // Example: if (baseData.platform === 'HubSpot') baseData.icon = 'HubSpotIcon';
      } else {
        baseData.icon = 'Zap'; // Generic action icon
      }

      return baseData
    }

    // Create STOP/END node helper (MODIFIED for different END labels)
    const createStopNode = (x: number, y: number, label: string = 'PATH END', icon: string = 'FlagCheckered'): DiagramNode => {
      nodeCounter++
      return {
        id: `stop-node-${nodeCounter}`,
        type: 'fallbackNode', // Reusing fallbackNode for STOP visuals
        position: { x, y },
        data: {
          label: label,
          stepType: 'stop', // Differentiate from 'fallback' type
          explanation: `This automation path concludes here.`,
          isRecommended: false,
          icon: icon 
        },
        sourcePosition: 'right',
        targetPosition: 'left'
      }
    }

    // Create dynamic trigger node (MODIFIED to use more generic trigger type and initial position)
    const triggerParentId = automation_blueprint.trigger ? 'trigger-node' : undefined
    const startXForSteps = automation_blueprint.trigger ? baseX + xSpacing : baseX;
    
    if (automation_blueprint.trigger) {
      const triggerInfo = getTriggerInfo(automation_blueprint.trigger);
      const triggerNode: DiagramNode = {
        id: 'trigger-node',
        type: 'triggerNode', // Retain this type for CustomNodeMapper
        position: { x: baseX, y: baseY },
        data: {
          label: triggerInfo.type, // e.g., "WEBHOOK TRIGGER"
          stepType: 'trigger',
          explanation: triggerInfo.explanation,
          trigger: automation_blueprint.trigger,
          platform: automation_blueprint.trigger.platform || automation_blueprint.trigger.integration,
          icon: 'Zap' // Initial icon for triggers
        },
        sourcePosition: 'right',
        targetPosition: 'left'
      };
      nodes.push(triggerNode);
    }

    // MODIFIED: processStepsWithRouting to handle multiple cases, retry paths, and fallback
    // Also explicitly pass parentId and sourceHandle for clearer connections
    const processStepsWithRouting = (
      steps: any[],
      startX: number,
      startY: number,
      parentId?: string,
      sourceHandle?: string, // The handle on the parent node this path originates from
      routePath: string = '' 
    ): { nodeIds: string[], endNodes: string[], finalX: number, finalY: number } => {
      const processedNodeIds: string[] = []
      const endNodeIds: string[] = []
      let currentX = startX
      let currentY = startY // Tracks Y for sequential steps in a single path

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        nodeCounter++
        const nodeId = `node-${nodeCounter}`
        
        // Determine position for the current node
        const node: DiagramNode = {
          id: nodeId,
          type: getNodeType(step),
          position: { x: currentX, y: currentY },
          data: getNodeData(step),
          sourcePosition: 'right',
          targetPosition: 'left'
        }

        nodes.push(node)
        processedNodeIds.push(nodeId)

        // Create connection from parent to current node if it's the first in a sequence
        if (i === 0 && parentId) {
          edges.push({
            id: `edge-${parentId}-${nodeId}-${sourceHandle || ''}`,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 3 },
            sourceHandle: sourceHandle || undefined // Use provided sourceHandle for specific branch connections
          })
        } else if (i > 0) {
          // Connect to the previous node in the current linear path
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

        // Handle complex condition branching (MAJOR MODIFICATION)
        if (step.type === 'condition' && step.condition && step.condition.cases) {
          const branches = step.condition.cases;
          const totalBranches = branches.length + (step.condition.default_steps && step.condition.default_steps.length > 0 ? 1 : 0);
          const verticalBranchSpacing = 200; // Increased vertical spacing between branches
          const initialBranchYOffset = -(totalBranches - 1) * (verticalBranchSpacing / 2);
          
          let branchYCursor = currentY + initialBranchYOffset; // Starting Y for first branch
          const endNodeForConditionBranches: string[] = []; // Collect end nodes of all branches from this condition

          branches.forEach((caseItem: any, index: number) => {
            const branchResult = processStepsWithRouting(
              caseItem.steps,
              currentX + xSpacing,
              branchYCursor,
              nodeId, // Parent is the condition node
              `case-${index}`, // Unique handle for each case
              `${routePath} -> ${caseItem.label}`
            );
            
            if (branchResult.nodeIds.length > 0) {
              edges.push({
                id: `edge-${nodeId}-${caseItem.label.replace(/\s/g, '-')}-${branchResult.nodeIds[0]}`,
                source: nodeId,
                target: branchResult.nodeIds[0],
                sourceHandle: `case-${index}`,
                type: 'smoothstep',
                animated: true,
                label: caseItem.label, // Use the blueprint's label for the edge
                style: { stroke: '#8b5cf6', strokeWidth: 3 }
              });
              endNodeForConditionBranches.push(...branchResult.endNodes);
            } else {
              // Add PATH END node for empty branch (as requested)
              const stopNode = createStopNode(currentX + xSpacing, branchYCursor, `PATH END: ${caseItem.label}`);
              nodes.push(stopNode);
              edges.push({
                id: `edge-${nodeId}-${caseItem.label.replace(/\s/g, '-')}-stop`,
                source: nodeId,
                target: stopNode.id,
                sourceHandle: `case-${index}`,
                type: 'smoothstep',
                animated: true,
                label: caseItem.label,
                style: { stroke: '#8b5cf6', strokeWidth: 3 }
              });
              endNodeForConditionBranches.push(stopNode.id);
            }
            branchYCursor += verticalBranchSpacing;
          });

          // Handle 'default_steps' if present (MODIFIED)
          if (step.condition.default_steps && step.condition.default_steps.length > 0) {
            const defaultResult = processStepsWithRouting(
              step.condition.default_steps,
              currentX + xSpacing,
              branchYCursor,
              nodeId,
              'default-case', // Specific handle for default path
              `${routePath} -> No Match Found`
            );
            if (defaultResult.nodeIds.length > 0) {
              edges.push({
                id: `edge-${nodeId}-default-${defaultResult.nodeIds[0]}`,
                source: nodeId,
                target: defaultResult.nodeIds[0],
                sourceHandle: 'default-case',
                type: 'smoothstep',
                animated: true,
                label: 'No Match Found', // Explicit label for this path
                style: { stroke: '#ef4444', strokeWidth: 3 } // Red for no match
              });
              endNodeForConditionBranches.push(...defaultResult.endNodes);
            } else {
              // Add PATH END node for empty default branch
              const stopNode = createStopNode(currentX + xSpacing, branchYCursor, 'PATH END: No Match');
              nodes.push(stopNode);
              edges.push({
                id: `edge-${nodeId}-default-stop`,
                source: nodeId,
                target: stopNode.id,
                sourceHandle: 'default-case',
                type: 'smoothstep',
                animated: true,
                label: 'No Match Found',
                style: { stroke: '#ef4444', strokeWidth: 3 }
              });
              endNodeForConditionBranches.push(stopNode.id);
            }
          } else if (branches.length === 0) {
            // If condition has no cases and no default_steps, it's a dead end.
            // This scenario should be rare with proper blueprint validation, but for safety:
            const stopNode = createStopNode(currentX + xSpacing, currentY, 'PATH END: No Conditions Defined');
            nodes.push(stopNode);
            edges.push({
                id: `edge-${nodeId}-no-cases-stop`,
                source: nodeId,
                target: stopNode.id,
                type: 'smoothstep',
                animated: true,
                label: 'No Paths Defined',
                style: { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '4,4' }
            });
            endNodeForConditionBranches.push(stopNode.id);
          }
          
          endNodeIds.push(...endNodeForConditionBranches);
          return { nodeIds: processedNodeIds, endNodes: endNodeIds, finalX: currentX, finalY: currentY }; // Condition node manages its own full flow
        }

        // Handle retry node's success and failure paths (MODIFIED)
        if (step.type === 'retry' && step.retry) {
            const retrySuccessResult = processStepsWithRouting(
                step.retry.steps,
                currentX + xSpacing,
                currentY - 75, // Position success path slightly above
                nodeId,
                'success', // Handle for success path
                `${routePath} -> Retry Success`
            );
            if (retrySuccessResult.nodeIds.length > 0) {
                edges.push({
                    id: `edge-${nodeId}-retry-success-${retrySuccessResult.nodeIds[0]}`,
                    source: nodeId,
                    target: retrySuccessResult.nodeIds[0],
                    sourceHandle: 'success',
                    type: 'smoothstep',
                    animated: true,
                    label: 'Success', 
                    style: { stroke: '#10b981', strokeWidth: 3 } // Green for success
                });
                endNodeIds.push(...retrySuccessResult.endNodes);
            } else {
                const stopNode = createStopNode(currentX + xSpacing, currentY - 75, 'RETRY SUCCESS END');
                nodes.push(stopNode);
                edges.push({
                    id: `edge-${nodeId}-retry-success-stop`,
                    source: nodeId,
                    target: stopNode.id,
                    sourceHandle: 'success',
                    type: 'smoothstep',
                    animated: true,
                    label: 'Success',
                    style: { stroke: '#10b981', strokeWidth: 3 }
                });
                endNodeIds.push(stopNode.id);
            }

            // Explicit retry failure path (NEW/MODIFIED)
            if (step.retry.on_retry_fail_steps && step.retry.on_retry_fail_steps.length > 0) {
                const retryFailY = currentY + 75; // Position failure path below
                const retryFailResult = processStepsWithRouting(
                    step.retry.on_retry_fail_steps,
                    currentX + xSpacing,
                    retryFailY,
                    nodeId,
                    'failure', // Handle for failure path
                    `${routePath} -> Retry Failed`
                );
                if (retryFailResult.nodeIds.length > 0) {
                    edges.push({
                        id: `edge-${nodeId}-retry-fail-${retryFailResult.nodeIds[0]}`,
                        source: nodeId,
                        target: retryFailResult.nodeIds[0],
                        sourceHandle: 'failure',
                        type: 'smoothstep',
                        animated: true,
                        label: 'Failed (Retries Exhausted)', 
                        style: { stroke: '#ef4444', strokeWidth: 3 } // Red for failure
                    });
                    endNodeIds.push(...retryFailResult.endNodes);
                } else {
                    const stopNode = createStopNode(currentX + xSpacing, retryFailY, 'RETRY FAILED END');
                    nodes.push(stopNode);
                    edges.push({
                        id: `edge-${nodeId}-retry-fail-stop`,
                        source: nodeId,
                        target: stopNode.id,
                        sourceHandle: 'failure',
                        type: 'smoothstep',
                        animated: true,
                        label: 'Failed (Retries Exhausted)',
                        style: { stroke: '#ef4444', strokeWidth: 3 }
                    });
                    endNodeIds.push(stopNode.id);
                }
            } else {
                // Add an implicit PATH END node for retry failure if no explicit path in blueprint
                const stopNode = createStopNode(currentX + xSpacing, currentY + 75, 'RETRY FAILED (No Path)');
                nodes.push(stopNode);
                edges.push({
                    id: `edge-${nodeId}-retry-implicit-fail-stop`,
                    source: nodeId,
                    target: stopNode.id,
                    sourceHandle: 'failure',
                    type: 'smoothstep',
                    animated: true,
                    label: 'Implicit Failure',
                    style: { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '4,4' } // Dashed red for implicit
                });
                endNodeIds.push(stopNode.id);
            }
            return { nodeIds: processedNodeIds, endNodes: endNodeIds, finalX: currentX, finalY: currentY }; // Retry node manages its own full flow
        }

        // Handle fallback node's primary and fallback paths (MODIFIED)
        if (step.type === 'fallback' && step.fallback) {
            // Primary path
            const primaryResult = processStepsWithRouting(
                step.fallback.primary_steps,
                currentX + xSpacing,
                currentY - 75, // Position primary path slightly above
                nodeId,
                'primary',
                `${routePath} -> Primary Path`
            );
            if (primaryResult.nodeIds.length > 0) {
                edges.push({
                    id: `edge-${nodeId}-fallback-primary-${primaryResult.nodeIds[0]}`,
                    source: nodeId,
                    target: primaryResult.nodeIds[0],
                    sourceHandle: 'primary',
                    type: 'smoothstep',
                    animated: true,
                    label: 'Primary Success',
                    style: { stroke: '#10b981', strokeWidth: 3 }
                });
                endNodeIds.push(...primaryResult.endNodes);
            } else {
                const stopNode = createStopNode(currentX + xSpacing, currentY - 75, 'PRIMARY PATH END');
                nodes.push(stopNode);
                edges.push({
                    id: `edge-${nodeId}-fallback-primary-stop`,
                    source: nodeId,
                    target: stopNode.id,
                    sourceHandle: 'primary',
                    type: 'smoothstep',
                    animated: true,
                    label: 'Primary Success',
                    style: { stroke: '#10b981', strokeWidth: 3 }
                });
                endNodeIds.push(stopNode.id);
            }

            // Fallback path
            const fallbackResult = processStepsWithRouting(
                step.fallback.fallback_steps,
                currentX + xSpacing,
                currentY + 75, // Position fallback path below
                nodeId,
                'fallback',
                `${routePath} -> Fallback Path`
            );
            if (fallbackResult.nodeIds.length > 0) {
                edges.push({
                    id: `edge-${nodeId}-fallback-secondary-${fallbackResult.nodeIds[0]}`,
                    source: nodeId,
                    target: fallbackResult.nodeIds[0],
                    sourceHandle: 'fallback',
                    type: 'smoothstep',
                    animated: true,
                    label: 'Fallback Executed',
                    style: { stroke: '#f59e0b', strokeWidth: 3 } // Amber for fallback
                });
                endNodeIds.push(...fallbackResult.endNodes);
            } else {
                const stopNode = createStopNode(currentX + xSpacing, currentY + 75, 'FALLBACK PATH END');
                nodes.push(stopNode);
                edges.push({
                    id: `edge-${nodeId}-fallback-secondary-stop`,
                    source: nodeId,
                    target: stopNode.id,
                    sourceHandle: 'fallback',
                    type: 'smoothstep',
                    animated: true,
                    label: 'Fallback Executed',
                    style: { stroke: '#f59e0b', strokeWidth: 3 }
                });
                endNodeIds.push(stopNode.id);
            }
            return { nodeIds: processedNodeIds, endNodes: endNodeIds, finalX: currentX, finalY: currentY }; // Fallback node manages its own full flow
        }
        
        currentX += xSpacing; // Move X for next sequential node in the same path
        
        // If this is the last step in a linear sequence, mark it as an end node
        if (i === steps.length - 1) {
          endNodeIds.push(nodeId)
        }
      }

      return { nodeIds: processedNodeIds, endNodes: endNodeIds, finalX: currentX, finalY: currentY }
    }

    // Process all steps with enhanced routing, including the initial trigger and final end node
    const mainResult = processStepsWithRouting(
      automation_blueprint.steps, 
      startXForSteps, 
      baseY, 
      triggerParentId, 
      undefined, 
      'Main Flow'
    );

    // Add a single, clear "AUTOMATION END" node at the very end
    if (mainResult.endNodes.length > 0) {
        const maxFinalX = Math.max(...mainResult.endNodes.map(id => nodes.find(n => n.id === id)?.position.x || 0));
        const avgFinalY = mainResult.endNodes.reduce((sum, id) => sum + (nodes.find(n => n.id === id)?.position.y || 0), 0) / mainResult.endNodes.length;

        const finalEndNodeId = `final-automation-end-node`;
        const finalEndNode: DiagramNode = {
            id: finalEndNodeId,
            type: 'fallbackNode', // Visually re-using fallbackNode type, can be a dedicated 'endNode'
            position: { x: maxFinalX + xSpacing, y: avgFinalY },
            data: {
                label: 'AUTOMATION END', // User wants "End node"
                stepType: 'end', // Explicit stepType for rendering
                explanation: 'The entire automation workflow has successfully concluded.',
                isRecommended: false,
                icon: 'FlagCheckered' // A checkered flag icon
            },
            sourcePosition: 'right',
            targetPosition: 'left'
        };
        nodes.push(finalEndNode);

        // Connect all disparate end nodes to this single final AUTOMATION END node
        mainResult.endNodes.forEach(endNodeId => {
            edges.push({
                id: `edge-final-converge-${endNodeId}-${finalEndNodeId}`,
                source: endNodeId,
                target: finalEndNodeId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#4f46e5', strokeWidth: 3, strokeDasharray: '4,2' } // A distinct converging line style
            });
        });
    }

    console.log('✅ Enhanced diagram generation completed successfully!', {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      conditionNodes: nodes.filter(n => n.type === 'conditionNode').length,
      aiAgentNodes: nodes.filter(n => n.data.isRecommended).length,
      stopNodes: nodes.filter(n => n.data.stepType === 'stop').length,
      generatedAt: new Date().toISOString(),
      triggerType: automation_blueprint.trigger?.type || 'manual'
    });

    const result = {
      nodes,
      edges,
      metadata: {
        totalSteps: automation_blueprint.steps.length,
        conditionalBranches: nodes.filter(n => n.type === 'conditionNode').length,
        aiAgentRecommendations: nodes.filter(n => n.data.isRecommended).length,
        platforms: [...new Set(nodes.map(n => n.data.platform).filter(Boolean))],
        // Count all explicit end/stop nodes for 'routePaths' if desired, or just final 'AUTOMATION END'
        routePathsTerminated: nodes.filter(n => n.data.stepType === 'stop' || n.data.stepType === 'end').length, 
        generatedAt: new Date().toISOString(),
        triggerType: automation_blueprint.trigger?.type || 'manual'
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Error in enhanced diagram generation:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'diagram-generator',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});