
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const url = new URL(req.url);
    const automationId = url.searchParams.get('automation_id');

    if (!automationId) {
      return new Response(
        JSON.stringify({ error: 'Missing automation_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get webhook payload
    let payload;
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    // Validate payload size (max 1MB)
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Payload size exceeds 1MB limit' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔗 Webhook triggered for automation ${automationId}`);

    // Get automation details
    const { data: automation, error: automationError } = await supabaseClient
      .from('automations')
      .select('id, title, user_id, automation_blueprint, status')
      .eq('id', automationId)
      .single();

    if (automationError || !automation) {
      console.error('Automation not found:', automationError);
      return new Response(
        JSON.stringify({ error: 'Automation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (automation.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Automation is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate webhook signature if present
    const signature = req.headers.get('x-webhook-signature');
    const blueprint = automation.automation_blueprint as any;
    
    if (blueprint?.trigger?.webhook_secret && signature) {
      const isValid = await validateWebhookSignature(
        JSON.stringify(payload),
        signature,
        blueprint.trigger.webhook_secret
      );
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare trigger data
    const triggerData = {
      type: 'webhook',
      timestamp: new Date().toISOString(),
      payload: payload,
      headers: Object.fromEntries(req.headers.entries()),
      source_ip: req.headers.get('x-forwarded-for') || 'unknown'
    };

    // Execute the automation
    const { data: executeResult, error: executeError } = await supabaseClient.functions.invoke('execute-automation', {
      body: {
        automation_id: automationId,
        trigger_data: triggerData
      }
    });

    if (executeError) {
      console.error('Failed to execute automation:', executeError);
      return new Response(
        JSON.stringify({ error: 'Failed to execute automation', details: executeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Webhook automation ${automationId} executed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        automation_id: automationId,
        run_id: executeResult?.run_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function validateWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Support both 'sha256=' prefix and raw hex
    const cleanSignature = signature.replace('sha256=', '');
    return cleanSignature === expectedHex;
  } catch (error) {
    console.error('Signature validation failed:', error);
    return false;
  }
}
