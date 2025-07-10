
import { supabase } from '@/integrations/supabase/client';

export interface AgentDecision {
  id: string;
  automation_id: string;
  agent_name: string;
  decision: string; // Changed from union type to string to match database
  agent_data?: any;
}

export class AutomationAgentManager {
  /**
   * Track agent recommendation for an automation
   */
  static async trackAgentRecommendation(
    automationId: string,
    agentName: string,
    agentData: any,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('automation_agent_decisions')
        .upsert({
          automation_id: automationId,
          user_id: userId,
          agent_name: agentName,
          decision: 'pending',
          agent_data: agentData
        }, {
          onConflict: 'automation_id,agent_name'
        });

      if (error) throw error;

      console.log(`📝 Tracked agent recommendation: ${agentName} for automation ${automationId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Failed to track agent recommendation:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update agent decision (add or dismiss)
   */
  static async updateAgentDecision(
    automationId: string,
    agentName: string,
    decision: 'added' | 'dismissed',
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('automation_agent_decisions')
        .update({ decision })
        .eq('automation_id', automationId)
        .eq('agent_name', agentName)
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`✅ Updated agent decision: ${agentName} -> ${decision}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Failed to update agent decision:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all agent decisions for an automation
   */
  static async getAgentDecisions(
    automationId: string,
    userId: string
  ): Promise<AgentDecision[]> {
    try {
      const { data, error } = await supabase
        .from('automation_agent_decisions')
        .select('*')
        .eq('automation_id', automationId)
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get agent decisions:', error);
      return [];
    }
  }

  /**
   * Check if there are pending agent decisions
   */
  static async hasPendingAgentDecisions(
    automationId: string,
    userId: string
  ): Promise<{ hasPending: boolean; pendingAgents: string[] }> {
    try {
      const { data, error } = await supabase
        .from('automation_agent_decisions')
        .select('agent_name')
        .eq('automation_id', automationId)
        .eq('user_id', userId)
        .eq('decision', 'pending');

      if (error) throw error;

      const pendingAgents = (data || []).map(d => d.agent_name);
      
      return {
        hasPending: pendingAgents.length > 0,
        pendingAgents
      };
    } catch (error) {
      console.error('❌ Failed to check pending agent decisions:', error);
      return { hasPending: false, pendingAgents: [] };
    }
  }

  /**
   * Validate all agent decisions are made
   */
  static async validateAgentDecisions(
    automationId: string,
    userId: string
  ): Promise<{ valid: boolean; pendingAgents: string[] }> {
    const result = await this.hasPendingAgentDecisions(automationId, userId);
    return {
      valid: !result.hasPending,
      pendingAgents: result.pendingAgents
    };
  }
}
