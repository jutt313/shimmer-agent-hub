
import { AutomationBlueprint } from "@/types/automation";

/**
 * Enhanced blueprint extraction utility
 * Extracts automation blueprint from various structured data formats
 */
export const extractBlueprintFromStructuredData = (structuredData: any): AutomationBlueprint | null => {
  try {
    console.log('🔧 Extracting blueprint from structured data:', Object.keys(structuredData || {}));

    if (!structuredData || typeof structuredData !== 'object') {
      console.warn('❌ Invalid structured data provided');
      return null;
    }

    // Method 1: Direct execution_blueprint extraction
    if (structuredData.execution_blueprint) {
      console.log('✅ Found execution_blueprint in structured data');
      return validateAndCleanBlueprint(structuredData.execution_blueprint);
    }

    // Method 2: Direct automation_blueprint extraction
    if (structuredData.automation_blueprint) {
      console.log('✅ Found automation_blueprint in structured data');
      return validateAndCleanBlueprint(structuredData.automation_blueprint);
    }

    // Method 3: FIXED - Construct blueprint from workflow/steps data
    if (structuredData.workflow || structuredData.steps || structuredData.platforms) {
      console.log('🔧 Constructing blueprint from structured data components');
      return constructBlueprintFromComponents(structuredData);
    }

    // Method 4: Extract from nested responses
    if (structuredData.yusrai_response || structuredData.ai_response) {
      const nestedData = structuredData.yusrai_response || structuredData.ai_response;
      console.log('🔍 Checking nested response data');
      return extractBlueprintFromStructuredData(nestedData);
    }

    console.warn('⚠️ No blueprint data found in structured response');
    return null;

  } catch (error) {
    console.error('❌ Error extracting blueprint:', error);
    return null;
  }
};

/**
 * Validates and cleans blueprint data to ensure proper structure
 */
const validateAndCleanBlueprint = (blueprint: any): AutomationBlueprint | null => {
  try {
    if (!blueprint || typeof blueprint !== 'object') {
      return null;
    }

    // Ensure required fields exist
    const cleanedBlueprint: AutomationBlueprint = {
      version: blueprint.version || "1.0",
      description: blueprint.description || "AI-generated automation",
      trigger: blueprint.trigger || { type: 'manual' },
      steps: []
    };

    // Process steps
    if (blueprint.steps && Array.isArray(blueprint.steps)) {
      cleanedBlueprint.steps = blueprint.steps.map((step: any, index: number) => ({
        id: step.id || `step-${index + 1}`,
        name: step.name || step.action || `Step ${index + 1}`,
        type: step.type || 'action',
        ...step
      }));
    } 
    // FIXED - Handle workflow format properly
    else if (blueprint.workflow && Array.isArray(blueprint.workflow)) {
      cleanedBlueprint.steps = blueprint.workflow.map((workflowItem: any, index: number) => ({
        id: workflowItem.id || `workflow-step-${index + 1}`,
        name: workflowItem.action || workflowItem.step || workflowItem.name || `Step ${index + 1}`,
        type: workflowItem.type || 'action',
        action: {
          integration: workflowItem.platform || 'system',
          method: workflowItem.method || 'execute',
          parameters: workflowItem.parameters || { description: workflowItem.action || workflowItem.step }
        },
        // Preserve original workflow data
        ...workflowItem
      }));
    }

    // Add variables if present
    if (blueprint.variables) {
      cleanedBlueprint.variables = blueprint.variables;
    }

    console.log(`✅ Validated blueprint with ${cleanedBlueprint.steps.length} steps`);
    return cleanedBlueprint;

  } catch (error) {
    console.error('❌ Error validating blueprint:', error);
    return null;
  }
};

/**
 * ENHANCED - Constructs blueprint from individual components with better workflow handling
 */
