
import { Node, Edge } from '@xyflow/react';

interface BlueprintStep {
  id: string;
  name: string;
  type: string;
  action?: {
    integration?: string;
    method?: string;
    parameters?: any;
  };
  condition?: any;
  loop?: any;
  delay?: any;
  agent?: any;
}

interface AutomationBlueprint {
  steps: BlueprintStep[];
  trigger?: any;
  variables?: any;
}

export const blueprintToDiagram = (blueprint: AutomationBlueprint): { nodes: Node[], edges: Edge[] } => {
  if (!blueprint || !blueprint.steps) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Helper function to determine node type based on step
  const getNodeType = (step: BlueprintStep): string => {
    switch (step.type) {
      case 'condition':
        return 'conditionNode';
      case 'loop':
        return 'loopNode';
      case 'delay':
        return 'delayNode';
      case 'agent':
        return 'aiAgentNode';
      case 'action':
      default:
        return 'actionNode';
    }
  };

  // Create nodes from steps
  blueprint.steps.forEach((step, index) => {
    const nodeType = getNodeType(step);
    
    nodes.push({
      id: step.id,
      type: nodeType,
      position: { x: index * 250, y: 100 },
      data: {
        label: step.name || `Step ${index + 1}`,
        icon: step.action?.integration || step.type,
        action: step.action,
        condition: step.condition,
        loop: step.loop,
        delay: step.delay,
        agent: step.agent
      }
    });

    // Create edges between consecutive steps
    if (index > 0) {
      edges.push({
        id: `e${blueprint.steps[index - 1].id}-${step.id}`,
        source: blueprint.steps[index - 1].id,
        target: step.id,
        animated: true,
        style: { stroke: '#9333ea', strokeWidth: 2 }
      });
    }
  });

  return { nodes, edges };
};
