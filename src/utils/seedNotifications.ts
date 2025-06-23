
import { createNotification, notificationTemplates } from './notificationHelpers';

export const seedExampleNotifications = async (userId: string) => {
  try {
    console.log('🌱 Seeding example notifications for user:', userId);

    // Create various types of notifications to demonstrate the system
    const notifications = [
      {
        ...notificationTemplates.automationCreated('Email Marketing Automation'),
        metadata: { automation_id: 'example-1', automation_title: 'Email Marketing Automation' }
      },
      {
        ...notificationTemplates.automationRunCompleted('Lead Qualification Flow'),
        metadata: { automation_id: 'example-2', automation_title: 'Lead Qualification Flow', run_id: 'run-123' }
      },
      {
        ...notificationTemplates.aiAgentCreated('Customer Support Agent'),
        metadata: { agent_id: 'agent-1', agent_name: 'Customer Support Agent' }
      },
      {
        ...notificationTemplates.platformCredentialTest('Gmail', true),
        metadata: { platform: 'Gmail', test_result: 'success' }
      },
      {
        ...notificationTemplates.knowledgeEntryAdded('API Integration Best Practices'),
        metadata: { entry_id: 'knowledge-1', entry_title: 'API Integration Best Practices' }
      },
      {
        ...notificationTemplates.automationRunFailed('Data Sync Automation', 'API rate limit exceeded'),
        metadata: { automation_id: 'example-3', automation_title: 'Data Sync Automation', error: 'API rate limit exceeded' }
      },
      {
        ...notificationTemplates.criticalError('Database connection timeout'),
        metadata: { error_type: 'database', component: 'connection_pool' }
      }
    ];

    // Create notifications with slight delays to show realistic timing
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      await createNotification(
        userId,
        notification.title,
        notification.message,
        notification.type,
        notification.category,
        notification.metadata
      );
      
      // Add small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('✅ Example notifications seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    return false;
  }
};
