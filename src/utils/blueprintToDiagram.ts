
import { AutomationBlueprint } from "@/types/automation";
import { Node, Edge, Position, MarkerType } from "@xyflow/react";
import { 
  FaGoogle, FaSlack, FaMicrosoft, FaGithub, FaTrello, FaDropbox, 
  FaTwitter, FaFacebook, FaLinkedin, FaInstagram, FaYoutube,
  FaDiscord, FaSpotify, FaAmazon, FaApple, FaShopify
} from 'react-icons/fa';
import { 
  SiGmail, SiNotion, SiAirtable, SiZapier, SiHubspot, SiSalesforce,
  SiZoom, SiOpenai, SiAnthropic
} from 'react-icons/si';
import { 
  Mail, Zap, GitBranch, Clock, Bot, Play, Square, 
  MessageSquare, Database, Code, Webhook, Calendar
} from 'lucide-react';

// Platform icon mapping with enhanced coverage
const getPlatformIcon = (platformName: string) => {
  const name = platformName.toLowerCase();
  
  // Email platforms
  if (name.includes('gmail')) return '📧';
  if (name.includes('outlook') || name.includes('microsoft')) return '📨';
  if (name.includes('mail')) return '✉️';
  
  // Communication platforms
  if (name.includes('slack')) return '💬';
  if (name.includes('discord')) return '🎮';
  if (name.includes('teams')) return '👥';
  if (name.includes('zoom')) return '📹';
  
  // Social platforms
  if (name.includes('twitter')) return '🐦';
  if (name.includes('facebook')) return '📘';
  if (name.includes('linkedin')) return '💼';
  if (name.includes('instagram')) return '📷';
  if (name.includes('youtube')) return '📺';
  
  // Productivity platforms
  if (name.includes('notion')) return '📝';
  if (name.includes('airtable')) return '📊';
  if (name.includes('trello')) return '📋';
  if (name.includes('github')) return '🐙';
  if (name.includes('google')) return '🌐';
  
  // AI platforms
  if (name.includes('openai') || name.includes('gpt')) return '🤖';
  if (name.includes('anthropic') || name.includes('claude')) return '🧠';
  
  // CRM/Sales
  if (name.includes('hubspot')) return '🎯';
  if (name.includes('salesforce')) return '☁️';
  if (name.includes('shopify')) return '🛒';
  
  // Generic fallbacks
  if (name.includes('webhook')) return '🔗';
  if (name.includes('api')) return '⚡';
  if (name.includes('database')) return '💾';
  if (name.includes('calendar')) return '📅';
  
  // Default
  return '⚙️';
};

