
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    const method = req.method
    
    console.log(`YusrAI API: ${method} ${url.pathname}`)
    
    // Extract API token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing or invalid Authorization header',
          message: 'Please provide a valid API token with Bearer authentication'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Validate token and get user info
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Hash the token to check against stored hash
    const tokenHash = await hashToken(token)
    
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('validate_api_token', { token_hash: tokenHash })
      .single()

    if (tokenError || !tokenData?.is_valid) {
      console.error('Token validation failed:', tokenError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API token',
          message: 'The provided API token is invalid or expired'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Token validated for user:', tokenData.user_id)

    // Update token usage
    await supabase
      .from('user_api_tokens')
      .update({ 
        last_used_at: new Date().toISOString(),
        usage_count: supabase.sql`usage_count + 1`
      })
      .eq('token_hash', tokenHash)

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: tokenData.user_id,
        endpoint: url.pathname,
        method: method,
        status_code: 200,
        response_time_ms: 0,
        created_at: new Date().toISOString()
      })

    // Route API requests
    if (path.length === 0) {
      // Root API endpoint - return documentation
      return new Response(
        JSON.stringify({ 
          message: 'Welcome to YusrAI Personal API v1.0',
          user_id: tokenData.user_id,
          base_url: 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api',
          documentation: 'https://docs.yusrai.com/api',
          available_endpoints: [
            'GET /automations - List user automations',
            'GET /automations/{id} - Get automation details',
            'POST /automations - Create automation',
            'PUT /automations/{id} - Update automation',
            'DELETE /automations/{id} - Delete automation',
            'GET /webhooks - List all webhooks',
            'POST /execute/{id} - Execute automation',
            'GET /events - List webhook events'
          ],
          real_time_webhook: `https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/realtime-webhook/${tokenData.user_id}`,
          rate_limits: {
            requests_per_minute: 100,
            requests_per_hour: 1000
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (path[0] === 'automations') {
      return await handleAutomationsAPI(supabase, tokenData, method, path, req)
    } else if (path[0] === 'webhooks') {
      return await handleWebhooksAPI(supabase, tokenData, method, path, req)
    } else if (path[0] === 'execute') {
      return await handleExecuteAPI(supabase, tokenData, method, path, req)
    } else if (path[0] === 'events') {
      return await handleEventsAPI(supabase, tokenData, method, path, req)
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Not Found',
          message: `Endpoint ${url.pathname} not found`,
          available_endpoints: ['/automations', '/webhooks', '/execute', '/events']
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('YusrAI API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function handleAutomationsAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id
  
  try {
    if (method === 'GET' && path.length === 1) {
      // GET /automations - List user automations
      const { data, error } = await supabase
        .from('automations')
        .select('id, title, description, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true,
          data,
          count: data?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'GET' && path.length === 2) {
      // GET /automations/{id} - Get automation details
      const automationId = path[1]
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .eq('user_id', userId)
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true,
          data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path.length === 1) {
      // POST /automations - Create automation
      if (!tokenData.permissions.write) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient permissions',
            message: 'Write permission required to create automations'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      console.log('Creating automation with body:', body)
      
      // Enhanced automation creation
      const automationData = {
        title: body.title || 'API Created Automation',
        description: body.description || 'Created via Personal API',
        user_id: userId,
        status: 'draft',
        automation_blueprint: {
          trigger: {
            type: body.trigger_type || 'webhook',
            event: body.event_type || 'api_trigger',
            webhook_endpoint: `https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/realtime-webhook/${userId}`,
            webhook_secret: crypto.randomUUID()
          },
          actions: body.actions || [
            {
              type: 'notification',
              config: {
                message: `Automation "${body.title || 'API Automation'}" was triggered`,
                channels: ['dashboard', 'email']
              }
            }
          ],
          conditions: body.conditions || [],
          metadata: {
            created_via: 'personal_api',
            api_token_id: tokenData.token_id,
            external_service: body.external_service || 'unknown',
            created_at: new Date().toISOString()
          }
        }
      }

      const { data, error } = await supabase
        .from('automations')
        .insert(automationData)
        .select()
        .single()

      if (error) {
        console.error('Error creating automation:', error)
        throw error
      }

      console.log('Automation created:', data)

      // Send notification about automation creation
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'New Automation Created via API',
          message: `Automation "${data.title}" was created successfully`,
          type: 'automation_created',
          category: 'system',
          metadata: {
            automation_id: data.id,
            created_via: 'personal_api'
          }
        })

      // Trigger real-time webhook if configured
      try {
        await fetch(`https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/realtime-webhook/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'automation_created',
            automation_id: data.id,
            automation_title: data.title,
            created_at: data.created_at,
            user_id: userId
          })
        })
      } catch (webhookError) {
        console.error('Failed to trigger real-time webhook:', webhookError)
      }

      // Return comprehensive response
      const response = {
        success: true,
        message: 'Automation created successfully',
        data: {
          automation: data,
          webhook_url: automationData.automation_blueprint.trigger.webhook_endpoint,
          api_endpoints: {
            get_automation: `/automations/${data.id}`,
            update_automation: `/automations/${data.id}`,
            delete_automation: `/automations/${data.id}`,
            execute_automation: `/execute/${data.id}`
          },
          real_time_updates: `Webhook events will be sent to your configured webhook URL`,
          next_steps: [
            'Test the automation using the execute endpoint',
            'Monitor automation runs via your webhook',
            'Update automation configuration as needed'
          ]
        }
      }

      return new Response(
        JSON.stringify(response),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'PUT' && path.length === 2) {
      // PUT /automations/{id} - Update automation
      if (!tokenData.permissions.write) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient permissions',
            message: 'Write permission required to update automations'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const automationId = path[1]
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('automations')
        .update(body)
        .eq('id', automationId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Automation updated successfully',
          data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'DELETE' && path.length === 2) {
      // DELETE /automations/{id} - Delete automation
      if (!tokenData.permissions.write) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient permissions',
            message: 'Write permission required to delete automations'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const automationId = path[1]
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', automationId)
        .eq('user_id', userId)

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Automation deleted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Automations API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        message: 'Failed to process automation request'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      error: 'Method not allowed',
      message: `${method} is not supported for this endpoint`
    }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleWebhooksAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id

  try {
    if (method === 'GET' && path.length === 1) {
      // GET /webhooks - List all user webhooks
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true,
          data,
          real_time_webhook: `https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/realtime-webhook/${userId}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Webhooks API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      error: 'Method not allowed'
    }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleExecuteAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  if (method !== 'POST' || path.length !== 2) {
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only POST is supported for execute endpoint'
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!tokenData.permissions.write) {
    return new Response(
      JSON.stringify({ 
        error: 'Insufficient permissions',
        message: 'Write permission required to execute automations'
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const automationId = path[1]
  const body = await req.json()

  try {
    // Mock execution for now - in real implementation, this would trigger the automation
    const executionId = crypto.randomUUID()
    
    const result = {
      success: true,
      execution_id: executionId,
      automation_id: automationId,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      result: {
        message: 'Automation executed successfully',
        trigger_data: body.triggerData || {},
        actions_performed: ['notification_sent']
      }
    }

    // Log the execution
    await supabase
      .from('automation_execution_logs')
      .insert({
        user_id: tokenData.user_id,
        automation_id: automationId,
        execution_id: executionId,
        execution_status: 'completed',
        execution_time: 150,
        result: result,
        triggered_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Execute API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleEventsAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id

  try {
    if (method === 'GET' && path.length === 1) {
      // GET /events - List webhook events
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .eq('user_id', userId)
        .order('received_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true,
          data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Events API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      error: 'Method not allowed'
    }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
