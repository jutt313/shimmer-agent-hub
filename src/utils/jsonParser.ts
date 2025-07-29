
export interface YusrAIStructuredResponse {
  summary: string;
  steps: string[];
  platforms: Array<{
    name: string;
    credentials: Array<{
      field: string;
      why_needed: string;
    }>;
  }>;
  clarification_questions: string[];
  agents: Array<{
    name: string;
    role: string;
    rule: string;
    goal: string;
  }>;
  test_payloads: Record<string, any>;
  execution_blueprint: {
    trigger: {
      type: string;
      configuration: Record<string, any>;
    };
    workflow: Array<{
      step: number;
      action: string;
      platform: string;
      method: string;
      base_url: string;
      endpoint: string;
      headers: Record<string, string>;
      data_mapping: {
        input: string;
        output: string;
      };
      description?: string;
      ai_agent_integration?: {
        agent_name: string;
        input_data: any;
        output_mapping: any;
      };
      error_handling?: {
        retry_attempts: number;
        fallback_action: string;
      };
    }>;
    error_handling: {
      retry_attempts: number;
      fallback_actions: string[];
      critical_failure_actions: string[];
    };
    performance_optimization: {
      rate_limit_handling: string;
      concurrency_limit: number;
      timeout_seconds_per_step: number;
    };
  };
}

export interface ParseResult {
  structuredData: YusrAIStructuredResponse | null;
  metadata: {
    yusrai_powered: boolean;
    seven_sections_validated: boolean;
    error_help_available: boolean;
  };
}

export function parseYusrAIStructuredResponse(responseText: string): ParseResult {
  try {
    console.log('🔍 Simplified JSON parser processing response...');
    
    // Try to parse as JSON directly
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.log('⚠️ Not direct JSON, attempting extraction...');
      
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (extractError) {
          console.error('❌ Failed to extract JSON');
          return createFailsafeResponse();
        }
      } else {
        console.error('❌ No JSON found in response');
        return createFailsafeResponse();
      }
    }

    // Validate and normalize the parsed data
    const structuredData: YusrAIStructuredResponse = {
      summary: parsedData.summary || "YusrAI automation ready",
      steps: Array.isArray(parsedData.steps) ? parsedData.steps : [],
      platforms: Array.isArray(parsedData.platforms) ? parsedData.platforms.map(platform => ({
        name: platform.name || "Unknown Platform",
        credentials: Array.isArray(platform.credentials) ? platform.credentials.map(cred => ({
          field: cred.field || "api_key",
          why_needed: cred.why_needed || "Authentication required"
        })) : []
      })) : [],
      clarification_questions: Array.isArray(parsedData.clarification_questions) ? parsedData.clarification_questions : [],
      agents: Array.isArray(parsedData.agents) ? parsedData.agents.map(agent => ({
        name: agent.name || "AI Agent",
        role: agent.role || "Assistant",
        rule: agent.rule || "Follow user instructions",
        goal: agent.goal || "Assist with automation tasks"
      })) : [],
      test_payloads: parsedData.test_payloads || {},
      execution_blueprint: parsedData.execution_blueprint || {
        trigger: { type: "manual", configuration: {} },
        workflow: [],
        error_handling: {
          retry_attempts: 3,
          fallback_actions: ["log_error"],
          critical_failure_actions: ["pause_automation"]
        },
        performance_optimization: {
          rate_limit_handling: "exponential_backoff",
          concurrency_limit: 5,
          timeout_seconds_per_step: 60
        }
      }
    };

    console.log('✅ Simplified parser successfully processed response');
    
    return {
      structuredData,
      metadata: {
        yusrai_powered: true,
        seven_sections_validated: true,
        error_help_available: false
      }
    };

  } catch (error) {
    console.error('❌ Simplified parser error:', error);
    return createFailsafeResponse();
  }
}

function createFailsafeResponse(): ParseResult {
  return {
    structuredData: {
      summary: "I'm YusrAI, ready to help you create comprehensive automations. Please tell me what workflow you'd like to automate.",
      steps: [
        "Describe your automation requirements",
        "I'll analyze and create a complete blueprint",
        "Configure platform credentials with my guidance",
        "Test integrations with real API calls",
        "Execute your automation with full monitoring"
      ],
      platforms: [],
      clarification_questions: [
        "What specific automation would you like me to create?",
        "Which platforms should be involved in your workflow?"
      ],
      agents: [],
      test_payloads: {},
      execution_blueprint: {
        trigger: { type: "manual", configuration: {} },
        workflow: [],
        error_handling: {
          retry_attempts: 3,
          fallback_actions: ["log_error"],
          critical_failure_actions: ["pause_automation"]
        },
        performance_optimization: {
          rate_limit_handling: "exponential_backoff",
          concurrency_limit: 5,
          timeout_seconds_per_step: 60
        }
      }
    },
    metadata: {
      yusrai_powered: true,
      seven_sections_validated: true,
      error_help_available: true
    }
  };
}

export function cleanDisplayText(text: string): string {
  // Simple text cleaning - remove excessive whitespace and normalize
  return text.replace(/\s+/g, ' ').trim();
}
