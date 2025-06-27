
import { Node, Edge, Position } from '@xyflow/react';

// Define the structure of a blueprint step, including nested steps for conditions and loops
interface BlueprintStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'delay' | 'ai_agent_call' | 'retry' | 'fallback';
  action?: {
    integration?: string;
    method?: string;
    parameters?: any;
  };
  condition?: {
    expression: string;
    if_true: BlueprintStep[];
    if_false?: BlueprintStep[];
  };
  loop?: {
    array_source: string;
    steps: BlueprintStep[];
  };
  delay?: {
    duration_seconds: number;
  };
  ai_agent_call?: {
    agent_id: string;
    input_prompt: string;
    output_variable: string;
  };
  retry?: {
    max_attempts: number;
    steps: BlueprintStep[];
  };
  fallback?: {
    primary_steps: BlueprintStep[];
    fallback_steps: BlueprintStep[];
  };
  on_error?: 'continue' | 'stop' | 'retry';
}

// Define the overall structure of the automation blueprint
interface AutomationBlueprint {
  version: string;
  description?: string;
  trigger?: any;
  steps: BlueprintStep[];
  variables?: any;
}

// Generate a proper UUID v4 with fallback
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function to determine the custom node type based on the blueprint step's type
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
    case 'retry':
      return 'retryNode';
    case 'fallback':
      return 'fallbackNode';
    case 'action':
    default:
      return 'actionNode';
  }
};

// Helper to get step explanation for node data
const getStepExplanation = (step: BlueprintStep): string => {
  switch (step.type) {
    case 'action':
      return `${step.action?.method || 'Action'} on ${step.action?.integration || 'platform'}`;
    case 'condition':
      return `If ${step.condition?.expression || 'condition'}`;
    case 'loop':
      return `For each in ${step.loop?.array_source || 'data'}`;
    case 'ai_agent_call':
      return `AI Agent: ${step.ai_agent_call?.agent_id || 'unknown'}`;
    case 'delay':
      return `Wait ${step.delay?.duration_seconds || 0}s`;
    case 'retry':
      return `Retry up to ${step.retry?.max_attempts || 3} times`;
    case 'fallback':
      return 'Primary with fallback';
    default:
      return 'Automation step';
  }
};

