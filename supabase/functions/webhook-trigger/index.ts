
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
    const automationId = url.searchParams.get('automation_id')
    const webhookId = url.pathname.split('/').pop()

    if (!automationId || !webhookId) {
      return new Response(
        JSON.stringify({ error: 'Missing automation_id or webhook_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the webhook by URL path
    const { data: webhook, error: webhookError } = await supabase
      .from('automation_webhooks')
      .select('*')
      .eq('automation_id', automationId)
      .like('webhook_url', `%${webhookId}%`)
      .eq('is_active', true)
      .single()

    if (webhookError || !webhook) {
      return new Response(
        JSON.stringify({ error: 'Webhook not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate webhook signature if provided
    const signature = req.headers.get('x-webhook-signature')
    if (signature) {
      const body = await req.text()
      const expectedSignature = await generateSignature(body, webhook.webhook_secret)
      
      if (signature !== expectedSignature) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get request body for execution
    const payload = req.method === 'POST' ? await req.json() : {}

    // Execute the automation
    const { data: executionResult, error: executionError } = await supabase.functions.invoke('execute-automation', {
      body: {
        automationId: automationId,
        triggerData: {
          source: 'webhook',
          webhook_id: webhook.id,
          payload: payload,
          headers: Object.fromEntries(req.headers.entries()),
          timestamp: new Date().toISOString()
        }
      }
    })

    // Update webhook statistics
    await supabase
      .from('automation_webhooks')
      .update({
        trigger_count: webhook.trigger_count + 1,
        last_triggered_at: new Date().toISOString()
      })
      .eq('id', webhook.id)

    // Log webhook delivery
    await supabase
      .from('webhook_delivery_logs')
      .insert({
        automation_webhook_id: webhook.id,
        payload: payload,
        status_code: executionError ? 500 : 200,
        response_body: executionError ? executionError.message : JSON.stringify(executionResult),
        delivered_at: new Date().toISOString()
      })

    if (executionError) {
      console.error('Automation execution error:', executionError)
      return new Response(
        JSON.stringify({ 
          error: 'Automation execution failed',
          details: executionError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'Webhook received and automation executed successfully',
        execution_id: executionResult?.execution_id,
        status: 'success'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook trigger error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(payload)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  return 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
