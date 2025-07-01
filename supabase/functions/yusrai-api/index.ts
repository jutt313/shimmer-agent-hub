
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface ApiCredential {
  user_id: string;
  credential_type: string;
  permissions: any;
  is_valid: boolean;
  rate_limit_per_hour: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract API key from Authorization header
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

    const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Validate API key using the new unified function
    const { data: credentialData, error: validationError } = await supabaseClient
      .rpc('validate_unified_api_key', { api_key: apiKey })

    if (validationError || !credentialData || credentialData.length === 0) {
      console.error('API key validation failed:', validationError)
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const credential: ApiCredential = credentialData[0]
    
    if (!credential.is_valid) {
      return new Response(
        JSON.stringify({ error: 'API key is inactive' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log API usage
    const url = new URL(req.url)
    const endpoint = url.pathname.replace('/functions/v1/yusrai-api', '')
    
    await supabaseClient
      .from('api_usage_logs')
      .insert({
        user_id: credential.user_id,
        method: req.method,
        endpoint: endpoint,
        status_code: 200,
        response_time_ms: 0 // Will be updated later if needed
      })

    // Update usage count
    await supabaseClient
      .from('api_credentials')
      .update({ 
        usage_count: supabaseClient.sql`usage_count + 1`,
        last_used_at: new Date().toISOString()
      })
      .eq('api_key', apiKey)

    // Route to different services based on endpoint
    const requestBody = req.method !== 'GET' ? await req.json() : null

    switch (endpoint) {
      case '/chat-ai':
        return await handleChatAI(requestBody, credential, supabaseClient)
      
      case '/create-notification':
        return await handleCreateNotification(requestBody, credential, supabaseClient)
      
      case '/diagram-generator':
        return await handleDiagramGenerator(requestBody, credential, supabaseClient)
      
      case '/error-analyzer':
        return await handleErrorAnalyzer(requestBody, credential, supabaseClient)
      
      case '/knowledge-ai-chat':
        return await handleKnowledgeAIChat(requestBody, credential, supabaseClient)
      
      case '/test-credential':
        return await handleTestCredential(requestBody, credential, supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ 
            error: 'Endpoint not found',
            available_endpoints: [
              '/chat-ai',
              '/create-notification', 
              '/diagram-generator',
              '/error-analyzer',
              '/knowledge-ai-chat',
              '/test-credential'
            ]
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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleChatAI(requestBody: any, credential: ApiCredential, supabaseClient: any) {
  // Check permissions
  if (!credential.permissions?.read) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions for chat-ai service' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { message, context } = requestBody || {}
  
  if (!message) {
    return new Response(
      JSON.stringify({ error: 'Message is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Call the chat-ai edge function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/chat-ai`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, context, user_id: credential.user_id })
  })

  const result = await response.json()

  return new Response(
    JSON.stringify(result),
    { 
      status: response.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleCreateNotification(requestBody: any, credential: ApiCredential, supabaseClient: any) {
  // Check permissions
  if (!credential.permissions?.notifications) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions for notifications service' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { title, message, type, category } = requestBody || {}
  
  if (!title || !message) {
    return new Response(
      JSON.stringify({ error: 'Title and message are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Call the create-notification edge function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-notification`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      title, 
      message, 
      type: type || 'api',
      category: category || 'general',
      user_id: credential.user_id 
    })
  })

  const result = await response.json()

  return new Response(
    JSON.stringify(result),
    { 
      status: response.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleDiagramGenerator(requestBody: any, credential: ApiCredential, supabaseClient: any) {
  // Check permissions
  if (!credential.permissions?.automations) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions for diagram generator service' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { description, automation_id } = requestBody || {}
  
  if (!description) {
    return new Response(
      JSON.stringify({ error: 'Description is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Call the diagram-generator edge function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/diagram-generator`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      description, 
      automation_id,
      user_id: credential.user_id 
    })
  })

  const result = await response.json()

  return new Response(
    JSON.stringify(result),
    { 
      status: response.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleErrorAnalyzer(requestBody: any, credential: ApiCredential, supabaseClient: any) {
  // Check permissions
  if (!credential.permissions?.read) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions for error analyzer service' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { error_message, stack_trace, context } = requestBody || {}
  
  if (!error_message) {
    return new Response(
      JSON.stringify({ error: 'Error message is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Call the error-analyzer edge function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/error-analyzer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      error_message, 
      stack_trace,
      context,
      user_id: credential.user_id 
    })
  })

  const result = await response.json()

  return new Response(
    JSON.stringify(result),
    { 
      status: response.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleKnowledgeAIChat(requestBody: any, credential: ApiCredential, supabaseClient: any) {
  // Check permissions
  if (!credential.permissions?.read) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions for knowledge AI chat service' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { message, context } = requestBody || {}
  
  if (!message) {
    return new Response(
      JSON.stringify({ error: 'Message is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Call the knowledge-ai-chat edge function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/knowledge-ai-chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      message, 
      context,
      user_id: credential.user_id 
    })
  })

  const result = await response.json()

  return new Response(
    JSON.stringify(result),
    { 
      status: response.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleTestCredential(requestBody: any, credential: ApiCredential, supabaseClient: any) {
  // Check permissions
  if (!credential.permissions?.platform_connections) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions for test credential service' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { platform_name, credentials } = requestBody || {}
  
  if (!platform_name || !credentials) {
    return new Response(
      JSON.stringify({ error: 'Platform name and credentials are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Call the test-credential edge function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/test-credential`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      platform_name, 
      credentials,
      user_id: credential.user_id 
    })
  })

  const result = await response.json()

  return new Response(
    JSON.stringify(result),
    { 
      status: response.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}
