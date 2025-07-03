
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🔧 UPDATING WEBHOOK URL GENERATOR FUNCTION');
    
    // Update the generate_webhook_url function to use the correct Supabase domain
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.generate_webhook_url(automation_id uuid)
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          webhook_id TEXT;
          base_url TEXT := 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/webhook-trigger/';
        BEGIN
          webhook_id := encode(gen_random_bytes(16), 'hex');
          RETURN base_url || webhook_id || '?automation_id=' || automation_id::text;
        END;
        $$;
      `
    })

    if (error) {
      console.error('❌ Failed to update webhook URL generator:', error);
      throw error;
    }

    console.log('✅ WEBHOOK URL GENERATOR UPDATED SUCCESSFULLY');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Webhook URL generator updated to use correct Supabase domain'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('💥 CRITICAL ERROR updating webhook generator:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to update webhook URL generator'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
