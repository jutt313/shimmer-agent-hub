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

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: tokenData.user_id,
        endpoint: url.pathname,
        method: method,
        status_code: 200
      })

    // Route API requests
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // API Routes
    if (path[0] === 'automations') {
      return await handleAutomationsAPI(userSupabase, tokenData, method, path, req)
    } else if (path[0] === 'webhooks') {
      return await handleWebhooksAPI(userSupabase, tokenData, method, path, req)
    } else if (path[0] === 'execute') {
      return await handleExecuteAPI(userSupabase, tokenData, method, path, req)
    } else if (path[0] === 'events') {
      return await handleEventsAPI(userSupabase, tokenData, method, path, req)
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
            'GET /automations/{id}/webhooks - Get automation webhooks',
            'POST /automations/{id}/webhooks - Create webhook',
            'GET /webhooks - List all webhooks',
            'POST /execute/{id} - Execute automation',
            'GET /events - List webhook events',
            'POST /events - Create webhook event'
          ]
        }),
        { 
          status: path.length === 0 ? 200 : 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('YusrAI API Error:', error)
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
      // GET /automations - List user automations
      const { data, error } = await supabase
        .from('automations')
        .select('id, title, description, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
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
        JSON.stringify({ data }),
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
        .update(body)
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

    // Handle webhook sub-routes
    if (path.length >= 3 && path[2] === 'webhooks') {
      return await handleAutomationWebhooksAPI(supabase, tokenData, method, path, req)
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

async function handleAutomationWebhooksAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id
  const automationId = path[1]

  try {
    if (method === 'GET') {
      // GET /automations/{id}/webhooks - Get automation webhooks
      const { data, error } = await supabase
        .from('automation_webhooks')
        .select('*')
        .eq('automation_id', automationId)

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST') {
      // POST /automations/{id}/webhooks - Create webhook
      if (!tokenData.permissions.webhook) {
        return new Response(
          JSON.stringify({ error: 'Insufficient webhook permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate webhook URL
      const { data: webhookUrl, error: urlError } = await supabase
        .rpc('generate_webhook_url', { automation_id: automationId })

      if (urlError) throw urlError

      const { data, error } = await supabase
        .from('automation_webhooks')
        .insert({
          automation_id: automationId,
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
    console.error('Webhook API Error:', error)
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
  // Handle general webhook management
  const userId = tokenData.user_id

  try {
    if (method === 'GET' && path.length === 1) {
      // GET /webhooks - List all user webhooks
      const { data, error } = await supabase
        .from('webhook_events')
        .select(`
          *,
          automations!inner(title, description)
        `)
        .eq('automations.user_id', userId)

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

async function handleExecuteAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  if (method !== 'POST' || path.length !== 2) {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!tokenData.permissions.write) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const automationId = path[1]
  const body = await req.json()

  try {
    // Call the execute-automation function
    const { data, error } = await supabase.functions.invoke('execute-automation', {
      body: {
        automationId,
        triggerData: body.triggerData || {},
        userId: tokenData.user_id
      }
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Execute API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
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
        .from('webhook_events')
        .select(`
          *,
          automations!inner(title, description, user_id)
        `)
        .eq('automations.user_id', userId)

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path.length === 1) {
      // POST /events - Create webhook event
      if (!tokenData.permissions.webhook) {
        return new Response(
          JSON.stringify({ error: 'Insufficient webhook permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const webhookUrl = `https://api.yusrai.com/webhooks/${crypto.randomUUID()}`
      
      const { data, error } = await supabase
        .from('webhook_events')
        .insert({
          ...body,
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
    console.error('Events API Error:', error)
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
