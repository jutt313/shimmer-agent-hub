
import { Node, Edge, Position } from '@xyflow/react';

// Define the structure of a blueprint step, including nested steps for conditions and loops
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
    case 'action':
    default:
      return 'actionNode';
  }
};

// Helper to get step explanation for node data
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

// FIXED: Main function to convert an automation blueprint into nodes and edges for React Flow
export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const processedNodes = new Map<string, Node>();
  
  if (!blueprint || !blueprint.steps || blueprint.steps.length === 0) {
    console.warn('⚠️ Empty or invalid blueprint provided');
    return { nodes: [], edges: [] };
  }

  console.log('🔄 Processing blueprint with', blueprint.steps.length, 'steps');

  // Layout constants - IMPROVED spacing and positioning
  const startX = 100;
  const startY = 200;
  const horizontalSpacing = 300; // Reduced from 350 for better fit
  const verticalSpacing = 120; // Reduced from 150 for better fit

  let currentColumnX = startX;
  let nodeIdCounter = 0;

  // Helper function to add edges with SOFT styling
  const addDiagramEdge = (sourceId: string, targetId: string, edgeType: 'default' | 'true' | 'false' | 'branch' = 'default', label?: string) => {
    if (!processedNodes.has(sourceId) || !processedNodes.has(targetId)) {
      console.error('❌ Cannot create edge: node not found');
      return;
    }

    const edgeId = `${sourceId}-${targetId}-${edgeType}-${Date.now()}-${Math.random()}`;
    
    // SOFT color palette for edges
    let color = '#a78bfa'; // Soft purple
    let sourceHandle: string | undefined = undefined;
    let animated = true;

    if (edgeType === 'true') {
      color = '#34d399'; // Soft green
      sourceHandle = 'true';
      label = label || 'True';
    } else if (edgeType === 'false') {
      color = '#f87171'; // Soft red
      sourceHandle = 'false';
      label = label || 'False';
    } else if (edgeType === 'branch') {
      color = '#a78bfa'; // Soft purple
      animated = true;
    }

    const newEdge: Edge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      sourceHandle,
      animated,
      label,
      labelBgPadding: [4, 8],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: 'white', color: '#374151' },
      labelStyle: { fontSize: '10px', fill: '#6b7280' },
      style: { stroke: color, strokeWidth: 2 }
    };

    edges.push(newEdge);
    console.log('✅ Added edge:', { sourceId, targetId, edgeType, edgeId });
  };

  // Function to create a node with SOFT colors
  const createNode = (step: BlueprintStep, x: number, y: number): Node => {
    if (!step.id) {
      step.id = `step_${generateUUID()}`;
    }

    const node: Node = {
      id: step.id,
      type: getNodeType(step),
      position: { x, y },
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
      sourcePosition: getNodeType(step) === 'conditionNode' ? undefined : Position.Right,
      targetPosition: Position.Left,
    };
    
    nodes.push(node);
    processedNodes.set(step.id, node);
    console.log('✅ Created node:', { id: step.id, type: getNodeType(step), position: { x, y } });
    return node;
  };

  // FIXED: Improved step processing with better connections
  const processStepsFlow = (
    steps: BlueprintStep[],
    startX: number,
    centerY: number,
    parentId?: string,
    edgeType: 'default' | 'true' | 'false' = 'default'
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

      // FIXED: Ensure proper connections
      if (parentId) {
        addDiagramEdge(parentId, step.id, edgeType);
      } else if (i > 0 && steps[i - 1]) {
        // Connect to previous step in sequence
        addDiagramEdge(steps[i - 1].id, step.id, 'default');
      }

      // Handle different step types with improved layout
      if (step.type === 'condition' && step.condition) {
        const branchStartX = currentX + horizontalSpacing;
        const branches: Array<{ steps: BlueprintStep[], type: 'true' | 'false' }> = [];
        
        if (step.condition.if_true && step.condition.if_true.length > 0) {
          branches.push({ steps: step.condition.if_true, type: 'true' });
        }
        
        if (step.condition.if_false && step.condition.if_false.length > 0) {
          branches.push({ steps: step.condition.if_false, type: 'false' });
        }

        let maxBranchX = branchStartX;
        branches.forEach((branch, index) => {
          const branchY = centerY + (index === 0 ? -verticalSpacing/2 : verticalSpacing/2);
          
          const { nextX: branchNextX } = processStepsFlow(
            branch.steps,
            branchStartX,
            branchY,
            step.id,
            branch.type
          );
          
          maxBranchX = Math.max(maxBranchX, branchNextX);
        });

        currentX = maxBranchX;

      } else if (step.type === 'loop' && step.loop) {
        const loopContentX = currentX + horizontalSpacing;
        
        const { nextX: loopNextX } = processStepsFlow(
          step.loop.steps,
          loopContentX,
          centerY,
          step.id,
          'default'
        );
        
        currentX = loopNextX;
      } else {
        currentX += horizontalSpacing;
      }
    }

    return { lastNodeId, nextX: currentX };
  };

  // Start processing from the first column
  processStepsFlow(blueprint.steps, startX, startY);

  // FIXED: Ensure proper node positioning without overlaps
  const adjustNodePositions = () => {
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
        const minDistance = 100;
        
        if (currentNode.position.y - prevNode.position.y < minDistance) {
          currentNode.position.y = prevNode.position.y + minDistance;
        }
      }
    });
  };

  adjustNodePositions();

  console.log('🎯 Blueprint conversion complete:', { 
    totalNodes: nodes.length, 
    totalEdges: edges.length,
    processedSteps: blueprint.steps.length
  });

  return { nodes, edges };
};
