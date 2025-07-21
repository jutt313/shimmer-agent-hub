
import { AutomationBlueprint } from "@/types/automation";

/**
 * PHASE 2 FIX: Enhanced blueprint extraction with perfect workflow → steps conversion
 * This ensures YusrAI responses are properly converted for diagram generation
 */
export const extractBlueprintFromStructuredData = (structuredData: any): AutomationBlueprint | null => {
  try {
    console.log('🔧 PHASE 2: Enhanced blueprint extraction from:', Object.keys(structuredData || {}));

    if (!structuredData || typeof structuredData !== 'object') {
      console.warn('❌ PHASE 2: Invalid structured data provided');
      return null;
    }

    // Method 1: Direct execution_blueprint extraction with workflow → steps conversion
    if (structuredData.execution_blueprint) {
      console.log('✅ PHASE 2: Found execution_blueprint');
      const blueprint = validateAndCleanBlueprint(structuredData.execution_blueprint);
      if (blueprint) {
        // Add additional data from structured response
        if (structuredData.platforms) blueprint.platforms = structuredData.platforms;
        if (structuredData.test_payloads) blueprint.test_payloads = structuredData.test_payloads;
        return blueprint;
      }
    }

    // Method 2: Construct from workflow in root level
    if (structuredData.workflow && Array.isArray(structuredData.workflow) && structuredData.workflow.length > 0) {
      console.log('🔧 PHASE 2: Converting root-level workflow to blueprint with steps');
      return constructBlueprintFromWorkflow(structuredData);
    }

    // Method 3: Construct from mixed components (platforms, steps, agents)
    if (structuredData.steps || structuredData.platforms || structuredData.agents) {
      console.log('🔧 PHASE 2: Constructing blueprint from YusrAI components');
      return constructBlueprintFromComponents(structuredData);
    }

    console.warn('⚠️ PHASE 2: No valid blueprint data found in structured response');
    return null;

  } catch (error) {
    console.error('❌ PHASE 2: Error extracting blueprint:', error);
    return null;
  }
};

/**
 * PHASE 2: Perfect workflow to steps conversion for YusrAI responses
 */
const constructBlueprintFromWorkflow = (structuredData: any): AutomationBlueprint => {
  console.log('🔧 PHASE 2: Converting workflow to steps format for YusrAI');
  
  const blueprint: AutomationBlueprint = {
    version: "1.0",
    description: structuredData.summary || "YusrAI-generated automation workflow",
    trigger: {
      type: 'manual', // Default for YusrAI automations
      platform: undefined
    },
    steps: [] // Always use steps array format for diagram generator
  };

  // Extract trigger info if available from execution_blueprint
  if (structuredData.execution_blueprint?.trigger) {
    blueprint.trigger = {
      type: structuredData.execution_blueprint.trigger.type || 'manual',
      platform: structuredData.execution_blueprint.trigger.platform
    };
  }

  // Convert workflow array to steps array for diagram generator
  const workflowSource = structuredData.workflow || structuredData.execution_blueprint?.workflow || [];
  
  if (Array.isArray(workflowSource) && workflowSource.length > 0) {
    blueprint.steps = workflowSource.map((workflowItem: any, index: number) => {
      console.log(`📋 PHASE 2: Converting workflow step ${index + 1}:`, workflowItem);

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
            base_url: workflowItem.base_url,
            endpoint: workflowItem.endpoint,
            method: workflowItem.method,
            headers: workflowItem.headers,
            data_mapping: workflowItem.data_mapping
          }
        },
        // Preserve all workflow data for diagram generation
        originalWorkflowData: workflowItem,
        platform: workflowItem.platform,
        platformDetails: workflowItem.config || workflowItem.headers
      };
    });
  }

  // Add YusrAI specific data
  if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
    blueprint.platforms = structuredData.platforms;
  }

  if (structuredData.test_payloads) {
    blueprint.test_payloads = Array.isArray(structuredData.test_payloads) 
      ? structuredData.test_payloads 
      : Object.entries(structuredData.test_payloads).map(([platform, payload]) => ({
          platform,
          payload,
          ...payload
        }));
  }

  console.log(`✅ PHASE 2: Created YusrAI blueprint with ${blueprint.steps.length} steps`);
  return blueprint;
};

/**
 * PHASE 2: Enhanced blueprint validation and cleaning with workflow support
 */
