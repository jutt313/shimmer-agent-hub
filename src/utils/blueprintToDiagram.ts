
import { AutomationBlueprint } from "@/types/automation";
import { Node, Edge, Position, MarkerType } from "@xyflow/react";
import { 
  FaGoogle, FaSlack, FaMicrosoft, FaGithub, FaTrello, FaDropbox, 
  FaTwitter, FaFacebook, FaLinkedin, FaInstagram, FaYoutube,
  FaDiscord, FaSpotify, FaAmazon, FaApple, FaShopify
} from 'react-icons/fa';
import { 
  SiGmail, SiNotion, SiAirtable, SiZapier, SiHubspot, SiSalesforce,
  SiZoom, SiMicrosoftteams, SiOpenai, SiAnthropic
} from 'react-icons/si';
import { 
  Mail, Zap, GitBranch, Clock, Bot, Play, Square, 
  MessageSquare, Database, Code, Webhook, Calendar
} from 'lucide-react';

// Platform icon mapping
const getPlatformIcon = (platformName: string) => {
  const name = platformName.toLowerCase();
  
  // Email platforms
  if (name.includes('gmail')) return { component: SiGmail, color: 'text-red-500' };
  if (name.includes('outlook') || name.includes('microsoft')) return { component: FaMicrosoft, color: 'text-blue-600' };
  if (name.includes('mail')) return { component: Mail, color: 'text-gray-600' };
  
  // Communication platforms
  if (name.includes('slack')) return { component: FaSlack, color: 'text-purple-500' };
  if (name.includes('discord')) return { component: FaDiscord, color: 'text-indigo-500' };
  if (name.includes('teams')) return { component: SiMicrosoftteams, color: 'text-blue-600' };
  if (name.includes('zoom')) return { component: SiZoom, color: 'text-blue-500' };
  
  // Social platforms
  if (name.includes('twitter')) return { component: FaTwitter, color: 'text-blue-400' };
  if (name.includes('facebook')) return { component: FaFacebook, color: 'text-blue-600' };
  if (name.includes('linkedin')) return { component: FaLinkedin, color: 'text-blue-700' };
  if (name.includes('instagram')) return { component: FaInstagram, color: 'text-pink-500' };
  if (name.includes('youtube')) return { component: FaYoutube, color: 'text-red-600' };
  
  // Productivity platforms
  if (name.includes('notion')) return { component: SiNotion, color: 'text-gray-800' };
  if (name.includes('airtable')) return { component: SiAirtable, color: 'text-yellow-500' };
  if (name.includes('trello')) return { component: FaTrello, color: 'text-blue-500' };
  if (name.includes('github')) return { component: FaGithub, color: 'text-gray-800' };
  if (name.includes('google')) return { component: FaGoogle, color: 'text-red-500' };
  
  // AI platforms
  if (name.includes('openai') || name.includes('gpt')) return { component: SiOpenai, color: 'text-green-600' };
  if (name.includes('anthropic') || name.includes('claude')) return { component: SiAnthropic, color: 'text-orange-500' };
  
  // CRM/Sales
  if (name.includes('hubspot')) return { component: SiHubspot, color: 'text-orange-500' };
  if (name.includes('salesforce')) return { component: SiSalesforce, color: 'text-blue-600' };
  if (name.includes('shopify')) return { component: FaShopify, color: 'text-green-600' };
  
  // Generic fallbacks
  if (name.includes('webhook')) return { component: Webhook, color: 'text-purple-500' };
  if (name.includes('api')) return { component: Code, color: 'text-gray-600' };
  if (name.includes('database')) return { component: Database, color: 'text-blue-500' };
  if (name.includes('calendar')) return { component: Calendar, color: 'text-green-500' };
  
  // Default
  return { component: Zap, color: 'text-blue-500' };
};

// Step type icon mapping
const getStepIcon = (stepType: string, step?: any) => {
  switch (stepType) {
    case 'action':
      if (step?.action?.integration) {
        return getPlatformIcon(step.action.integration);
      }
      return { component: Zap, color: 'text-blue-500' };
    case 'condition':
      return { component: GitBranch, color: 'text-orange-500' };
    case 'loop':
      return { component: Square, color: 'text-purple-500' };
    case 'delay':
      return { component: Clock, color: 'text-gray-500' };
    case 'ai_agent_call':
      return { component: Bot, color: 'text-green-500' };
    default:
      return { component: Play, color: 'text-gray-500' };
  }
};

// Helper to generate unique IDs
let idCounter = 0;
const getId = () => `node_${idCounter++}`;
const getEdgeId = (source: string, target: string, label?: string) => `edge_${source}-${target}-${label || ''}-${idCounter++}`;

export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let xOffset = 50;
  let yOffset = 100;
  const nodeSpacing = 300;

  // Create the Trigger node
  const triggerNodeId = getId();
  nodes.push({
    id: triggerNodeId,
    type: 'input',
    data: { 
      label: `Trigger: ${blueprint.trigger.type}`,
      icon: '▶️'
    },
    position: { x: xOffset, y: yOffset },
    sourcePosition: Position.Right,
    style: {
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      color: 'white',
      border: '2px solid #15803d',
      borderRadius: '12px',
      fontWeight: 'bold'
    },
  });

  let previousNodeId = triggerNodeId;
  xOffset += nodeSpacing;

  // Process main steps
  blueprint.steps.forEach((step, index) => {
    const nodeId = getId();
    const label = step.name || `${step.type} ${index + 1}`;
    const iconInfo = getStepIcon(step.type, step);
    
    let nodeColor = '#3b82f6'; // Default blue
    let borderColor = '#2563eb';
    
    // Assign colors based on step type
    switch (step.type) {
      case 'action':
        nodeColor = '#3b82f6';
        borderColor = '#2563eb';
        break;
      case 'condition':
        nodeColor = '#f97316';
        borderColor = '#ea580c';
        break;
      case 'loop':
        nodeColor = '#8b5cf6';
        borderColor = '#7c3aed';
        break;
      case 'delay':
        nodeColor = '#6b7280';
        borderColor = '#4b5563';
        break;
      case 'ai_agent_call':
        nodeColor = '#10b981';
        borderColor = '#059669';
        break;
    }

    nodes.push({
      id: nodeId,
      type: 'default',
      data: { 
        label,
        icon: getStepTypeEmoji(step.type),
        step
      },
      position: { x: xOffset, y: yOffset },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      style: {
        background: `linear-gradient(135deg, ${nodeColor}, ${borderColor})`,
        color: 'white',
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        fontWeight: 'bold',
        minWidth: 200
      },
    });

    // Connect to previous node with beautiful animated edge
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
        color: '#4f46e5',
      },
      style: {
        strokeWidth: 3,
        stroke: '#4f46e5',
        strokeDasharray: '5,5',
      },
    });

    previousNodeId = nodeId;
    xOffset += nodeSpacing;
  });

  // Create End node
  const endNodeId = getId();
  nodes.push({
    id: endNodeId,
    type: 'output',
    data: { 
      label: 'Complete',
      icon: '🏁'
    },
    position: { x: xOffset, y: yOffset },
    targetPosition: Position.Left,
    style: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      border: '2px solid #b91c1c',
      borderRadius: '12px',
      fontWeight: 'bold'
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
      color: '#4f46e5',
    },
    style: {
      strokeWidth: 3,
      stroke: '#4f46e5',
      strokeDasharray: '5,5',
    },
  });

  return { nodes, edges };
};

// Helper function to get emoji for step types
const getStepTypeEmoji = (stepType: string): string => {
  switch (stepType) {
    case 'action':
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
      return '📋';
  }
};
