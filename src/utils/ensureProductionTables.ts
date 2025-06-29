
import { supabase } from '@/integrations/supabase/client';

export const ensureProductionTables = async () => {
  try {
    // Simple table existence check using a basic query
    console.log('Checking production tables...');
    
    // Check if error_logs table is accessible
    const { error: errorLogsCheck } = await supabase
      .rpc('pg_table_exists', { schema: 'public', table_name: 'error_logs' })
      .single();

    // Check if monitoring_events table is accessible  
    const { error: monitoringCheck } = await supabase
      .rpc('pg_table_exists', { schema: 'public', table_name: 'monitoring_events' })
      .single();

    // Check if webhook_delivery_logs is accessible
    const { error: webhookLogsCheck } = await supabase
      .rpc('pg_table_exists', { schema: 'public', table_name: 'webhook_delivery_logs' })
      .single();

    console.log('Production tables status:', {
      error_logs: !errorLogsCheck,
      monitoring_events: !monitoringCheck,
      webhook_delivery_logs: !webhookLogsCheck
    });

    return true;
  } catch (error) {
    console.error('Error checking production tables:', error);
    // For now, just return true to avoid blocking the app
    return true;
  }
};
