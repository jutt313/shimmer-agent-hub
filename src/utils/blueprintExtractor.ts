
import { AutomationBlueprint } from "@/types/automation";

/**
 * FINAL FIX: Complete blueprint extraction with perfect workflow → steps conversion
 */
export const extractBlueprintFromStructuredData = (structuredData: any): AutomationBlueprint | null => {
  try {
    console.log('🔧 FINAL: Blueprint extraction from:', Object.keys(structuredData || {}));

    if (!structuredData || typeof structuredData !== 'object') {
      console.warn('❌ FINAL: Invalid structured data provided');
      return null;
    }

    // Method 1: Direct execution_blueprint extraction
    if (structuredData.execution_blueprint) {
      console.log('✅ FINAL: Found execution_blueprint');
      return validateAndCleanBlueprint(structuredData.execution_blueprint);
    }

    // Method 2: Direct automation_blueprint extraction
    if (structuredData.automation_blueprint) {
      console.log('✅ FINAL: Found automation_blueprint');
      return validateAndCleanBlueprint(structuredData.automation_blueprint);
    }

    // Method 3: CRITICAL - Enhanced workflow handling with COMPLETE conversion to steps
    if (structuredData.workflow && Array.isArray(structuredData.workflow) && structuredData.workflow.length > 0) {
      console.log('🔧 FINAL: Converting workflow to steps format for diagram generator');
      return constructBlueprintFromWorkflow(structuredData);
    }

    // Method 4: Construct from components
    if (structuredData.steps || structuredData.platforms) {
      console.log('🔧 FINAL: Constructing from components');
      return constructBlueprintFromComponents(structuredData);
    }

    // Method 5: Extract from nested responses
    if (structuredData.yusrai_response || structuredData.ai_response) {
      const nestedData = structuredData.yusrai_response || structuredData.ai_response;
      console.log('🔍 FINAL: Checking nested response');
      return extractBlueprintFromStructuredData(nestedData);
    }

    console.warn('⚠️ FINAL: No blueprint data found in structured response');
    return null;

  } catch (error) {
    console.error('❌ FINAL: Error extracting blueprint:', error);
    return null;
  }
};

/**
 * CRITICAL: Perfect workflow to steps conversion for diagram generator
 */
const constructBlueprintFromWorkflow = (structuredData: any): AutomationBlueprint => {
  console.log('🔧 FINAL: Perfect workflow to steps conversion');
  
  const blueprint: AutomationBlueprint = {
    version: "1.0",
    description: structuredData.summary || "AI-generated automation workflow",
    trigger: {
      type: structuredData.trigger_type || 'manual',
      platform: structuredData.trigger_platform || undefined
    },
    steps: [] // CRITICAL: Always use steps array format
  };

  // CRITICAL: Convert workflow array to steps array for diagram generator
  if (structuredData.workflow && Array.isArray(structuredData.workflow)) {
    blueprint.steps = structuredData.workflow.map((workflowItem: any, index: number) => {
      console.log(`📋 FINAL: Converting workflow item ${index + 1}:`, workflowItem);

      return {
        id: `step-${index + 1}`,
        name: workflowItem.action || workflowItem.step || `Step ${index + 1}`,
        type: 'action' as const,
        action: {
          integration: workflowItem.platform || 'system',
          method: workflowItem.method || 'execute',
          parameters: {
            ...workflowItem.parameters,
            description: workflowItem.action || workflowItem.step,
            platform: workflowItem.platform || 'system',
            details: workflowItem.details || workflowItem.description
          }
        },
        // Store original workflow data for reference
        originalWorkflowData: workflowItem,
        platform: workflowItem.platform,
        platformDetails: workflowItem.platform_details || workflowItem.config
      };
    });
  }

  // Add platforms and test payloads if available
  if (structuredData.test_payloads && Array.isArray(structuredData.test_payloads)) {
    blueprint.test_payloads = structuredData.test_payloads;
  }

  if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
    blueprint.platforms = structuredData.platforms;
  }

  console.log(`✅ FINAL: Created blueprint with ${blueprint.steps.length} steps in correct format`);
  return blueprint;
};

/**
 * Enhanced blueprint validation and cleaning
 */