const constructBlueprintFromComponents = (structuredData: any): AutomationBlueprint => {
  const constructedBlueprint: AutomationBlueprint = {
    version: "1.0",
    description: structuredData.summary || structuredData.description || "AI-generated automation",
    trigger: {
      type: structuredData.trigger_type || 'manual',
      platform: structuredData.trigger_platform
    },
    steps: []
  };

  let stepCounter = 1;

  // ENHANCED - Handle workflow array first (most common from AI)
  if (structuredData.workflow && Array.isArray(structuredData.workflow)) {
    console.log('🔧 Processing workflow array with', structuredData.workflow.length, 'items');
    structuredData.workflow.forEach((workflowItem: any, index: number) => {
      const step = {
        id: `workflow-${stepCounter++}`,
        name: workflowItem.action || workflowItem.step || workflowItem.name || `Workflow Step ${index + 1}`,
        type: workflowItem.type || 'action',
        action: {
          integration: workflowItem.platform || 'system',
          method: workflowItem.method || 'execute',
          parameters: workflowItem.parameters || { 
            description: workflowItem.action || workflowItem.step,
            platform: workflowItem.platform 
          }
        }
      };
      
      console.log(`📋 Added workflow step: ${step.name} (${step.action.integration})`);
      constructedBlueprint.steps.push(step);
    });
  }

  // Add traditional steps if present
  if (structuredData.steps && Array.isArray(structuredData.steps)) {
    structuredData.steps.forEach((step: string | any, index: number) => {
      if (typeof step === 'string') {
        constructedBlueprint.steps.push({
          id: `step-${stepCounter++}`,
          name: step,
          type: 'action',
          action: {
            integration: 'system',
            method: 'execute',
            parameters: { description: step }
          }
        });
      } else if (typeof step === 'object' && step !== null) {
        const stepObj = step as any;
        constructedBlueprint.steps.push({
          id: stepObj.id || `step-${stepCounter++}`,
          name: stepObj.name || stepObj.action || `Step ${index + 1}`,
          type: stepObj.type || 'action',
          ...stepObj
        });
      }
    });
  }

  // Add platform-based steps
  if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
    structuredData.platforms.forEach((platform: any) => {
      if (platform && typeof platform === 'object' && platform.name) {
        constructedBlueprint.steps.push({
          id: `platform-step-${stepCounter++}`,
          name: `${platform.name} Integration`,
          type: 'action',
          action: {
            integration: platform.name.toLowerCase(),
            method: platform.method || 'api_call',
            parameters: platform.config || platform.parameters || {}
          }
        });
      }
    });
  }

  // Add AI agent steps
  if (structuredData.agents && Array.isArray(structuredData.agents)) {
    structuredData.agents.forEach((agent: any, index: number) => {
      if (agent && typeof agent === 'object' && agent.name) {
        constructedBlueprint.steps.push({
          id: `agent-step-${stepCounter++}`,
          name: `AI Agent: ${agent.name}`,
          type: 'ai_agent_call',
          ai_agent_call: {
            agent_id: agent.name,
            input_prompt: agent.goal || 'Execute assigned tasks',
            output_variable: `agent_${index + 1}_output`,
            is_recommended: true
          },
          ai_recommended: true
        });
      }
    });
  }

  console.log(`🔧 Constructed blueprint with ${constructedBlueprint.steps.length} steps from components`);
  return constructedBlueprint;
};

/**
 * Validates if a blueprint has the minimum required structure for diagram generation
 */
export const validateBlueprintForDiagram = (blueprint: AutomationBlueprint | null): boolean => {
  if (!blueprint) {
    console.warn('❌ No blueprint provided for validation');
    return false;
  }

  if (!blueprint.steps || !Array.isArray(blueprint.steps) || blueprint.steps.length === 0) {
    console.warn('❌ Blueprint has no steps for diagram generation');
    return false;
  }

  if (!blueprint.trigger) {
    console.warn('⚠️ Blueprint has no trigger defined, using default');
    blueprint.trigger = { type: 'manual' };
  }

  console.log(`✅ Blueprint validation passed with ${blueprint.steps.length} steps`);
  return true;
};
