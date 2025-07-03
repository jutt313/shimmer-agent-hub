
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-event, x-webhook-timestamp',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

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
        error: 'Webhook URL is required for testing',
        userMessage: 'Please provide a webhook URL to test'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`🎯 TESTING WEBHOOK: ${webhookUrl}`);

    // Create test payload with proper structure
    const testPayload = {
      event: 'test_webhook',
      data: {
        message: 'Test webhook from YusrAI System',
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
      try {
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
      } catch (sigError) {
        console.error('Signature generation failed:', sigError);
      }
    }

    // Prepare headers with consistent naming
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Webhook-Tester/1.0',
      'X-Webhook-Timestamp': testPayload.timestamp,
      'X-Webhook-Event': 'test_webhook'
    };

    if (signature) {
      headers['X-Webhook-Signature'] = signature;
    }

    console.log(`📡 SENDING TEST REQUEST to ${webhookUrl}`);

    // Make the webhook call with proper timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;
    let responseBody = '';
    let networkError = false;
    let userFriendlyError = '';

    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Get response body safely
      try {
        responseBody = await response.text();
      } catch (bodyError) {
        responseBody = 'Unable to read response body';
        console.error('Failed to read response body:', bodyError);
      }

      console.log(`📊 WEBHOOK RESPONSE - Status: ${response.status}, Body Length: ${responseBody.length}`);

    } catch (error: any) {
      clearTimeout(timeoutId);
      networkError = true;
      
      console.error(`💥 WEBHOOK NETWORK ERROR:`, error);
      
      // Create user-friendly error messages
      if (error.name === 'AbortError') {
        userFriendlyError = 'Webhook test timed out after 30 seconds. The webhook endpoint may be slow or unresponsive.';
      } else if (error.message.includes('fetch')) {
        userFriendlyError = 'Unable to connect to the webhook URL. Please check if the URL is correct and accessible.';
      } else if (error.message.includes('network')) {
        userFriendlyError = 'Network error occurred while testing the webhook. Please check your internet connection.';
      } else {
        userFriendlyError = `Connection failed: ${error.message}`;
      }
      
      const responseTime = Date.now() - startTime;
      
      return new Response(JSON.stringify({
        success: false,
        error: userFriendlyError,
        responseTime: responseTime, // FIXED: consistent camelCase naming
        statusCode: 0,
        networkError: true,
        userMessage: userFriendlyError,
        details: {
          errorType: error.name,
          originalError: error.message,
          url: webhookUrl,
          timestamp: new Date().toISOString()
        }
      }), { 
        status: 200, // Don't fail the test function itself
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const responseTime = Date.now() - startTime;
    const success = response.ok;

    // Generate user-friendly status messages
    let userMessage = '';
    if (success) {
      userMessage = `Webhook test successful! Responded in ${responseTime}ms with status ${response.status}`;
    } else if (response.status >= 400 && response.status < 500) {
      userMessage = `Webhook rejected the request (${response.status}). Check your webhook endpoint configuration.`;
    } else if (response.status >= 500) {
      userMessage = `Webhook server error (${response.status}). The endpoint may be experiencing issues.`;
    } else {
      userMessage = `Webhook responded with status ${response.status}`;
    }

    // Return consistent response format with camelCase properties
    return new Response(JSON.stringify({
      success,
      statusCode: response.status, // FIXED: consistent camelCase
      responseTime: responseTime,  // FIXED: consistent camelCase
      responseBody: responseBody.substring(0, 1000), // Limit size
      userMessage: userMessage,
      error: success ? undefined : userMessage,
      networkError: false,
      headers: Object.fromEntries(response.headers.entries()),
      testPayload,
      timestamp: new Date().toISOString(),
      details: {
        url: webhookUrl,
        method: 'POST',
        hasSignature: !!signature,
        responseSize: responseBody.length,
        testId: testPayload.data.test_id
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('💥 TEST FUNCTION CRITICAL ERROR:', error);
    
    const userFriendlyError = 'Internal error occurred during webhook testing. Please try again.';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: userFriendlyError,
      userMessage: userFriendlyError,
      responseTime: 0,
      statusCode: 500,
      networkError: false,
      timestamp: new Date().toISOString(),
      details: {
        internalError: error.message
      }
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