// Step type icon mapping with emojis for better visibility
const getStepIcon = (stepType: string, step?: any): string => {
  switch (stepType) {
    case 'action':
      if (step?.action?.integration) {
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

// Color scheme for different node types
const getNodeStyle = (stepType: string) => {
  switch (stepType) {
    case 'action':
      return {
        background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
        color: 'white',
        border: '2px solid #7c3aed',
        borderRadius: '12px',
        fontWeight: 'bold',
        minWidth: 200,
        padding: '12px 16px'
      };
    case 'condition':
      return {
        background: 'linear-gradient(135deg, #f97316, #ea580c)',
        color: 'white',
        border: '2px solid #ea580c',
        borderRadius: '12px',
        fontWeight: 'bold',
        minWidth: 200,
        padding: '12px 16px'
      };
    case 'loop':
      return {
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white',
        border: '2px solid #7c3aed',
        borderRadius: '12px',
        fontWeight: 'bold',
        minWidth: 200,
        padding: '12px 16px'
      };
    case 'delay':
      return {
        background: 'linear-gradient(135deg, #6b7280, #4b5563)',
        color: 'white',
        border: '2px solid #4b5563',
        borderRadius: '12px',
        fontWeight: 'bold',
        minWidth: 200,
        padding: '12px 16px'
      };
    case 'ai_agent_call':
      return {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: '2px solid #059669',
        borderRadius: '12px',
        fontWeight: 'bold',
        minWidth: 200,
        padding: '12px 16px'
      };
    default:
      return {
        background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
        color: 'white',
        border: '2px solid #7c3aed',
        borderRadius: '12px',
        fontWeight: 'bold',
        minWidth: 200,
        padding: '12px 16px'
      };
  }
};

// Enhanced node data with platform information
const createNodeData = (step: any, index: number) => {
  const icon = getStepIcon(step.type, step);
  let label = step.name || `${step.type} ${index + 1}`;
  
  // Add platform info for action nodes
  if (step.type === 'action' && step.action?.integration) {
    const platformIcon = getPlatformIcon(step.action.integration);
    label = `${platformIcon} ${step.action.integration}: ${step.action.method || 'Action'}`;
  }
  
  // Add condition details for condition nodes
  if (step.type === 'condition' && step.condition?.expression) {
    label = `🔀 IF: ${step.condition.expression.substring(0, 30)}${step.condition.expression.length > 30 ? '...' : ''}`;
  }
  
  // Add loop details for loop nodes
  if (step.type === 'loop' && step.loop?.array_source) {
    label = `🔄 Loop: ${step.loop.array_source}`;
  }
  
  // Add delay details for delay nodes
  if (step.type === 'delay' && step.delay?.duration_seconds) {
    const duration = step.delay.duration_seconds;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    label = `⏰ Wait: ${timeStr}`;
  }
  
  // Add AI agent details
  if (step.type === 'ai_agent_call' && step.ai_agent_call?.agent_id) {
    label = `🤖 AI Agent: ${step.ai_agent_call.agent_id}`;
  }
  
  return {
    label,
    icon,
    step,
    platform: step.action?.integration || null
  };
};

export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let xOffset = 50;
  let yOffset = 100;
  const nodeSpacing = 300;
  const verticalSpacing = 150;

  // Reset counter for unique IDs
  idCounter = 0;

  // Create the Trigger node
  const triggerNodeId = getId();
  nodes.push({
    id: triggerNodeId,
    type: 'input',
    data: { 
      label: `▶️ Trigger: ${blueprint.trigger.type}`,
      icon: '▶️'
    },
    position: { x: xOffset, y: yOffset },
    sourcePosition: Position.Right,
    style: {
      background: 'linear-gradient(135deg, #a855f7, #9333ea)',
      color: 'white',
      border: '2px solid #9333ea',
      borderRadius: '12px',
      fontWeight: 'bold',
      minWidth: 200,
      padding: '12px 16px'
    },
  });

  let previousNodeId = triggerNodeId;
  xOffset += nodeSpacing;

  // Process main steps with enhanced layout
  blueprint.steps.forEach((step, index) => {
    const nodeId = getId();
    const nodeData = createNodeData(step, index);
    const style = getNodeStyle(step.type);
    
    nodes.push({
      id: nodeId,
      type: 'default',
      data: nodeData,
      position: { x: xOffset, y: yOffset },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      style: style,
    });

    // Connect to previous node with enhanced animated edge
    edges.push({
      id: getEdgeId(previousNodeId, nodeId),
      source: previousNodeId,
      target: nodeId,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#9333ea',
      },
      style: {
        strokeWidth: 3,
        stroke: '#9333ea',
        strokeDasharray: '5,5',
      },
    });

    // Handle conditional branching for condition nodes
    if (step.type === 'condition' && step.condition) {
      let currentY = yOffset;
      
      // Process if_true branch
      if (step.condition.if_true && step.condition.if_true.length > 0) {
        currentY += verticalSpacing;
        const trueBranchNodes = processConditionalBranch(
          step.condition.if_true, 
          nodeId, 
          xOffset + nodeSpacing, 
          currentY, 
          'TRUE',
          '#10b981'
        );
        nodes.push(...trueBranchNodes.nodes);
        edges.push(...trueBranchNodes.edges);
      }
      
      // Process if_false branch
      if (step.condition.if_false && step.condition.if_false.length > 0) {
        currentY += verticalSpacing * 2;
        const falseBranchNodes = processConditionalBranch(
          step.condition.if_false, 
          nodeId, 
          xOffset + nodeSpacing, 
          currentY, 
          'FALSE',
          '#ef4444'
        );
        nodes.push(...falseBranchNodes.nodes);
        edges.push(...falseBranchNodes.edges);
      }
    }

    // Handle loop structures
    if (step.type === 'loop' && step.loop?.steps && step.loop.steps.length > 0) {
      const loopNodes = processLoopBranch(
        step.loop.steps,
        nodeId,
        xOffset + nodeSpacing,
        yOffset + verticalSpacing,
        '#8b5cf6'
      );
      nodes.push(...loopNodes.nodes);
      edges.push(...loopNodes.edges);
    }

    previousNodeId = nodeId;
    xOffset += nodeSpacing;
  });

  // Create End node
  const endNodeId = getId();
  nodes.push({
    id: endNodeId,
    type: 'output',
    data: { 
      label: '🏁 Complete',
      icon: '🏁'
    },
    position: { x: xOffset, y: yOffset },
    targetPosition: Position.Left,
    style: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      border: '2px solid #b91c1c',
      borderRadius: '12px',
      fontWeight: 'bold',
      minWidth: 200,
      padding: '12px 16px'
    },
  });

  edges.push({
    id: getEdgeId(previousNodeId, endNodeId),
    source: previousNodeId,
    target: endNodeId,
    type: 'smoothstep',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#9333ea',
    },
    style: {
      strokeWidth: 3,
      stroke: '#9333ea',
      strokeDasharray: '5,5',
    },
  });

  return { nodes, edges };
};

