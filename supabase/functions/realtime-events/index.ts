
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const { headers } = req
  const upgradeHeader = headers.get("upgrade") || ""

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 426 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  let userId: string | null = null
  let subscriptions: any[] = []

  socket.onopen = () => {
    console.log('WebSocket connection opened')
    socket.send(JSON.stringify({
      type: 'connection_ack',
      message: 'Connected to YusrAI real-time events'
    }))
  }

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'authenticate':
          // Authenticate user with API token
          const token = message.token
          if (!token) {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Authentication token required'
            }))
            return
          }

          // Validate token
          const tokenHash = await hashToken(token)
          const { data: tokenData, error: tokenError } = await supabase
            .rpc('validate_api_token', { token_hash: tokenHash })
            .single()

          if (tokenError || !tokenData?.is_valid) {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Invalid authentication token'
            }))
            socket.close()
            return
          }

          userId = tokenData.user_id
          socket.send(JSON.stringify({
            type: 'authenticated',
            user_id: userId
          }))
          break

        case 'subscribe':
          if (!userId) {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Must authenticate before subscribing'
            }))
            return
          }

          const { events } = message
          
          // Subscribe to real-time automation runs
          if (events.includes('automation_runs')) {
            const runsChannel = supabase
              .channel('automation_runs_channel')
              .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'automation_runs',
                filter: `user_id=eq.${userId}`
              }, (payload) => {
                socket.send(JSON.stringify({
                  type: 'automation_run_update',
                  data: payload
                }))
              })
              .subscribe()
            
            subscriptions.push(runsChannel)
          }

          // Subscribe to real-time webhook deliveries
          if (events.includes('webhook_deliveries')) {
            const webhookChannel = supabase
              .channel('webhook_deliveries_channel')
              .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'webhook_delivery_logs'
              }, async (payload) => {
                // Check if this webhook belongs to the user
                const { data: webhook } = await supabase
                  .from('automation_webhooks')
                  .select(`
                    automations!inner(user_id)
                  `)
                  .eq('id', payload.new?.automation_webhook_id)
                  .single()

                if (webhook?.automations?.user_id === userId) {
                  socket.send(JSON.stringify({
                    type: 'webhook_delivery_update',
                    data: payload
                  }))
                }
              })
              .subscribe()
            
            subscriptions.push(webhookChannel)
          }

          // Subscribe to real-time API usage
          if (events.includes('api_usage')) {
            const apiChannel = supabase
              .channel('api_usage_channel')
              .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'api_usage_logs',
                filter: `user_id=eq.${userId}`
              }, (payload) => {
                socket.send(JSON.stringify({
                  type: 'api_usage_update',
                  data: payload
                }))
              })
              .subscribe()
            
            subscriptions.push(apiChannel)
          }

          socket.send(JSON.stringify({
            type: 'subscribed',
            events: events
          }))
          break

        case 'ping':
          socket.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }))
          break

        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }))
      }
    } catch (error) {
      console.error('WebSocket message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }))
    }
  }

  socket.onclose = () => {
    console.log('WebSocket connection closed')
    // Clean up subscriptions
    subscriptions.forEach(sub => {
      supabase.removeChannel(sub)
    })
  }

  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  return response
})

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
