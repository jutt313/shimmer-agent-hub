
import { supabase } from '@/integrations/supabase/client';
import { createNotification, notificationTemplates } from './notificationHelpers';

export const triggerAutomationCreatedNotification = async (userId: string, automationName: string) => {
  try {
    const template = notificationTemplates.automationCreated(automationName);
    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { automation_name: automationName }
    );
    console.log('Automation created notification sent');
  } catch (error) {
    console.error('Error sending automation created notification:', error);
  }
};

export const triggerCredentialTestNotification = async (userId: string, platform: string, success: boolean) => {
  try {
    const template = notificationTemplates.platformCredentialTest(platform, success);
    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { platform, test_result: success }
    );
    console.log('Credential test notification sent');
  } catch (error) {
    console.error('Error sending credential test notification:', error);
  }
};

export const triggerAutomationRunNotification = async (userId: string, automationName: string, status: 'started' | 'completed' | 'failed', details?: string) => {
  try {
    let template;
    switch (status) {
      case 'started':
        template = notificationTemplates.automationRunStarted(automationName);
        break;
      case 'completed':
        template = notificationTemplates.automationRunCompleted(automationName, details);
        break;
      case 'failed':
        template = notificationTemplates.automationRunFailed(automationName, details || 'Unknown error');
        break;
    }
    
    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { automation_name: automationName, status, details }
    );
    console.log(`Automation ${status} notification sent`);
  } catch (error) {
    console.error(`Error sending automation ${status} notification:`, error);
  }
};
