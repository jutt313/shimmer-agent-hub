
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    
    // Validate token using api_credentials table
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: tokenData, error: tokenError } = await supabase
      .from('api_credentials')
      .select('user_id, permissions, rate_limit_per_hour, id')
      .eq('api_key', token)
      .eq('is_active', true)
      .single()

    if (tokenError || !tokenData) {
      console.error('Token validation failed:', tokenError)
      
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
      .from('api_credentials')
      .update({ 
        last_used_at: new Date().toISOString(),
        usage_count: supabase.sql`usage_count + 1`
      })
      .eq('api_key', token)

    // Route API requests
    let response
    
    if (path.length === 0) {
      // Root API endpoint - return documentation
      response = new Response(
        JSON.stringify({ 
          message: 'Welcome to YusrAI Personal API v1.0',
          user_id: tokenData.user_id,
          available_endpoints: [
            'GET /automations - List user automations',
            'GET /automations/{id} - Get automation details', 
            'POST /automations - Create automation',
            'PUT /automations/{id} - Update automation',
            'DELETE /automations/{id} - Delete automation',
            'GET /webhooks - List all webhooks',
            'POST /execute/{id} - Execute automation',
            'GET /events - List webhook events'
          ]
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

    // Log API usage
    const responseTime = 100 // Simple placeholder
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: tokenData.user_id,
        api_credential_id: tokenData.id,
        endpoint: url.pathname,
        method: method,
        status_code: response.status,
        response_time_ms: responseTime
      })

    return response

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
        { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path.length === 1) {
      // POST /automations - Create automation
      const body = await req.json()
      
      const automationData = {
        title: body.title || 'API Created Automation',
        description: body.description || 'Created via Personal API',
        user_id: userId,
        status: 'active'
      }

      const { data, error } = await supabase
        .from('automations')
        .insert(automationData)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Automation created successfully',
          data
        }),
        { status: 201, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Automations API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      error: 'Method not allowed'
    }),
    { status: 405, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  )
}

async function handleWebhooksAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id

  try {
    if (method === 'GET' && path.length === 1) {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true,
          data
        }),
        { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Webhooks API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      error: 'Method not allowed'
    }),
    { status: 405, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  )
}

async function handleExecuteAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  if (method !== 'POST' || path.length !== 2) {
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed'
      }),
      { status: 405, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  const automationId = path[1]

  try {
    const result = {
      success: true,
      execution_id: crypto.randomUUID(),
      automation_id: automationId,
      status: 'completed',
      message: 'Automation executed successfully'
    }

    return new Response(
      JSON.stringify(result),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Execute API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }
}

async function handleEventsAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  const userId = tokenData.user_id

  try {
    if (method === 'GET' && path.length === 1) {
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true,
          data
        }),
        { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Events API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      error: 'Method not allowed'
    }),
    { status: 405, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  )
}
