
import { supabase } from '@/integrations/supabase/client';
import { AutomationBlueprint } from '@/types/automation';
import { AutomationCredentialManager } from './automationCredentialManager';

export interface ExecutionValidationResult {
  canExecute: boolean;
  issues: {
    missingCredentials: string[];
    untestedCredentials: string[];
    pendingAgents: string[];
  };
  message: string;
}

export class AutomationExecutionValidator {
  /**
   * Validate if automation is ready for execution with AI-powered validation
   */
  static async validateAutomation(
    automationId: string,
    blueprint: AutomationBlueprint,
    userId: string
  ): Promise<ExecutionValidationResult> {
    console.log(`🔍 AI-POWERED VALIDATION: ${automationId}`);

    try {
      // Extract required platforms from automation blueprint
      const requiredPlatforms = this.extractRequiredPlatforms(blueprint);
      console.log(`📋 Required platforms:`, requiredPlatforms);

      // Validate platform credentials
      const credentialValidation = await AutomationCredentialManager.validateAutomationCredentials(
        automationId,
        requiredPlatforms,
        userId
      );

      // Validate AI agents
      const agentValidation = await this.validateAIAgents(automationId, blueprint, userId);

      const canExecute = credentialValidation.valid && agentValidation.valid;

      const result: ExecutionValidationResult = {
        canExecute,
        issues: {
          missingCredentials: credentialValidation.missing,
          untestedCredentials: credentialValidation.untested,
          pendingAgents: agentValidation.pending
        },
        message: canExecute ? 
          '🚀 Automation ready for execution with AI-powered platform integration' :
          '⚠️ Automation requires additional configuration before execution'
      };

      console.log(`🎯 AI-POWERED VALIDATION RESULT:`, result);
      return result;

    } catch (error) {
      console.error('❌ Validation error:', error);
      return {
        canExecute: false,
        issues: {
          missingCredentials: [],
          untestedCredentials: [],
          pendingAgents: []
        },
        message: 'Validation failed - please check automation configuration'
      };
    }
  }

  /**
   * Extract required platforms from automation blueprint with AI-powered analysis
   * Made public so it can be used by other components
   */
  static extractRequiredPlatforms(blueprint: AutomationBlueprint): string[] {
    const platforms = new Set<string>();

    // Extract from action steps
    blueprint.steps?.forEach(step => {
      if (step.type === 'action' && step.action?.integration) {
        platforms.add(step.action.integration.toLowerCase());
      }
    });

    console.log(`🤖 AI-powered platform extraction found:`, Array.from(platforms));
    return Array.from(platforms);
  }

  /**
   * Validate AI agents are properly configured with AI-powered validation
   */
  private static async validateAIAgents(
    automationId: string,
    blueprint: AutomationBlueprint,
    userId: string
  ): Promise<{ valid: boolean; pending: string[] }> {
    try {
      // Extract AI agent requirements from blueprint
      const agentSteps = blueprint.steps?.filter(step => step.type === 'ai_agent_call') || [];
      
      if (agentSteps.length === 0) {
        return { valid: true, pending: [] };
      }

      // Get configured AI agents
      const { data: agents, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('automation_id', automationId);

      if (error) {
        console.error('Failed to fetch AI agents:', error);
        return { valid: false, pending: ['Failed to validate AI agents'] };
      }

      const pendingAgents: string[] = [];

      // Check each required agent
      agentSteps.forEach((step, index) => {
        const agentId = step.ai_agent_call?.agent_id;
        if (!agentId) {
          pendingAgents.push(`Agent decision required for step ${index + 1}`);
          return;
        }

        const agent = agents?.find(a => a.id === agentId);
        if (!agent) {
          pendingAgents.push(`Agent ${agentId} not found`);
          return;
        }

        // Validate agent configuration
        if (!agent.api_key) {
          pendingAgents.push(`API key missing for agent: ${agent.agent_name}`);
        }
      });

      return {
        valid: pendingAgents.length === 0,
        pending: pendingAgents
      };

    } catch (error) {
      console.error('AI agent validation error:', error);
      return { valid: false, pending: ['AI agent validation failed'] };
    }
  }
}
