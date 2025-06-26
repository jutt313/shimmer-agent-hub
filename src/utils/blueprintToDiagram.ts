import { Node, Edge, XYPosition, Position, internalsSymbol } from '@xyflow/react';
import ELK from 'elkjs/lib/elk.js'; // Import ELK for graph layout

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
    // Added optional property for a unique ID for the condition itself if needed, though step.id usually suffices
    condition_id?: string; 
  };
  loop?: {
    array_source: string;
    steps: BlueprintStep[];
    // Added optional property for a unique ID for the loop itself
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

// Initialize ELK.js for layout calculation
const elk = new ELK();

// ELK layout algorithm options for a hierarchical, directed graph
// These options are crucial for how the diagram will be structured and spaced
const elkLayoutOptions = {
  'elk.algorithm': 'layered', // Use layered algorithm for hierarchical graphs
  'elk.direction': 'RIGHT', // Flow from left to right
  'elk.spacing.nodeNode': '70', // Spacing between nodes
  'elk.layered.spacing.nodeNodeBetweenLayers': '100', // Spacing between nodes in different layers
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF', // Better for minimizing bends
  'elk.padding': '[top=50,left=50,bottom=50,right=50]', // Padding around the entire graph
  'elk.layered.mergeEdges': 'true', // Merge multiple edges between same nodes
  'elk.edgeRouting': 'SPLINES', // Smooth edges
  'org.eclipse.elk.portAlignment.default': 'CENTER', // Align ports centrally
  'org.eclipse.elk.layered.mergeEdges': 'true',
  'org.eclipse.elk.layered.unnecessaryBends': 'true', // Reduce unnecessary bends
  'org.eclipse.elk.layered.layering.strategy': 'LONGEST_PATH', // Optimize layering
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

// Recursive function to build the ELK graph structure from the automation blueprint
// This function meticulously translates each blueprint step and its nested logic
// into nodes and edges that ELK.js can understand and layout.
const buildElkGraph = (steps: BlueprintStep[], parentElkNode: any, currentX: number, currentY: number, processedMap: Map<string, any>, globalNodes: Node[], globalEdges: Edge[], initialYOffset: number): { elkNodes: any[], elkEdges: any[], finalY: number } => {
  let elkNodes: any[] = [];
  let elkEdges: any[] = [];
  let maxYReached = currentY;
  let currentLayerX = currentX;

  steps.forEach((step, index) => {
    // Determine the node type for React Flow
    const reactFlowNodeType = getNodeType(step);
    // Approximate node dimensions for ELK.js (React Flow nodes are often fixed size)
    const nodeWidth = 220;
    const nodeHeight = 80;

    // Check if this step has already been processed to avoid duplicates
    // This is crucial for handling convergence in branching paths
    if (processedMap.has(step.id)) {
        // If node already exists, we just need to draw an edge to it
        const existingElkNode = processedMap.get(step.id);
        if (parentElkNode) {
            // Create an edge from the parent to the existing node
            elkEdges.push({
                id: `e${parentElkNode.id}-${step.id}-converge`,
                source: parentElkNode.id,
                target: existingElkNode.id,
                properties: { 'org.eclipse.elk.edgeRouting': 'SPLINES' }
            });
            // Also add to global React Flow edges if not already there
            if (!globalEdges.some(e => e.id === `e${parentElkNode.id}-${step.id}-converge`)) {
                globalEdges.push({
                    id: `e${parentElkNode.id}-${step.id}-converge`,
                    source: parentElkNode.id,
                    target: step.id,
                    animated: true,
                    style: { stroke: '#9333ea', strokeWidth: 2 }
                });
            }
        }
        return; // Skip further processing for this step as its node is already defined
    }

    // Add node to ELK graph
    const elkNode = {
      id: step.id,
      width: nodeWidth,
      height: nodeHeight,
      // ELK.js will compute x, y, this is just a placeholder
      x: 0, 
      y: 0,
    };
    elkNodes.push(elkNode);
    processedMap.set(step.id, elkNode);

    // Create a corresponding React Flow node
    const reactFlowNode: Node = {
        id: step.id,
        type: reactFlowNodeType,
        position: { x: elkNode.x, y: elkNode.y }, // Will be updated after layout
        data: {
            label: step.name || `Step ${step.id}`,
            icon: step.action?.integration || step.type,
            platform: step.action?.integration,
            action: step.action,
            condition: step.condition,
            loop: step.loop,
            delay: step.delay,
            agent: step.ai_agent_call,
            // Add an explanation for the node's purpose based on its type or context
            explanation: `This step ${step.type === 'action' ? 'performs an action' : step.type === 'condition' ? 'evaluates a condition' : step.type === 'loop' ? 'iterates over data' : step.type === 'ai_agent_call' ? 'invokes an AI agent' : 'introduces a delay'}.`
        },
        sourcePosition: reactFlowNodeType === 'conditionNode' ? undefined : Position.Right,
        targetPosition: Position.Left,
    };
    globalNodes.push(reactFlowNode);


    // If there's a parent, create an edge
    if (parentElkNode) {
      let edgeId = `e${parentElkNode.id}-${step.id}`;
      let edgeLabel: string | undefined = undefined;
      let edgeColor = '#9333ea'; // Default edge color for sequential flow

      // Handle specific source handles for conditions (true/false)
      let sourceHandle: string | undefined = undefined;
      if (parentElkNode.type === 'conditionNode') { // Assuming parentElkNode also holds its React Flow type
        if (index === 0 && parentElkNode.branchType === 'true') { // Using a custom property to track branch type
            sourceHandle = 'true';
            edgeId = `${parentElkNode.id}-true-${step.id}`;
            edgeLabel = 'If True';
            edgeColor = '#10b981'; // Green for true branch
        } else if (index === 0 && parentElkNode.branchType === 'false') { // Assuming branchType is passed
            sourceHandle = 'false';
            edgeId = `${parentElkNode.id}-false-${step.id}`;
            edgeLabel = 'If False';
            edgeColor = '#ef4444'; // Red for false branch
        }
      } else if (parentElkNode.type === 'aiAgentNode' && steps.length > 1) { // If an agent has multiple conceptual outputs
         // This is a complex scenario, for now, we'll just have it branch from its default handle
         // A more advanced blueprint could define explicit output handles for agents
         sourceHandle = 'right'; // Agents usually have a single right handle unless blueprint defines more
      }
      

      elkEdges.push({
        id: edgeId,
        source: parentElkNode.id,
        target: step.id,
        properties: { 'org.eclipse.elk.edgeRouting': 'SPLINES' }
      });

      // Add to global React Flow edges
      globalEdges.push({
        id: edgeId,
        source: parentEllNode.id, // Corrected typo
        target: step.id,
        sourceHandle: sourceHandle,
        animated: true,
        label: edgeLabel,
        labelBgPadding: [4, 8],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: 'white', color: '#333' },
        labelStyle: { fontSize: '10px', fill: '#555' },
        style: { stroke: edgeColor, strokeWidth: 2 }
      });
    }

    // Handle nested steps recursively
    if (step.type === 'condition' && step.condition) {
      let subElkNodes: any[] = [];
      let subElkEdges: any[] = [];
      let subMaxY = maxYReached;

      // Process 'if_true' branch
      if (step.condition.if_true && step.condition.if_true.length > 0) {
        const { elkNodes: trueNodes, elkEdges: trueEdges, finalY: trueFinalY } = buildElkGraph(
          step.condition.if_true,
          { ...elkNode, type: 'conditionNode', branchType: 'true' }, // Pass type and branch info
          currentLayerX + nodeWidth + 100, // Start next layer after condition
          maxYReached + (initialYOffset / 2), // Adjust Y for true branch
          processedMap, globalNodes, globalEdges, initialYOffset
        );
        subElkNodes.push(...trueNodes);
        subElkEdges.push(...trueEdges);
        subMaxY = Math.max(subMaxY, trueFinalY);
      }

      // Process 'if_false' branch
      if (step.condition.if_false && step.condition.if_false.length > 0) {
        const { elkNodes: falseNodes, elkEdges: falseEdges, finalY: falseFinalY } = buildElkGraph(
          step.condition.if_false,
          { ...elkNode, type: 'conditionNode', branchType: 'false' }, // Pass type and branch info
          currentLayerX + nodeWidth + 100, // Start next layer after condition
          subMaxY + initialYOffset, // Position false branch below true branch's max Y
          processedMap, globalNodes, globalEdges, initialYOffset
        );
        subElkNodes.push(...falseNodes);
        subElkEdges.push(...falseEdges);
        subMaxY = Math.max(subMaxY, falseFinalY);
      }
      
      // Add sub-nodes and edges to the current ELK node's children for layout
      elkNode.children = subElkNodes;
      elkNode.edges = subElkEdges;
      maxYReached = subMaxY;

    } else if (step.type === 'loop' && step.loop) {
        // For loops, the steps inside are children of the loop node in ELK
        let subElkNodes: any[] = [];
        let subElkEdges: any[] = [];
        const { elkNodes: loopNodes, elkEdges: loopEdges, finalY: loopFinalY } = buildElkGraph(
            step.loop.steps,
            { ...elkNode, type: 'loopNode' }, // Pass type info
            currentLayerX + nodeWidth + 100, // Start nested steps after loop node
            maxYReached + (initialYOffset / 2),
            processedMap, globalNodes, globalEdges, initialYOffset
        );
        subElkNodes.push(...loopNodes);
        subElkEdges.push(...loopEdges);
        maxYReached = Math.max(maxYReached, loopFinalY);

        elkNode.children = subElkNodes;
        elkNode.edges = subElkEdges;
    }
    
    currentLayerX += nodeWidth + 100; // Advance X for sequential steps
    maxYReached = Math.max(maxYReached, elkNode.y + nodeHeight); // Update max Y

    return { id: step.id, x: elkNode.x, y: elkNode.y }; // Return initial position (will be updated by ELK)
  });

  return { elkNodes, elkEdges, finalY: maxYReached };
};


// Main function to convert an automation blueprint into nodes and edges for React Flow
export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[], edges: Edge[] } => {
  const reactFlowNodes: Node[] = [];
  const reactFlowEdges: Edge[] = [];
  const processedMap = new Map<string, any>(); // Map to track processed nodes for ELK graph building

  if (!blueprint || !blueprint.steps || blueprint.steps.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Build the ELK graph structure from the blueprint
  const { elkNodes: topLevelElkNodes, elkEdges: topLevelElkEdges } = buildElkGraph(
    blueprint.steps,
    null, // No parent for top-level steps
    0, 0, // Initial X, Y for the entire graph
    processedMap, reactFlowNodes, reactFlowEdges, 80 // Initial Y offset for layout
  );

  // Define the root ELK graph object
  const elkGraph = {
    id: 'root',
    children: topLevelElkNodes,
    edges: topLevelElkEdges,
  };

  console.log('ELK Graph before layout:', JSON.stringify(elkGraph, null, 2));

  // Run the ELK layout algorithm
  return elk.layout(elkGraph)
    .then(layoutGraph => {
      console.log('ELK Layout Result:', JSON.stringify(layoutGraph, null, 2));

      // Create a map from ELK node ID to its React Flow node object for easy updates
      const reactFlowNodesMap = new Map<string, Node>();
      reactFlowNodes.forEach(node => reactFlowNodesMap.set(node.id, node));

      // Update positions for React Flow nodes based on ELK's layout result
      layoutGraph.children?.forEach(elkNode => {
        const reactFlowNode = reactFlowNodesMap.get(elkNode.id);
        if (reactFlowNode) {
          reactFlowNode.position = { x: elkNode.x || 0, y: elkNode.y || 0 };
          // If the node is a group/parent in ELK (e.g., condition/loop with children),
          // its size might be determined by ELK to contain children.
          // React Flow nodes typically manage their own size based on content.
          // This ensures the top-level nodes are updated.
        }
      });
      
      // Update edge paths for React Flow based on ELK's layout result
      layoutGraph.edges?.forEach(elkEdge => {
        const reactFlowEdge = reactFlowEdges.find(e => e.id === elkEdge.id);
        if (reactFlowEdge && elkEdge.sections && elkEdge.sections.length > 0) {
          // Map ELK points to React Flow points
          reactFlowEdge.data = { elk: elkEdge }; // Store ELK data for debugging/reference
          // ELK edge points might need to be translated to React Flow's `points`
          // property for custom edge rendering, if default smooth step edges aren't enough.
          // For now, React Flow's default edge rendering often uses source/target positions.
          // If custom edge drawing is needed later, this is where `points` would be set.
          // reactFlowEdge.points = elkEdge.sections[0].bendPoints || []; // Example for custom edges
        }
      });

      // For multiple outputs from a single step (e.g., AI agent, which is not a 'condition' type)
      // This part of layout is complex without explicit blueprint support for output handles.
      // Current ELK configuration and recursive processing handles general hierarchical layout.
      // If an AI Agent can have *named, distinct output paths* that diverge, the blueprint
      // itself would need to define this, perhaps similar to a 'condition' but with 'output_branches' array.
      // The current diagram will lay out sequential steps after an agent linearly.
      // If a step's output feeds into multiple *independent* next steps, the ELK layout will
      // attempt to draw diverging lines, but they might merge if they converge later.

      return { nodes: Array.from(reactFlowNodesMap.values()), edges: reactFlowEdges };
    })
    .catch(error => {
      console.error('ELK layout failed:', error);
      // Fallback: return nodes and edges without layout, or throw error
      return { nodes: reactFlowNodes, edges: reactFlowEdges };
    });
};