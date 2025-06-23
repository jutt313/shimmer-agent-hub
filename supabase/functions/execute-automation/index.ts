
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

    const { automation_id, trigger_data } = await req.json()

    if (!automation_id) {
      return new Response(
        JSON.stringify({ error: 'Missing automation_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get automation details first
    const { data: automation, error: automationError } = await supabaseClient
      .from('automations')
      .select('id, title, user_id, automation_blueprint')
      .eq('id', automation_id)
      .single()

    if (automationError || !automation) {
      console.error('Error fetching automation:', automationError)
      return new Response(
        JSON.stringify({ error: 'Automation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create automation run record
    const runId = crypto.randomUUID()
    const startTime = new Date()

    try {
      // Create notification for automation run started
      await supabaseClient.functions.invoke('create-notification', {
        body: {
          userId: automation.user_id,
          title: 'Automation Started',
          message: `Your automation "${automation.title}" has started running.`,
          type: 'automation_status',
          category: 'execution',
          metadata: { automation_id: automation.id, run_id: runId }
        }
      });

      const { data: run, error: runError } = await supabaseClient
        .from('automation_runs')
        .insert([
          {
            id: runId,
            automation_id: automation_id,
            user_id: automation.user_id,
            status: 'running',
            trigger_data: trigger_data || {},
            run_timestamp: startTime.toISOString(),
            details_log: {
              started_at: startTime.toISOString(),
              steps: []
            }
          }
        ])
        .select()
        .single()

      if (runError) {
        console.error('Error creating automation run:', runError)
        throw runError
      }

      // Simulate automation execution (replace with actual logic)
      console.log(`🚀 Starting automation execution for: ${automation.title}`)
      
      // Add some simulation delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For now, we'll mark it as completed successfully
      // In a real implementation, this would execute the actual automation blueprint
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      // Update run status to completed
      const { error: updateError } = await supabaseClient
        .from('automation_runs')
        .update({
          status: 'completed',
          duration_ms: duration,
          details_log: {
            started_at: startTime.toISOString(),
            completed_at: endTime.toISOString(),
            steps: [
              {
                step: 'initialization',
                status: 'completed',
                timestamp: startTime.toISOString()
              },
              {
                step: 'execution',
                status: 'completed', 
                timestamp: endTime.toISOString()
              }
            ],
            result: 'Automation executed successfully'
          }
        })
        .eq('id', runId)

      if (updateError) {
        console.error('Error updating run status:', updateError)
      }

      // Create notification for successful completion
      await supabaseClient.functions.invoke('create-notification', {
        body: {
          userId: automation.user_id,
          title: 'Automation Completed',
          message: `Your automation "${automation.title}" has completed successfully.`,
          type: 'automation_status',
          category: 'execution',
          metadata: { automation_id: automation.id, run_id: runId, duration_ms: duration }
        }
      });

      console.log(`✅ Automation execution completed: ${automation.title}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          run_id: runId,
          status: 'completed',
          duration_ms: duration,
          automation_title: automation.title
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (executionError) {
      console.error('Error during automation execution:', executionError)
      
      // Update run status to failed
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()
      
      await supabaseClient
        .from('automation_runs')
        .update({
          status: 'failed',
          duration_ms: duration,
          details_log: {
            started_at: startTime.toISOString(),
            failed_at: endTime.toISOString(),
            error: executionError.message,
            steps: [
              {
                step: 'initialization',
                status: 'completed',
                timestamp: startTime.toISOString()
              },
              {
                step: 'execution',
                status: 'failed',
                timestamp: endTime.toISOString(),
                error: executionError.message
              }
            ]
          }
        })
        .eq('id', runId)

      // Create notification for failed execution
      await supabaseClient.functions.invoke('create-notification', {
        body: {
          userId: automation.user_id,
          title: 'Automation Failed',
          message: `Your automation "${automation.title}" failed: ${executionError.message}`,
          type: 'automation_status',
          category: 'error',
          metadata: { automation_id: automation.id, run_id: runId, error: executionError.message }
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'Automation execution failed',
          run_id: runId,
          details: executionError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in execute-automation function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
