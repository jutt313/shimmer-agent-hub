
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
  if (name.includes('gmail')) return <SiGmail className="w-4 h-4 text-red-500" />;
  if (name.includes('outlook') || name.includes('microsoft')) return <FaMicrosoft className="w-4 h-4 text-blue-600" />;
  if (name.includes('mail')) return <Mail className="w-4 h-4 text-gray-600" />;
  
  // Communication platforms
  if (name.includes('slack')) return <FaSlack className="w-4 h-4 text-purple-500" />;
  if (name.includes('discord')) return <FaDiscord className="w-4 h-4 text-indigo-500" />;
  if (name.includes('teams')) return <SiMicrosoftteams className="w-4 h-4 text-blue-600" />;
  if (name.includes('zoom')) return <SiZoom className="w-4 h-4 text-blue-500" />;
  
  // Social platforms
  if (name.includes('twitter')) return <FaTwitter className="w-4 h-4 text-blue-400" />;
  if (name.includes('facebook')) return <FaFacebook className="w-4 h-4 text-blue-600" />;
  if (name.includes('linkedin')) return <FaLinkedin className="w-4 h-4 text-blue-700" />;
  if (name.includes('instagram')) return <FaInstagram className="w-4 h-4 text-pink-500" />;
  if (name.includes('youtube')) return <FaYoutube className="w-4 h-4 text-red-600" />;
  
  // Productivity platforms
  if (name.includes('notion')) return <SiNotion className="w-4 h-4 text-gray-800" />;
  if (name.includes('airtable')) return <SiAirtable className="w-4 h-4 text-yellow-500" />;
  if (name.includes('trello')) return <FaTrello className="w-4 h-4 text-blue-500" />;
  if (name.includes('github')) return <FaGithub className="w-4 h-4 text-gray-800" />;
  if (name.includes('google')) return <FaGoogle className="w-4 h-4 text-red-500" />;
  
  // AI platforms
  if (name.includes('openai') || name.includes('gpt')) return <SiOpenai className="w-4 h-4 text-green-600" />;
  if (name.includes('anthropic') || name.includes('claude')) return <SiAnthropic className="w-4 h-4 text-orange-500" />;
  
  // CRM/Sales
  if (name.includes('hubspot')) return <SiHubspot className="w-4 h-4 text-orange-500" />;
  if (name.includes('salesforce')) return <SiSalesforce className="w-4 h-4 text-blue-600" />;
  if (name.includes('shopify')) return <FaShopify className="w-4 h-4 text-green-600" />;
  
  // Generic fallbacks
  if (name.includes('webhook')) return <Webhook className="w-4 h-4 text-purple-500" />;
  if (name.includes('api')) return <Code className="w-4 h-4 text-gray-600" />;
  if (name.includes('database')) return <Database className="w-4 h-4 text-blue-500" />;
  if (name.includes('calendar')) return <Calendar className="w-4 h-4 text-green-500" />;
  
  // Default
  return <Zap className="w-4 h-4 text-blue-500" />;
};

// Step type icon mapping
const getStepIcon = (stepType: string, step?: any) => {
  switch (stepType) {
    case 'action':
      if (step?.action?.integration) {
        return getPlatformIcon(step.action.integration);
      }
      return <Zap className="w-4 h-4 text-blue-500" />;
    case 'condition':
      return <GitBranch className="w-4 h-4 text-orange-500" />;
    case 'loop':
      return <Square className="w-4 h-4 text-purple-500" />;
    case 'delay':
      return <Clock className="w-4 h-4 text-gray-500" />;
    case 'ai_agent_call':
      return <Bot className="w-4 h-4 text-green-500" />;
    default:
      return <Play className="w-4 h-4 text-gray-500" />;
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
      icon: <Play className="w-4 h-4 text-green-500" />
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
    const icon = getStepIcon(step.type, step);
    
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
        icon,
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
      icon: <Square className="w-4 h-4 text-red-500" />
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
