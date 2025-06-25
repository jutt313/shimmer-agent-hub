import { AutomationBlueprint } from "@/types/automation";
import { Node, Edge, Position, MarkerType } from "@xyflow/react";

// Dynamic platform icon mapping - fully based on automation blueprint data
const getPlatformIcon = (platformName: string, actionType?: string): string => {
  if (!platformName) return '⚡';
  
  const name = platformName.toLowerCase();
  
  // Email platforms
  if (name.includes('gmail') || name.includes('google mail')) return '📧';
  if (name.includes('outlook') || name.includes('microsoft mail')) return '📨';
  if (name.includes('sendgrid')) return '📮';
  if (name.includes('mailchimp')) return '📬';
  if (name.includes('mail') || actionType?.includes('email')) return '✉️';
  
  // Communication platforms
  if (name.includes('slack')) return '💬';
  if (name.includes('discord')) return '🎮';
  if (name.includes('teams') || name.includes('microsoft teams')) return '👥';
  if (name.includes('zoom')) return '📹';
  if (name.includes('telegram')) return '📱';
  if (name.includes('whatsapp')) return '📲';
  
  // Social platforms
  if (name.includes('twitter') || name.includes('x.com')) return '🐦';
  if (name.includes('facebook')) return '📘';
  if (name.includes('linkedin')) return '💼';
  if (name.includes('instagram')) return '📷';
  if (name.includes('youtube')) return '📺';
  if (name.includes('tiktok')) return '🎵';
  
  // Productivity platforms
  if (name.includes('notion')) return '📝';
  if (name.includes('airtable')) return '📊';
  if (name.includes('trello')) return '📋';
  if (name.includes('asana')) return '📌';
  if (name.includes('monday')) return '📅';
  if (name.includes('clickup')) return '✅';
  
  // Development platforms
  if (name.includes('github')) return '🐙';
  if (name.includes('gitlab')) return '🦊';
  if (name.includes('bitbucket')) return '🪣';
  if (name.includes('jira')) return '🎯';
  
  // Google services
  if (name.includes('google drive')) return '💾';
  if (name.includes('google sheets')) return '📈';
  if (name.includes('google docs')) return '📄';
  if (name.includes('google calendar')) return '📅';
  if (name.includes('google')) return '🌐';
  
  // AI platforms
  if (name.includes('openai') || name.includes('gpt') || name.includes('chatgpt')) return '🤖';
  if (name.includes('anthropic') || name.includes('claude')) return '🧠';
  if (name.includes('gemini') || name.includes('bard')) return '✨';
  if (name.includes('hugging') || name.includes('transformers')) return '🤗';
  
  // CRM/Sales platforms
  if (name.includes('hubspot')) return '🎯';
  if (name.includes('salesforce')) return '☁️';
  if (name.includes('pipedrive')) return '🚀';
  if (name.includes('zoho')) return '📊';
  
  // E-commerce platforms
  if (name.includes('shopify')) return '🛒';
  if (name.includes('woocommerce')) return '🏪';
  if (name.includes('stripe')) return '💳';
  if (name.includes('paypal')) return '💰';
  
  // File storage
  if (name.includes('dropbox')) return '📦';
  if (name.includes('onedrive')) return '☁️';
  if (name.includes('box')) return '📁';
  
  // Generic action-based icons
  if (actionType) {
    const action = actionType.toLowerCase();
    if (action.includes('send') || action.includes('post')) return '📤';
    if (action.includes('get') || action.includes('fetch') || action.includes('read')) return '📥';
    if (action.includes('create') || action.includes('add')) return '➕';
    if (action.includes('update') || action.includes('edit')) return '✏️';
    if (action.includes('delete') || action.includes('remove')) return '🗑️';
    if (action.includes('search') || action.includes('find')) return '🔍';
    if (action.includes('upload')) return '📤';
    if (action.includes('download')) return '📥';
  }
  
  // Generic fallbacks
  if (name.includes('webhook') || name.includes('api')) return '🔗';
  if (name.includes('database') || name.includes('sql')) return '💾';
  if (name.includes('calendar')) return '📅';
  if (name.includes('file')) return '📄';
  if (name.includes('image')) return '🖼️';
  if (name.includes('video')) return '🎥';
  if (name.includes('audio')) return '🎵';
  
  // Default platform icon
  return '⚙️';
};

// Dynamic step type icon mapping
const getStepIcon = (stepType: string, step?: any): string => {
  switch (stepType) {
    case 'action':
      if (step?.action?.integration && step?.action?.method) {
        return getPlatformIcon(step.action.integration, step.action.method);
      } else if (step?.action?.integration) {
        return getPlatformIcon(step.action.integration);
      }
      return '⚡';
    case 'condition':
      return '🔀';
    case 'loop':
      return '🔄';
    case 'delay':
      return '⏰';
    case 'ai_agent_call':
      return '🤖';
    default:
      return '▶️';
  }
};

