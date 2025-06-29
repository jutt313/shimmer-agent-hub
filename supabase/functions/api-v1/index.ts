
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
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
    
    // Extract API token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Validate token and get user info
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('validate_api_token', { token_hash: await hashToken(token) })
      .single()

    if (tokenError || !tokenData?.is_valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid API token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update last used timestamp and usage count
    await supabase
      .from('user_api_tokens')
      .update({ 
        last_used_at: new Date().toISOString(),
        usage_count: supabase.sql`usage_count + 1`,
        last_usage_details: {
          endpoint: url.pathname,
          method: method,
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('User-Agent')
        }
      })
      .eq('token_hash', await hashToken(token))

    // Log API usage for rate limiting
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: tokenData.user_id,
        endpoint: url.pathname,
        method: method,
        status_code: 200
      })

    // Route API requests
    if (path[0] === 'automations') {
      return await handleAutomationsAPI(supabase, tokenData, method, path, req)
    } else if (path[0] === 'runs') {
      return await handleRunsAPI(supabase, tokenData, method, path, req)
    } else if (path[0] === 'webhooks') {
      return await handleWebhooksAPI(supabase, tokenData, method, path, req)
    } else if (path[0] === 'user') {
      return await handleUserAPI(supabase, tokenData, method, path, req)
    } else if (path[0] === 'platforms') {
      return await handlePlatformsAPI(supabase, tokenData, method, path, req)
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Not Found',
          message: 'Welcome to YusrAI API v1.0',
          base_url: 'https://api.yusrai.com',
          documentation: 'https://docs.yusrai.com/api',
          available_endpoints: [
            'GET /automations - List user automations',
            'GET /automations/{id} - Get automation details',
            'POST /automations - Create automation',
            'PUT /automations/{id} - Update automation',
            'DELETE /automations/{id} - Delete automation',
            'GET /runs - List automation runs',
            'GET /runs/{id} - Get run details',
            'POST /runs - Execute automation',
            'GET /webhooks - List webhooks',
            'POST /webhooks - Create webhook',
            'GET /user/profile - Get user profile',
            'GET /platforms - List connected platforms'
          ]
        }),
        { 
          status: path.length === 0 ? 200 : 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('API v1 Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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
      // GET /automations - List user automations with real-time data
      const { data, error } = await supabase
        .from('automations')
        .select(`
          id, title, description, status, created_at, updated_at, priority,
          automation_runs!inner(
            id, status, run_timestamp, duration_ms
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get real-time webhook status for each automation
      const automationsWithWebhooks = await Promise.all(
        (data || []).map(async (automation) => {
          const { data: webhooks } = await supabase
            .from('automation_webhooks')
            .select('webhook_url, is_active, trigger_count, last_triggered_at')
            .eq('automation_id', automation.id)

          return {
            ...automation,
            webhooks: webhooks || [],
            last_run: automation.automation_runs?.[0] || null
          }
        })
      )

      return new Response(
        JSON.stringify({ 
          data: automationsWithWebhooks,
          meta: {
            total: automationsWithWebhooks.length,
            timestamp: new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'GET' && path.length === 2) {
      // GET /automations/{id} - Get automation details with real-time run data
      const automationId = path[1]
      const { data: automation, error } = await supabase
        .from('automations')
        .select(`
          *,
          automation_runs(
            id, status, run_timestamp, duration_ms, trigger_data, details_log
          ),
          automation_webhooks(
            id, webhook_url, is_active, trigger_count, last_triggered_at
          )
        `)
        .eq('id', automationId)
        .eq('user_id', userId)
        .single()

      if (error) throw error

      // Get real-time webhook delivery logs
      const { data: webhookLogs } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .in('automation_webhook_id', automation.automation_webhooks.map(w => w.id))
        .order('created_at', { ascending: false })
        .limit(10)

      return new Response(
        JSON.stringify({ 
          data: {
            ...automation,
            webhook_delivery_logs: webhookLogs || []
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path.length === 1) {
      // POST /automations - Create automation
      if (!tokenData.permissions.write) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const { data, error } = await supabase
        .from('automations')
        .insert({
          ...body,
          user_id: userId
        })
        .select()
        .single()

      if (error) throw error

      // Create default webhook if requested
      if (body.create_webhook) {
        const { data: webhookUrl } = await supabase
          .rpc('generate_webhook_url', { automation_id: data.id })

        await supabase
          .from('automation_webhooks')
          .insert({
            automation_id: data.id,
            webhook_url: webhookUrl
          })
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'PUT' && path.length === 2) {
      // PUT /automations/{id} - Update automation
      if (!tokenData.permissions.write) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const automationId = path[1]
      const body = await req.json()
      const { data, error } = await supabase
        .from('automations')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', automationId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'DELETE' && path.length === 2) {
      // DELETE /automations/{id} - Delete automation
      if (!tokenData.permissions.write) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
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
        JSON.stringify({ message: 'Automation deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Automations API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleRunsAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id

  try {
    if (method === 'GET' && path.length === 1) {
      // GET /runs - List automation runs with real-time status
      const { data, error } = await supabase
        .from('automation_runs')
        .select(`
          *,
          automations!inner(id, title, user_id)
        `)
        .eq('automations.user_id', userId)
        .order('run_timestamp', { ascending: false })
        .limit(50)

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          data,
          meta: {
            total: data?.length || 0,
            timestamp: new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'GET' && path.length === 2) {
      // GET /runs/{id} - Get run details with real-time logs
      const runId = path[1]
      const { data, error } = await supabase
        .from('automation_runs')
        .select(`
          *,
          automations!inner(id, title, user_id)
        `)
        .eq('id', runId)
        .eq('automations.user_id', userId)
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path.length === 1) {
      // POST /runs - Execute automation
      if (!tokenData.permissions.write) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const { automation_id, trigger_data } = body

      // Verify user owns the automation
      const { data: automation, error: authError } = await supabase
        .from('automations')
        .select('id, title')
        .eq('id', automation_id)
        .eq('user_id', userId)
        .single()

      if (authError || !automation) {
        return new Response(
          JSON.stringify({ error: 'Automation not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Execute automation via edge function
      const { data: executionResult, error: execError } = await supabase.functions.invoke('execute-automation', {
        body: {
          automationId: automation_id,
          triggerData: trigger_data || {},
          userId: userId
        }
      })

      if (execError) throw execError

      return new Response(
        JSON.stringify({ 
          data: executionResult,
          message: 'Automation execution started'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Runs API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleWebhooksAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id

  try {
    if (method === 'GET' && path.length === 1) {
      // GET /webhooks - List all webhooks with real-time delivery status
      const { data, error } = await supabase
        .from('automation_webhooks')
        .select(`
          *,
          automations!inner(id, title, user_id),
          webhook_delivery_logs(
            id, status_code, delivered_at, delivery_attempts, created_at
          )
        `)
        .eq('automations.user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get real-time delivery statistics
      const webhooksWithStats = data?.map(webhook => {
        const logs = webhook.webhook_delivery_logs || []
        const successfulDeliveries = logs.filter(log => log.status_code && log.status_code < 400).length
        const failedDeliveries = logs.filter(log => log.status_code && log.status_code >= 400).length
        
        return {
          ...webhook,
          delivery_stats: {
            total_attempts: logs.length,
            successful_deliveries: successfulDeliveries,
            failed_deliveries: failedDeliveries,
            success_rate: logs.length > 0 ? (successfulDeliveries / logs.length) * 100 : 0,
            last_delivery: logs[0]?.created_at || null
          }
        }
      })

      return new Response(
        JSON.stringify({ 
          data: webhooksWithStats,
          meta: {
            total: webhooksWithStats?.length || 0,
            timestamp: new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path.length === 1) {
      // POST /webhooks - Create webhook
      if (!tokenData.permissions.webhook) {
        return new Response(
          JSON.stringify({ error: 'Insufficient webhook permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const { automation_id } = body

      // Verify user owns the automation
      const { data: automation } = await supabase
        .from('automations')
        .select('id')
        .eq('id', automation_id)
        .eq('user_id', userId)
        .single()

      if (!automation) {
        return new Response(
          JSON.stringify({ error: 'Automation not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate webhook URL
      const { data: webhookUrl, error: urlError } = await supabase
        .rpc('generate_webhook_url', { automation_id })

      if (urlError) throw urlError

      const { data, error } = await supabase
        .from('automation_webhooks')
        .insert({
          automation_id,
          webhook_url: webhookUrl
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Webhooks API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleUserAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id

  try {
    if (method === 'GET' && path.length === 2 && path[1] === 'profile') {
      // GET /user/profile - Get user profile with real-time usage stats
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Get real-time usage statistics
      const { data: apiUsage } = await supabase
        .from('api_usage_logs')
        .select('endpoint, method, status_code, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })

      const { data: automationCount } = await supabase
        .from('automations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      const { data: runCount } = await supabase
        .from('automation_runs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('run_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      return new Response(
        JSON.stringify({ 
          data: {
            ...profile,
            usage_stats: {
              api_calls_24h: apiUsage?.length || 0,
              automations_total: automationCount?.length || 0,
              runs_24h: runCount?.length || 0,
              last_activity: apiUsage?.[0]?.created_at || null
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('User API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handlePlatformsAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id

  try {
    if (method === 'GET' && path.length === 1) {
      // GET /platforms - List connected platforms with real-time status
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('id, platform_name, credential_type, is_active, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          data,
          meta: {
            total: data?.length || 0,
            active: data?.filter(p => p.is_active).length || 0,
            timestamp: new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Platforms API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
