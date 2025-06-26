
import { Node, Edge, Position } from '@xyflow/react';

interface BlueprintStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'delay' | 'ai_agent_call';
  action?: {
    integration?: string;
    method?: string;
    parameters?: any;
  };
  condition?: {
    expression: string;
    if_true: BlueprintStep[];
    if_false?: BlueprintStep[];
    condition_id?: string;
  };
  loop?: {
    array_source: string;
    steps: BlueprintStep[];
    loop_id?: string;
  };
  delay?: {
    duration_seconds: number;
  };
  ai_agent_call?: {
    agent_id: string;
    input_prompt: string;
    output_variable: string;
  };
  on_error?: 'continue' | 'stop' | 'retry';
}

interface AutomationBlueprint {
  version: string;
  description?: string;
  trigger?: any;
  steps: BlueprintStep[];
  variables?: any;
}

const getNodeType = (step: BlueprintStep): string => {
  switch (step.type) {
    case 'condition':
      return 'conditionNode';
    case 'loop':
      return 'loopNode';
    case 'delay':
      return 'delayNode';
    case 'ai_agent_call':
      return 'aiAgentNode';
    case 'action':
    default:
      return 'actionNode';
  }
};

export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const processedNodes = new Map<string, Node>();

  if (!blueprint || !blueprint.steps || blueprint.steps.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Layout constants - optimized for better visual flow
  const startX = 100;
  const startY = 100;
  const xSpacing = 300; // More space between columns
  const ySpacing = 120; // Space between rows
  const branchSeparation = 200; // Space between true/false branches

  const processSteps = (
    steps: BlueprintStep[],
    currentX: number,
    currentY: number,
    parentId: string | null,
    edgeType: 'default' | 'true' | 'false' = 'default'
  ): { maxX: number; maxY: number; lastNodeId: string | null } => {
    let maxX = currentX;
    let maxY = currentY;
    let lastNodeId: string | null = null;
    let yOffset = 0;

    steps.forEach((step, index) => {
      // Check if node already exists (convergence point)
      if (processedNodes.has(step.id)) {
        const existingNode = processedNodes.get(step.id)!;
        if (parentId) {
          addEdge(parentId, step.id, edgeType);
        }
        lastNodeId = step.id;
        maxX = Math.max(maxX, existingNode.position.x);
        maxY = Math.max(maxY, existingNode.position.y);
        return;
      }

      const nodeY = currentY + yOffset;
      
      // Create the node
      const newNode: Node = {
        id: step.id,
        type: getNodeType(step),
        position: { x: currentX, y: nodeY },
        data: {
          label: step.name || `Step ${step.id}`,
          platform: step.action?.integration,
          action: step.action,
          condition: step.condition,
          loop: step.loop,
          delay: step.delay,
          agent: step.ai_agent_call,
          explanation: getStepExplanation(step)
        },
        sourcePosition: step.type === 'condition' ? undefined : Position.Right,
        targetPosition: Position.Left,
      };

      nodes.push(newNode);
      processedNodes.set(step.id, newNode);
      lastNodeId = step.id;

      // Add edge from parent
      if (parentId) {
        addEdge(parentId, step.id, edgeType);
      }

      maxX = Math.max(maxX, currentX);
      maxY = Math.max(maxY, nodeY);

      // Handle nested structures
      if (step.type === 'condition' && step.condition) {
        const branchX = currentX + xSpacing;
        let trueBranchY = nodeY - branchSeparation / 2;
        let falseBranchY = nodeY + branchSeparation / 2;

        // Ensure branches don't overlap with existing nodes
        trueBranchY = Math.max(trueBranchY, maxY - branchSeparation);
        falseBranchY = Math.max(falseBranchY, maxY);

        let branchMaxX = branchX;
        let branchMaxY = Math.max(trueBranchY, falseBranchY);

        // Process true branch
        if (step.condition.if_true && step.condition.if_true.length > 0) {
          const trueResult = processSteps(
            step.condition.if_true,
            branchX,
            trueBranchY,
            step.id,
            'true'
          );
          branchMaxX = Math.max(branchMaxX, trueResult.maxX);
          branchMaxY = Math.max(branchMaxY, trueResult.maxY);
        }

        // Process false branch
        if (step.condition.if_false && step.condition.if_false.length > 0) {
          const falseResult = processSteps(
            step.condition.if_false,
            branchX,
            falseBranchY,
            step.id,
            'false'
          );
          branchMaxX = Math.max(branchMaxX, falseResult.maxX);
          branchMaxY = Math.max(branchMaxY, falseResult.maxY);
        }

        maxX = Math.max(maxX, branchMaxX);
        maxY = Math.max(maxY, branchMaxY);
        yOffset = branchMaxY - currentY + ySpacing;

      } else if (step.type === 'loop' && step.loop) {
        const loopX = currentX + xSpacing;
        const loopResult = processSteps(
          step.loop.steps,
          loopX,
          nodeY,
          step.id,
          'default'
        );
        maxX = Math.max(maxX, loopResult.maxX);
        maxY = Math.max(maxY, loopResult.maxY);
        yOffset += ySpacing;
      } else {
        // Regular sequential step
        yOffset += ySpacing;
      }
    });

    return { maxX, maxY, lastNodeId };
  };

  const addEdge = (sourceId: string, targetId: string, type: 'default' | 'true' | 'false') => {
    let label: string | undefined;
    let color = '#9333ea';
    let sourceHandle: string | undefined;

    if (type === 'true') {
      label = 'If True';
      color = '#10b981';
      sourceHandle = 'true';
    } else if (type === 'false') {
      label = 'If False';
      color = '#ef4444';
      sourceHandle = 'false';
    }

    const edgeId = `${sourceId}-${type}-${targetId}`;
    
    edges.push({
      id: edgeId,
      source: sourceId,
      target: targetId,
      sourceHandle,
      animated: true,
      label,
      labelBgPadding: [4, 8],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: 'white', color: '#333' },
      labelStyle: { fontSize: '10px', fill: '#555' },
      style: { stroke: color, strokeWidth: 2 }
    });
  };

  const getStepExplanation = (step: BlueprintStep): string => {
    switch (step.type) {
      case 'action':
        return `Performs ${step.action?.method || 'an action'} on ${step.action?.integration || 'a platform'}`;
      case 'condition':
        return `Evaluates condition: ${step.condition?.expression || 'unknown'}`;
      case 'loop':
        return `Iterates over: ${step.loop?.array_source || 'data'}`;
      case 'ai_agent_call':
        return `Invokes AI agent: ${step.ai_agent_call?.agent_id || 'unknown'}`;
      case 'delay':
        return `Waits for ${step.delay?.duration_seconds || 0} seconds`;
      default:
        return 'Performs a step in the automation';
    }
  };

  // Process all steps starting from the beginning
  processSteps(blueprint.steps, startX, startY, null);

  return { nodes, edges };
};
