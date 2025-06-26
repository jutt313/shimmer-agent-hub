import { Node, Edge, XYPosition, Position } from '@xyflow/react'; // Removed ELK and internalsSymbol imports

// Define a new type to include 'id' along with XYPosition for recursive function returns
interface ProcessedNodePosition extends XYPosition {
  id: string;
}

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

// Main function to convert an automation blueprint into nodes and edges for React Flow
export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  // Use a Map to keep track of processed step IDs and their React Flow Node objects
  // This helps when drawing edges to already-placed nodes (e.g., convergence)
  const processedNodes = new Map<string, Node>();
  // Tracks the maximum Y-coordinate used at a specific X-coordinate level
  // Used to prevent vertical overlaps in horizontal layout
  const columnMaxY = new Map<number, number>(); 

  if (!blueprint || !blueprint.steps || blueprint.steps.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Layout constants - optimized for better visual flow and readability
  const startX = 100;
  const startY = 100;
  const xSpacing = 300; // Horizontal space between node centers
  const ySpacing = 120; // Vertical space between nodes/branches (center to center)
  const nodeHeight = 80; // Approximate visual height of a node for overlap calculation

  // Helper function to add edges to the React Flow graph
  const addDiagramEdge = (sourceId: string, targetId: string, type: 'default' | 'true' | 'false', edgeList: Edge[]) => {
    let label: string | undefined = undefined;
    let color = '#9333ea'; // Default stroke color
    let sourceHandle: string | undefined = Position.Right; // Default source handle

    if (type === 'true') {
      label = 'If True';
      color = '#10b981'; // Green for true
      sourceHandle = 'true'; // Custom handle for ConditionNode
    } else if (type === 'false') {
      label = 'If False';
      color = '#ef4444'; // Red for false
      sourceHandle = 'false'; // Custom handle for ConditionNode
    }

    const edgeId = `${sourceId}-${type}-${targetId}`;
    
    // Check if edge already exists to prevent duplicates, especially with convergence
    if (edgeList.some(e => e.id === edgeId)) {
        return;
    }

    edgeList.push({
      id: edgeId,
      source: sourceId,
      target: targetId,
      sourceHandle: sourceHandle,
      animated: true,
      label,
      labelBgPadding: [4, 8],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: 'white', color: '#333' },
      labelStyle: { fontSize: '10px', fill: '#555' },
      style: { stroke: color, strokeWidth: 2 }
    });
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

  // Recursive function to process steps and determine their positions and connections.
  // This function is the core of the manual layout algorithm.
  const processSteps = (
    steps: BlueprintStep[],
    currentColumnX: number, // The X-coordinate for the current 'column' or layer of nodes
    currentYCursor: number, // The Y-coordinate to start placing the first node in this flow segment
    parentNodeId: string | null, // The ID of the node that leads to these steps (for edge drawing)
    incomingEdgeType: 'default' | 'true' | 'false' = 'default' // Type of edge coming from the parent
  ): { nextColumnX: number; maxBranchY: number; lastNodeId: string | null } => {
    let maxXReachedInSegment = currentColumnX; // Tracks the furthest X coordinate reached by nodes in this segment
    let maxYReachedByFlow = currentYCursor; // Tracks the lowest Y coordinate reached by nodes in this segment (including branches)
    let lastProcessedNodeId: string | null = null;
    let localYCursor = currentYCursor; // Y cursor for placing sequential nodes within the current column

    steps.forEach((step, index) => {
      // If node already exists (convergence point), just connect an edge to it
      if (processedNodes.has(step.id)) {
        const existingNode = processedNodes.get(step.id)!;
        if (parentNodeId) {
          addDiagramEdge(parentNodeId, step.id, incomingEdgeType, edges);
        }
        // Update max X/Y based on this existing node's position as it's part of the flow
        maxXReachedInSegment = Math.max(maxXReachedInSegment, existingNode.position.x);
        maxYReachedByFlow = Math.max(maxYReachedByFlow, existingNode.position.y + nodeHeight);
        lastProcessedNodeId = step.id;
        return; // Skip adding node again
      }

      // Determine the Y position for the current node, preventing overlaps within the same X-column
      const nodeY = Math.max(localYCursor, columnMaxY.get(currentColumnX) || startY);
      columnMaxY.set(currentColumnX, nodeY + nodeHeight + ySpacing / 2); // Update max Y for this column

      const newNode: Node = {
        id: step.id,
        type: getNodeType(step),
        position: { x: currentColumnX, y: nodeY },
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
      nodes.push(newNode);
      processedNodes.set(step.id, newNode); // Add node to the map of processed nodes
      lastProcessedNodeId = step.id;

      // Add edge from parent to current node
      if (parentNodeId) {
        addDiagramEdge(parentNodeId, step.id, incomingEdgeType, edges);
      }

      let subFlowMaxY = nodeY; // Max Y reached by nested flows originating from this node

      // Handle nested steps (conditions and loops)
      if (step.type === 'condition' && step.condition) {
        const branchStartX = currentColumnX + xSpacing;
        let trueBranchCurrentY = nodeY - (ySpacing * 0.75); // Start true branch slightly above current node's Y
        let falseBranchCurrentY = nodeY + (ySpacing * 0.75); // Start false branch slightly below current node's Y

        let branchMaxX = branchStartX;
        
        // Process 'if_true' branch
        if (step.condition.if_true && step.condition.if_true.length > 0) {
          const { nextColumnX: trueNextX, maxBranchY: trueMaxY } = processSteps(
            step.condition.if_true, branchStartX, trueBranchCurrentY, step.id, 'true'
          );
          branchMaxX = Math.max(branchMaxX, trueNextX);
          subFlowMaxY = Math.max(subFlowMaxY, trueMaxY);
        }

        // Process 'if_false' branch
        if (step.condition.if_false && step.condition.if_false.length > 0) {
          const { nextColumnX: falseNextX, maxBranchY: falseMaxY } = processSteps(
            step.condition.if_false, branchStartX, falseBranchCurrentY, step.id, 'false'
          );
          branchMaxX = Math.max(branchMaxX, falseNextX);
          subFlowMaxY = Math.max(subFlowMaxY, falseMaxY);
        }

        // After processing branches, the current Y cursor for subsequent nodes
        // needs to account for the total vertical space consumed by branches.
        // The next sequential node should ideally start at the max Y of all branches + spacing
        localYCursor = subFlowMaxY + ySpacing; 
        maxXReachedInSegment = Math.max(maxXReachedInSegment, branchMaxX); // Update max X considering branches
      } else if (step.type === 'loop' && step.loop) {
        // For loops, its children are laid out sequentially starting to its right
        const loopContentStartX = currentColumnX + xSpacing;
        const { nextColumnX: loopNextX, maxBranchY: loopMaxY } = processSteps(
          step.loop.steps, loopContentStartX, nodeY, step.id, 'default'
        );
        maxXReachedInSegment = Math.max(maxXReachedInSegment, loopNextX);
        subFlowMaxY = Math.max(subFlowMaxY, loopMaxY);
        localYCursor = subFlowMaxY + ySpacing; // Advance Y cursor after loop content
      } else {
        // For simple actions, agents, delays: just advance the Y cursor for the next sibling step
        localYCursor = nodeY + ySpacing;
      }
      
      maxXReachedInSegment = Math.max(maxXReachedInSegment, currentColumnX + xSpacing); // Further most X reached by this step's column
      maxYReachedByFlow = Math.max(maxYReachedByFlow, subFlowMaxY); // Max Y including any nested branches

    });

    return { nextColumnX: maxXReachedInSegment, maxBranchY: maxYReachedByFlow, lastNodeId: lastProcessedNodeId };
  };

  // Start processing the top-level blueprint steps
  const { nextColumnX, maxBranchY } = processSteps(blueprint.steps, startX, startY, null);

  // Final layout adjustment: Re-center diagram if it's too far left/top
  // This can be done by finding min X/Y and shifting all nodes.
  let minX = Infinity;
  let minY = Infinity;
  nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
  });

  const offsetX = (minX < 50) ? (50 - minX) : 0; // Ensure some left margin
  const offsetY = (minY < 50) ? (50 - minY) : 0; // Ensure some top margin

  nodes.forEach(node => {
      node.position.x += offsetX;
      node.position.y += offsetY;
  });

  return { nodes, edges };
};