// Main function to convert an automation blueprint into nodes and edges for React Flow
export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const processedNodes = new Map<string, Node>();
  
  if (!blueprint || !blueprint.steps || blueprint.steps.length === 0) {
    console.warn('⚠️ Empty or invalid blueprint provided');
    return { nodes: [], edges: [] };
  }

  console.log('🔄 Processing blueprint with', blueprint.steps.length, 'steps');

  // Layout constants - Make.com style spacing
  const startX = 100;
  const startY = 300;
  const horizontalSpacing = 280;
  const verticalSpacing = 180;
  const branchSpacing = 120;

  let currentColumnX = startX;
  let nodeIdCounter = 0;

  // Helper function to add edges with soft styling and curves
  const addDiagramEdge = (
    sourceId: string, 
    targetId: string, 
    edgeType: 'default' | 'success' | 'error' | 'branch' | 'loop' = 'default', 
    label?: string
  ) => {
    if (!processedNodes.has(sourceId) || !processedNodes.has(targetId)) {
      console.error('❌ Cannot create edge: node not found');
      return;
    }

    const edgeId = `${sourceId}-${targetId}-${edgeType}-${Date.now()}-${Math.random()}`;
    
    // Soft color palette for edges
    let color = '#a8b5ff'; // Soft blue
    let sourceHandle: string | undefined = undefined;
    let animated = false;

    if (edgeType === 'success') {
      color = '#90f0a0'; // Soft green
      sourceHandle = 'success';
      label = label || 'Success';
      animated = true;
    } else if (edgeType === 'error') {
      color = '#ffb3ba'; // Soft red
      sourceHandle = 'error';
      label = label || 'Error';
    } else if (edgeType === 'branch') {
      color = '#ffd1a9'; // Soft orange
      animated = true;
    } else if (edgeType === 'loop') {
      color = '#e1c7ff'; // Soft purple
      animated = true;
    }

    const newEdge: Edge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      sourceHandle,
      animated,
      label,
      type: 'smoothstep',
      labelBgPadding: [8, 12],
      labelBgBorderRadius: 12,
      labelBgStyle: { fill: '#ffffff', opacity: 0.9 },
      labelStyle: { fontSize: '11px', fill: '#4a5568', fontWeight: '500' },
      style: { 
        stroke: color, 
        strokeWidth: 2.5,
        strokeDasharray: edgeType === 'error' ? '8,4' : undefined
      }
    };

    edges.push(newEdge);
    console.log('✅ Added edge:', { sourceId, targetId, edgeType, edgeId });
  };

  // Function to create a node with soft Make.com-style design
  const createNode = (step: BlueprintStep, x: number, y: number): Node => {
    if (!step.id) {
      step.id = `step_${generateUUID()}`;
    }

    const node: Node = {
      id: step.id,
      type: getNodeType(step),
      position: { x, y },
      data: {
        label: step.name || `Step ${step.id.slice(-4)}`,
        platform: step.action?.integration,
        action: step.action,
        condition: step.condition,
        loop: step.loop,
        delay: step.delay,
        agent: step.ai_agent_call,
        retry: step.retry,
        fallback: step.fallback,
        explanation: getStepExplanation(step),
        stepType: step.type
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    
    nodes.push(node);
    processedNodes.set(step.id, node);
    console.log('✅ Created node:', { id: step.id, type: getNodeType(step), position: { x, y } });
    return node;
  };

  // Enhanced step processing with Make.com-style layout
  const processStepsFlow = (
    steps: BlueprintStep[],
    startX: number,
    centerY: number,
    parentId?: string,
    edgeType: 'default' | 'success' | 'error' | 'branch' = 'default'
  ): { lastNodeId: string | null; nextX: number } => {
    let currentX = startX;
    let lastNodeId: string | null = null;

    console.log('🔄 Processing', steps.length, 'steps at position', { startX, centerY });

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      if (!step.id) {
        step.id = `step_${generateUUID()}`;
      }
      
      // Check if node already exists
      if (processedNodes.has(step.id)) {
        const existingNode = processedNodes.get(step.id)!;
        if (parentId) {
          addDiagramEdge(parentId, step.id, edgeType);
        }
        lastNodeId = step.id;
        continue;
      }

      // Create the current node
      const currentNode = createNode(step, currentX, centerY);
      lastNodeId = step.id;

      // Connect to parent or previous step
      if (parentId) {
        addDiagramEdge(parentId, step.id, edgeType);
      } else if (i > 0 && steps[i - 1]) {
        addDiagramEdge(steps[i - 1].id, step.id, 'default');
      }

      // Handle different step types with Make.com-style branching
      if (step.type === 'condition' && step.condition) {
        const branchStartX = currentX + horizontalSpacing;
        
        // True branch (success path) - positioned above
        if (step.condition.if_true && step.condition.if_true.length > 0) {
          const trueBranchY = centerY - branchSpacing;
          const { nextX: trueNextX } = processStepsFlow(
            step.condition.if_true,
            branchStartX,
            trueBranchY,
            step.id,
            'success'
          );
          currentX = Math.max(currentX, trueNextX);
        }
        
        // False branch (error path) - positioned below
        if (step.condition.if_false && step.condition.if_false.length > 0) {
          const falseBranchY = centerY + branchSpacing;
          const { nextX: falseNextX } = processStepsFlow(
            step.condition.if_false,
            branchStartX,
            falseBranchY,
            step.id,
            'error'
          );
          currentX = Math.max(currentX, falseNextX);
        }

      } else if (step.type === 'loop' && step.loop) {
        const loopContentX = currentX + horizontalSpacing;
        const { nextX: loopNextX } = processStepsFlow(
          step.loop.steps,
          loopContentX,
          centerY,
          step.id,
          'loop'
        );
        currentX = loopNextX;

      } else if (step.type === 'retry' && step.retry) {
        const retryContentX = currentX + horizontalSpacing;
        const { nextX: retryNextX } = processStepsFlow(
          step.retry.steps,
          retryContentX,
          centerY,
          step.id,
          'branch'
        );
        currentX = retryNextX;

      } else if (step.type === 'fallback' && step.fallback) {
        const fallbackStartX = currentX + horizontalSpacing;
        
        // Primary path
        const primaryY = centerY - branchSpacing/2;
        const { nextX: primaryNextX } = processStepsFlow(
          step.fallback.primary_steps,
          fallbackStartX,
          primaryY,
          step.id,
          'success'
        );
        
        // Fallback path
        const fallbackY = centerY + branchSpacing/2;
        const { nextX: fallbackNextX } = processStepsFlow(
          step.fallback.fallback_steps,
          fallbackStartX,
          fallbackY,
          step.id,
          'error'
        );
        
        currentX = Math.max(primaryNextX, fallbackNextX);

      } else {
        currentX += horizontalSpacing;
      }
    }

    return { lastNodeId, nextX: currentX };
  };

  // Start processing from the first column
  processStepsFlow(blueprint.steps, startX, startY);

  // Optimize node positioning to prevent overlaps
  const optimizeLayout = () => {
    const columns = new Map<number, Node[]>();
    
    nodes.forEach(node => {
      const x = Math.round(node.position.x / horizontalSpacing) * horizontalSpacing;
      if (!columns.has(x)) {
        columns.set(x, []);
      }
      columns.get(x)!.push(node);
    });
    
    columns.forEach((columnNodes, x) => {
      columnNodes.sort((a, b) => a.position.y - b.position.y);
      
      for (let i = 1; i < columnNodes.length; i++) {
        const prevNode = columnNodes[i - 1];
        const currentNode = columnNodes[i];
        const minDistance = 140;
        
        if (currentNode.position.y - prevNode.position.y < minDistance) {
          currentNode.position.y = prevNode.position.y + minDistance;
        }
      }
    });
  };

  optimizeLayout();

  console.log('🎯 Blueprint conversion complete:', { 
    totalNodes: nodes.length, 
    totalEdges: edges.length,
    processedSteps: blueprint.steps.length
  });

  return { nodes, edges };
};
