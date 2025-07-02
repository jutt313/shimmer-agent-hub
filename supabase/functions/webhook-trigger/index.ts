
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-event, x-webhook-timestamp',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const automationId = url.searchParams.get('automation_id')
    const webhookId = url.pathname.split('/').pop()

    if (!automationId || !webhookId) {
      return new Response(
        JSON.stringify({ error: 'Missing automation_id or webhook_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the webhook by URL path and automation ID
    const { data: webhook, error: webhookError } = await supabase
      .from('automation_webhooks')
      .select(`
        *,
        automations!inner(id, title, user_id, status)
      `)
      .eq('automation_id', automationId)
      .like('webhook_url', `%${webhookId}%`)
      .eq('is_active', true)
      .single()

    if (webhookError || !webhook) {
      console.error('[Webhook Trigger] Webhook not found:', { automationId, webhookId, error: webhookError })
      return new Response(
        JSON.stringify({ 
          error: 'Webhook not found or inactive',
          automation_id: automationId,
          webhook_id: webhookId,
          message: 'The requested webhook endpoint is not available or has been disabled'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if automation is active
    if (webhook.automations.status !== 'active') {
      console.log('[Webhook Trigger] Automation not active:', webhook.automations.status)
      return new Response(
        JSON.stringify({ 
          error: 'Automation not active',
          automation_id: automationId,
          status: webhook.automations.status,
          message: 'The target automation is not currently active'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body first (we need it for both signature validation and execution)
    let requestBody = '';
    let payload = {};
    
    try {
      if (req.method === 'POST') {
        requestBody = await req.text();
        payload = requestBody ? JSON.parse(requestBody) : {};
      }
    } catch (parseError) {
      console.error('[Webhook Trigger] Failed to parse request body:', parseError);
      payload = { raw_body: requestBody };
    }

    // Validate webhook signature if provided
    const signature = req.headers.get('x-webhook-signature')
    if (signature && webhook.webhook_secret) {
      const expectedSignature = await generateSignature(requestBody, webhook.webhook_secret)
      
      if (signature !== expectedSignature) {
        console.log('[Webhook Trigger] Invalid signature. Expected:', expectedSignature, 'Got:', signature);
        
        // Still log the failed delivery attempt
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            automation_webhook_id: webhook.id,
            automation_run_id: null,
            payload: payload,
            status_code: 401,
            response_body: JSON.stringify({ error: 'Invalid webhook signature' }),
            delivered_at: null,
            delivery_attempts: 1
          });
          
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(`[Webhook Trigger] Processing webhook for automation: ${webhook.automations.title}`)

    // Create automation run record
    const triggerData = {
      source: 'webhook',
      webhook_id: webhook.id,
      webhook_name: webhook.webhook_name,
      payload: payload,
      headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString(),
      automation_title: webhook.automations.title
    }

    const { data: automationRun, error: runError } = await supabase
      .from('automation_runs')
      .insert({
        automation_id: automationId,
        user_id: webhook.automations.user_id,
        status: 'running',
        trigger_data: triggerData,
        details_log: {
          webhook_triggered: true,
          webhook_name: webhook.webhook_name,
          trigger_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (runError) {
      console.error('[Webhook Trigger] Failed to create automation run:', runError)
    }

    // Simulate automation execution (in a real system, this would invoke actual automation logic)
    const executionResult = {
      execution_id: automationRun?.id || crypto.randomUUID(),
      automation_id: automationId,
      status: 'completed',
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString(),
      trigger_source: 'webhook',
      webhook_name: webhook.webhook_name
    }

    // Update run status to completed
    if (automationRun) {
      await supabase
        .from('automation_runs')
        .update({
          status: 'completed',
          duration_ms: 1000, // Simulated execution time
          details_log: {
            ...automationRun.details_log,
            completed_at: new Date().toISOString(),
            execution_result: executionResult
          }
        })
        .eq('id', automationRun.id)
    }

    // Update webhook statistics
    await supabase
      .from('automation_webhooks')
      .update({
        trigger_count: webhook.trigger_count + 1,
        last_triggered_at: new Date().toISOString()
      })
      .eq('id', webhook.id)

    // Log successful webhook delivery
    const { error: deliveryLogError } = await supabase
      .from('webhook_delivery_logs')
      .insert({
        automation_webhook_id: webhook.id,
        automation_run_id: automationRun?.id || null,
        payload: payload,
        status_code: 200,
        response_body: JSON.stringify(executionResult),
        delivered_at: new Date().toISOString(),
        delivery_attempts: 1
      });
      
    if (deliveryLogError) {
      console.error('[Webhook Trigger] Failed to log delivery:', deliveryLogError);
    }

    // Send success response
    const responseData = {
      success: true,
      message: 'Webhook received and processed successfully',
      execution_id: executionResult.execution_id,
      automation_id: automationId,
      automation_title: webhook.automations.title,
      webhook_name: webhook.webhook_name,
      status: 'completed',
      processed_at: new Date().toISOString(),
      trigger_count: webhook.trigger_count + 1
    }

    console.log(`[Webhook Trigger] Successfully processed webhook for: ${webhook.automations.title}`)

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook trigger error:', error)
    
    // Log failed delivery attempt
    try {
      await supabase
        .from('webhook_delivery_logs')
        .insert({
          automation_webhook_id: webhookId || 'unknown',
          automation_run_id: null,
          payload: { error: 'Failed to process webhook' },
          status_code: 500,
          response_body: JSON.stringify({ error: 'Internal server error', details: error.message }),
          delivered_at: null,
          delivery_attempts: 1
        });
    } catch (logError) {
      console.error('[Webhook Trigger] Failed to log error delivery:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(payload)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  return 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
