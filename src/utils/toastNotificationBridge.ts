
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from './notificationHelpers';

export interface ToastNotificationData {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export const createNotificationFromToast = async (
  userId: string | undefined,
  toastData: ToastNotificationData
) => {
  if (!userId || !toastData.title) return;

  // Determine notification type and category based on toast variant and content
  const isError = toastData.variant === 'destructive' || 
                  toastData.title.toLowerCase().includes('error') ||
                  toastData.title.toLowerCase().includes('failed') ||
                  toastData.title.toLowerCase().includes('problem');

  const isSuccess = toastData.title.toLowerCase().includes('success') ||
                    toastData.title.toLowerCase().includes('completed') ||
                    toastData.title.toLowerCase().includes('saved') ||
                    toastData.title.toLowerCase().includes('created');

  const isCredentialRelated = toastData.title.toLowerCase().includes('credential') ||
                              toastData.title.toLowerCase().includes('token') ||
                              toastData.title.toLowerCase().includes('connection');

  const isAutomationRelated = toastData.title.toLowerCase().includes('automation') ||
                              toastData.title.toLowerCase().includes('execution') ||
                              toastData.title.toLowerCase().includes('run');

  const isAIAgentRelated = toastData.title.toLowerCase().includes('agent') ||
                           toastData.title.toLowerCase().includes('ai') ||
                           toastData.title.toLowerCase().includes('chat');

  // Determine notification type
  let notificationType: 'automation_status' | 'error' | 'ai_agent' | 'platform_integration' | 'knowledge_system';
  let category: string;

  if (isError) {
    notificationType = 'error';
    category = 'system_error';
  } else if (isCredentialRelated) {
    notificationType = 'platform_integration';
    category = isSuccess ? 'success' : 'configuration';
  } else if (isAutomationRelated) {
    notificationType = 'automation_status';
    category = isSuccess ? 'execution' : 'error';
  } else if (isAIAgentRelated) {
    notificationType = 'ai_agent';
    category = isSuccess ? 'creation' : 'testing';
  } else {
    notificationType = 'knowledge_system';
    category = isSuccess ? 'addition' : 'general';
  }

  try {
    await createNotification(
      userId,
      toastData.title,
      toastData.description || toastData.title,
      notificationType,
      category,
      {
        source: 'toast_conversion',
        variant: toastData.variant,
        timestamp: new Date().toISOString()
      }
    );
    console.log('Toast converted to notification:', toastData.title);
  } catch (error) {
    console.error('Failed to create notification from toast:', error);
  }
};
