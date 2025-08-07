
/**
 * Data Flow Validator - Ensures ChatAI data integrity throughout the application
 * This prevents data loss during transformations and provides debugging information
 */

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  dataStructure: any;
}

export class DataFlowValidator {
  /**
   * Validate ChatAI response structure
   */
  static validateChatAIResponse(response: any, stepName: string): ValidationResult {
    console.log(`🔍 Validating ChatAI data at step: ${stepName}`);
    
    const result: ValidationResult = {
      isValid: true,
      issues: [],
      warnings: [],
      dataStructure: {}
    };

    if (!response) {
      result.isValid = false;
      result.issues.push('Response is null or undefined');
      return result;
    }

    // Check for essential sections
    const essentialSections = ['summary', 'platforms_and_credentials'];
    essentialSections.forEach(section => {
      if (!response[section]) {
        result.warnings.push(`Missing ${section} in response`);
      } else {
        result.dataStructure[section] = typeof response[section];
      }
    });

    // Validate platforms data specifically
    if (response.platforms_and_credentials) {
      if (!Array.isArray(response.platforms_and_credentials)) {
        result.issues.push('platforms_and_credentials is not an array');
        result.isValid = false;
      } else {
        response.platforms_and_credentials.forEach((platform: any, index: number) => {
          if (!platform.platform) {
            result.warnings.push(`Platform at index ${index} missing name`);
          }
          if (!platform.credentials || !Array.isArray(platform.credentials)) {
            result.warnings.push(`Platform at index ${index} missing or invalid credentials`);
          }
        });
      }
    }

    // Check for AI agents
    if (!response.ai_agents && !response.agents) {
      result.warnings.push('No AI agents found in response');
    }

    // Check for test data
    if (!response.test_payloads) {
      result.warnings.push('No test payloads found in response');
    }

    console.log(`✅ Validation complete for ${stepName}:`, result);
    return result;
  }

  /**
   * Log data transformation step
   */
  static logDataTransformation(
    stepName: string, 
    inputData: any, 
    outputData: any, 
    transformation: string
  ) {
    console.group(`🔄 Data Transformation: ${stepName}`);
    console.log('Transformation:', transformation);
    console.log('Input keys:', inputData ? Object.keys(inputData) : 'null');
    console.log('Output keys:', outputData ? Object.keys(outputData) : 'null');
    
    // Check for data loss
    if (inputData && outputData) {
      const inputKeys = Object.keys(inputData);
      const outputKeys = Object.keys(outputData);
      const lostKeys = inputKeys.filter(key => !outputKeys.includes(key));
      
      if (lostKeys.length > 0) {
        console.warn('⚠️ Data loss detected! Lost keys:', lostKeys);
      }
    }
    
    console.groupEnd();
  }

  /**
   * Validate platform object for credential form
   */
  static validatePlatformForCredentialForm(platform: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      issues: [],
      warnings: [],
      dataStructure: {}
    };

    if (!platform) {
      result.isValid = false;
      result.issues.push('Platform object is null or undefined');
      return result;
    }

    if (!platform.name) {
      result.isValid = false;
      result.issues.push('Platform name is missing');
    }

    if (!platform.credentials || !Array.isArray(platform.credentials)) {
      result.isValid = false;
      result.issues.push('Platform credentials are missing or invalid');
    }

    // Check for ChatAI test data
    if (platform.testConfig) {
      result.dataStructure.hasTestConfig = true;
      console.log('✅ ChatAI testConfig found for platform:', platform.name);
    }

    if (platform.test_payloads && Array.isArray(platform.test_payloads)) {
      result.dataStructure.hasTestPayloads = true;
      result.dataStructure.testPayloadsCount = platform.test_payloads.length;
      console.log('✅ ChatAI test_payloads found for platform:', platform.name, platform.test_payloads.length);
    }

    console.log(`🎯 Platform validation for ${platform.name || 'Unknown'}:`, result);
    return result;
  }

  /**
   * Validate credential field structure
   */
  static validateCredentialFields(credentials: any[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      issues: [],
      warnings: [],
      dataStructure: {}
    };

    if (!Array.isArray(credentials)) {
      result.isValid = false;
      result.issues.push('Credentials is not an array');
      return result;
    }

    credentials.forEach((cred, index) => {
      if (!cred.field) {
        result.issues.push(`Credential at index ${index} missing field name`);
        result.isValid = false;
      }

      // Check for hardcoded fallback indicators
      if (cred.link && cred.link.includes('api.') && cred.link.endsWith('.com')) {
        result.warnings.push(`Credential at index ${index} has generic link: ${cred.link}`);
      }

      if (cred.why_needed && cred.why_needed.includes('Required for') && cred.why_needed.includes('integration')) {
        result.warnings.push(`Credential at index ${index} has generic why_needed text`);
      }
    });

    result.dataStructure.credentialCount = credentials.length;
    console.log('🔍 Credential fields validation:', result);
    return result;
  }
}
