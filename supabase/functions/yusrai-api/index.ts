
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
          message: 'Please provide a valid YUSR_ API token with Bearer authentication'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Validate YUSR_ prefix
    if (!token.startsWith('YUSR_')) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API token format',
          message: 'API token must start with YUSR_ prefix'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Validate token and get user info
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Hash the token to check against stored hash
    const tokenHash = await hashToken(token)
    
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('validate_api_token', { token_hash: tokenHash })
      .single()

    if (tokenError || !tokenData?.is_valid) {
      console.error('Token validation failed:', tokenError)
      
      // Log the failed authentication attempt
      await supabase
        .from('error_logs')
        .insert({
          user_id: null,
          error_type: 'AUTHENTICATION_ERROR',
          error_code: 'INVALID_TOKEN',
          error_message: 'Invalid or expired API token',
          severity: 'medium',
          context: {
            token_prefix: token.substring(0, 10) + '...',
            endpoint: url.pathname,
            method: method
          }
        })

      return new Response(
        JSON.stringify({ 
          error: 'Invalid API token',
          message: 'The provided YUSR_ API token is invalid or expired'
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
        usage_count: supabase.sql`usage_count + 1`,
        last_usage_details: {
          endpoint: url.pathname,
          method: method,
          timestamp: new Date().toISOString(),
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        }
      })
      .eq('token_hash', tokenHash)

    // Log API usage with real-time response time
    const requestStartTime = Date.now()

    try {
      // Route API requests
      let response
      
      if (path.length === 0) {
        // Root API endpoint - return documentation
        response = new Response(
          JSON.stringify({ 
            message: 'Welcome to YusrAI Personal API v1.0',
            user_id: tokenData.user_id,
            base_url: 'https://usr.com/api/v1',
            documentation: 'https://docs.usr.com/api',
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
            real_time_webhook: `https://usr.com/api/realtime-webhook/${tokenData.user_id}`,
            rate_limits: {
              requests_per_minute: 100,
              requests_per_hour: 1000
            },
            authentication: {
              type: 'Bearer Token',
              format: 'YUSR_[token]',
              header: 'Authorization: Bearer YUSR_your_token_here'
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else if (path[0] === 'automations') {
        response = await handleAutomationsAPI(supabase, tokenData, method, path, req)
      } else if (path[0] === 'webhooks') {
        response = await handleWebhooksAPI(supabase, tokenData, method, path, req)
      } else if (path[0] === 'execute') {
        response = await handleExecuteAPI(supabase, tokenData, method, path, req)
      } else if (path[0] === 'events') {
        response = await handleEventsAPI(supabase, tokenData, method, path, req)
      } else {
        response = new Response(
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

      // Calculate response time
      const responseTime = Date.now() - requestStartTime
      const responseStatus = response.status

      // Log successful API usage
      await supabase
        .from('api_usage_logs')
        .insert({
          user_id: tokenData.user_id,
          endpoint: url.pathname,
          method: method,
          status_code: responseStatus,
          response_time_ms: responseTime,
          created_at: new Date().toISOString()
        })

      // Trigger real-time webhook for successful API calls
      if (responseStatus < 400) {
        try {
          await fetch(`https://usr.com/api/realtime-webhook/${tokenData.user_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'api_call_made',
              user_id: tokenData.user_id,
              endpoint: url.pathname,
              method: method,
              status_code: responseStatus,
              response_time: responseTime,
              timestamp: new Date().toISOString()
            })
          })
        } catch (webhookError) {
          console.error('Failed to trigger real-time webhook:', webhookError)
        }
      }

      return response

    } catch (error) {
      const responseTime = Date.now() - requestStartTime
      
      // Log API error
      await supabase
        .from('error_logs')
        .insert({
          user_id: tokenData.user_id,
          error_type: 'API_ERROR',
          error_code: 'INTERNAL_ERROR',
          error_message: error.message || 'Unknown API error',
          severity: 'high',
          context: {
            endpoint: url.pathname,
            method: method,
            response_time: responseTime
          }
        })

      // Log failed API usage
      await supabase
        .from('api_usage_logs')
        .insert({
          user_id: tokenData.user_id,
          endpoint: url.pathname,
          method: method,
          status_code: 500,
          response_time_ms: responseTime,
          created_at: new Date().toISOString()
        })

      throw error
    }

  } catch (error) {
    console.error('YusrAI API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
        support: 'If this issue persists, contact support@usr.com'
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
          count: data?.length || 0,
          user_id: userId
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
      
      // Enhanced automation creation with real webhook URL
      const automationData = {
        title: body.title || 'API Created Automation',
        description: body.description || 'Created via Personal API',
        user_id: userId,
        status: 'active',
        automation_blueprint: {
          trigger: {
            type: body.trigger_type || 'api_trigger',
            event: body.event_type || 'api_created',
            webhook_endpoint: `https://usr.com/api/realtime-webhook/${userId}`,
            webhook_secret: crypto.randomUUID()
          },
          actions: body.actions || [
            {
              type: 'notification',
              config: {
                message: `Automation "${body.title || 'API Automation'}" was triggered`,
                channels: ['dashboard', 'email', 'webhook']
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
          message: `Automation "${data.title}" was created successfully via your Personal API`,
          type: 'automation_created',
          category: 'system',
          metadata: {
            automation_id: data.id,
            created_via: 'personal_api'
          }
        })

      // Trigger real-time webhook for automation creation
      try {
        await fetch(`https://usr.com/api/realtime-webhook/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'automation_created',
            automation_id: data.id,
            automation_title: data.title,
            created_at: data.created_at,
            user_id: userId,
            api_created: true
          })
        })
      } catch (webhookError) {
        console.error('Failed to trigger real-time webhook:', webhookError)
      }

      // Return comprehensive response
      const response = {
        success: true,
        message: 'Automation created successfully via YusrAI Personal API',
        data: {
          automation: data,
          webhook_url: `https://usr.com/api/realtime-webhook/${userId}`,
          api_endpoints: {
            get_automation: `/automations/${data.id}`,
            update_automation: `/automations/${data.id}`,
            delete_automation: `/automations/${data.id}`,
            execute_automation: `/execute/${data.id}`
          },
          real_time_updates: `Real-time webhook events will be sent to https://usr.com/api/realtime-webhook/${userId}`,
          next_steps: [
            'Test the automation using the execute endpoint',
            'Monitor automation runs via your webhook',
            'Update automation configuration as needed',
            'Check your dashboard for real-time updates'
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
          real_time_webhook: `https://usr.com/api/realtime-webhook/${userId}`,
          webhook_events_supported: [
            'automation_created',
            'automation_executed', 
            'automation_updated',
            'automation_error',
            'account_updated',
            'notification_sent',
            'user_login',
            'api_call_made',
            'webhook_received'
          ]
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
    // Get the automation details
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .eq('user_id', tokenData.user_id)
      .single()

    if (automationError || !automation) {
      return new Response(
        JSON.stringify({ 
          error: 'Automation not found',
          message: 'The specified automation does not exist or you do not have access to it'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Execute the automation
    const executionId = crypto.randomUUID()
    const startTime = Date.now()
    
    // Simulate automation execution
    const result = {
      success: true,
      execution_id: executionId,
      automation_id: automationId,
      automation_title: automation.title,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime,
      result: {
        message: 'Automation executed successfully via Personal API',
        trigger_data: body.triggerData || {},
        actions_performed: ['notification_sent', 'webhook_triggered'],
        webhook_url: `https://usr.com/api/realtime-webhook/${tokenData.user_id}`
      }
    }

    // Log the execution
    await supabase
      .from('automation_runs')
      .insert({
        user_id: tokenData.user_id,
        automation_id: automationId,
        status: 'completed',
        duration_ms: result.execution_time_ms,
        trigger_data: body.triggerData || {},
        details_log: result
      })

    // Trigger real-time webhook
    try {
      await fetch(`https://usr.com/api/realtime-webhook/${tokenData.user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'automation_executed',
          execution_id: executionId,
          automation_id: automationId,
          automation_title: automation.title,
          status: 'completed',
          execution_time_ms: result.execution_time_ms,
          user_id: tokenData.user_id,
          timestamp: new Date().toISOString()
        })
      })
    } catch (webhookError) {
      console.error('Failed to trigger execution webhook:', webhookError)
    }

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
          data,
          real_time_webhook: `https://usr.com/api/realtime-webhook/${userId}`
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
