
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
  verticalGap: 200,
  startX: 100,
  startY: 300
};

export const calculateEnhancedLayout = (
  nodes: Node[], 
  edges: Edge[], 
  options: Partial<LayoutOptions> = {}
): { nodes: Node[]; edges: Edge[] } => {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  
  console.log('🎨 Creating CRYSTAL CLEAR left-to-right layout for', nodes.length, 'nodes');
  
  if (!nodes || nodes.length === 0) return { nodes: [], edges };

  // Build adjacency graph for perfect left-to-right flow
  const graph = new Map<string, string[]>();
  const inDegrees = new Map<string, number>();
  const nodeTypes = new Map<string, string>();

  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegrees.set(node.id, 0);
    // Fix the TypeScript error by safely casting the stepType
    const stepType = node.data?.stepType;
    nodeTypes.set(node.id, typeof stepType === 'string' ? stepType : (node.type || 'action'));
  });

  edges.forEach(edge => {
    if (graph.has(edge.source) && graph.has(edge.target)) {
      graph.get(edge.source)?.push(edge.target);
      inDegrees.set(edge.target, (inDegrees.get(edge.target) || 0) + 1);
    }
  });

  // Topological sort for perfect left-to-right positioning
  const layers = new Map<string, number>();
  const queue: string[] = [];
  
  // Find root nodes (triggers or nodes with no incoming edges)
  nodes.forEach(node => {
    const stepType = node.data?.stepType;
    const safeStepType = typeof stepType === 'string' ? stepType : node.type;
    if (inDegrees.get(node.id) === 0 || safeStepType === 'trigger') {
      queue.push(node.id);
      layers.set(node.id, 0);
    }
  });

  // Process nodes layer by layer for crystal clear flow
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

  // Handle orphaned nodes - put them in appropriate layers
  nodes.forEach(node => {
    if (!layers.has(node.id)) {
      const stepType = node.data?.stepType;
      const safeStepType = typeof stepType === 'string' ? stepType : node.type;
      if (safeStepType === 'trigger') {
        layers.set(node.id, 0);
      } else if (safeStepType === 'end' || safeStepType === 'stop') {
        // Put end nodes in the last layer
        const maxLayer = Math.max(...Array.from(layers.values()));
        layers.set(node.id, maxLayer + 1);
      } else {
        layers.set(node.id, 1);
      }
    }
  });

  // Group nodes by layer for perfect vertical distribution
  const layerGroups = new Map<number, string[]>();
  layers.forEach((layer, nodeId) => {
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)?.push(nodeId);
  });

  // Calculate positions with CRYSTAL CLEAR spacing
  const layoutedNodes = nodes.map(node => {
    const layer = layers.get(node.id) || 0;
    const layerNodes = layerGroups.get(layer) || [];
    const nodeIndex = layerNodes.indexOf(node.id);
    
    // Perfect horizontal position (clean left to right)
    const x = opts.startX + (layer * opts.horizontalGap);
    
    // Perfect vertical position with centered distribution
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

  // Enhanced edge styling with PERFECT connections
  const layoutedEdges = edges.map((edge, index) => {
    const colors = [
      '#8b5cf6', // Purple
      '#3b82f6', // Blue  
      '#10b981', // Green
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#06b6d4', // Cyan
      '#8b5a2b', // Brown
      '#dc2626', // Red
    ];
    
    const colorIndex = index % colors.length;
    const baseColor = colors[colorIndex];
    
    const edgeStyle = {
      stroke: baseColor,
      strokeWidth: 4,
      strokeDasharray: undefined,
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
      ...edge.style
    };

    // Clear condition branch labels
    let label = edge.label;
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
        const caseNumber = edge.sourceHandle.replace('case-', '');
        label = edge.label || `Condition ${parseInt(caseNumber) + 1}`;
      } else {
        label = edge.label || 'Next';
      }
    } else {
      label = edge.label || 'Next';
    }

    return {
      ...edge,
      type: 'smoothstep',
      animated: false,
      style: edgeStyle,
      label,
      labelStyle: {
        fontWeight: 'bold',
        fontSize: '14px',
        color: baseColor,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '6px 12px',
        borderRadius: '16px',
        border: `2px solid ${baseColor}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      labelBgStyle: {
        fill: 'transparent',
      },
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
    };
  });

  console.log('✅ CRYSTAL CLEAR left-to-right layout completed:', {
    finalNodes: layoutedNodes.length,
    finalEdges: layoutedEdges.length,
    layers: Math.max(...Array.from(layers.values())) + 1,
    maxLayer: Math.max(...Array.from(layers.values())),
    layerGroups: layerGroups.size
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
  
  if (validEdges.length < edges.length) {
    console.warn(`⚠️ Filtered out ${edges.length - validEdges.length} invalid edges`);
  }
  
  return { validNodes: nodes, validEdges };
};
