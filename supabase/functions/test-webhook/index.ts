
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-event, x-webhook-timestamp',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🧪 WEBHOOK TEST FUNCTION STARTED');
    
    const { webhookUrl, secret } = await req.json();
    
    if (!webhookUrl) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Webhook URL is required' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`🎯 TESTING WEBHOOK: ${webhookUrl}`);

    // Create comprehensive test payload
    const testPayload = {
      event: 'test_webhook',
      data: {
        message: 'Test webhook from YusrAI System - Server Side Test',
        timestamp: new Date().toISOString(),
        test: true,
        source: 'yusrai_webhook_tester',
        test_id: crypto.randomUUID(),
        environment: 'development'
      },
      timestamp: new Date().toISOString()
    };

    const startTime = Date.now();
    
    // Generate HMAC signature if secret provided
    let signature = '';
    if (secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(testPayload)));
      const hashArray = Array.from(new Uint8Array(sig));
      signature = 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Webhook-Tester/1.0',
      'X-Webhook-Timestamp': testPayload.timestamp,
      'X-Webhook-Event': 'test_webhook'
    };

    if (signature) {
      headers['X-Webhook-Signature'] = signature;
    }

    console.log(`📡 SENDING TEST REQUEST with headers:`, Object.keys(headers));

    // Make the actual webhook call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;
    let responseBody = '';
    let networkError = false;

    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Get response body
      try {
        responseBody = await response.text();
      } catch (e) {
        responseBody = 'Failed to read response body';
      }

      console.log(`📊 WEBHOOK RESPONSE - Status: ${response.status}, Body Length: ${responseBody.length}`);

    } catch (error: any) {
      clearTimeout(timeoutId);
      networkError = true;
      
      console.error(`💥 WEBHOOK NETWORK ERROR:`, error);
      
      const responseTime = Date.now() - startTime;
      
      return new Response(JSON.stringify({
        success: false,
        error: error.name === 'AbortError' ? 'Request timeout (30s)' : `Network error: ${error.message}`,
        responseTime,
        statusCode: 0,
        networkError: true,
        details: {
          errorType: error.name,
          errorMessage: error.message,
          url: webhookUrl,
          testPayload
        }
      }), { 
        status: 200, // Don't fail the test function itself
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const responseTime = Date.now() - startTime;
    const success = response.ok;

    // Return comprehensive test results
    return new Response(JSON.stringify({
      success,
      statusCode: response.status,
      responseTime,
      responseBody: responseBody.substring(0, 1000), // Limit response body size
      headers: Object.fromEntries(response.headers.entries()),
      testPayload,
      timestamp: new Date().toISOString(),
      networkError: false,
      details: {
        url: webhookUrl,
        method: 'POST',
        hasSignature: !!signature,
        responseSize: responseBody.length
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('💥 TEST FUNCTION ERROR:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Test function error: ${error.message}`,
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
