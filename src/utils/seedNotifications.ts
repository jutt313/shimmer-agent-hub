
import { createNotification } from './notificationHelpers';

export const seedExampleNotifications = async (userId: string): Promise<boolean> => {
  try {
    console.log('Starting to seed example notifications for user:', userId);

    const notifications = [
      {
        title: 'Welcome to the Platform!',
        message: 'Thank you for joining our automation platform. Get started by creating your first automation.',
        type: 'ai_agent' as const,
        category: 'welcome',
        metadata: { source: 'onboarding', priority: 'high' }
      },
      {
        title: 'Sample Automation Created',
        message: 'A sample "Lead Qualification Flow" automation has been created to help you get started.',
        type: 'automation_status' as const,
        category: 'creation',
        metadata: { automation_name: 'Lead Qualification Flow', sample: true }
      },
      {
        title: 'Platform Integration Available',
        message: 'You can now connect your CRM and email platforms to enhance your automations.',
        type: 'platform_integration' as const,
        category: 'info',
        metadata: { available_platforms: ['CRM', 'Email', 'Calendar'] }
      },
      {
        title: 'Knowledge Base Updated',
        message: 'New automation templates and best practices have been added to your knowledge base.',
        type: 'knowledge_system' as const,
        category: 'update',
        metadata: { new_entries: 5, category: 'templates' }
      },
      {
        title: 'Sample Automation Executed',
        message: 'Your sample automation ran successfully and processed 3 test leads.',
        type: 'automation_status' as const,
        category: 'execution',
        metadata: { leads_processed: 3, execution_time: '2.3s' }
      }
    ];

    for (const notification of notifications) {
      await createNotification(
        userId,
        notification.title,
        notification.message,
        notification.type,
        notification.category,
        notification.metadata
      );
      
      // Add small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Successfully seeded', notifications.length, 'example notifications');
    return true;
  } catch (error) {
    console.error('Error seeding example notifications:', error);
    return false;
  }
};
