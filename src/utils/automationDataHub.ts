/**
 * AUTOMATION DATA HEADQUARTERS
 * Central coordinator for all automation data flow from chat-AI response to execution
 * Manages: parsing → persistence → platform buttons → blueprint → diagram → execution
 */

import { supabase } from "@/integrations/supabase/client";
import { parseYusrAIStructuredResponse, YusrAIStructuredResponse, YusrAIParseResult } from "./jsonParser";
import { toast } from "@/components/ui/use-toast";

interface AutomationDataHubResult {
  success: boolean;
  data?: {
    structuredData: YusrAIStructuredResponse | null;
    metadata: any;
    automationResponseId?: string;
    platformsForButtons: any[];
    blueprintData: any;
    diagramData: any;
  };
  error?: string;
}

export class AutomationDataHub {
  private static instance: AutomationDataHub;
  private logger: (message: string, data?: any) => void;

  constructor() {
    this.logger = (message: string, data?: any) => {
      console.log(`🏢 [HEADQUARTERS] ${message}`, data || '');
    };
  }

  static getInstance(): AutomationDataHub {
    if (!AutomationDataHub.instance) {
      AutomationDataHub.instance = new AutomationDataHub();
    }
    return AutomationDataHub.instance;
  }

  /**
   * MAIN ENTRY POINT: Process chat-AI response and coordinate all subsystems
   */
  async processAutomationResponse(
    rawResponse: string,
    userId: string,
    automationId: string,
    messageId: number
  ): Promise<AutomationDataHubResult> {
    this.logger('Processing new automation response', {
      responseLength: rawResponse.length,
      userId,
      automationId,
      messageId
    });

    try {
      // STEP 1: Parse the raw response using enhanced jsonParser
      this.logger('STEP 1: Parsing raw response...');
      const parseResult = this.parseResponse(rawResponse);
      
      if (!parseResult.success) {
        return parseResult;
      }

      const { structuredData, metadata } = parseResult.data!;

      // STEP 2: Save to database for persistence
      this.logger('STEP 2: Saving to database...');
      const automationResponseId = await this.saveToDatabase(
        structuredData,
        metadata,
        rawResponse,
        userId,
        automationId,
        messageId
      );

      // STEP 3: Transform platforms for button integration
      this.logger('STEP 3: Preparing platform buttons...');
      const platformsForButtons = this.preparePlatformButtons(structuredData);

      // STEP 4: Extract blueprint for execution
      this.logger('STEP 4: Extracting execution blueprint...');
      const blueprintData = this.extractBlueprint(structuredData);

      // STEP 5: Prepare data for diagram generator
      this.logger('STEP 5: Preparing diagram data...');
      const diagramData = this.prepareDiagramData(structuredData, blueprintData);

      // STEP 6: Send to diagram generator if blueprint exists
      if (blueprintData) {
        this.logger('STEP 6: Triggering diagram generation...');
        await this.triggerDiagramGeneration(blueprintData, automationId, userId);
      }

      this.logger('✅ All steps completed successfully');

      return {
        success: true,
        data: {
          structuredData,
          metadata,
          automationResponseId,
          platformsForButtons,
          blueprintData,
          diagramData
        }
      };

    } catch (error) {
      this.logger('❌ Error in processing pipeline', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * STEP 1: Enhanced parsing with comprehensive error handling
   */
  private parseResponse(rawResponse: string): AutomationDataHubResult {
    try {
      const parseResult: YusrAIParseResult = parseYusrAIStructuredResponse(rawResponse);
      
      this.logger('Parse result', {
        hasStructuredData: !!parseResult.structuredData,
        isPlainText: parseResult.isPlainText,
        metadata: parseResult.metadata
      });

      return {
        success: true,
        data: {
          structuredData: parseResult.structuredData,
          metadata: parseResult.metadata,
          platformsForButtons: [],
          blueprintData: null,
          diagramData: null
        }
      };
    } catch (error) {
      this.logger('❌ Parsing failed', error);
      return {
        success: false,
        error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * STEP 2: Save to automation_responses table with all metadata
   */
  private async saveToDatabase(
    structuredData: YusrAIStructuredResponse | null,
    metadata: any,
    rawResponse: string,
    userId: string,
    automationId: string,
    messageId: number
  ): Promise<string | undefined> {
    try {
      if (!structuredData) {
        this.logger('⚠️ No structured data to save');
        return undefined;
      }

      const { data, error } = await supabase.from('automation_responses').insert({
        user_id: userId,
        automation_id: automationId,
        chat_message_id: messageId,
        response_text: rawResponse,
        structured_data: structuredData as any,
        yusrai_powered: metadata.yusrai_powered || true,
        seven_sections_validated: metadata.seven_sections_validated || false,
        error_help_available: metadata.error_help_available || false,
        is_ready_for_execution: false // Will be updated when credentials are configured
      }).select('id').single();

      if (error) {
        this.logger('❌ Database save failed', error);
        throw error;
      }

      this.logger('✅ Saved to database', { responseId: data.id });
      return data.id;
    } catch (error) {
      this.logger('❌ Database operation failed', error);
      throw error;
    }
  }

  /**
   * STEP 3: Transform platforms for FixedPlatformButtons component
   */
  private preparePlatformButtons(structuredData: YusrAIStructuredResponse | null): any[] {
    try {
      if (!structuredData?.platforms || !Array.isArray(structuredData.platforms)) {
        this.logger('⚠️ No platforms found for buttons');
        return [];
      }

      const transformedPlatforms = structuredData.platforms.map((platform, index) => {
        const credentials = platform.credentials || [];
        
        return {
          name: platform.name || `Platform ${index + 1}`,
          credentials: credentials.map(cred => ({
            field: cred.field || 'api_key',
            placeholder: cred.example || `Enter ${cred.field || 'credential'}`,
            link: cred.link || cred.where_to_get || '#',
            why_needed: cred.why_needed || 'Authentication required'
          }))
        };
      });

      this.logger('✅ Transformed platforms for buttons', { count: transformedPlatforms.length });
      return transformedPlatforms;
    } catch (error) {
      this.logger('❌ Platform transformation failed', error);
      return [];
    }
  }

  /**
   * STEP 4: Extract execution blueprint for automation runner
   */
  private extractBlueprint(structuredData: YusrAIStructuredResponse | null): any {
    try {
      if (!structuredData?.execution_blueprint) {
        this.logger('⚠️ No execution blueprint found');
        return null;
      }

      const blueprint = {
        version: "1.0",
        description: structuredData.summary || "YusrAI Generated Automation",
        trigger: structuredData.execution_blueprint.trigger || { type: 'manual' },
        steps: this.convertWorkflowToSteps(structuredData.execution_blueprint.workflow || []),
        variables: {},
        platforms: structuredData.platforms || [],
        test_payloads: this.convertTestPayloads(structuredData.test_payloads || {})
      };

      this.logger('✅ Extracted execution blueprint', { stepsCount: blueprint.steps.length });
      return blueprint;
    } catch (error) {
      this.logger('❌ Blueprint extraction failed', error);
      return null;
    }
  }

  /**
   * STEP 5: Prepare data for diagram generator
   */
  private prepareDiagramData(structuredData: YusrAIStructuredResponse | null, blueprintData: any): any {
    try {
      if (!blueprintData) {
        this.logger('⚠️ No blueprint data for diagram');
        return null;
      }

      const diagramData = {
        automation_data: structuredData,
        blueprint: blueprintData,
        metadata: {
          totalSteps: blueprintData.steps?.length || 0,
          platforms: (structuredData?.platforms || []).map(p => p.name),
          generatedAt: new Date().toISOString(),
          source: 'yusrai_headquarters'
        }
      };

      this.logger('✅ Prepared diagram data');
      return diagramData;
    } catch (error) {
      this.logger('❌ Diagram data preparation failed', error);
      return null;
    }
  }

  /**
   * STEP 6: Trigger diagram generation via edge function
   */
  private async triggerDiagramGeneration(blueprintData: any, automationId: string, userId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('diagram-generator', {
        body: {
          automation_id: automationId,
          user_id: userId,
          automation_data: blueprintData,
          layout_version: '2.0'
        }
      });

      if (error) {
        this.logger('❌ Diagram generation failed', error);
        throw error;
      }

      this.logger('✅ Diagram generation triggered', { diagramId: data?.diagram_id });
    } catch (error) {
      this.logger('❌ Diagram generation error', error);
      // Don't throw - diagram generation failure shouldn't break the whole flow
    }
  }

  /**
   * Helper: Convert execution blueprint workflow to automation steps
   */
  private convertWorkflowToSteps(workflow: any[]): any[] {
    return workflow.map((workflowStep, index) => ({
      id: `step-${index + 1}`,
      name: workflowStep.action || `Step ${index + 1}`,
      type: 'action',
      action: {
        integration: workflowStep.platform || 'unknown',
        method: workflowStep.method || 'GET',
        parameters: workflowStep.data_mapping || {}
      },
      ai_recommended: true
    }));
  }

  /**
   * Helper: Convert test payloads to automation format
   */
  private convertTestPayloads(testPayloads: any): any[] {
    const converted = [];
    for (const [platform, payload] of Object.entries(testPayloads)) {
      converted.push({
        platform,
        payload,
        method: (payload as any)?.method || 'GET'
      });
    }
    return converted;
  }

  /**
   * Recovery: Load automation response from database by ID
   */
  async recoverAutomationData(automationId: string, userId: string): Promise<AutomationDataHubResult> {
    try {
      this.logger('Recovering automation data from database', { automationId });

      const { data, error } = await supabase
        .from('automation_responses')
        .select('*')
        .eq('automation_id', automationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        throw new Error('No automation data found');
      }

      const structuredData = data.structured_data as unknown as YusrAIStructuredResponse;
      const platformsForButtons = this.preparePlatformButtons(structuredData);
      const blueprintData = this.extractBlueprint(structuredData);
      const diagramData = this.prepareDiagramData(structuredData, blueprintData);

      this.logger('✅ Data recovered successfully');

      return {
        success: true,
        data: {
          structuredData,
          metadata: {
            yusrai_powered: data.yusrai_powered,
            seven_sections_validated: data.seven_sections_validated,
            error_help_available: data.error_help_available
          },
          automationResponseId: data.id,
          platformsForButtons,
          blueprintData,
          diagramData
        }
      };
    } catch (error) {
      this.logger('❌ Recovery failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Recovery failed'
      };
    }
  }

  /**
   * Update execution readiness status
   */
  async updateExecutionReadiness(automationId: string, userId: string, isReady: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_responses')
        .update({ is_ready_for_execution: isReady })
        .eq('automation_id', automationId)
        .eq('user_id', userId);

      if (error) throw error;
      
      this.logger(`✅ Execution readiness updated: ${isReady}`);
    } catch (error) {
      this.logger('❌ Failed to update execution readiness', error);
    }
  }
}

// Export singleton instance
export const automationDataHub = AutomationDataHub.getInstance();