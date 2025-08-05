import { AutomationBlueprint } from "@/types/automation";

/**
 * ENHANCED PHASE 2 FIX: Improved blueprint extraction with comprehensive workflow → steps conversion
 * This ensures YusrAI responses are properly converted for diagram generation with better validation
 */
export const extractBlueprintFromStructuredData = (structuredData: any): AutomationBlueprint | null => {
  try {
    console.log('🔧 ENHANCED: Advanced blueprint extraction from:', Object.keys(structuredData || {}));

    if (!structuredData || typeof structuredData !== 'object') {
      console.warn('❌ ENHANCED: Invalid structured data provided');
      return null;
    }

    // Method 1: ENHANCED direct execution_blueprint extraction with improved validation
    if (structuredData.execution_blueprint) {
      console.log('✅ ENHANCED: Found execution_blueprint, processing with enhanced validation');
      const blueprint = validateAndCleanBlueprint(structuredData.execution_blueprint);
      if (blueprint) {
        // Add additional data from structured response
        if (structuredData.platforms) blueprint.platforms = structuredData.platforms;
        if (structuredData.test_payloads) blueprint.test_payloads = structuredData.test_payloads;
        if (structuredData.summary) blueprint.description = structuredData.summary;
        return blueprint;
      }
    }

    // Method 2: ENHANCED workflow conversion with comprehensive step mapping
    if (structuredData.workflow && Array.isArray(structuredData.workflow) && structuredData.workflow.length > 0) {
      console.log('🔧 ENHANCED: Converting root-level workflow to blueprint with comprehensive steps');
      return constructEnhancedBlueprintFromWorkflow(structuredData);
    }

    // Method 3: ENHANCED component-based construction with better error handling
    if (structuredData.steps || structuredData.platforms || structuredData.agents) {
      console.log('🔧 ENHANCED: Constructing blueprint from YusrAI components with enhanced processing');
      return constructBlueprintFromComponents(structuredData);
    }

    // Method 4: ENHANCED fallback for minimal data structures
    if (structuredData.summary || structuredData.description) {
      console.log('🔧 ENHANCED: Creating minimal blueprint from description data');
      return createMinimalBlueprint(structuredData);
    }

    console.warn('⚠️ ENHANCED: No valid blueprint data found in structured response');
    return null;

  } catch (error) {
    console.error('❌ ENHANCED: Error extracting blueprint:', error);
    return null;
  }
};

/**
 * ENHANCED: Comprehensive workflow to steps conversion with better type handling
 */
const constructEnhancedBlueprintFromWorkflow = (structuredData: any): AutomationBlueprint => {
  console.log('🔧 ENHANCED: Converting workflow to steps format with advanced processing');
  
  const blueprint: AutomationBlueprint = {
    version: "1.0",
    description: structuredData.summary || structuredData.description || "YusrAI-generated automation workflow",
    trigger: {
      type: 'manual',
      platform: undefined
    },
    steps: []
  };

  // ENHANCED: Better trigger extraction
  if (structuredData.execution_blueprint?.trigger) {
    blueprint.trigger = {
      type: structuredData.execution_blueprint.trigger.type || 'manual',
      platform: structuredData.execution_blueprint.trigger.platform
    };
  } else if (structuredData.trigger) {
    blueprint.trigger = {
      type: structuredData.trigger.type || 'manual',
      platform: structuredData.trigger.platform
    };
  }

  // ENHANCED: Comprehensive workflow processing with type safety
  const workflowSource = structuredData.workflow || structuredData.execution_blueprint?.workflow || [];
  
  if (Array.isArray(workflowSource) && workflowSource.length > 0) {
    blueprint.steps = workflowSource.map((workflowItem: any, index: number) => {
      console.log(`📋 ENHANCED: Converting workflow step ${index + 1}:`, workflowItem);

      // ENHANCED: Better step data extraction with multiple fallbacks
      const stepName = workflowItem.action || workflowItem.step || workflowItem.name || `Step ${index + 1}`;
      const stepPlatform = workflowItem.platform || workflowItem.integration || 'system';
      const stepMethod = workflowItem.method || workflowItem.action || 'execute';

      return {
        id: workflowItem.id || `step-${index + 1}`,
        name: stepName,
        type: 'action' as const,
        action: {
          integration: stepPlatform,
          method: stepMethod,
          parameters: {
            ...workflowItem.parameters,
            description: stepName,
            platform: stepPlatform,
            base_url: workflowItem.base_url,
            endpoint: workflowItem.endpoint,
            method: stepMethod,
            headers: workflowItem.headers,
            data_mapping: workflowItem.data_mapping,
            ...(workflowItem.config && typeof workflowItem.config === 'object' ? workflowItem.config : {})
          }
        },
        // ENHANCED: Preserve all workflow data for diagram generation
        originalWorkflowData: workflowItem,
        platform: stepPlatform,
        platformDetails: workflowItem.config || workflowItem.headers || workflowItem.credentials
      };
    });
  }

  // ENHANCED: Comprehensive metadata preservation
  if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
    blueprint.platforms = structuredData.platforms;
  }

  if (structuredData.test_payloads) {
    blueprint.test_payloads = Array.isArray(structuredData.test_payloads) 
      ? structuredData.test_payloads 
      : Object.entries(structuredData.test_payloads).map(([platform, payload]) => ({
          platform,
          payload,
          ...(typeof payload === 'object' && payload !== null ? payload : {})
        }));
  }

  // ENHANCED: Additional metadata from YusrAI responses - with proper optional checks
  if (structuredData.variables) blueprint.variables = structuredData.variables;
  if (structuredData.conditions) blueprint.conditions = structuredData.conditions;
  if (structuredData.agents) blueprint.agents = structuredData.agents;

  console.log(`✅ ENHANCED: Created YusrAI blueprint with ${blueprint.steps.length} steps and comprehensive metadata`);
  return blueprint;
};

