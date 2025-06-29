
import { supabase } from '@/integrations/supabase/client';

export const ensureProductionTables = async () => {
  try {
    // Check if error_logs table exists, if not it will be created via migration
    const { error: errorLogsCheck } = await supabase
      .from('error_logs')
      .select('id')
      .limit(1);

    // Check if monitoring_events table exists
    const { error: monitoringCheck } = await supabase
      .from('monitoring_events')
      .select('id')
      .limit(1);

    // Check if webhook_delivery_logs exists
    const { error: webhookLogsCheck } = await supabase
      .from('webhook_delivery_logs')
      .select('id')
      .limit(1);

    console.log('Production tables status:', {
      error_logs: !errorLogsCheck,
      monitoring_events: !monitoringCheck,
      webhook_delivery_logs: !webhookLogsCheck
    });

    return true;
  } catch (error) {
    console.error('Error checking production tables:', error);
    return false;
  }
};
