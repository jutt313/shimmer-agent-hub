
import { supabase } from '@/integrations/supabase/client';
import { createNotification, notificationTemplates } from './notificationHelpers';

// Diagram Generation Notifications
export const triggerDiagramGenerationNotification = async (userId: string, automationName: string, success: boolean, details?: string) => {
  try {
    const template = success 
      ? {
          title: 'Diagram Generated Successfully',
          message: `Diagram for automation "${automationName}" has been generated successfully.`,
          type: 'automation_status' as const,
          category: 'diagram_generation'
        }
      : {
          title: 'Diagram Generation Failed',
          message: `Failed to generate diagram for automation "${automationName}". ${details || 'Please try again.'}`,
          type: 'error' as const,
          category: 'diagram_generation'
        };

    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { automation_name: automationName, success, details }
    );
    console.log('Diagram generation notification sent');
  } catch (error) {
    console.error('Error sending diagram generation notification:', error);
  }
};

// Blueprint Creation Notifications
export const triggerBlueprintNotification = async (userId: string, automationName: string, action: 'created' | 'updated' | 'failed', details?: string) => {
  try {
    let template;
    switch (action) {
      case 'created':
        template = {
          title: 'Blueprint Created Successfully',
          message: `Blueprint for automation "${automationName}" has been created successfully.`,
          type: 'automation_status' as const,
          category: 'blueprint_creation'
        };
        break;
      case 'updated':
        template = {
          title: 'Blueprint Updated Successfully',
          message: `Blueprint for automation "${automationName}" has been updated successfully.`,
          type: 'automation_status' as const,
          category: 'blueprint_update'
        };
        break;
      case 'failed':
        template = {
          title: 'Blueprint Operation Failed',
          message: `Blueprint operation for automation "${automationName}" failed. ${details || 'Please check your configuration.'}`,
          type: 'error' as const,
          category: 'blueprint_error'
        };
        break;
    }

    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { automation_name: automationName, action, details }
    );
    console.log(`Blueprint ${action} notification sent`);
  } catch (error) {
    console.error(`Error sending blueprint ${action} notification:`, error);
  }
};

// File Upload/Processing Notifications
export const triggerFileProcessingNotification = async (userId: string, fileName: string, success: boolean, details?: string) => {
  try {
    const template = success
      ? {
          title: 'File Processed Successfully',
          message: `File "${fileName}" has been processed successfully.`,
          type: 'knowledge_system' as const,
          category: 'file_processing'
        }
      : {
          title: 'File Processing Failed',
          message: `Failed to process file "${fileName}". ${details || 'Please check the file format and try again.'}`,
          type: 'error' as const,
          category: 'file_processing'
        };

    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { file_name: fileName, success, details }
    );
    console.log('File processing notification sent');
  } catch (error) {
    console.error('Error sending file processing notification:', error);
  }
};

// Webhook Event Notifications
export const triggerWebhookEventNotification = async (userId: string, webhookName: string, eventType: string, success: boolean, details?: string) => {
  try {
    const template = success
      ? {
          title: 'Webhook Event Processed',
          message: `Webhook "${webhookName}" processed ${eventType} event successfully.`,
          type: 'platform_integration' as const,
          category: 'webhook_event'
        }
      : {
          title: 'Webhook Event Failed',
          message: `Webhook "${webhookName}" failed to process ${eventType} event. ${details || 'Please check webhook configuration.'}`,
          type: 'error' as const,
          category: 'webhook_error'
        };

    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { webhook_name: webhookName, event_type: eventType, success, details }
    );
    console.log('Webhook event notification sent');
  } catch (error) {
    console.error('Error sending webhook event notification:', error);
  }
};

// System Performance Notifications
export const triggerPerformanceNotification = async (userId: string, metricType: string, value: number, threshold: number) => {
  try {
    const isWarning = value > threshold;
    const template = {
      title: isWarning ? 'Performance Warning' : 'Performance Update',
      message: `${metricType} is ${isWarning ? 'above' : 'within'} normal levels: ${value}${metricType.includes('memory') ? 'MB' : metricType.includes('cpu') ? '%' : 'ms'}`,
      type: isWarning ? 'error' as const : 'automation_status' as const,
      category: 'performance_monitoring'
    };

    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { metric_type: metricType, value, threshold, is_warning: isWarning }
    );
    console.log('Performance notification sent');
  } catch (error) {
    console.error('Error sending performance notification:', error);
  }
};

// API Rate Limit Notifications
export const triggerRateLimitNotification = async (userId: string, apiName: string, remainingCalls: number, resetTime?: string) => {
  try {
    const isWarning = remainingCalls < 100;
    const template = {
      title: isWarning ? 'API Rate Limit Warning' : 'API Usage Update',
      message: `${apiName} API has ${remainingCalls} calls remaining${resetTime ? `. Resets at ${resetTime}` : ''}.`,
      type: isWarning ? 'error' as const : 'platform_integration' as const,
      category: 'rate_limit'
    };

    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { api_name: apiName, remaining_calls: remainingCalls, reset_time: resetTime, is_warning: isWarning }
    );
    console.log('Rate limit notification sent');
  } catch (error) {
    console.error('Error sending rate limit notification:', error);
  }
};

// Security Event Notifications
export const triggerSecurityNotification = async (userId: string, eventType: string, severity: 'low' | 'medium' | 'high' | 'critical', details: string) => {
  try {
    const template = {
      title: `Security ${severity === 'critical' ? 'Alert' : 'Event'}: ${eventType}`,
      message: `Security event detected: ${details}`,
      type: 'error' as const,
      category: 'security_event'
    };

    await createNotification(
      userId,
      template.title,
      template.message,
      template.type,
      template.category,
      { event_type: eventType, severity, details }
    );
    console.log('Security notification sent');
  } catch (error) {
    console.error('Error sending security notification:', error);
  }
};