// Helper to generate unique IDs
let idCounter = 0;
const getId = () => `node_${++idCounter}`;
const getEdgeId = (source: string, target: string, label?: string) => `edge_${source}-${target}-${label || ''}-${++idCounter}`;

// Enhanced node data creation with full dynamic content
const createNodeData = (step: any, index: number) => {
  const icon = getStepIcon(step.type, step);
  let label = step.name || `Step ${index + 1}`;
  let platform = null;
  
  // Dynamic label and platform extraction from blueprint
  switch (step.type) {
    case 'action':
      if (step.action?.integration) {
        platform = step.action.integration;
        const method = step.action.method || 'Action';
        const description = step.action.description || '';
        label = description ? `${method}: ${description}` : `${platform}: ${method}`;
      }
      break;
      
    case 'condition':
      if (step.condition?.expression) {
        const expr = step.condition.expression;
        label = `IF: ${expr.length > 25 ? `${expr.substring(0, 25)}...` : expr}`;
      } else if (step.condition?.field && step.condition?.operator && step.condition?.value) {
        label = `IF: ${step.condition.field} ${step.condition.operator} ${step.condition.value}`;
      }
      break;
      
    case 'loop':
      if (step.loop?.array_source) {
        label = `Loop: ${step.loop.array_source}`;
      } else if (step.loop?.condition) {
        label = `Loop: ${step.loop.condition}`;
      } else if (step.loop?.count) {
        label = `Loop: ${step.loop.count} times`;
      }
      break;
      
    case 'delay':
      if (step.delay?.duration_seconds) {
        const duration = step.delay.duration_seconds;
        if (duration >= 3600) {
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          label = `Wait: ${hours}h ${minutes}m`;
        } else if (duration >= 60) {
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          label = `Wait: ${minutes}m ${seconds}s`;
        } else {
          label = `Wait: ${duration}s`;
        }
      } else if (step.delay?.duration) {
        label = `Wait: ${step.delay.duration}`;
      }
      break;
      
    case 'ai_agent_call':
      if (step.ai_agent_call?.agent_name) {
        label = `AI: ${step.ai_agent_call.agent_name}`;
      } else if (step.ai_agent_call?.agent_id) {
        label = `AI Agent: ${step.ai_agent_call.agent_id}`;
      } else if (step.ai_agent_call?.prompt) {
        const prompt = step.ai_agent_call.prompt;
        label = `AI: ${prompt.length > 20 ? `${prompt.substring(0, 20)}...` : prompt}`;
      }
      break;
  }
  
  return {
    label,
    icon,
    platform,
    step,
    stepType: step.type
  };
};

// Enhanced layout algorithm with better spacing and branching
export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Reset counter
  idCounter = 0;
  
  // Layout configuration
  const config = {
    nodeWidth: 220,
    nodeHeight: 80,
    horizontalSpacing: 280,
    verticalSpacing: 120,
    branchSpacing: 150,
    startX: 100,
    startY: 100
  };
  
  let currentX = config.startX;
  let currentY = config.startY;

  // Create the Trigger node with dynamic content - fix trigger type handling
  const triggerNodeId = getId();
  const triggerIcon = '▶️'; // Use default trigger icon since trigger doesn't have platform property
  const triggerLabel = `${triggerIcon} ${blueprint.trigger?.type || 'Trigger'}`;
  
  nodes.push({
    id: triggerNodeId,
    type: 'input',
    data: { 
      label: triggerLabel,
      icon: triggerIcon,
      stepType: 'trigger'
    },
    position: { x: currentX, y: currentY },
    sourcePosition: Position.Right,
    style: {
      background: 'linear-gradient(135deg, #a855f7, #9333ea)',
      color: 'white',
      border: '2px solid #9333ea',
      borderRadius: '12px',
      fontWeight: 'bold',
      minWidth: config.nodeWidth,
      minHeight: config.nodeHeight,
      padding: '12px 16px'
    },
  });

  let previousNodeId = triggerNodeId;
  currentX += config.horizontalSpacing;

  // Process main steps with enhanced recursive handling
  if (blueprint.steps && Array.isArray(blueprint.steps)) {
    blueprint.steps.forEach((step, index) => {
      const result = processStep(step, index, currentX, currentY, previousNodeId, config);
      nodes.push(...result.nodes);
      edges.push(...result.edges);
      
      if (result.lastNode) {
        previousNodeId = result.lastNode.id;
        currentX = result.lastNode.position.x + config.horizontalSpacing;
      }
    });
  }

  // Create End node
  const endNodeId = getId();
  nodes.push({
    id: endNodeId,
    type: 'output',
    data: { 
      label: '🏁 Complete',
      icon: '🏁',
      stepType: 'end'
    },
    position: { x: currentX, y: currentY },
    targetPosition: Position.Left,
    style: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      border: '2px solid #b91c1c',
      borderRadius: '12px',
      fontWeight: 'bold',
      minWidth: config.nodeWidth,
      minHeight: config.nodeHeight,
      padding: '12px 16px'
    },
  });

  // Connect last node to end node
  if (previousNodeId) {
    edges.push(createEdge(previousNodeId, endNodeId));
  }

  return { nodes, edges };
};

