
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json()
    
    if (req.method === 'POST') {
      const { grant_type, code, client_id, client_secret, refresh_token } = body

      // Validate client credentials
      const { data: integration, error: integrationError } = await supabase
        .from('developer_integrations')
        .select('*')
        .eq('client_id', client_id)
        .eq('client_secret', client_secret)
        .eq('is_active', true)
        .single()

      if (integrationError || !integration) {
        return new Response(
          JSON.stringify({ 
            error: 'invalid_client',
            error_description: 'Invalid client credentials'
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (grant_type === 'authorization_code') {
        // Exchange authorization code for access token
        const { data: connection, error: connectionError } = await supabase
          .from('oauth_connections')
          .select('*')
          .eq('access_token', code) // In our system, the code IS the access token
          .eq('developer_integration_id', integration.id)
          .eq('is_active', true)
          .single()

        if (connectionError || !connection) {
          return new Response(
            JSON.stringify({ 
              error: 'invalid_grant',
              error_description: 'Invalid authorization code'
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Check if token is expired
        if (connection.expires_at && new Date(connection.expires_at) <= new Date()) {
          return new Response(
            JSON.stringify({ 
              error: 'invalid_grant',
              error_description: 'Authorization code expired'
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Generate new access token and refresh token
        const newAccessToken = crypto.randomUUID()
        const newRefreshToken = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

        // Update connection with new tokens
        const { error: updateError } = await supabase
          .from('oauth_connections')
          .update({
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            expires_at: expiresAt.toISOString(),
            last_used_at: new Date().toISOString()
          })
          .eq('id', connection.id)

        if (updateError) throw updateError

        // Log the token exchange
        await supabase
          .from('api_usage_logs')
          .insert({
            user_id: connection.user_id,
            developer_integration_id: integration.id,
            endpoint: '/oauth/token',
            method: 'POST',
            status_code: 200
          })

        return new Response(
          JSON.stringify({
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            token_type: 'Bearer',
            expires_in: 3600, // 1 hour in seconds
            scope: Object.keys(connection.scopes).join(' ')
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      } else if (grant_type === 'refresh_token') {
        // Refresh access token
        const { data: connection, error: connectionError } = await supabase
          .from('oauth_connections')
          .select('*')
          .eq('refresh_token', refresh_token)
          .eq('developer_integration_id', integration.id)
          .eq('is_active', true)
          .single()

        if (connectionError || !connection) {
          return new Response(
            JSON.stringify({ 
              error: 'invalid_grant',
              error_description: 'Invalid refresh token'
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Generate new access token
        const newAccessToken = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

        // Update connection with new access token
        const { error: updateError } = await supabase
          .from('oauth_connections')
          .update({
            access_token: newAccessToken,
            expires_at: expiresAt.toISOString(),
            last_used_at: new Date().toISOString()
          })
          .eq('id', connection.id)

        if (updateError) throw updateError

        // Log the token refresh
        await supabase
          .from('api_usage_logs')
          .insert({
            user_id: connection.user_id,
            developer_integration_id: integration.id,
            endpoint: '/oauth/token',
            method: 'POST',
            status_code: 200
          })

        return new Response(
          JSON.stringify({
            access_token: newAccessToken,
            token_type: 'Bearer',
            expires_in: 3600, // 1 hour in seconds
            scope: Object.keys(connection.scopes).join(' ')
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      } else {
        return new Response(
          JSON.stringify({ 
            error: 'unsupported_grant_type',
            error_description: 'Grant type not supported'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

  } catch (error) {
    console.error('OAuth Token Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'server_error',
        error_description: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      error: 'invalid_request',
      error_description: 'Method not allowed'
    }),
    { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
})