/**
 * ENHANCED: Improved blueprint validation with more permissive rules
 */
const validateAndCleanBlueprint = (blueprint: any): AutomationBlueprint | null => {
  try {
    if (!blueprint || typeof blueprint !== 'object') {
      return null;
    }

    const cleanedBlueprint: AutomationBlueprint = {
      version: blueprint.version || "1.0",
      description: blueprint.description || blueprint.summary || "YusrAI-generated automation",
      trigger: blueprint.trigger || { type: 'manual' },
      steps: []
    };

    // ENHANCED: Handle existing steps format with better validation
    if (blueprint.steps && Array.isArray(blueprint.steps)) {
      cleanedBlueprint.steps = blueprint.steps.map((step: any, index: number) => ({
        id: step.id || `step-${index + 1}`,
        name: step.name || step.action || step.step || `Step ${index + 1}`,
        type: step.type || 'action',
        action: step.action ? step.action : {
          integration: step.platform || step.integration || 'system',
          method: step.method || 'execute',
          parameters: { 
            description: step.name || step.action || `Step ${index + 1}`,
            ...(typeof step.parameters === 'object' && step.parameters !== null ? step.parameters : {})
          }
        },
        ...(typeof step === 'object' && step !== null ? step : {})
      }));
    } 
    // ENHANCED: Better workflow format handling in blueprint
    else if (blueprint.workflow && Array.isArray(blueprint.workflow)) {
      console.log('🔧 ENHANCED: Converting blueprint.workflow to steps format with improved processing');
      cleanedBlueprint.steps = blueprint.workflow.map((workflowItem: any, index: number) => {
        const stepName = workflowItem.action || workflowItem.step || workflowItem.name || `Step ${index + 1}`;
        
        return {
          id: workflowItem.id || `step-${index + 1}`,
          name: stepName,
          type: 'action' as const,
          action: {
            integration: workflowItem.platform || workflowItem.integration || 'system',
            method: workflowItem.method || workflowItem.action || 'execute',
            parameters: {
              description: stepName,
              platform: workflowItem.platform,
              base_url: workflowItem.base_url,
              endpoint: workflowItem.endpoint,
              method: workflowItem.method,
              headers: workflowItem.headers,
              data_mapping: workflowItem.data_mapping,
              ...(typeof workflowItem.parameters === 'object' && workflowItem.parameters !== null ? workflowItem.parameters : {}),
              ...(typeof workflowItem.config === 'object' && workflowItem.config !== null ? workflowItem.config : {})
            }
          },
          originalWorkflowData: workflowItem,
          platform: workflowItem.platform,
          platformDetails: workflowItem.config || workflowItem.headers
        };
      });
    }

    // ENHANCED: Preserve comprehensive blueprint data
    if (blueprint.variables) cleanedBlueprint.variables = blueprint.variables;
    if (blueprint.test_payloads) cleanedBlueprint.test_payloads = blueprint.test_payloads;
    if (blueprint.platforms) cleanedBlueprint.platforms = blueprint.platforms;
    if (blueprint.conditions) cleanedBlueprint.conditions = blueprint.conditions;
    if (blueprint.agents) cleanedBlueprint.agents = blueprint.agents;

    console.log(`✅ ENHANCED: Validated blueprint with ${cleanedBlueprint.steps.length} steps and enhanced metadata`);
    return cleanedBlueprint;

  } catch (error) {
    console.error('❌ ENHANCED: Error validating blueprint:', error);
    return null;
  }
};

/**
 * ENHANCED: Component-based blueprint construction with better error handling
 */
const constructBlueprintFromComponents = (structuredData: any): AutomationBlueprint => {
  const blueprint: AutomationBlueprint = {
    version: "1.0",
    description: structuredData.summary || structuredData.description || "YusrAI automation from components",
    trigger: {
      type: 'manual',
      platform: undefined
    },
    steps: []
  };

  let stepCounter = 1;

  // ENHANCED: Process YusrAI steps array with better type handling
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
          name: step.name || step.action || step.step || `Step ${index + 1}`,
          type: step.type || 'action',
          action: step.action || {
            integration: step.platform || step.integration || 'system',
            method: step.method || 'execute',
            parameters: { 
              description: step.name || step.action || `Step ${index + 1}`,
              ...(typeof step.parameters === 'object' && step.parameters !== null ? step.parameters : {})
            }
          },
          ...(typeof step === 'object' && step !== null ? step : {})
        });
      }
    });
  }

  // ENHANCED: Process YusrAI platforms to create integration steps
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

  // ENHANCED: Additional metadata from YusrAI responses - with proper optional checks
  if (structuredData.conditions) blueprint.conditions = structuredData.conditions;
  if (structuredData.agents) blueprint.agents = structuredData.agents;

  console.log(`🔧 ENHANCED: Constructed YusrAI blueprint with ${blueprint.steps.length} steps from components`);
  return blueprint;
};

/**
 * ENHANCED: Create minimal blueprint for basic responses
 */
const createMinimalBlueprint = (structuredData: any): AutomationBlueprint => {
  console.log('🔧 ENHANCED: Creating minimal blueprint from basic data');
  
  return {
    version: "1.0",
    description: structuredData.summary || structuredData.description || "Basic automation structure",
    trigger: { type: 'manual' },
    steps: [{
      id: "step-1",
      name: "Process Request",
      type: 'action' as const,
      action: {
        integration: 'system',
        method: 'process',
        parameters: {
          description: structuredData.summary || "Basic automation step"
        }
      }
    }]
  };
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
            ...(typeof workflowItem.parameters === 'object' && workflowItem.parameters !== null ? workflowItem.parameters : {})
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
