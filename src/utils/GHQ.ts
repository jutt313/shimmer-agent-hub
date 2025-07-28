
/**
 * GHQ.ts - GLOBAL HEADQUARTERS
 * Central coordinator for ALL automation data processing
 * Single source of truth for parsing, platform handling, agent decisions, and execution readiness
 */

import { supabase } from '@/integrations/supabase/client';
import { parseYusrAIResponse } from '@/utils/jsonParser';
import { extractBlueprintFromStructuredData } from '@/utils/blueprintExtractor';
import { agentStateManager } from '@/utils/agentStateManager';

export interface GHQProcessingResult {
  success: boolean;
  data?: {
    structuredData: any;
    platformsForButtons: any[];
    agentsForDecision: any[];
    blueprintData: any;
    diagramData: any;
    metadata: {
      yusrai_powered: boolean;
      seven_sections_validated: boolean;
      error_help_available: boolean;
    };
  };
  error?: string;
}

export interface GHQReadinessResult {
  isReady: boolean;
  credentialStatus: 'missing' | 'partial' | 'complete';
  agentStatus: 'pending' | 'partial' | 'complete';
  missingCredentials: string[];
  pendingAgents: string[];
}

class GHQHeadquarters {
  private static instance: GHQHeadquarters;

  static getInstance(): GHQHeadquarters {
    if (!GHQHeadquarters.instance) {
      GHQHeadquarters.instance = new GHQHeadquarters();
    }
    return GHQHeadquarters.instance;
  }

