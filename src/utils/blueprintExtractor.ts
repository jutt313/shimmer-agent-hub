import { AutomationBlueprint } from "@/types/automation";

/**
 * FIXED: Enhanced blueprint extraction with robust workflow handling
 */
export const extractBlueprintFromStructuredData = (structuredData: any): AutomationBlueprint | null => {
  try {
    console.log('🔧 FIXED: Enhanced blueprint extraction from:', Object.keys(structuredData || {}));

    if (!structuredData || typeof structuredData !== 'object') {
      console.warn('❌ FIXED: Invalid structured data provided');
      return null;
    }

    // Method 1: Direct execution_blueprint extraction
    if (structuredData.execution_blueprint) {
      console.log('✅ FIXED: Found execution_blueprint');
      return validateAndCleanBlueprint(structuredData.execution_blueprint);
    }

    // Method 2: Direct automation_blueprint extraction
    if (structuredData.automation_blueprint) {
      console.log('✅ FIXED: Found automation_blueprint');
      return validateAndCleanBlueprint(structuredData.automation_blueprint);
    }

    // Method 3: CRITICAL FIX - Enhanced workflow handling with COMPLETE data preservation
    if (structuredData.workflow && Array.isArray(structuredData.workflow) && structuredData.workflow.length > 0) {
      console.log('🔧 FIXED: Enhanced workflow processing with', structuredData.workflow.length, 'items');
      return constructBlueprintFromWorkflow(structuredData);
    }

    // Method 4: Construct from components
    if (structuredData.steps || structuredData.platforms) {
      console.log('🔧 FIXED: Constructing from components');
      return constructBlueprintFromComponents(structuredData);
    }

    // Method 5: Extract from nested responses
    if (structuredData.yusrai_response || structuredData.ai_response) {
      const nestedData = structuredData.yusrai_response || structuredData.ai_response;
      console.log('🔍 FIXED: Checking nested response');
      return extractBlueprintFromStructuredData(nestedData);
    }

    console.warn('⚠️ FIXED: No blueprint data found in structured response');
    return null;

  } catch (error) {
    console.error('❌ FIXED: Error extracting blueprint:', error);
    return null;
  }
};

/**
 * CRITICAL FIX: Complete workflow to blueprint conversion with ALL data preservation
 */
const constructBlueprintFromWorkflow = (structuredData: any): AutomationBlueprint => {
  console.log('🔧 FIXED: Complete workflow to blueprint conversion');
  
  const blueprint: AutomationBlueprint = {
    version: "1.0",
    description: structuredData.summary || "AI-generated automation workflow",
    trigger: {
      type: structuredData.trigger_type || 'manual',
      platform: structuredData.trigger_platform || undefined
    },
    steps: []
  };

  // CRITICAL FIX: Complete workflow processing with ALL data preservation
  if (structuredData.workflow && Array.isArray(structuredData.workflow)) {
    blueprint.steps = structuredData.workflow.map((workflowItem: any, index: number) => {
      console.log(`📋 FIXED: Processing workflow item ${index + 1}:`, {
        action: workflowItem.action,
        step: workflowItem.step,
        platform: workflowItem.platform,
        method: workflowItem.method,
        parameters: workflowItem.parameters,
        details: workflowItem.details
      });

      return {
        id: `workflow-step-${index + 1}`,
        name: workflowItem.action || workflowItem.step || `Workflow Step ${index + 1}`,
        type: workflowItem.type || 'action',
        action: {
          integration: workflowItem.platform || 'system',
          method: workflowItem.method || 'execute',
          parameters: {
            ...workflowItem.parameters,
            description: workflowItem.action || workflowItem.step,
            platform: workflowItem.platform || 'system',
            details: workflowItem.details || workflowItem.description,
            // CRITICAL: Preserve ALL workflow data
            originalAction: workflowItem.action,
            originalStep: workflowItem.step,
            originalPlatform: workflowItem.platform,
            originalMethod: workflowItem.method,
            allWorkflowData: workflowItem
          }
        },
        // CRITICAL: Store original workflow data for diagram generation
        originalWorkflowData: workflowItem,
        // Add platform info for diagram generator
        platform: workflowItem.platform,
        platformDetails: workflowItem.platform_details || workflowItem.config
      };
    });
  }

  // CRITICAL: Add test payloads if available from AI
  if (structuredData.test_payloads && Array.isArray(structuredData.test_payloads)) {
    blueprint.test_payloads = structuredData.test_payloads;
  }

  // CRITICAL: Add platforms info for credential forms
  if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
    blueprint.platforms = structuredData.platforms;
  }

  console.log(`✅ FIXED: Created complete blueprint with ${blueprint.steps.length} steps from workflow`);
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

    // Enhanced steps processing
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
    // Handle workflow format in blueprint
    else if (blueprint.workflow && Array.isArray(blueprint.workflow)) {
      cleanedBlueprint.steps = blueprint.workflow.map((workflowItem: any, index: number) => ({
        id: workflowItem.id || `workflow-step-${index + 1}`,
        name: workflowItem.action || workflowItem.step || `Step ${index + 1}`,
        type: workflowItem.type || 'action',
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

    // CRITICAL: Preserve test payloads and platforms
    if (blueprint.test_payloads) {
      cleanedBlueprint.test_payloads = blueprint.test_payloads;
    }
    if (blueprint.platforms) {
      cleanedBlueprint.platforms = blueprint.platforms;
    }

    console.log(`✅ FIXED: Validated blueprint with ${cleanedBlueprint.steps.length} steps`);
    return cleanedBlueprint;

  } catch (error) {
    console.error('❌ FIXED: Error validating blueprint:', error);
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

  console.log(`🔧 FIXED: Constructed blueprint with ${blueprint.steps.length} steps from components`);
  return blueprint;
};

/**
 * Enhanced blueprint validation for diagram generation
 */
export const validateBlueprintForDiagram = (blueprint: AutomationBlueprint | null): boolean => {
  if (!blueprint) {
    console.warn('❌ FIXED: No blueprint provided for validation');
    return false;
  }

  if (!blueprint.steps || !Array.isArray(blueprint.steps) || blueprint.steps.length === 0) {
    console.warn('❌ FIXED: Blueprint has no steps for diagram generation');
    return false;
  }

  if (!blueprint.trigger) {
    console.warn('⚠️ FIXED: Blueprint has no trigger, using default');
    blueprint.trigger = { type: 'manual' };
  }

  // Enhanced validation
  const validSteps = blueprint.steps.filter(step => step.name && step.name.trim() !== '');
  if (validSteps.length === 0) {
    console.warn('❌ FIXED: Blueprint has no valid steps with names');
    return false;
  }

  console.log(`✅ FIXED: Blueprint validation passed with ${blueprint.steps.length} steps`);
  return true;
};