// Helper function to process conditional branches
const processConditionalBranch = (
  steps: any[], 
  parentNodeId: string, 
  startX: number, 
  startY: number, 
  branchLabel: string,
  edgeColor: string
): { nodes: Node[]; edges: Edge[] } => {
  const branchNodes: Node[] = [];
  const branchEdges: Edge[] = [];
  let currentX = startX;
  let previousNodeId = parentNodeId;

  steps.forEach((step, index) => {
    const nodeId = getId();
    const nodeData = createNodeData(step, index);
    const style = getNodeStyle(step.type);
    
    branchNodes.push({
      id: nodeId,
      type: 'default',
      data: nodeData,
      position: { x: currentX, y: startY },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      style: style,
    });

    // Connect to previous node
    branchEdges.push({
      id: getEdgeId(previousNodeId, nodeId),
      source: previousNodeId,
      target: nodeId,
      type: 'smoothstep',
      animated: true,
      label: index === 0 ? branchLabel : undefined,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: edgeColor,
      },
      style: {
        strokeWidth: 3,
        stroke: edgeColor,
        strokeDasharray: '5,5',
      },
    });

    previousNodeId = nodeId;
    currentX += 300;
  });

  return { nodes: branchNodes, edges: branchEdges };
};

// Helper function to process loop branches
const processLoopBranch = (
  steps: any[], 
  parentNodeId: string, 
  startX: number, 
  startY: number, 
  edgeColor: string
): { nodes: Node[]; edges: Edge[] } => {
  const loopNodes: Node[] = [];
  const loopEdges: Edge[] = [];
  let currentX = startX;
  let previousNodeId = parentNodeId;

  steps.forEach((step, index) => {
    const nodeId = getId();
    const nodeData = createNodeData(step, index);
    const style = getNodeStyle(step.type);
    
    loopNodes.push({
      id: nodeId,
      type: 'default',
      data: nodeData,
      position: { x: currentX, y: startY },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      style: style,
    });

    // Connect to previous node
    loopEdges.push({
      id: getEdgeId(previousNodeId, nodeId),
      source: previousNodeId,
      target: nodeId,
      type: 'smoothstep',
      animated: true,
      label: index === 0 ? 'LOOP' : undefined,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: edgeColor,
      },
      style: {
        strokeWidth: 3,
        stroke: edgeColor,
        strokeDasharray: '5,5',
      },
    });

    previousNodeId = nodeId;
    currentX += 300;
  });

  return { nodes: loopNodes, edges: loopEdges };
};
