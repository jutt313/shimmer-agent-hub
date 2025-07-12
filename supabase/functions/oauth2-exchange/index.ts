import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OAuth2ExchangeRequest {
  platform_name: string;
  authorization_code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  automation_id: string;
  user_id: string;
}

const platformConfigs: Record<string, any> = {
  'google_sheets': {
    token_url: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/spreadsheets'
  },
  'gmail': {
    token_url: 'https://oauth2.googleapis.com/token', 
    scope: 'https://www.googleapis.com/auth/gmail.readonly'
  },
  'github': {
    token_url: 'https://github.com/login/oauth/access_token',
    scope: 'repo'
  },
  'slack': {
    token_url: 'https://slack.com/api/oauth.v2.access',
    scope: 'channels:read,chat:write'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: OAuth2ExchangeRequest = await req.json();
    const { 
      platform_name, 
      authorization_code, 
      client_id, 
      client_secret, 
      redirect_uri,
      automation_id,
      user_id 
    } = body;

    console.log(`🔄 OAuth2 token exchange for ${platform_name}`);

    const config = platformConfigs[platform_name.toLowerCase()];
    if (!config) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `OAuth2 not supported for platform: ${platform_name}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange authorization code for access token
    const tokenRequest = {
      grant_type: 'authorization_code',
      code: authorization_code,
      client_id: client_id,
      client_secret: client_secret,
      redirect_uri: redirect_uri
    };

    const tokenResponse = await fetch(config.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenRequest)
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`OAuth2 token exchange failed: ${tokenResponse.status} ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `OAuth2 token exchange failed: ${tokenResponse.status} ${errorText}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokens = await tokenResponse.json();
    console.log(`✅ OAuth2 tokens obtained for ${platform_name}`);

    // Store tokens securely in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      client_id: client_id,
      client_secret: client_secret,
      expires_at: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null,
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope || config.scope
    };

    const { error: storeError } = await supabase
      .from('automation_platform_credentials')
      .upsert({
        automation_id: automation_id,
        user_id: user_id,
        platform_name: platform_name.toLowerCase(),
        credential_type: 'oauth2',
        credentials: JSON.stringify(credentials),
        is_active: true,
        is_tested: true,
        test_status: 'success',
        test_message: 'OAuth2 authorization successful'
      }, {
        onConflict: 'automation_id,platform_name'
      });

    if (storeError) {
      console.error('Failed to store OAuth2 tokens:', storeError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to store tokens: ${storeError.message}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💾 OAuth2 tokens stored for ${platform_name} in automation ${automation_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `OAuth2 authorization successful for ${platform_name}`,
        details: {
          platform_name: platform_name,
          token_type: tokens.token_type || 'Bearer',
          scope: tokens.scope || config.scope,
          has_refresh_token: !!tokens.refresh_token,
          expires_in: tokens.expires_in
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('OAuth2 exchange error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `OAuth2 exchange failed: ${error.message}` 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});