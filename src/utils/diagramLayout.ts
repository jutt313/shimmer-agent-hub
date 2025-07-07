import { Node, Edge } from '@xyflow/react';

export interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  startX: number;
  startY: number;
}

const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  nodeWidth: 320,
  nodeHeight: 140,
  horizontalGap: 500,
  verticalGap: 180,
  startX: 100,
  startY: 300
};

export const calculateEnhancedLayout = (
  nodes: Node[], 
  edges: Edge[], 
  options: Partial<LayoutOptions> = {}
): { nodes: Node[]; edges: Edge[] } => {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  
  console.log('🎯 Creating PERFECT left-to-right diagram with GREEN DOTTED lines');
  
  if (!nodes || nodes.length === 0) return { nodes: [], edges };

  // STEP 1: Build dependency graph for perfect layering
  const graph = new Map<string, string[]>();
  const inDegrees = new Map<string, number>();
  const nodeTypes = new Map<string, string>();

  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegrees.set(node.id, 0);
    const stepType = typeof node.data?.stepType === 'string' ? node.data.stepType : (node.type || 'action');
    nodeTypes.set(node.id, stepType);
  });

  edges.forEach(edge => {
    if (graph.has(edge.source) && graph.has(edge.target)) {
      graph.get(edge.source)?.push(edge.target);
      inDegrees.set(edge.target, (inDegrees.get(edge.target) || 0) + 1);
    }
  });

  // STEP 2: Perfect topological sorting for left-to-right layers
  const layers = new Map<string, number>();
  const queue: { nodeId: string; layer: number }[] = [];
  
  // Find trigger nodes (layer 0)
  nodes.forEach(node => {
    const stepType = nodeTypes.get(node.id);
    if (inDegrees.get(node.id) === 0 || stepType === 'trigger') {
      layers.set(node.id, 0);
      queue.push({ nodeId: node.id, layer: 0 });
    }
  });

  // Process each layer sequentially for perfect left-to-right flow
  let maxLayer = 0;
  while (queue.length > 0) {
    const { nodeId, layer } = queue.shift()!;
    
    graph.get(nodeId)?.forEach(childId => {
      const newInDegree = (inDegrees.get(childId) || 0) - 1;
      inDegrees.set(childId, newInDegree);
      
      if (newInDegree === 0) {
        const childLayer = layer + 1;
        layers.set(childId, childLayer);
        queue.push({ nodeId: childId, layer: childLayer });
        maxLayer = Math.max(maxLayer, childLayer);
      }
    });
  }

  // Handle orphaned nodes
  nodes.forEach(node => {
    if (!layers.has(node.id)) {
      const stepType = nodeTypes.get(node.id);
      if (stepType === 'end' || stepType === 'stop') {
        layers.set(node.id, maxLayer + 1);
      } else {
        layers.set(node.id, 1);
      }
    }
  });

  // STEP 3: Group nodes by layer for perfect vertical distribution
  const layerGroups = new Map<number, string[]>();
  layers.forEach((layer, nodeId) => {
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)?.push(nodeId);
  });

  // STEP 4: Calculate PERFECT positions with straight line alignment
  const layoutedNodes = nodes.map(node => {
    const layer = layers.get(node.id) || 0;
    const layerNodes = layerGroups.get(layer) || [];
    const nodeIndex = layerNodes.indexOf(node.id);
    
    // PERFECT horizontal positioning (clean left-to-right layers)
    const x = opts.startX + (layer * opts.horizontalGap);
    
    // PERFECT vertical positioning (centered and evenly spaced)
    const totalLayerHeight = Math.max(1, layerNodes.length) * opts.nodeHeight + 
                             Math.max(0, layerNodes.length - 1) * opts.verticalGap;
    const layerStartY = opts.startY - (totalLayerHeight / 2);
    const y = layerStartY + nodeIndex * (opts.nodeHeight + opts.verticalGap);
    
    return { 
      ...node, 
      position: { x, y },
      draggable: true,
      selectable: true,
      connectable: false,
      style: {
        ...node.style,
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '2px solid rgba(139, 92, 246, 0.2)',
      }
    };
  });

  // STEP 5: Create PERFECT GREEN DOTTED line edges
  const layoutedEdges = edges.map((edge, index) => {
    // Use GREEN color scheme for all connections
    const greenColor = '#10b981'; // emerald-500 green
    
    // Generate meaningful labels based on source node type and handle
    let label = '';
    const sourceNode = nodes.find(n => n.id === edge.source);
    const sourceStepType = sourceNode?.data?.stepType;
    
    if (edge.sourceHandle) {
      if (edge.sourceHandle === 'true') {
        label = '✓ YES';
      } else if (edge.sourceHandle === 'false') {
        label = '✗ NO';
      } else if (edge.sourceHandle === 'success') {
        label = '✓ SUCCESS';
      } else if (edge.sourceHandle === 'failure') {
        label = '⚠ FAILURE';
      } else if (edge.sourceHandle.startsWith('case-')) {
        const caseNumber = parseInt(edge.sourceHandle.replace('case-', ''));
        label = edge.label?.toString() || `Option ${caseNumber + 1}`;
      } else {
        label = edge.label?.toString() || edge.sourceHandle;
      }
    } else if (sourceStepType === 'condition') {
      label = edge.label?.toString() || '📍 Decision';
    } else if (sourceStepType === 'trigger') {
      label = '🚀 Start';
    } else {
      label = edge.label?.toString() || '';
    }

    return {
      ...edge,
      type: 'straight', // STRAIGHT LINES - not curved!
      animated: false,
      style: {
        stroke: greenColor, // GREEN COLOR for all connections
        strokeWidth: 3,
        strokeDasharray: '8 5', // DOTTED LINE PATTERN
        ...edge.style
      },
      label,
      labelStyle: {
        fontWeight: 'bold',
        fontSize: '12px',
        color: greenColor,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '4px 8px',
        borderRadius: '12px',
        border: `1px solid ${greenColor}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      labelBgStyle: {
        fill: 'transparent',
      }
    };
  });

  console.log('✅ PERFECT left-to-right layout with GREEN DOTTED lines completed:', {
    nodes: layoutedNodes.length,
    edges: layoutedEdges.length,
    layers: maxLayer + 1,
    greenDottedLines: true
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

export const validateNodesAndEdges = (nodes: Node[], edges: Edge[]): { validNodes: Node[]; validEdges: Edge[] } => {
  const nodeIds = new Set(nodes.map(n => n.id));
  
  const validEdges = edges.filter(edge => {
    const isValid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
    if (!isValid) {
      console.warn(`⚠️ Invalid edge: ${edge.source} -> ${edge.target}`);
    }
    return isValid;
  });
  
  return { validNodes: nodes, validEdges };
};
