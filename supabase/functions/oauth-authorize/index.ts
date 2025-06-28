
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
    const clientId = url.searchParams.get('client_id')
    const redirectUri = url.searchParams.get('redirect_uri')
    const state = url.searchParams.get('state')
    const scope = url.searchParams.get('scope') || 'read'

    if (!clientId || !redirectUri) {
      return new Response('Missing required parameters', { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate client_id and redirect_uri
    const { data: integration, error } = await supabase
      .from('developer_integrations')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (error || !integration) {
      return new Response('Invalid client_id', { status: 400 })
    }

    if (!integration.redirect_uris.includes(redirectUri)) {
      return new Response('Invalid redirect_uri', { status: 400 })
    }

    // For GET requests, show authorization page
    if (req.method === 'GET') {
      const authPageHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>YusrAI Authorization</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
            .logo { text-align: center; margin-bottom: 2rem; }
            .logo h1 { color: #667eea; margin: 0; font-size: 2rem; }
            .app-info { background: #f8f9ff; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
            .permissions { margin: 1.5rem 0; }
            .permission { display: flex; align-items: center; margin: 0.5rem 0; }
            .permission svg { width: 16px; height: 16px; color: #10b981; margin-right: 8px; }
            .buttons { display: flex; gap: 1rem; margin-top: 2rem; }
            .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; text-decoration: none; text-align: center; flex: 1; }
            .btn-primary { background: #667eea; color: white; }
            .btn-secondary { background: #e5e7eb; color: #374151; }
            .btn:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>YusrAI</h1>
            </div>
            
            <div class="app-info">
              <h3>${integration.app_name}</h3>
              <p>${integration.app_description || 'This application wants to access your YusrAI account.'}</p>
            </div>

            <div class="permissions">
              <h4>This application will be able to:</h4>
              <div class="permission">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                View your automations
              </div>
              ${scope.includes('write') ? `
              <div class="permission">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Create and modify automations
              </div>` : ''}
              ${scope.includes('webhook') ? `
              <div class="permission">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Receive webhook notifications
              </div>` : ''}
            </div>

            <div class="buttons">
              <button class="btn btn-secondary" onclick="window.history.back()">Cancel</button>
              <button class="btn btn-primary" onclick="authorize()">Authorize</button>
            </div>
          </div>

          <script>
            async function authorize() {
              try {
                const response = await fetch(window.location.href, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ authorize: true })
                });
                
                const result = await response.json();
                if (result.redirect_url) {
                  window.location.href = result.redirect_url;
                } else {
                  alert('Authorization failed: ' + (result.error || 'Unknown error'));
                }
              } catch (error) {
                alert('Authorization failed: ' + error.message);
              }
            }
          </script>
        </body>
        </html>
      `

      return new Response(authPageHtml, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // For POST requests, handle authorization
    if (req.method === 'POST') {
      const body = await req.json()
      
      if (!body.authorize) {
        const errorUrl = `${redirectUri}?error=access_denied${state ? `&state=${state}` : ''}`
        return new Response(JSON.stringify({ redirect_url: errorUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get user from session (you'll need to implement session management)
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
      }

      // Generate access token
      const accessToken = crypto.randomUUID()
      const refreshToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

      // Get user ID from auth header (implement proper session validation)
      const userId = 'user-id-from-session' // This needs proper implementation

      // Store OAuth connection
      await supabase
        .from('oauth_connections')
        .insert({
          user_id: userId,
          developer_integration_id: integration.id,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt.toISOString(),
          scopes: { scope }
        })

      const successUrl = `${redirectUri}?code=${accessToken}${state ? `&state=${state}` : ''}`
      
      return new Response(JSON.stringify({ redirect_url: successUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('OAuth Authorization Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
