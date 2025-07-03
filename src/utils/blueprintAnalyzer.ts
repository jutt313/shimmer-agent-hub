
import { AutomationBlueprint } from "@/types/automation";

export interface BlueprintStats {
  totalSteps: number;
  platforms: string[];
  agents: string[];
  conditions: number;
  loops: number;
  expectedNodes: number;
}

export const analyzeBlueprintStructure = (blueprint: AutomationBlueprint): BlueprintStats | null => {
  if (!blueprint?.steps) return null;

  let totalSteps = 0;
  const platforms = new Set<string>();
  const agents = new Set<string>();
  let conditions = 0;
  let loops = 0;

  const processSteps = (steps: any[]) => {
    steps.forEach((step) => {
      totalSteps++;
      
      // Enhanced platform detection with multiple property checks
      if (step.action && typeof step.action === 'object') {
        const platform = step.action.integration || 
                        step.action.platform || 
                        step.action.service || 
                        step.action.provider;
        if (platform) platforms.add(platform);
      }
      
      // Extract trigger platforms
      if (step.trigger && typeof step.trigger === 'object') {
        const platform = step.trigger.integration || 
                        step.trigger.platform || 
                        step.trigger.service;
        if (platform) platforms.add(platform);
      }
      
      // Track AI agents
      if (step.ai_agent_call?.agent_id) {
        agents.add(step.ai_agent_call.agent_id);
      }
      
      // Count conditions and process nested steps
      if (step.type === 'condition') {
        conditions++;
        if (step.condition?.if_true) processSteps(step.condition.if_true);
        if (step.condition?.if_false) processSteps(step.condition.if_false);
      }
      
      // Count loops and process nested steps
      if (step.type === 'loop') {
        loops++;
        if (step.loop?.steps) processSteps(step.loop.steps);
      }
      
      // Process retry and fallback steps
      if (step.retry?.steps) processSteps(step.retry.steps);
      if (step.fallback?.primary_steps) processSteps(step.fallback.primary_steps);
      if (step.fallback?.fallback_steps) processSteps(step.fallback.fallback_steps);
    });
  };

  processSteps(blueprint.steps);
  
  const stats: BlueprintStats = {
    totalSteps,
    platforms: Array.from(platforms),
    agents: Array.from(agents),
    conditions,
    loops,
    expectedNodes: totalSteps + platforms.size + agents.size + 1 
  };

  console.log('📊 Blueprint analysis completed:', stats);
  return stats;
};

export const extractPlatformFromStep = (step: any): string => {
  if (!step) return '';
  
  // Check action properties
  if (step.action && typeof step.action === 'object') {
    return step.action.integration || 
           step.action.platform || 
           step.action.service || 
           step.action.provider || 
           '';
  }
  
  // Check trigger properties
  if (step.trigger && typeof step.trigger === 'object') {
    return step.trigger.integration || 
           step.trigger.platform || 
           step.trigger.service || 
           '';
  }
  
  return '';
};

export const extractConditionBranches = (condition: any): Array<{ label: string; handle: string; color: string }> => {
  const branches = [];
  
  if (!condition) {
    return [
      { label: 'Yes', handle: 'yes', color: '#10b981' },
      { label: 'No', handle: 'no', color: '#ef4444' }
    ];
  }
  
  // Check for explicit branches
  if (condition.if_true) {
    branches.push({ label: 'True', handle: 'true', color: '#10b981' });
  }
  
  if (condition.if_false) {
    branches.push({ label: 'False', handle: 'false', color: '#ef4444' });
  }
  
  // Analyze condition expression for specific cases
  if (condition.expression) {
    const expr = condition.expression.toLowerCase();
    
    if (expr.includes('urgent')) {
      branches.push({ label: 'Urgent', handle: 'urgent', color: '#ef4444' });
    }
    if (expr.includes('task')) {
      branches.push({ label: 'Task', handle: 'task', color: '#10b981' });
    }
    if (expr.includes('follow')) {
      branches.push({ label: 'Follow-up', handle: 'followup', color: '#f59e0b' });
    }
    if (expr.includes('existing') || expr.includes('found')) {
      branches.push({ label: 'Existing', handle: 'existing', color: '#3b82f6' });
    }
    if (expr.includes('new') || expr.includes('not found')) {
      branches.push({ label: 'New', handle: 'new', color: '#10b981' });
    }
    if (expr.includes('customer') && expr.includes('status')) {
      branches.push(
        { label: 'Existing Customer', handle: 'existing', color: '#3b82f6' },
        { label: 'New Customer', handle: 'new', color: '#10b981' }
      );
    }
  }
  
  // Default branches if none found
  if (branches.length === 0) {
    branches.push(
      { label: 'Yes', handle: 'yes', color: '#10b981' },
      { label: 'No', handle: 'no', color: '#ef4444' }
    );
  }
  
  return branches;
};