const validateAndCleanBlueprint = (blueprint: any): AutomationBlueprint | null => {
  try {
    if (!blueprint || typeof blueprint !== 'object') {
      return null;
    }

    const cleanedBlueprint: AutomationBlueprint = {
      version: blueprint.version || "1.0",
      description: blueprint.description || "AI-generated automation",
      trigger: blueprint.trigger || { type: 'manual' },
      steps: []
    };

    // Handle steps format
    if (blueprint.steps && Array.isArray(blueprint.steps)) {
      cleanedBlueprint.steps = blueprint.steps.map((step: any, index: number) => ({
        id: step.id || `step-${index + 1}`,
        name: step.name || step.action || `Step ${index + 1}`,
        type: step.type || 'action',
        action: step.action ? step.action : {
          integration: 'system',
          method: 'execute',
          parameters: { description: step.name || `Step ${index + 1}` }
        },
        ...step
      }));
    } 
    // Handle workflow format in blueprint - convert to steps
    else if (blueprint.workflow && Array.isArray(blueprint.workflow)) {
      cleanedBlueprint.steps = blueprint.workflow.map((workflowItem: any, index: number) => ({
        id: `step-${index + 1}`,
        name: workflowItem.action || workflowItem.step || `Step ${index + 1}`,
        type: 'action' as const,
        action: {
          integration: workflowItem.platform || 'system',
          method: workflowItem.method || 'execute',
          parameters: workflowItem.parameters || { 
            description: workflowItem.action || workflowItem.step,
            platform: workflowItem.platform 
          }
        },
        originalWorkflowData: workflowItem
      }));
    }

    if (blueprint.variables) {
      cleanedBlueprint.variables = blueprint.variables;
    }

    // Preserve test payloads and platforms
    if (blueprint.test_payloads) {
      cleanedBlueprint.test_payloads = blueprint.test_payloads;
    }
    if (blueprint.platforms) {
      cleanedBlueprint.platforms = blueprint.platforms;
    }

    console.log(`✅ FINAL: Validated blueprint with ${cleanedBlueprint.steps.length} steps`);
    return cleanedBlueprint;

  } catch (error) {
    console.error('❌ FINAL: Error validating blueprint:', error);
    return null;
  }
};

/**
 * Enhanced component-based blueprint construction
 */
const constructBlueprintFromComponents = (structuredData: any): AutomationBlueprint => {
  const blueprint: AutomationBlueprint = {
    version: "1.0",
    description: structuredData.summary || structuredData.description || "AI-generated automation",
    trigger: {
      type: structuredData.trigger_type || 'manual',
      platform: structuredData.trigger_platform
    },
    steps: []
  };

  let stepCounter = 1;

  // Process steps
  if (structuredData.steps && Array.isArray(structuredData.steps)) {
    structuredData.steps.forEach((step: string | any, index: number) => {
      if (typeof step === 'string') {
        blueprint.steps.push({
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
        blueprint.steps.push({
          id: step.id || `step-${stepCounter++}`,
          name: step.name || step.action || `Step ${index + 1}`,
          type: step.type || 'action',
          ...step
        });
      }
    });
  }

  // Process platforms
  if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
    structuredData.platforms.forEach((platform: any) => {
      if (platform?.name) {
        blueprint.steps.push({
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

  console.log(`🔧 FINAL: Constructed blueprint with ${blueprint.steps.length} steps from components`);
  return blueprint;
};

/**
 * CRITICAL: Ensure blueprint has steps format for diagram generator
 */
export const ensureBlueprintHasSteps = (blueprint: AutomationBlueprint): AutomationBlueprint => {
  if (!blueprint.steps || !Array.isArray(blueprint.steps) || blueprint.steps.length === 0) {
    console.warn('⚠️ FINAL: Blueprint missing steps array, cannot generate diagram');
    return blueprint;
  }

  console.log(`✅ FINAL: Blueprint validated with ${blueprint.steps.length} steps for diagram generation`);
  return blueprint;
};

/**
 * Enhanced blueprint validation for diagram generation
 */
export const validateBlueprintForDiagram = (blueprint: AutomationBlueprint | null): boolean => {
  if (!blueprint) {
    console.warn('❌ FINAL: No blueprint provided for validation');
    return false;
  }

  if (!blueprint.steps || !Array.isArray(blueprint.steps) || blueprint.steps.length === 0) {
    console.warn('❌ FINAL: Blueprint has no steps for diagram generation');
    return false;
  }

  if (!blueprint.trigger) {
    console.warn('⚠️ FINAL: Blueprint has no trigger, using default');
    blueprint.trigger = { type: 'manual' };
  }

  // Enhanced validation
  const validSteps = blueprint.steps.filter(step => step.name && step.name.trim() !== '');
  if (validSteps.length === 0) {
    console.warn('❌ FINAL: Blueprint has no valid steps with names');
    return false;
  }

  console.log(`✅ FINAL: Blueprint validation passed with ${blueprint.steps.length} steps`);
  return true;
};
