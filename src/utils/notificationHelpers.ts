
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
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          type,
          category,
          metadata
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const notificationTemplates = {
  automationCreated: (automationName: string) => ({
    title: 'Automation Created',
    message: `Your automation "${automationName}" has been created successfully.`,
    type: 'automation_status' as const,
    category: 'creation'
  }),
  
  automationRunStarted: (automationName: string) => ({
    title: 'Automation Started',
    message: `Your automation "${automationName}" has started running.`,
    type: 'automation_status' as const,
    category: 'execution'
  }),
  
  automationRunCompleted: (automationName: string) => ({
    title: 'Automation Completed',
    message: `Your automation "${automationName}" has completed successfully.`,
    type: 'automation_status' as const,
    category: 'execution'
  }),
  
  automationRunFailed: (automationName: string, error: string) => ({
    title: 'Automation Failed',
    message: `Your automation "${automationName}" failed: ${error}`,
    type: 'automation_status' as const,
    category: 'error'
  }),
  
  criticalError: (errorMessage: string) => ({
    title: 'Critical Error Detected',
    message: `A critical error has been detected: ${errorMessage}`,
    type: 'error' as const,
    category: 'critical'
  }),
  
  aiAgentCreated: (agentName: string) => ({
    title: 'AI Agent Created',
    message: `Your AI agent "${agentName}" has been created and configured successfully.`,
    type: 'ai_agent' as const,
    category: 'creation'
  }),
  
  platformCredentialTest: (platform: string, success: boolean) => ({
    title: success ? 'Platform Test Successful' : 'Platform Test Failed',
    message: success 
      ? `Your ${platform} credentials are working correctly.`
      : `Your ${platform} credentials test failed. Please check your configuration.`,
    type: 'platform_integration' as const,
    category: success ? 'success' : 'error'
  }),
  
  knowledgeEntryAdded: (title: string) => ({
    title: 'Knowledge Entry Added',
    message: `New knowledge entry "${title}" has been added to your knowledge base.`,
    type: 'knowledge_system' as const,
    category: 'addition'
  })
};
