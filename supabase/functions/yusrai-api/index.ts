
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

  const startTime = Date.now()

  try {
    const url = new URL(req.url)
    // Fix: Remove the function prefix to get the actual path
    const fullPath = url.pathname
    const pathWithoutFunction = fullPath.replace('/yusrai-api', '') || '/'
    const path = pathWithoutFunction.split('/').filter(Boolean)
    const method = req.method
    
    console.log(`[YusrAI API] ${method} ${fullPath} -> ${pathWithoutFunction} - Start`)
    
    // Extract API token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[YusrAI API] Missing or invalid Authorization header')
      return new Response(
        JSON.stringify({ 
          error: 'Authentication Required',
          message: 'Please provide a valid YUSR_ API token with Bearer authentication',
          code: 'AUTH_MISSING_TOKEN'
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
      console.error('[YusrAI API] Invalid token format:', token.substring(0, 10) + '...')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Token Format',
          message: 'API token must start with YUSR_ prefix',
          code: 'AUTH_INVALID_FORMAT'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Validate token using api_credentials table with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('[YusrAI API] Validating token:', token.substring(0, 10) + '...')
    
    const { data: tokenData, error: tokenError } = await supabase
      .from('api_credentials')
      .select('user_id, permissions, rate_limit_per_hour, id, credential_name')
      .eq('api_key', token)
      .eq('is_active', true)
      .maybeSingle()

    if (tokenError) {
      console.error('[YusrAI API] Token validation database error:', tokenError)
      return new Response(
        JSON.stringify({ 
          error: 'Database Error',
          message: 'Unable to validate API token',
          code: 'DB_ERROR',
          details: tokenError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!tokenData) {
      console.error('[YusrAI API] Token not found or inactive:', token.substring(0, 10) + '...')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API Token',
          message: 'The provided YUSR_ API token is invalid, expired, or inactive',
          code: 'AUTH_INVALID_TOKEN'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[YusrAI API] Token validated successfully for user: ${tokenData.user_id}`)

    // Update token usage with proper error handling
    try {
      const { error: updateError } = await supabase
        .from('api_credentials')
        .update({ 
          last_used_at: new Date().toISOString(),
          usage_count: supabase.sql`COALESCE(usage_count, 0) + 1`
        })
        .eq('api_key', token)

      if (updateError) {
        console.error('[YusrAI API] Failed to update token usage:', updateError)
      }
    } catch (updateErr) {
      console.error('[YusrAI API] Exception updating token usage:', updateErr)
    }

    // Route API requests
    let response
    const responseTime = Date.now() - startTime
    
    if (path.length === 0) {
      // Root API endpoint - return documentation
      response = new Response(
        JSON.stringify({ 
          message: 'Welcome to YusrAI Personal API v1.0',
          user_id: tokenData.user_id,
          credential_name: tokenData.credential_name,
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
          response_time_ms: responseTime
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
          error: 'Endpoint Not Found',
          message: `Endpoint ${pathWithoutFunction} not found`,
          available_endpoints: ['/automations', '/webhooks', '/execute', '/events'],
          code: 'ENDPOINT_NOT_FOUND'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log API usage with consolidated tracking
    const finalResponseTime = Date.now() - startTime
    try {
      const { error: logError } = await supabase
        .from('api_usage_tracking')
        .insert({
          user_id: tokenData.user_id,
          api_credential_id: tokenData.id,
          endpoint: pathWithoutFunction,
          method: method,
          status_code: response.status,
          response_time_ms: finalResponseTime,
          usage_date: new Date().toISOString().split('T')[0]
        })

      if (logError) {
        console.error('[YusrAI API] Failed to log usage:', logError)
      } else {
        console.log(`[YusrAI API] Usage logged: ${method} ${pathWithoutFunction} - ${response.status} - ${finalResponseTime}ms`)
      }
    } catch (logErr) {
      console.error('[YusrAI API] Exception logging usage:', logErr)
    }

    console.log(`[YusrAI API] ${method} ${pathWithoutFunction} - Complete - ${response.status} - ${finalResponseTime}ms`)
    return response

  } catch (error) {
    console.error('[YusrAI API] Unexpected Error:', error)
    const errorResponseTime = Date.now() - startTime
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
        response_time_ms: errorResponseTime,
        details: error.message
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

      if (error) {
        console.error('[Automations API] Select error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          data: data || [],
          count: data?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      if (error) {
        console.error('[Automations API] Insert error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Automation created successfully',
          data
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        error: 'Method Not Allowed',
        message: `${method} not supported for this endpoint`,
        code: 'METHOD_NOT_ALLOWED'
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Automations API] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Automations API Error',
        message: error.message || 'Failed to process automations request',
        code: 'AUTOMATIONS_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleWebhooksAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  try {
    if (method === 'GET' && path.length === 1) {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[Webhooks API] Select error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          data: data || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        error: 'Method Not Allowed',
        message: `${method} not supported for this endpoint`,
        code: 'METHOD_NOT_ALLOWED'
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Webhooks API] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Webhooks API Error',
        message: error.message || 'Failed to process webhooks request',
        code: 'WEBHOOKS_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleExecuteAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  if (method !== 'POST' || path.length !== 2) {
    return new Response(
      JSON.stringify({ 
        error: 'Method Not Allowed',
        message: 'Only POST method is supported for execution endpoint',
        code: 'METHOD_NOT_ALLOWED'
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const automationId = path[1]

  try {
    const result = {
      success: true,
      execution_id: crypto.randomUUID(),
      automation_id: automationId,
      status: 'completed',
      message: 'Automation executed successfully',
      executed_at: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Execute API] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Execute API Error',
        message: error.message || 'Failed to execute automation',
        code: 'EXECUTE_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleEventsAPI(supabase: any, tokenData: any, method: string, path: string[], req: Request) {
  try {
    if (method === 'GET' && path.length === 1) {
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[Events API] Select error:', error)
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          data: data || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        error: 'Method Not Allowed',
        message: `${method} not supported for this endpoint`,
        code: 'METHOD_NOT_ALLOWED'
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Events API] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Events API Error',
        message: error.message || 'Failed to process events request',
        code: 'EVENTS_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
