
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const userId = url.pathname.split('/').pop()
    const events = url.searchParams.get('events')?.split(',') || []

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle the webhook payload
    const payload = req.method === 'POST' ? await req.json() : {}
    
    // Determine event type based on the payload or URL parameters
    const eventType = payload.event_type || 'webhook_received'
    
    // Create a webhook event log
    const webhookLog = {
      user_id: userId,
      event_type: eventType,
      payload: payload,
      headers: Object.fromEntries(req.headers.entries()),
      received_at: new Date().toISOString(),
      processed: true
    }

    // Store the webhook event
    await supabase
      .from('webhook_delivery_logs')
      .insert(webhookLog)

    // Based on event type, perform different actions
    switch (eventType) {
      case 'automation_created':
        await handleAutomationCreated(supabase, userId, payload)
        break
      case 'automation_executed':
        await handleAutomationExecuted(supabase, userId, payload)
        break
      case 'api_call_made':
        await handleApiCallMade(supabase, userId, payload)
        break
      default:
        // Generic webhook handling
        await handleGenericWebhook(supabase, userId, payload, eventType)
    }

    // Send real-time notification to user
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: `Real-time Event: ${eventType}`,
        message: `Webhook received for ${eventType}`,
        type: 'webhook',
        category: 'system',
        metadata: {
          event_type: eventType,
          webhook_payload: payload
        }
      })

    return new Response(
      JSON.stringify({ 
        message: 'Webhook processed successfully',
        event_type: eventType,
        user_id: userId,
        status: 'success'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Real-time webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleAutomationCreated(supabase: any, userId: string, payload: any) {
  // Handle automation creation webhook
  console.log(`Automation created for user ${userId}:`, payload)
  
  // You could trigger additional workflows here
  // For example, send welcome email, update analytics, etc.
}

async function handleAutomationExecuted(supabase: any, userId: string, payload: any) {
  // Handle automation execution webhook
  console.log(`Automation executed for user ${userId}:`, payload)
  
  // Log execution metrics
  await supabase
    .from('automation_execution_logs')
    .insert({
      user_id: userId,
      automation_id: payload.automation_id,
      execution_status: payload.status || 'completed',
      execution_time: payload.execution_time || 0,
      result: payload.result,
      triggered_at: new Date().toISOString()
    })
}

async function handleApiCallMade(supabase: any, userId: string, payload: any) {
  // Handle API call logging
  await supabase
    .from('api_usage_logs')
    .insert({
      user_id: userId,
      endpoint: payload.endpoint || 'unknown',
      method: payload.method || 'GET',
      status_code: payload.status_code || 200,
      response_time_ms: payload.response_time || 0,
      created_at: new Date().toISOString()
    })
}

async function handleGenericWebhook(supabase: any, userId: string, payload: any, eventType: string) {
  // Handle generic webhook events
  console.log(`Generic webhook ${eventType} for user ${userId}:`, payload)
  
  // Store in generic webhook events table
  await supabase
    .from('webhook_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      event_data: payload,
      processed_at: new Date().toISOString(),
      is_active: true
    })
}
