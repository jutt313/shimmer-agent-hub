
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role key for bypassing RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { userId, title, message, type, category, metadata = {} } = await req.json()

    if (!userId || !title || !message || !type || !category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, message, type, category' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate notification type
    const validTypes = ['automation_status', 'error', 'ai_agent', 'platform_integration', 'knowledge_system']
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type. Must be one of: ' + validTypes.join(', ') }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating notification for user:', userId, 'with type:', type)

    const { data, error } = await supabaseClient
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          type,
          category,
          metadata
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create notification', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Notification created successfully:', data)

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
