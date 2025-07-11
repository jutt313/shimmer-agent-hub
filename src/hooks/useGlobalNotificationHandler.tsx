
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/utils/notificationHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export const useGlobalNotificationHandler = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  const createNotificationFromError = useCallback(async (
    title: string,
    message: string,
    type: 'automation_status' | 'error' | 'ai_agent' | 'platform_integration' | 'knowledge_system' = 'error',
    category: string = 'general',
    metadata: any = {}
  ) => {
    if (!user?.id) return;

    try {
      await createNotification(
        user.id,
        title,
        message,
        type,
        category,
        {
          ...metadata,
          timestamp: new Date().toISOString(),
          source: 'global_handler'
        }
      );
      console.log('Global notification created:', { title, message, type });
    } catch (error) {
      console.error('Failed to create global notification:', error);
    }
  }, [user]);

  // Handle automation-related notifications
  const handleAutomationNotification = useCallback(async (event: CustomEvent) => {
    const { action, data, error } = event.detail;
    
    switch (action) {
      case 'automation_created':
        await createNotificationFromError(
          'Automation Created Successfully',
          `Your automation "${data.name}" has been created and is ready to use.`,
          'automation_status',
          'creation',
          { automation_id: data.id, automation_name: data.name }
        );
        break;
      
      case 'automation_updated':
        await createNotificationFromError(
          'Automation Updated',
          `Your automation "${data.name}" has been updated successfully.`,
          'automation_status',
          'update',
          { automation_id: data.id, automation_name: data.name }
        );
        break;
      
      case 'automation_executed':
        await createNotificationFromError(
          data.success ? 'Automation Completed Successfully' : 'Automation Execution Failed',
          data.success 
            ? `Your automation "${data.name}" executed successfully.`
            : `Your automation "${data.name}" failed: ${error || 'Unknown error'}`,
          'automation_status',
          'execution',
          { 
            automation_id: data.id, 
            automation_name: data.name,
            success: data.success,
            error: error
          }
        );
        break;
      
      case 'credential_test':
        await createNotificationFromError(
          data.success ? 'Credential Test Successful' : 'Credential Test Failed',
          data.success
            ? `Your ${data.platform} credentials are working correctly.`
            : `Your ${data.platform} credentials test failed: ${error || 'Please check your configuration'}`,
          'platform_integration',
          'credential_test',
          {
            platform: data.platform,
            success: data.success,
            error: error
          }
        );
        break;
      
      case 'diagram_generated':
        await createNotificationFromError(
          data.success ? 'Diagram Generated Successfully' : 'Diagram Generation Failed',
          data.success
            ? 'Your automation diagram has been generated successfully.'
            : `Diagram generation failed: ${error || 'Please try again'}`,
          'automation_status',
          'diagram',
          {
            success: data.success,
            error: error
          }
        );
        break;
      
      case 'ai_agent_created':
        await createNotificationFromError(
          'AI Agent Created Successfully',
          `Your AI agent "${data.name}" has been created and configured.`,
          'ai_agent',
          'creation',
          { agent_id: data.id, agent_name: data.name }
        );
        break;
      
      default:
        console.log('Unhandled automation notification:', action, data);
    }
  }, [createNotificationFromError]);

  // Handle global errors
  const handleGlobalError = useCallback(async (event: CustomEvent) => {
    const { message, context, severity = 'medium' } = event.detail;
    
    await createNotificationFromError(
      'System Error Detected',
      message,
      'error',
      'system_error',
      {
        context,
        severity,
        timestamp: new Date().toISOString()
      }
    );
  }, [createNotificationFromError]);

  useEffect(() => {
    // Listen for automation events
    window.addEventListener('automation-event', handleAutomationNotification as EventListener);
    
    // Listen for global errors
    window.addEventListener('global-error', handleGlobalError as EventListener);
    
    // Override console.error to catch unhandled errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      
      // Create notification for console errors
      if (args.length > 0 && typeof args[0] === 'string') {
        const errorMessage = args[0];
        if (!errorMessage.includes('Warning:') && !errorMessage.includes('Download the React DevTools')) {
          createNotificationFromError(
            'Application Error',
            errorMessage.substring(0, 200),
            'error',
            'console_error',
            { full_error: args.join(' ') }
          );
        }
      }
    };

    return () => {
      window.removeEventListener('automation-event', handleAutomationNotification as EventListener);
      window.removeEventListener('global-error', handleGlobalError as EventListener);
      console.error = originalConsoleError;
    };
  }, [handleAutomationNotification, handleGlobalError]);

  return {
    createNotificationFromError
  };
};
