import { Node, Edge, XYPosition } from '@xyflow/react';

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
    case 'ai_agent_call': // Changed from 'agent' to 'ai_agent_call' as per automation.ts
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

  // Initial X and Y positions
  let currentX = 150;
  let currentY = 100;
  const nodeWidth = 220; // Approximate width of a node for layout calculations
  const nodeHeight = 80; // Approximate height of a node
  const xOffset = nodeWidth + 80; // Horizontal spacing between nodes
  const yOffset = nodeHeight + 50; // Vertical spacing for branches

  // Recursively processes steps and generates nodes/edges
  const processStep = (step: BlueprintStep, x: number, y: number, parentId: string | null, edgeType: 'default' | 'true' | 'false' = 'default'): XYPosition => {
    // If step already processed (e.g., part of multiple paths converging), skip re-adding node but still draw edge
    if (processedStepIds.has(step.id)) {
      // Find existing node to connect to
      const existingNode = nodes.find(n => n.id === step.id);
      if (existingNode && parentId) {
        let edgeId = `${parentId}-${step.id}`;
        let edgeLabel: string | undefined = undefined;
        let edgeColor = '#9333ea'; // Default edge color

        if (edgeType === 'true') {
          edgeId = `${parentId}-true-${step.id}`;
          edgeLabel = 'If True';
          edgeColor = '#10b981'; // Green for true branch
        } else if (edgeType === 'false') {
          edgeId = `${parentId}-false-${step.id}`;
          edgeLabel = 'If False';
          edgeColor = '#ef4444'; // Red for false branch
        }

        // Add edge only if it doesn't already exist
        if (!edges.some(e => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: parentId,
            target: step.id,
            sourceHandle: edgeType !== 'default' ? edgeType : undefined, // Attach to specific handle for conditions
            animated: true,
            label: edgeLabel,
            labelBgPadding: [4, 8],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: 'white', color: '#333' },
            labelStyle: { fontSize: '10px', fill: '#555' },
            style: { stroke: edgeColor, strokeWidth: 2 }
          });
        }
      }
      return { x: existingNode?.position.x || x, y: existingNode?.position.y || y };
    }

    processedStepIds.add(step.id); // Mark as processed

    const nodeType = getNodeType(step);
    const newNode: Node = {
      id: step.id,
      type: nodeType,
      position: { x, y },
      data: {
        label: step.name || `Step ${step.id}`,
        icon: step.action?.integration || step.type,
        platform: step.action?.integration,
        action: step.action,
        condition: step.condition,
        loop: step.loop,
        delay: step.delay,
        agent: step.ai_agent_call // Use ai_agent_call for agent data
      },
      // Ensure specific handles are available for condition nodes
      sourcePosition: nodeType === 'conditionNode' ? undefined : 'right',
      targetPosition: 'left',
    };
    nodes.push(newNode);

    // Create edge from parent if exists
    if (parentId) {
      let edgeId = `${parentId}-${step.id}`;
      let edgeLabel: string | undefined = undefined;
      let edgeColor = '#9333ea'; // Default edge color

      if (edgeType === 'true') {
        edgeId = `${parentId}-true-${step.id}`;
        edgeLabel = 'If True';
        edgeColor = '#10b981'; // Green for true branch
      } else if (edgeType === 'false') {
        edgeId = `${parentId}-false-${step.id}`;
        edgeLabel = 'If False';
        edgeColor = '#ef4444'; // Red for false branch
      }

      edges.push({
        id: edgeId,
        source: parentId,
        target: step.id,
        sourceHandle: edgeType !== 'default' ? edgeType : undefined, // Attach to specific handle for conditions
        animated: true,
        label: edgeLabel,
        labelBgPadding: [4, 8],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: 'white', color: '#333' },
        labelStyle: { fontSize: '10px', fill: '#555' },
        style: { stroke: edgeColor, strokeWidth: 2 }
      });
    }

    let maxYInBranch = y; // Track maximum Y coordinate reached in this branch for layout

    // Handle nested steps for conditions and loops
    if (step.type === 'condition' && step.condition) {
      const conditionSteps = [];
      if (step.condition.if_true && step.condition.if_true.length > 0) {
        conditionSteps.push({ steps: step.condition.if_true, type: 'true' });
      }
      if (step.condition.if_false && step.condition.if_false.length > 0) {
        conditionSteps.push({ steps: step.condition.if_false, type: 'false' });
      }

      if (conditionSteps.length > 0) {
        const branchStartY = y - (yOffset * (conditionSteps.length - 1)) / 2; // Center branches vertically
        let currentBranchY = branchStartY;

        conditionSteps.forEach((branch, i) => {
          let branchNodeX = x + xOffset;
          let branchNodeY = currentBranchY;
          let lastBranchNodePos: XYPosition = { x: branchNodeX, y: branchNodeY };

          branch.steps.forEach((subStep, subIndex) => {
            lastBranchNodePos = processStep(subStep, branchNodeX, branchNodeY, subIndex === 0 ? step.id : lastBranchNodePos.id, branch.type);
            branchNodeX += xOffset;
            branchNodeY = lastBranchNodePos.y; // Keep Y consistent within a sub-path
          });
          currentBranchY += yOffset;
          maxYInBranch = Math.max(maxYInBranch, lastBranchNodePos.y); // Update overall max Y
        });
      }

    } else if (step.type === 'loop' && step.loop) {
      // For loops, lay out children sequentially after the loop node
      let loopNodeX = x + xOffset;
      let loopNodeY = y;
      let lastLoopNodePos: XYPosition = { x: loopNodeX, y: loopNodeY };

      if (step.loop.steps && step.loop.steps.length > 0) {
        step.loop.steps.forEach((subStep, subIndex) => {
          lastLoopNodePos = processStep(subStep, loopNodeX, loopNodeY, subIndex === 0 ? step.id : lastLoopNodePos.id);
          loopNodeX += xOffset;
          loopNodeY = lastLoopNodePos.y;
        });
        maxYInBranch = Math.max(maxYInBranch, lastLoopNodePos.y);
      }
    }
    
    // For AI Agent calls that might imply multiple subsequent actions,
    // we assume these are defined as separate steps in the main blueprint after the agent.
    // The main processing loop (below) handles sequential steps.
    // If you need explicit branching from an agent within the diagram, the blueprint
    // needs to reflect that branching explicitly (e.g., like a condition with 'if_true'/'if_false' for agent outcomes).

    return { id: step.id, x: x, y: y }; // Return position of the current node
  };

  // Process top-level steps
  let lastX = currentX;
  let lastY = currentY;

  blueprint.steps.forEach(step => {
    // If this step is part of a conditional/loop branch already handled by recursion, skip it here.
    // This simple check might not be perfect for complex graph structures,
    // but prevents duplicates for basic sequential processing.
    if (!processedStepIds.has(step.id)) {
        const nodePosition = processStep(step, lastX, lastY, null);
        lastX += xOffset; // Move next node horizontally
        // For sequential steps, if a branch caused a large Y displacement, align subsequent steps below it.
        lastY = Math.max(lastY, nodePosition.y); 
    }
  });

  // A very basic attempt at auto-layout for readability.
  // For truly complex diagrams, a proper graph layout algorithm (e.g., using elkjs) would be needed.
  // This iteration will try to align nodes more logically.
  const layoutNodes: Node[] = [];
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.id, node));

  // Simple topological sort / layered layout:
  // Iterate through levels (based on X position)
  const xLevels = new Map<number, Node[]>();
  nodes.forEach(node => {
      const xCoord = node.position.x;
      if (!xLevels.has(xCoord)) {
          xLevels.set(xCoord, []);
      }
      xLevels.get(xCoord)?.push(node);
  });

  const sortedXCoords = Array.from(xLevels.keys()).sort((a, b) => a - b);
  let currentLayerY = 100;
  let maxPrevLayerHeight = 0; // Track the height of the tallest node in the previous layer

  sortedXCoords.forEach(xCoord => {
      const layerNodes = xLevels.get(xCoord) || [];
      
      // Calculate max height for current layer
      let currentLayerMaxNodeHeight = 0;
      layerNodes.forEach(node => {
        // Approximate height
        currentLayerMaxNodeHeight = Math.max(currentLayerMaxNodeHeight, nodeHeight); 
      });

      // Simple Y positioning within a layer: spread out vertically
      const totalVerticalSpaceNeeded = layerNodes.length * yOffset;
      let startYForLayer = currentLayerY;

      // Adjust Y position if branches from previous layers extend downwards
      if (layerNodes.some(node => node.type === 'conditionNode' || node.type === 'loopNode')) {
          startYForLayer += 0; // No adjustment, branches will extend
      }
      
      // Sort nodes in this layer by their original Y position to maintain relative order
      layerNodes.sort((a, b) => a.position.y - b.position.y);

      layerNodes.forEach((node, i) => {
          // If node is part of a branching flow, its Y might be dictated by the branch
          // Otherwise, lay it out in the current vertical flow
          if (!node.data.ySetByBranch) { // A custom flag could be used if Y is strictly set by branching logic
            node.position = { x: node.position.x, y: startYForLayer + (i * yOffset) };
          }
          layoutNodes.push(node);
      });

      // Update Y for next layer, considering the maximum height needed for this layer
      currentLayerY = startYForLayer + totalVerticalSpaceNeeded + yOffset;
  });

  // Final pass for edges to ensure source/target handles are correctly set for conditional nodes
  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source);
    if (sourceNode && sourceNode.type === 'conditionNode') {
      // Ensure sourceHandle is 'true' or 'false'
      if (!edge.sourceHandle) {
         // This is a fallback, ideally set during processStep
         edge.sourceHandle = edges.find(e => e.source === edge.source && e.target === edge.target && e.sourceHandle === 'true')?.sourceHandle || 'false';
      }
    }
  });


  return { nodes: layoutNodes, edges };
};