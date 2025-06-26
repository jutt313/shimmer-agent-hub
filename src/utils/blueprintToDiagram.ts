
import { Node, Edge, XYPosition, Position } from '@xyflow/react';

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

// Main function to convert an automation blueprint into nodes and edges for React Flow
export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const processedNodes = new Map<string, Node>();
  
  if (!blueprint || !blueprint.steps || blueprint.steps.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Layout constants - LEFT TO RIGHT FLOW
  const startX = 100;
  const startY = 200;
  const nodeWidth = 280; // Width of each node including spacing
  const nodeHeight = 100; // Height for vertical spacing between branches
  const horizontalSpacing = 350; // Space between columns (left to right)
  const verticalSpacing = 150; // Space between branches (up and down)

  let currentColumnX = startX;
  let nodeIdCounter = 0;

  // Helper function to add edges with proper styling
  const addDiagramEdge = (sourceId: string, targetId: string, edgeType: 'default' | 'true' | 'false' | 'branch' = 'default', label?: string) => {
    const edgeId = `${sourceId}-${targetId}-${edgeType}-${Date.now()}`;
    
    let color = '#9333ea';
    let sourceHandle: string | undefined = undefined;
    let animated = true;

    if (edgeType === 'true') {
      color = '#10b981'; // Green
      sourceHandle = 'true';
      label = label || 'True';
    } else if (edgeType === 'false') {
      color = '#ef4444'; // Red
      sourceHandle = 'false';
      label = label || 'False';
    } else if (edgeType === 'branch') {
      color = '#8b5cf6'; // Purple
      animated = true;
    }

    edges.push({
      id: edgeId,
      source: sourceId,
      target: targetId,
      sourceHandle,
      animated,
      label,
      labelBgPadding: [4, 8],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: 'white', color: '#333' },
      labelStyle: { fontSize: '10px', fill: '#555' },
      style: { stroke: color, strokeWidth: 2 }
    });
  };

  // Function to create a node
  const createNode = (step: BlueprintStep, x: number, y: number): Node => {
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
    return node;
  };

  // Function to process steps with proper left-to-right flow and branching
  const processStepsFlow = (
    steps: BlueprintStep[],
    startX: number,
    centerY: number,
    parentId?: string,
    edgeType: 'default' | 'true' | 'false' = 'default'
  ): { lastNodeId: string | null; nextX: number; usedYPositions: number[] } => {
    let currentX = startX;
    let lastNodeId: string | null = null;
    let usedYPositions: number[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Check if node already exists (for convergence)
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
      usedYPositions.push(centerY);

      // Connect to parent if exists
      if (parentId) {
        addDiagramEdge(parentId, step.id, edgeType);
      }

      // Handle different step types
      if (step.type === 'condition' && step.condition) {
        // CONDITION NODE - CREATE BRANCHES
        const branchStartX = currentX + horizontalSpacing;
        let branchY = centerY;
        const branches: Array<{ steps: BlueprintStep[], type: 'true' | 'false', label?: string }> = [];
        
        // Add true branch
        if (step.condition.if_true && step.condition.if_true.length > 0) {
          branches.push({ steps: step.condition.if_true, type: 'true' });
        }
        
        // Add false branch  
        if (step.condition.if_false && step.condition.if_false.length > 0) {
          branches.push({ steps: step.condition.if_false, type: 'false' });
        }

        // Calculate branch positions
        const totalBranches = branches.length;
        const branchSpacing = verticalSpacing;
        let branchStartY = centerY - ((totalBranches - 1) * branchSpacing / 2);

        let maxBranchX = branchStartX;
        let allBranchEndNodes: string[] = [];

        // Process each branch
        branches.forEach((branch, index) => {
          const branchY = branchStartY + (index * branchSpacing);
          const { lastNodeId: branchLastNode, nextX: branchNextX } = processStepsFlow(
            branch.steps,
            branchStartX,
            branchY,
            step.id,
            branch.type
          );
          
          if (branchLastNode) {
            allBranchEndNodes.push(branchLastNode);
          }
          maxBranchX = Math.max(maxBranchX, branchNextX);
        });

        // Update current X to continue after branches
        currentX = maxBranchX;
        
        // If there are more steps after this condition, create convergence
        if (i < steps.length - 1) {
          const nextStep = steps[i + 1];
          // The next step will naturally converge the branches
        }

      } else if (step.type === 'loop' && step.loop) {
        // LOOP NODE - PROCESS INTERNAL STEPS
        const loopContentX = currentX + horizontalSpacing;
        const { lastNodeId: loopLastNode, nextX: loopNextX } = processStepsFlow(
          step.loop.steps,
          loopContentX,
          centerY,
          step.id,
          'default'
        );
        
        currentX = loopNextX;
      } else {
        // REGULAR NODE - CONTINUE SEQUENCE
        currentX += horizontalSpacing;
      }

      // Check if this step sends to multiple platforms (parallel execution)
      if (step.action && step.action.integration) {
        // If next steps are all actions with different platforms, they might be parallel
        let parallelActions: BlueprintStep[] = [];
        let j = i + 1;
        
        // Look ahead for consecutive action steps that might be parallel
        while (j < steps.length && steps[j].type === 'action' && steps[j].action?.integration !== step.action.integration) {
          parallelActions.push(steps[j]);
          j++;
        }
        
        // If we found parallel actions, create branches
        if (parallelActions.length > 0) {
          const parallelStartX = currentX;
          let parallelY = centerY;
          const parallelSpacing = verticalSpacing * 0.8;
          const parallelStartY = centerY - ((parallelActions.length - 1) * parallelSpacing / 2);
          
          let parallelEndNodes: string[] = [];
          
          // Create parallel action nodes
          parallelActions.forEach((parallelStep, index) => {
            const parallelNodeY = parallelStartY + (index * parallelSpacing);
            const parallelNode = createNode(parallelStep, parallelStartX, parallelNodeY);
            addDiagramEdge(step.id, parallelStep.id, 'branch');
            parallelEndNodes.push(parallelStep.id);
            usedYPositions.push(parallelNodeY);
          });
          
          // Skip the parallel actions in main loop
          i = j - 1;
          currentX = parallelStartX + horizontalSpacing;
        }
      }
    }

    return { lastNodeId, nextX: currentX, usedYPositions };
  };

  // Start processing from the first column
  const { lastNodeId, nextX } = processStepsFlow(blueprint.steps, startX, startY);

  // Adjust positions to prevent overlaps and ensure proper spacing
  const adjustNodePositions = () => {
    const columns = new Map<number, Node[]>();
    
    // Group nodes by X position (column)
    nodes.forEach(node => {
      const x = node.position.x;
      if (!columns.has(x)) {
        columns.set(x, []);
      }
      columns.get(x)!.push(node);
    });
    
    // Adjust Y positions within each column to prevent overlaps
    columns.forEach((columnNodes, x) => {
      columnNodes.sort((a, b) => a.position.y - b.position.y);
      
      for (let i = 1; i < columnNodes.length; i++) {
        const prevNode = columnNodes[i - 1];
        const currentNode = columnNodes[i];
        const minDistance = nodeHeight + 20; // Minimum distance between nodes
        
        if (currentNode.position.y - prevNode.position.y < minDistance) {
          currentNode.position.y = prevNode.position.y + minDistance;
        }
      }
    });
  };

  adjustNodePositions();

  return { nodes, edges };
};