const validateAndCleanBlueprint = (blueprint: any): AutomationBlueprint | null => {
  try {
    if (!blueprint || typeof blueprint !== 'object') {
      return null;
    }

    const cleanedBlueprint: AutomationBlueprint = {
      version: blueprint.version || "1.0",
      description: blueprint.description || "YusrAI-generated automation",
      trigger: blueprint.trigger || { type: 'manual' },
      steps: []
    };

    // Handle existing steps format
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
    // CRITICAL: Handle workflow format in blueprint - convert to steps
    else if (blueprint.workflow && Array.isArray(blueprint.workflow)) {
      console.log('🔧 PHASE 2: Converting blueprint.workflow to steps format');
      cleanedBlueprint.steps = blueprint.workflow.map((workflowItem: any, index: number) => ({
        id: `step-${index + 1}`,
        name: workflowItem.action || workflowItem.step || `Step ${index + 1}`,
        type: 'action' as const,
        action: {
          integration: workflowItem.platform || 'system',
          method: workflowItem.method || 'execute',
          parameters: {
            description: workflowItem.action || workflowItem.step,
            platform: workflowItem.platform,
            base_url: workflowItem.base_url,
            endpoint: workflowItem.endpoint,
            method: workflowItem.method,
            headers: workflowItem.headers,
            data_mapping: workflowItem.data_mapping,
            ...workflowItem.parameters
          }
        },
        originalWorkflowData: workflowItem,
        platform: workflowItem.platform,
        platformDetails: workflowItem.config || workflowItem.headers
      }));
    }

    // Preserve additional blueprint data
    if (blueprint.variables) {
      cleanedBlueprint.variables = blueprint.variables;
    }

    if (blueprint.test_payloads) {
      cleanedBlueprint.test_payloads = blueprint.test_payloads;
    }
    
    if (blueprint.platforms) {
      cleanedBlueprint.platforms = blueprint.platforms;
    }

    console.log(`✅ PHASE 2: Validated blueprint with ${cleanedBlueprint.steps.length} steps`);
    return cleanedBlueprint;

  } catch (error) {
    console.error('❌ PHASE 2: Error validating blueprint:', error);
    return null;
  }
};

/**
 * PHASE 2: Enhanced component-based blueprint construction for YusrAI
 */
const constructBlueprintFromComponents = (structuredData: any): AutomationBlueprint => {
  const blueprint: AutomationBlueprint = {
    version: "1.0",
    description: structuredData.summary || "YusrAI automation from components",
    trigger: {
      type: 'manual',
      platform: undefined
    },
    steps: []
  };

  let stepCounter = 1;

  // Process YusrAI steps array
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

  // Process YusrAI platforms to create integration steps
  if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
    structuredData.platforms.forEach((platform: any) => {
      if (platform?.name) {
        blueprint.steps.push({
          id: `platform-step-${stepCounter++}`,
          name: `${platform.name} Integration`,
          type: 'action',
          action: {
            integration: platform.name.toLowerCase(),
            method: 'api_call',
            parameters: {
              platform: platform.name,
              credentials: platform.credentials,
              config: platform.config || {}
            }
          },
          platform: platform.name,
          platformDetails: platform
        });
      }
    });
  }

  // Add YusrAI platforms and test payloads to blueprint
  if (structuredData.platforms) {
    blueprint.platforms = structuredData.platforms;
  }

  if (structuredData.test_payloads) {
    blueprint.test_payloads = structuredData.test_payloads;
  }

  console.log(`🔧 PHASE 2: Constructed YusrAI blueprint with ${blueprint.steps.length} steps from components`);
  return blueprint;
};

/**
 * PHASE 2: Ensure blueprint has proper steps format for diagram generator
 */
export const ensureBlueprintHasSteps = (blueprint: AutomationBlueprint): AutomationBlueprint => {
  if (!blueprint.steps || !Array.isArray(blueprint.steps) || blueprint.steps.length === 0) {
    console.warn('⚠️ PHASE 2: Blueprint missing steps array, cannot generate diagram');
    
    // Try to create steps from workflow if available
    if ((blueprint as any).workflow && Array.isArray((blueprint as any).workflow)) {
      console.log('🔧 PHASE 2: Creating steps from workflow in ensureBlueprintHasSteps');
      const workflow = (blueprint as any).workflow;
      blueprint.steps = workflow.map((workflowItem: any, index: number) => ({
        id: `step-${index + 1}`,
        name: workflowItem.action || workflowItem.step || `Step ${index + 1}`,
        type: 'action' as const,
        action: {
          integration: workflowItem.platform || 'system',
          method: workflowItem.method || 'execute',
          parameters: {
            description: workflowItem.action || workflowItem.step,
            platform: workflowItem.platform,
            ...workflowItem.parameters
          }
        },
        originalWorkflowData: workflowItem,
        platform: workflowItem.platform
      }));
    }
  }

  console.log(`✅ PHASE 2: Blueprint validated with ${blueprint.steps?.length || 0} steps for diagram generation`);
  return blueprint;
};

/**
 * PHASE 2: Enhanced blueprint validation for diagram generation
 */
export const validateBlueprintForDiagram = (blueprint: AutomationBlueprint | null): boolean => {
  if (!blueprint) {
    console.warn('❌ PHASE 2: No blueprint provided for validation');
    return false;
  }

  if (!blueprint.steps || !Array.isArray(blueprint.steps) || blueprint.steps.length === 0) {
    console.warn('❌ PHASE 2: Blueprint has no steps for diagram generation');
    return false;
  }

  if (!blueprint.trigger) {
    console.warn('⚠️ PHASE 2: Blueprint has no trigger, using default');
    blueprint.trigger = { type: 'manual' };
  }

  // Enhanced validation for YusrAI blueprints
  const validSteps = blueprint.steps.filter(step => step.name && step.name.trim() !== '');
  if (validSteps.length === 0) {
    console.warn('❌ PHASE 2: Blueprint has no valid steps with names');
    return false;
  }

  console.log(`✅ PHASE 2: Blueprint validation passed with ${blueprint.steps.length} steps for YusrAI diagram`);
  return true;
};
