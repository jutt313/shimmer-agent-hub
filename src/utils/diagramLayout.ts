
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
  horizontalGap: 280,
  verticalGap: 180,
  startX: 50,
  startY: 100
};

export const calculateEnhancedLayout = (
  nodes: Node[], 
  edges: Edge[], 
  options: Partial<LayoutOptions> = {}
): { nodes: Node[]; edges: Edge[] } => {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  
  console.log('🎨 Calculating enhanced layout for', nodes.length, 'nodes');
  
  if (!nodes || nodes.length === 0) return { nodes: [], edges };

  // Build adjacency graph for topological sorting
  const graph = new Map<string, string[]>();
  const inDegrees = new Map<string, number>();

  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegrees.set(node.id, 0);
  });

  edges.forEach(edge => {
    if (graph.has(edge.source) && graph.has(edge.target)) {
      graph.get(edge.source)?.push(edge.target);
      inDegrees.set(edge.target, (inDegrees.get(edge.target) || 0) + 1);
    }
  });

  // Topological sort to determine layers
  const queue: string[] = [];
  const layers = new Map<string, number>();
  
  // Find root nodes (nodes with no incoming edges)
  nodes.forEach(node => {
    if (inDegrees.get(node.id) === 0) {
      queue.push(node.id);
      layers.set(node.id, 0);
    }
  });

  let head = 0;
  while (head < queue.length) {
    const nodeId = queue[head++];
    const currentLayer = layers.get(nodeId) || 0;
    
    graph.get(nodeId)?.forEach(childId => {
      const newInDegree = (inDegrees.get(childId) || 0) - 1;
      inDegrees.set(childId, newInDegree);
      
      if (newInDegree === 0) {
        queue.push(childId);
        layers.set(childId, Math.max(layers.get(childId) || 0, currentLayer + 1));
      }
    });
  }

  // Handle orphaned nodes
  nodes.forEach(node => {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  });

  // Group nodes by layer
  const layerGroups = new Map<number, string[]>();
  layers.forEach((layer, nodeId) => {
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)?.push(nodeId);
  });

  // Position calculation with enhanced spacing
  const layoutedNodes = nodes.map(node => {
    const layer = layers.get(node.id) || 0;
    const layerNodes = layerGroups.get(layer) || [];
    const nodeIndex = layerNodes.indexOf(node.id);
    
    // Calculate horizontal position
    const x = opts.startX + (layer * (opts.nodeWidth + opts.horizontalGap));
    
    // Calculate vertical position with centering
    const layerHeight = layerNodes.length * opts.nodeHeight + (layerNodes.length - 1) * opts.verticalGap;
    const layerStartY = opts.startY + (layerHeight > 0 ? -layerHeight / 2 : 0);
    const y = layerStartY + nodeIndex * (opts.nodeHeight + opts.verticalGap) + 300;
    
    return { 
      ...node, 
      position: { x, y },
      draggable: true,
      selectable: true,
      connectable: false
    };
  });

  // Enhanced edge styling with smart colors
  const layoutedEdges = edges.map(edge => {
    const edgeStyle = {
      stroke: getEdgeColor(edge.sourceHandle),
      strokeWidth: 2,
      ...edge.style
    };

    return {
      ...edge,
      type: 'smoothstep',
      animated: true,
      style: edgeStyle,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
    };
  });

  console.log('✅ Enhanced layout completed:', {
    finalNodes: layoutedNodes.length,
    finalEdges: layoutedEdges.length,
    layers: Math.max(...Array.from(layers.values())) + 1,
    layerGroups: layerGroups.size
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

const getEdgeColor = (sourceHandle?: string): string => {
  switch (sourceHandle) {
    case 'true':
    case 'yes':
    case 'success':
    case 'existing':
      return '#10b981'; // Green
    case 'false':
    case 'no':
    case 'error':
      return '#ef4444'; // Red
    case 'urgent':
      return '#ef4444'; // Red
    case 'task':
    case 'new':
      return '#10b981'; // Green
    case 'followup':
      return '#f59e0b'; // Amber
    default:
      return '#3b82f6'; // Blue
  }
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
  
  if (validEdges.length < edges.length) {
    console.warn(`⚠️ Filtered out ${edges.length - validEdges.length} invalid edges`);
  }
  
  return { validNodes: nodes, validEdges };
};