  /**
   * MAIN PROCESSING FUNCTION
   * Processes raw ChatAI response through complete pipeline
   */
  async processAutomationResponse(
    rawText: string, 
    userId: string, 
    automationId: string,
    messageId?: number
  ): Promise<GHQProcessingResult> {
    try {
      console.log('🏢 GHQ: Starting complete automation processing pipeline');
      
      // STEP 1: Parse the raw response
      const parseResult = parseYusrAIResponse(rawText);
      
      if (!parseResult) {
        console.log('📄 GHQ: Plain text message, no structured data');
        return { success: true, data: undefined };
      }

      console.log('✅ GHQ: Parsed structured data successfully');

      // STEP 2: Extract and transform platform data
      const platformsForButtons = this.extractPlatformData(parseResult);
      
      // STEP 3: Extract and process agent data
      const agentsForDecision = this.extractAgentData(parseResult);
      
      // STEP 4: Generate blueprint for execution
      const blueprintData = this.generateBlueprint(parseResult);
      
      // STEP 5: Prepare diagram data
      const diagramData = this.prepareDiagramData(parseResult, blueprintData);
      
      // STEP 6: Save to database
      await this.saveToDatabase(
        userId, 
        automationId, 
        rawText, 
        parseResult,
        messageId,
        parseResult.metadata || {}
      );

      console.log('🏢 GHQ: Complete processing pipeline finished successfully');

      return {
        success: true,
        data: {
          structuredData: parseResult,
          platformsForButtons,
          agentsForDecision,
          blueprintData,
          diagramData,
          metadata: {
            yusrai_powered: parseResult.metadata?.yusrai_powered || false,
            seven_sections_validated: parseResult.metadata?.seven_sections_validated || false,
            error_help_available: parseResult.metadata?.error_help_available || false
          }
        }
      };

    } catch (error: any) {
      console.error('❌ GHQ: Processing pipeline failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * VALIDATE CREDENTIAL READINESS
   * Checks if all required platform credentials are ready
   */
  async validateCredentialReadiness(automationId: string, userId: string): Promise<{
    isReady: boolean;
    status: 'missing' | 'partial' | 'complete';
    platforms: { name: string; status: 'missing' | 'saved' | 'tested' }[];
  }> {
    try {
      // Get automation data to find required platforms
      const { data: automation } = await supabase
        .from('automations')
        .select('platforms_config')
        .eq('id', automationId)
        .eq('user_id', userId)
        .single();

      if (!automation?.platforms_config) {
        return { isReady: true, status: 'complete', platforms: [] };
      }

      const platformsConfig = automation.platforms_config as any;
      const requiredPlatforms = platformsConfig?.platforms || [];
      const platformStatuses = [];

      for (const platform of requiredPlatforms) {
        // Check credential status
        const { data: credential } = await supabase
          .from('automation_platform_credentials')
          .select('is_tested, test_status')
          .eq('automation_id', automationId)
          .eq('platform_name', platform.name)
          .eq('user_id', userId)
          .single();

        let status: 'missing' | 'saved' | 'tested' = 'missing';
        if (credential) {
          status = credential.is_tested && credential.test_status === 'success' ? 'tested' : 'saved';
        }

        platformStatuses.push({ name: platform.name, status });
      }

      const allTested = platformStatuses.every(p => p.status === 'tested');
      const someSaved = platformStatuses.some(p => p.status !== 'missing');

      return {
        isReady: allTested,
        status: allTested ? 'complete' : someSaved ? 'partial' : 'missing',
        platforms: platformStatuses
      };

    } catch (error) {
      console.error('❌ GHQ: Credential validation failed:', error);
      return { isReady: false, status: 'missing', platforms: [] };
    }
  }

  /**
   * VALIDATE AGENT READINESS  
   * Checks if all agent decisions have been made
   */
  async validateAgentReadiness(automationId: string): Promise<{
    isReady: boolean;
    status: 'pending' | 'partial' | 'complete';
    agents: { name: string; status: 'pending' | 'added' | 'dismissed' }[];
  }> {
    try {
      // Set automation context for agent manager
      agentStateManager.setAutomationId(automationId);

      // Get automation data to find recommended agents
      const { data: automation } = await supabase
        .from('automation_responses')
        .select('structured_data')
        .eq('automation_id', automationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!automation?.structured_data) {
        return { isReady: true, status: 'complete', agents: [] };
      }

      const structuredData = automation.structured_data as any;
      const recommendedAgents = structuredData?.agents || [];
      const agentStatuses = [];

      for (const agent of recommendedAgents) {
        const status = agentStateManager.getAgentStatus(agent.name);
        agentStatuses.push({ name: agent.name, status });
      }

      const allDecided = agentStatuses.every(a => a.status !== 'pending');
      const someDecided = agentStatuses.some(a => a.status !== 'pending');

      return {
        isReady: allDecided,
        status: allDecided ? 'complete' : someDecided ? 'partial' : 'pending',
        agents: agentStatuses
      };

    } catch (error) {
      console.error('❌ GHQ: Agent validation failed:', error);
      return { isReady: false, status: 'pending', agents: [] };
    }
  }

  /**
   * GET EXECUTION READINESS
   * Combined check for both credentials and agents
   */
  async getExecutionReadiness(automationId: string, userId: string): Promise<GHQReadinessResult> {
    try {
      const [credentialCheck, agentCheck] = await Promise.all([
        this.validateCredentialReadiness(automationId, userId),
        this.validateAgentReadiness(automationId)
      ]);

      const isReady = credentialCheck.isReady && agentCheck.isReady;

      return {
        isReady,
        credentialStatus: credentialCheck.status,
        agentStatus: agentCheck.status,
        missingCredentials: credentialCheck.platforms
          .filter(p => p.status !== 'tested')
          .map(p => p.name),
        pendingAgents: agentCheck.agents
          .filter(a => a.status === 'pending')
          .map(a => a.name)
      };

    } catch (error) {
      console.error('❌ GHQ: Execution readiness check failed:', error);
      return {
        isReady: false,
        credentialStatus: 'missing',
        agentStatus: 'pending',
        missingCredentials: [],
        pendingAgents: []
      };
    }
  }

  /**
   * PRIVATE HELPER METHODS
   */
  private extractPlatformData(structuredData: any): any[] {
    if (!structuredData.platforms?.length) return [];
    
    return structuredData.platforms.map((platform: any) => ({
      name: platform.name || 'Unknown Platform',
      credentials: platform.credentials || [],
      test_payloads: platform.test_payloads || []
    }));
  }

  private extractAgentData(structuredData: any): any[] {
    if (!structuredData.agents?.length) return [];
    
    return structuredData.agents.map((agent: any) => ({
      name: agent.name || 'Unnamed Agent',
      role: agent.role || 'Assistant',
      rule: agent.rule || 'No specific rules',
      goal: agent.goal || 'General assistance',
      is_recommended: true
    }));
  }

  private generateBlueprint(structuredData: any): any {
    try {
      return extractBlueprintFromStructuredData(structuredData);
    } catch (error) {
      console.error('⚠️ GHQ: Blueprint generation failed:', error);
      return null;
    }
  }

  private prepareDiagramData(structuredData: any, blueprintData: any): any {
    if (!blueprintData || !structuredData.steps?.length) return null;

    return {
      nodes: [],
      edges: [],
      metadata: {
        totalSteps: structuredData.steps?.length || 0,
        platforms: structuredData.platforms?.map((p: any) => p.name) || [],
        agentRecommendations: structuredData.agents?.length || 0,
        generatedAt: new Date().toISOString(),
        source: 'GHQ'
      }
    };
  }

  private async saveToDatabase(
    userId: string,
    automationId: string,
    responseText: string,
    structuredData: any,
    messageId?: number,
    metadata: any = {}
  ): Promise<void> {
    try {
      // Save to automation_responses table
      const { error } = await supabase
        .from('automation_responses')
        .upsert({
          user_id: userId,
          automation_id: automationId,
          response_text: responseText,
          structured_data: structuredData,
          chat_message_id: messageId,
          yusrai_powered: metadata.yusrai_powered || false,
          seven_sections_validated: metadata.seven_sections_validated || false,
          error_help_available: metadata.error_help_available || false,
          is_ready_for_execution: false // Will be updated by readiness checks
        });

      if (error) {
        console.error('❌ GHQ: Database save failed:', error);
      } else {
        console.log('💾 GHQ: Successfully saved to database');
      }

    } catch (error) {
      console.error('❌ GHQ: Database save error:', error);
    }
  }
}

// Export singleton instance
export const GHQ = GHQHeadquarters.getInstance();
