
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
        JSON.stringify({ 
          error: 'Missing user ID',
          message: 'Please provide a valid user ID in the webhook URL'
        }),
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
        JSON.stringify({ 
          error: 'Invalid user ID',
          message: 'The provided user ID does not exist'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle the webhook payload
    const payload = req.method === 'POST' ? await req.json() : {}
    
    // Determine event type based on the payload or URL parameters
    const eventType = payload.event_type || 'webhook_received'
    
    console.log(`YusrAI Realtime Webhook - Event: ${eventType} for User: ${userId}`)

    // Create a comprehensive webhook event log
    const webhookLog = {
      user_id: userId,
      event_type: eventType,
      payload: payload,
      headers: Object.fromEntries(req.headers.entries()),
      received_at: new Date().toISOString(),
      processed: true,
      webhook_source: 'usr.com'
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
      case 'automation_error':
        await handleAutomationError(supabase, userId, payload)
        break
      case 'account_updated':
        await handleAccountUpdated(supabase, userId, payload)
        break
      case 'user_login':
        await handleUserLogin(supabase, userId, payload)
        break
      case 'notification_sent':
        await handleNotificationSent(supabase, userId, payload)
        break
      default:
        // Generic webhook handling
        await handleGenericWebhook(supabase, userId, payload, eventType)
    }

    // Send real-time notification to user dashboard
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: `Real-time Event: ${eventType}`,
        message: `Webhook received for ${eventType} via your Personal API`,
        type: 'webhook',
        category: 'system',
        metadata: {
          event_type: eventType,
          webhook_payload: payload,
          webhook_source: 'usr.com',
          timestamp: new Date().toISOString()
        }
      })

    // Return success response with event details
    const response = {
      success: true,
      message: 'Webhook processed successfully by YusrAI',
      event_type: eventType,
      user_id: userId,
      status: 'processed',
      webhook_url: `https://usr.com/api/realtime-webhook/${userId}`,
      supported_events: [
        'automation_created',
        'automation_executed',
        'automation_updated',
        'automation_error',
        'account_updated',
        'notification_sent',
        'user_login',
        'api_call_made',
        'webhook_received'
      ],
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('YusrAI Real-time webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to process webhook',
        support: 'Contact support@usr.com if this issue persists'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleAutomationCreated(supabase: any, userId: string, payload: any) {
  console.log(`YusrAI: Automation created for user ${userId}:`, payload)
  
  // Update user stats
  await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      updated_at: new Date().toISOString()
    })

  // Send welcome notification for first automation
  const { count } = await supabase
    .from('automations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count === 1) {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: '🎉 First Automation Created!',
        message: 'Congratulations! You\'ve created your first automation via the Personal API. Your automation journey with YusrAI has begun!',
        type: 'milestone',
        category: 'celebration',
        metadata: {
          automation_id: payload.automation_id,
          milestone: 'first_automation'
        }
      })
  }
}

async function handleAutomationExecuted(supabase: any, userId: string, payload: any) {
  console.log(`YusrAI: Automation executed for user ${userId}:`, payload)
  
  // Log execution metrics for analytics
  await supabase
    .from('automation_runs')
    .upsert({
      user_id: userId,
      automation_id: payload.automation_id,
      status: payload.status || 'completed',
      duration_ms: payload.execution_time_ms || 0,
      trigger_data: payload.trigger_data || {},
      details_log: {
        executed_via: 'personal_api',
        webhook_triggered: true,
        real_time: true,
        ...payload
      },
      run_timestamp: new Date().toISOString()
    })

  // Send success notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: '✅ Automation Executed Successfully',
      message: `Your automation "${payload.automation_title || 'Unknown'}" ran successfully in ${payload.execution_time_ms || 0}ms`,
      type: 'automation_executed',
      category: 'success',
      metadata: {
        execution_id: payload.execution_id,
        automation_id: payload.automation_id,
        execution_time: payload.execution_time_ms
      }
    })
}

async function handleApiCallMade(supabase: any, userId: string, payload: any) {
  console.log(`YusrAI: API call made for user ${userId}:`, payload)
  
  // Track API usage patterns
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

async function handleAutomationError(supabase: any, userId: string, payload: any) {
  console.log(`YusrAI: Automation error for user ${userId}:`, payload)
  
  // Log the error
  await supabase
    .from('error_logs')
    .insert({
      user_id: userId,
      error_type: 'AUTOMATION_ERROR',
      error_code: payload.error_code || 'UNKNOWN_ERROR',
      error_message: payload.error_message || 'An automation error occurred',
      severity: payload.severity || 'medium',
      automation_id: payload.automation_id,
      context: {
        webhook_triggered: true,
        real_time: true,
        ...payload
      }
    })

  // Send error notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: '⚠️ Automation Error',
      message: `An error occurred in your automation: ${payload.error_message || 'Unknown error'}`,
      type: 'automation_error',
      category: 'error',
      metadata: {
        automation_id: payload.automation_id,
        error_code: payload.error_code
      }
    })
}

async function handleAccountUpdated(supabase: any, userId: string, payload: any) {
  console.log(`YusrAI: Account updated for user ${userId}:`, payload)
  
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: '🔄 Account Updated',
      message: 'Your YusrAI account has been updated successfully',
      type: 'account_updated',
      category: 'info',
      metadata: payload
    })
}

async function handleUserLogin(supabase: any, userId: string, payload: any) {
  console.log(`YusrAI: User login for user ${userId}:`, payload)
  
  // Track login activity (optional notification)
  if (payload.notify) {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: '🔐 Login Detected',
        message: 'New login to your YusrAI account detected',
        type: 'user_login',
        category: 'security',
        metadata: {
          login_time: payload.timestamp || new Date().toISOString(),
          ip_address: payload.ip || 'unknown'
        }
      })
  }
}

async function handleNotificationSent(supabase: any, userId: string, payload: any) {
  console.log(`YusrAI: Notification sent for user ${userId}:`, payload)
  
  // Log notification delivery for analytics
  // This creates a meta-notification about notification delivery
  // Only if specifically requested to avoid infinite loops
  if (payload.track_delivery) {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: '📬 Notification Delivered',
        message: `Your notification "${payload.title}" was delivered successfully`,
        type: 'notification_sent',
        category: 'delivery',
        metadata: {
          original_notification: payload.title,
          delivery_time: new Date().toISOString()
        }
      })
  }
}

async function handleGenericWebhook(supabase: any, userId: string, payload: any, eventType: string) {
  console.log(`YusrAI: Generic webhook ${eventType} for user ${userId}:`, payload)
  
  // Store in generic webhook events table
  await supabase
    .from('webhook_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      event_data: payload,
      processed_at: new Date().toISOString(),
      is_active: true,
      webhook_url: `https://usr.com/api/realtime-webhook/${userId}`
    })

  // Send generic webhook notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: `🔔 Webhook Event: ${eventType}`,
      message: `A ${eventType} event was received via your Personal API webhook`,
      type: 'webhook_received',
      category: 'webhook',
      metadata: {
        event_type: eventType,
        webhook_data: payload
      }
    })
}