// Enhanced step processing with recursive branching
const processStep = (step: any, index: number, x: number, y: number, previousNodeId: string, config: any) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const nodeId = getId();
  const nodeData = createNodeData(step, index); // Fixed: pass step instead of &
  
  // Determine node type based on step type
  let nodeType = 'default';
  switch (step.type) {
    case 'action':
      nodeType = 'actionNode';
      break;
    case 'condition':
      nodeType = 'conditionNode';
      break;
    case 'loop':
      nodeType = 'loopNode';
      break;
    case 'delay':
      nodeType = 'delayNode';
      break;
    case 'ai_agent_call':
      nodeType = 'aiAgentNode';
      break;
  }
  
  const node = {
    id: nodeId,
    type: nodeType,
    data: nodeData,
    position: { x, y },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
  };
  
  nodes.push(node);
  
  // Connect to previous node
  if (previousNodeId) {
    edges.push(createEdge(previousNodeId, nodeId));
  }
  
  let lastNode = node;
  let maxX = x;
  
  // Handle complex branching for conditions
  if (step.type === 'condition' && step.condition) {
    let branchY = y;
    
    // Process if_true branch
    if (step.condition.if_true && Array.isArray(step.condition.if_true) && step.condition.if_true.length > 0) {
      branchY += config.branchSpacing;
      const trueBranch = processBranch(
        step.condition.if_true, 
        nodeId, 
        x + config.horizontalSpacing, 
        branchY, 
        'TRUE',
        '#10b981',
        config
      );
      nodes.push(...trueBranch.nodes);
      edges.push(...trueBranch.edges);
      maxX = Math.max(maxX, trueBranch.maxX);
    }
    
    // Process if_false branch
    if (step.condition.if_false && Array.isArray(step.condition.if_false) && step.condition.if_false.length > 0) {
      branchY += config.branchSpacing;
      const falseBranch = processBranch(
        step.condition.if_false, 
        nodeId, 
        x + config.horizontalSpacing, 
        branchY, 
        'FALSE',
        '#ef4444',
        config
      );
      nodes.push(...falseBranch.nodes);
      edges.push(...falseBranch.edges);
      maxX = Math.max(maxX, falseBranch.maxX);
    }
  }
  
  // Handle loop branching
  if (step.type === 'loop' && step.loop?.steps && Array.isArray(step.loop.steps) && step.loop.steps.length > 0) {
    const loopBranch = processBranch(
      step.loop.steps,
      nodeId,
      x + config.horizontalSpacing,
      y + config.branchSpacing,
      'LOOP',
      '#8b5cf6',
      config
    );
    nodes.push(...loopBranch.nodes);
    edges.push(...loopBranch.edges);
    maxX = Math.max(maxX, loopBranch.maxX);
  }
  
  return { nodes, edges, lastNode, maxX };
};

// Enhanced branch processing with better organization
const processBranch = (
  steps: any[], 
  parentNodeId: string, 
  startX: number, 
  startY: number, 
  branchLabel: string,
  edgeColor: string,
  config: any
) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let currentX = startX;
  let currentY = startY;
  let previousNodeId = parentNodeId;
  let maxX = startX;

  steps.forEach((step, index) => {
    const result = processStep(step, index, currentX, currentY, previousNodeId, config);
    nodes.push(...result.nodes);
    edges.push(...result.edges);
    
    // Update the first edge in the branch with the label
    if (index === 0 && result.edges.length > 0) {
      result.edges[0].label = branchLabel;
      const edgeStyle = result.edges[0].style || {};
      const markerEnd = result.edges[0].markerEnd || {};
      
      result.edges[0].style = {
        ...edgeStyle,
        stroke: edgeColor,
      };
      result.edges[0].markerEnd = {
        ...markerEnd,
        ...markerEnd,
        color: edgeColor,
      };
    }
    
    if (result.lastNode) {
      previousNodeId = result.lastNode.id;
      currentX = result.lastNode.position.x + config.horizontalSpacing;
      maxX = Math.max(maxX, currentX);
    }
  });

  return { nodes, edges, maxX };
};

// Enhanced edge creation with better styling
const createEdge = (source: string, target: string, label?: string, color: string = '#9333ea') => ({
  id: getEdgeId(source, target, label),
  source,
  target,
  type: 'smoothstep',
  animated: true,
  label,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color,
  },
  style: {
    strokeWidth: 3,
    stroke: color,
    strokeDasharray: '8,4',
  },
});
