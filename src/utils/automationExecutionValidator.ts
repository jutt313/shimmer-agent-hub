
import { AutomationBlueprint } from '@/types/automation';
import { AutomationCredentialManager } from './automationCredentialManager';
import { AutomationAgentManager } from './automationAgentManager';

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
   * Validate if an automation is ready for execution
   */
  static async validateAutomation(
    automationId: string,
    blueprint: AutomationBlueprint,
    userId: string
  ): Promise<ExecutionValidationResult> {
    try {
      console.log(`🔍 Validating automation ${automationId} for execution`);

      // Extract required platforms from blueprint
      const requiredPlatforms = this.extractRequiredPlatforms(blueprint);
      console.log(`📋 Required platforms:`, requiredPlatforms);

      // Validate credentials
      const credentialValidation = await AutomationCredentialManager.validateAutomationCredentials(
        automationId,
        requiredPlatforms,
        userId
      );

      // Validate agent decisions
      const agentValidation = await AutomationAgentManager.validateAgentDecisions(
        automationId,
        userId
      );

      const issues = {
        missingCredentials: credentialValidation.missing,
        untestedCredentials: credentialValidation.untested,
        pendingAgents: agentValidation.pendingAgents
      };

      const canExecute = credentialValidation.valid && agentValidation.valid;

      let message = '';
      if (canExecute) {
        message = '✅ Automation is ready for execution';
      } else {
        const problems = [];
        if (issues.missingCredentials.length > 0) {
          problems.push(`Missing credentials: ${issues.missingCredentials.join(', ')}`);
        }
        if (issues.untestedCredentials.length > 0) {
          problems.push(`Untested credentials: ${issues.untestedCredentials.join(', ')}`);
        }
        if (issues.pendingAgents.length > 0) {
          problems.push(`Pending agent decisions: ${issues.pendingAgents.join(', ')}`);
        }
        message = `❌ Cannot execute: ${problems.join('; ')}`;
      }

      console.log(`🎯 Validation result:`, { canExecute, issues, message });

      return {
        canExecute,
        issues,
        message
      };

    } catch (error) {
      console.error('❌ Failed to validate automation:', error);
      return {
        canExecute: false,
        issues: {
          missingCredentials: [],
          untestedCredentials: [],
          pendingAgents: []
        },
        message: 'Validation failed due to system error'
      };
    }
  }

  /**
   * Extract required platforms from automation blueprint
   */
  private static extractRequiredPlatforms(blueprint: AutomationBlueprint): string[] {
    const platforms = new Set<string>();

    if (!blueprint.steps) return [];

    blueprint.steps.forEach(step => {
      if (step.action?.integration && step.action.integration !== 'system') {
        platforms.add(step.action.integration);
      }
    });

    return Array.from(platforms);
  }
}
