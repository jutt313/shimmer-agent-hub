import { supabase } from '@/integrations/supabase/client';

export const cleanupOldNotifications = async (userId: string, daysToKeep: number = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;

    console.log(`Cleaned up notifications older than ${daysToKeep} days for user ${userId}`);
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
  }
};

export const cleanupReadNotifications = async (userId: string, keepCount: number = 50) => {
  try {
    // Get read notifications beyond the keep count
    const { data: notificationsToDelete, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('is_read', true)
      .order('created_at', { ascending: false })
      .range(keepCount, 1000);

    if (fetchError) throw fetchError;

    if (notificationsToDelete && notificationsToDelete.length > 0) {
      const idsToDelete = notificationsToDelete.map(n => n.id);
      
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      console.log(`Cleaned up ${notificationsToDelete.length} old read notifications for user ${userId}`);
    }
  } catch (error) {
    console.error('Error cleaning up read notifications:', error);
  }
};

// Auto-cleanup function to be called periodically
export const performNotificationMaintenance = async (userId: string) => {
  await Promise.all([
    cleanupOldNotifications(userId, 30), // Keep 30 days
    cleanupReadNotifications(userId, 50)  // Keep 50 most recent read notifications
  ]);
};
