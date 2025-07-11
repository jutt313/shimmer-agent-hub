
// Utility functions to trigger global notifications from anywhere in the app

export const triggerAutomationEvent = (
  action: 'automation_created' | 'automation_updated' | 'automation_executed' | 'credential_test' | 'diagram_generated' | 'ai_agent_created',
  data: any,
  error?: string
) => {
  window.dispatchEvent(new CustomEvent('automation-event', {
    detail: { action, data, error }
  }));
};

export const triggerGlobalError = (
  message: string,
  context?: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) => {
  window.dispatchEvent(new CustomEvent('global-error', {
    detail: { message, context, severity }
  }));
};

// Specific notification triggers
export const notifyAutomationCreated = (automationId: string, automationName: string) => {
  triggerAutomationEvent('automation_created', { id: automationId, name: automationName });
};

export const notifyAutomationUpdated = (automationId: string, automationName: string) => {
  triggerAutomationEvent('automation_updated', { id: automationId, name: automationName });
};

export const notifyAutomationExecuted = (
  automationId: string, 
  automationName: string, 
  success: boolean, 
  error?: string
) => {
  triggerAutomationEvent('automation_executed', { 
    id: automationId, 
    name: automationName, 
    success 
  }, error);
};

export const notifyCredentialTest = (
  platform: string,
  success: boolean,
  error?: string
) => {
  triggerAutomationEvent('credential_test', { platform, success }, error);
};

export const notifyDiagramGenerated = (success: boolean, error?: string) => {
  triggerAutomationEvent('diagram_generated', { success }, error);
};

export const notifyAIAgentCreated = (agentId: string, agentName: string) => {
  triggerAutomationEvent('ai_agent_created', { id: agentId, name: agentName });
};

// Error notification helpers
export const notifySystemError = (message: string, context?: any) => {
  triggerGlobalError(message, context, 'high');
};

export const notifyValidationError = (message: string, field?: string) => {
  triggerGlobalError(`Validation Error: ${message}`, { field }, 'medium');
};

export const notifyNetworkError = (message: string, endpoint?: string) => {
  triggerGlobalError(`Network Error: ${message}`, { endpoint }, 'high');
};

export const notifyAPIError = (message: string, api?: string, statusCode?: number) => {
  triggerGlobalError(`API Error: ${message}`, { api, statusCode }, 'high');
};
