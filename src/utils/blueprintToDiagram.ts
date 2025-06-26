import { Node, Edge, XYPosition, Position } from '@xyflow/react'; // Removed internalsSymbol, ELK import

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
  const processedStepIds = new Set<string>(); // To prevent duplicate processing of steps

  if (!blueprint || !blueprint.steps || blueprint.steps.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Initial X and Y positions and spacing constants
  const startX = 150;
  const startY = 100;
  const nodeWidth = 220;
  const nodeHeight = 80;
  const xSpacing = 180; // Horizontal space between nodes
  const ySpacing = 120; // Vertical space between nodes/branches

  // Recursive function to process steps and generate nodes/edges with manual layout
  // It returns the final X and Y position after processing the given steps,
  // useful for positioning subsequent sequential steps.
  const processSteps = (
    currentSteps: BlueprintStep[],
    startX: number,
    startY: number,
    parentId: string | null,
    edgeType: 'default' | 'true' | 'false' = 'default',
    incomingNodesForConvergence: Map<string, ProcessedNodePosition> = new Map() // Tracks nodes from parent branches for convergence
  ): { nextX: number, nextY: number, lastProcessedNodeId: string | null } => {
    let maxXInCurrentFlow = startX;
    let currentYCursor = startY;
    let lastProcessedNodeId: string | null = null;
    let nodesInCurrentFlow: Node[] = []; // Collect nodes to determine max Y for this flow

    currentSteps.forEach(step => {
      // If step already processed (e.g., convergence point), just ensure an edge exists and update position if needed
      if (processedStepIds.has(step.id)) {
        const existingNode = nodes.find(n => n.id === step.id);
        if (existingNode && parentId) {
          // If this is a convergence point, ensure its position is correct relative to incoming branches
          const incomingNodePos = incomingNodesForConvergence.get(step.id);
          if (incomingNodePos) {
              existingNode.position.x = Math.max(existingNode.position.x, incomingNodePos.x + xSpacing);
              existingNode.position.y = Math.max(existingNode.position.y, incomingNodePos.y + ySpacing / 2); // Average Y for convergence
          }
          
          let edgeId = `${parentId}-${step.id}`;
          if (edgeType === 'true' || edgeType === 'false') {
            edgeId = `${parentId}-${edgeType}-${step.id}-converge`;
          } else if (parentId && nodes.find(n => n.id === parentId)?.type === 'conditionNode') {
            // If parent is a condition and edgeType is default, it means it's coming from an implicit handle
            // This case should be rare if edges are handled explicitly.
            edgeId = `${parentId}-default-${step.id}-converge`;
          }

          if (!edges.some(e => e.id === edgeId)) { // Prevent duplicate edges
            edges.push({
              id: edgeId,
              source: parentId,
              target: step.id,
              sourceHandle: edgeType !== 'default' ? edgeType : Position.Right, // Use specific handle for conditions or default right
              animated: true,
              label: (edgeType === 'true' ? 'If True' : edgeType === 'false' ? 'If False' : undefined),
              labelBgPadding: [4, 8],
              labelBgBorderRadius: 4,
              labelBgStyle: { fill: 'white', color: '#333' },
              labelStyle: { fontSize: '10px', fill: '#555' },
              style: { stroke: (edgeType === 'true' ? '#10b981' : edgeType === 'false' ? '#ef4444' : '#9333ea'), strokeWidth: 2 }
            });
          }
        }
        lastProcessedNodeId = step.id;
        maxXInCurrentFlow = Math.max(maxXInCurrentFlow, existingNode?.position.x || 0);
        currentYCursor = Math.max(currentYCursor, existingNode?.position.y || 0);
        return; // Skip adding node again
      }

      processedStepIds.add(step.id); // Mark as processed

      const nodeType = getNodeType(step);
      const nodeX = maxXInCurrentFlow;
      const nodeY = currentYCursor;

      const newNode: Node = {
        id: step.id,
        type: nodeType,
        position: { x: nodeX, y: nodeY },
        data: {
          label: step.name || `Step ${step.id}`,
          icon: step.action?.integration || step.type,
          platform: step.action?.integration,
          action: step.action,
          condition: step.condition,
          loop: step.loop,
          delay: step.delay,
          agent: step.ai_agent_call,
          explanation: `This step ${step.type === 'action' ? 'performs an action' : step.type === 'condition' ? 'evaluates a condition' : step.type === 'loop' ? 'iterates over data' : step.type === 'ai_agent_call' ? 'invokes an AI agent' : 'introduces a delay'}.`
        },
        sourcePosition: nodeType === 'conditionNode' ? undefined : Position.Right,
        targetPosition: Position.Left,
      };
      nodes.push(newNode);
      nodesInCurrentFlow.push(newNode); // Add to current flow for Y tracking

      // Create edge from parent if exists
      if (parentId) {
        let edgeId = `${parentId}-${step.id}`;
        let label: string | undefined = undefined;
        let color = '#9333ea'; // Default edge color for sequential flow

        // Determine edge label and color for conditional branches
        if (edgeType === 'true') {
          edgeId = `${parentId}-true-${step.id}`;
          label = 'If True';
          color = '#10b981'; // Green for true branch
        } else if (edgeType === 'false') {
          edgeId = `${parentId}-false-${step.id}`;
          label = 'If False';
          color = '#ef4444'; // Red for false branch
        }

        edges.push({
          id: edgeId,
          source: parentId,
          target: step.id,
          sourceHandle: edgeType !== 'default' ? edgeType : Position.Right, // Use specific handle for conditions or default right
          animated: true,
          label: label,
          labelBgPadding: [4, 8],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: 'white', color: '#333' },
          labelStyle: { fontSize: '10px', fill: '#555' },
          style: { stroke: color, strokeWidth: 2 }
        });
      }
      
      let nextYForSequential = nodeY + ySpacing; // Default next Y for sequential step

      // Handle nested steps for conditions and loops
      if (step.type === 'condition' && step.condition) {
        const branchStartX = nodeX + xSpacing;
        let branchYOffset = 0;
        let branchMaxY = nodeY;
        const branchConvergenceNodes = new Map<string, ProcessedNodePosition>();

        if (step.condition.if_true && step.condition.if_true.length > 0) {
          const { nextX: trueNextX, nextY: trueNextY, lastProcessedNodeId: lastTrueNodeId } = processSteps(
            step.condition.if_true, branchStartX, nodeY, step.id, 'true', branchConvergenceNodes
          );
          branchMaxY = Math.max(branchMaxY, trueNextY);
          branchYOffset = branchMaxY - nodeY; // Adjust Y for next branch if needed
          if (lastTrueNodeId) branchConvergenceNodes.set(lastTrueNodeId, { id: lastTrueNodeId, x: trueNextX, y: trueNextY });
        }

        if (step.condition.if_false && step.condition.if_false.length > 0) {
          const { nextX: falseNextX, nextY: falseNextY, lastProcessedNodeId: lastFalseNodeId } = processSteps(
            step.condition.if_false, branchStartX, nodeY + Math.max(ySpacing, branchYOffset + ySpacing), step.id, 'false', branchConvergenceNodes
          );
          branchMaxY = Math.max(branchMaxY, falseNextY);
          if (lastFalseNodeId) branchConvergenceNodes.set(lastFalseNodeId, { id: lastFalseNodeId, x: falseNextX, y: falseNextY });
        }
        
        // After processing branches, position the next sequential step if branches converge
        // This is a simplification; for true convergence, subsequent steps would share target.
        // For now, we position the next step after the 'deepest' branch.
        const maxBranchY = branchMaxY;
        nextYForSequential = maxBranchY + ySpacing;
      } else if (step.type === 'loop' && step.loop) {
        // For loops, lay out children sequentially after the loop node
        const { nextX: loopNextX, nextY: loopNextY } = processSteps(
          step.loop.steps, nodeX + xSpacing, nodeY, step.id, 'default', incomingNodesForConvergence
        );
        nextYForSequential = loopNextY + ySpacing;
      }
      // Update max X and Y for the current flow after processing step and its children
      maxXInCurrentFlow = Math.max(maxXInCurrentFlow, nodeX);
      currentYCursor = nextYForSequential; // Move cursor for next sibling step

      lastProcessedNodeId = step.id; // Update last processed node
    });

    return { nextX: maxXInCurrentFlow + xSpacing, nextY: currentYCursor, lastProcessedNodeId: lastProcessedNodeId };
  };

  // Start processing top-level steps
  const { nextX, nextY } = processSteps(blueprint.steps, startX, startY, null);

  // Return all collected nodes and edges
  return { nodes, edges };
};