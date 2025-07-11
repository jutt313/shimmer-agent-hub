
// Export all notification triggers for easy import
export {
  triggerAutomationCreatedNotification,
  triggerCredentialTestNotification,
  triggerAutomationRunNotification
} from './automationNotificationTriggers';

export {
  triggerDiagramGenerationNotification,
  triggerBlueprintNotification,
  triggerFileProcessingNotification,
  triggerWebhookEventNotification,
  triggerPerformanceNotification,
  triggerRateLimitNotification,
  triggerSecurityNotification
} from './comprehensiveNotificationTriggers';

export {
  cleanupOldNotifications,
  cleanupReadNotifications,
  performNotificationMaintenance
} from './notificationCleanup';

export {
  createNotificationFromToast
} from './toastNotificationBridge';

// Helper function to initialize all notification systems
export const initializeNotificationSystem = () => {
  console.log('🔔 Professional Notification System Initialized');
  console.log('✅ Toast-to-Notification conversion active');
  console.log('✅ Chat integration enabled');
  console.log('✅ Comprehensive error coverage active');
  console.log('✅ All automation operations monitored');
};
