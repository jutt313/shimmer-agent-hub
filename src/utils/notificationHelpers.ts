
import { supabase } from '@/integrations/supabase/client';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'automation_status' | 'error' | 'ai_agent' | 'platform_integration' | 'knowledge_system',
  category: string,
  metadata: any = {}
) => {
  try {
    // Use the edge function instead of direct database insertion to bypass RLS
    const { data, error } = await supabase.functions.invoke('create-notification', {
      body: {
        userId,
        title,
        message,
        type,
        category,
        metadata
      }
    });

    if (error) throw error;
    return data.notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const notificationTemplates = {
  // Automation Status Notifications
  automationCreated: (automationName: string) => ({
    title: 'New Automation Created Successfully',
    message: `Your automation "${automationName}" has been created and is ready to use.`,
    type: 'automation_status' as const,
    category: 'creation'
  }),
  
  automationRunStarted: (automationName: string) => ({
    title: 'Automation Run Started',
    message: `Your automation "${automationName}" has started running.`,
    type: 'automation_status' as const,
    category: 'execution'
  }),
  
  automationRunCompleted: (automationName: string, results?: string) => ({
    title: 'Automation Completed Successfully',
    message: `Your automation "${automationName}" has completed successfully.${results ? ` ${results}` : ''}`,
    type: 'automation_status' as const,
    category: 'execution'
  }),
  
  automationRunFailed: (automationName: string, error: string) => ({
    title: 'Automation Run Failed',
    message: `Your automation "${automationName}" failed to complete: ${error}`,
    type: 'automation_status' as const,
    category: 'error'
  }),

  automationPaused: (automationName: string) => ({
    title: 'Automation Paused',
    message: `Your automation "${automationName}" has been paused.`,
    type: 'automation_status' as const,
    category: 'status_change'
  }),

  automationResumed: (automationName: string) => ({
    title: 'Automation Resumed',
    message: `Your automation "${automationName}" has been resumed and is now active.`,
    type: 'automation_status' as const,
    category: 'status_change'
  }),
  
  // Error Notifications
  criticalError: (errorMessage: string) => ({
    title: 'Critical Error Detected',
    message: `A critical error has been detected in your application: ${errorMessage}`,
    type: 'error' as const,
    category: 'critical'
  }),

  errorAnalysisAvailable: (errorDetails: string) => ({
    title: 'Error Analysis Available',
    message: `AI analysis is available for your recent error: ${errorDetails}`,
    type: 'error' as const,
    category: 'analysis'
  }),

  errorResolved: (errorType: string) => ({
    title: 'Error Resolved',
    message: `The ${errorType} error has been successfully resolved.`,
    type: 'error' as const,
    category: 'resolution'
  }),
  
  // AI Agent Notifications
  aiAgentCreated: (agentName: string) => ({
    title: 'New AI Agent Created',
    message: `Your AI agent "${agentName}" has been created and configured successfully.`,
    type: 'ai_agent' as const,
    category: 'creation'
  }),

  aiAgentConfigured: (agentName: string) => ({
    title: 'AI Agent Configured Successfully',
    message: `Your AI agent "${agentName}" has been configured and is ready to use.`,
    type: 'ai_agent' as const,
    category: 'configuration'
  }),

  aiAgentTestSuccess: (agentName: string) => ({
    title: 'Agent Testing Successful',
    message: `Your AI agent "${agentName}" has passed all tests and is working correctly.`,
    type: 'ai_agent' as const,
    category: 'testing'
  }),

  aiAgentTestFailed: (agentName: string, reason: string) => ({
    title: 'Agent Testing Failed',
    message: `Your AI agent "${agentName}" testing failed: ${reason}`,
    type: 'ai_agent' as const,
    category: 'testing'
  }),

  aiAgentPerformanceAlert: (agentName: string, successRate: number) => ({
    title: 'Agent Performance Alert',
    message: `Your AI agent "${agentName}" has a low success rate of ${successRate}%. Consider reviewing its configuration.`,
    type: 'ai_agent' as const,
    category: 'performance'
  }),

  // Memory/Knowledge Notifications
  memoryAdded: (title: string) => ({
    title: 'Memory Added Successfully',
    message: `New memory entry "${title}" has been added to your agent's knowledge base.`,
    type: 'knowledge_system' as const,
    category: 'addition'
  }),

  knowledgeEntryAdded: (title: string) => ({
    title: 'Knowledge Entry Added',
    message: `New knowledge entry "${title}" has been added to your knowledge base.`,
    type: 'knowledge_system' as const,
    category: 'addition'
  }),

  knowledgeUpdateSuggested: (topic: string) => ({
    title: 'Knowledge Update Available',
    message: `We've suggested updates for your knowledge base on "${topic}". Review them to improve your automations.`,
    type: 'knowledge_system' as const,
    category: 'suggestion'
  }),

  knowledgeUsageSpike: (entryTitle: string, usageCount: number) => ({
    title: 'Knowledge Entry Usage Spike',
    message: `Your knowledge entry "${entryTitle}" has been accessed ${usageCount} times recently. Consider expanding it.`,
    type: 'knowledge_system' as const,
    category: 'analytics'
  }),
  
  // Platform Integration Notifications
  platformCredentialTest: (platform: string, success: boolean) => ({
    title: success ? 'Platform Credentials Test Successful' : 'Platform Credentials Test Failed',
    message: success 
      ? `Your ${platform} credentials are working correctly and the connection is established.`
      : `Your ${platform} credentials test failed. Please check your configuration and try again.`,
    type: 'platform_integration' as const,
    category: success ? 'success' : 'error'
  }),

  platformApiRateLimit: (platform: string, resetTime?: string) => ({
    title: 'Platform API Rate Limit Reached',
    message: `Your ${platform} API rate limit has been reached.${resetTime ? ` It will reset at ${resetTime}.` : ' Please wait before making more requests.'}`,
    type: 'platform_integration' as const,
    category: 'rate_limit'
  }),

  platformIntegrationAvailable: (platform: string) => ({
    title: 'Platform Integration Available',
    message: `New integration with ${platform} is now available. Connect your account to unlock new automation possibilities.`,
    type: 'platform_integration' as const,
    category: 'availability'
  }),

  platformConnectionLost: (platform: string) => ({
    title: 'Platform Connection Lost',
    message: `Connection to ${platform} has been lost. Please check your credentials and reconnect.`,
    type: 'platform_integration' as const,
    category: 'connection_error'
  }),

  platformConnectionRestored: (platform: string) => ({
    title: 'Platform Connection Restored',
    message: `Connection to ${platform} has been successfully restored.`,
    type: 'platform_integration' as const,
    category: 'connection_success'
  })
};
