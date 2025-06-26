
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

// Generate a proper UUID v4
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
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

  // Layout constants - LEFT TO RIGHT FLOW
  const startX = 100;
  const startY = 200;
  const nodeWidth = 280; // Width of each node including spacing
  const nodeHeight = 100; // Height for vertical spacing between branches
  const horizontalSpacing = 350; // Space between columns (left to right)
  const verticalSpacing = 150; // Space between branches (up and down)

  let currentColumnX = startX;
  let nodeIdCounter = 0;

  // Helper function to add edges with proper styling and validation
  const addDiagramEdge = (sourceId: string, targetId: string, edgeType: 'default' | 'true' | 'false' | 'branch' = 'default', label?: string) => {
    // Validate that both source and target nodes exist
    if (!processedNodes.has(sourceId)) {
      console.error('❌ Cannot create edge: source node not found:', sourceId);
      return;
    }
    if (!processedNodes.has(targetId)) {
      console.error('❌ Cannot create edge: target node not found:', targetId);
      return;
    }

    const edgeId = `${sourceId}-${targetId}-${edgeType}-${Date.now()}-${Math.random()}`;
    
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

    const newEdge: Edge = {
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
    };

    edges.push(newEdge);
    console.log('✅ Added edge:', { sourceId, targetId, edgeType, edgeId });
  };

  // Function to create a node with proper validation
  const createNode = (step: BlueprintStep, x: number, y: number): Node => {
    // Ensure step has a valid ID
    if (!step.id) {
      step.id = `step_${generateUUID()}`;
      console.warn('⚠️ Generated ID for step without ID:', step.id);
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

    console.log('🔄 Processing', steps.length, 'steps at position', { startX, centerY });

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Ensure step has an ID
      if (!step.id) {
        step.id = `step_${generateUUID()}`;
      }
      
      // Check if node already exists (for convergence)
      if (processedNodes.has(step.id)) {
        const existingNode = processedNodes.get(step.id)!;
        if (parentId) {
          addDiagramEdge(parentId, step.id, edgeType);
        }
        lastNodeId = step.id;
        console.log('✅ Reusing existing node:', step.id);
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
        const branches: Array<{ steps: BlueprintStep[], type: 'true' | 'false', label?: string }> = [];
        
        // Add true branch
        if (step.condition.if_true && step.condition.if_true.length > 0) {
          branches.push({ steps: step.condition.if_true, type: 'true' });
        }
        
        // Add false branch  
        if (step.condition.if_false && step.condition.if_false.length > 0) {
          branches.push({ steps: step.condition.if_false, type: 'false' });
        }

        console.log('🔀 Processing condition with', branches.length, 'branches');

        // Calculate branch positions
        const totalBranches = branches.length;
        if (totalBranches > 0) {
          const branchSpacing = verticalSpacing;
          let branchStartY = centerY - ((totalBranches - 1) * branchSpacing / 2);

          let maxBranchX = branchStartX;
          let allBranchEndNodes: string[] = [];

          // Process each branch
          branches.forEach((branch, index) => {
            const branchY = branchStartY + (index * branchSpacing);
            console.log('🌿 Processing', branch.type, 'branch at Y:', branchY);
            
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
        }

      } else if (step.type === 'loop' && step.loop) {
        // LOOP NODE - PROCESS INTERNAL STEPS
        const loopContentX = currentX + horizontalSpacing;
        console.log('🔄 Processing loop with', step.loop.steps.length, 'internal steps');
        
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

      // Handle parallel execution for multiple platforms
      if (step.action && step.action.integration) {
        // Look for consecutive actions that might be parallel
        let parallelActions: BlueprintStep[] = [];
        let j = i + 1;
        
        while (j < steps.length && steps[j].type === 'action' && j - i < 5) { // Limit to 5 parallel actions
          parallelActions.push(steps[j]);
          j++;
        }
        
        if (parallelActions.length > 0) {
          console.log('⚡ Processing', parallelActions.length, 'parallel actions');
          const parallelStartX = currentX;
          const parallelSpacing = verticalSpacing * 0.8;
          const parallelStartY = centerY - ((parallelActions.length - 1) * parallelSpacing / 2);
          
          let parallelEndNodes: string[] = [];
          
          // Create parallel action nodes
          parallelActions.forEach((parallelStep, index) => {
            if (!parallelStep.id) {
              parallelStep.id = `step_${generateUUID()}`;
            }
            
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

    console.log('✅ Finished processing steps, last node:', lastNodeId, 'next X:', currentX);
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

  console.log('🎯 Blueprint conversion complete:', { 
    totalNodes: nodes.length, 
    totalEdges: edges.length,
    processedSteps: blueprint.steps.length
  });

  return { nodes, edges };
};
