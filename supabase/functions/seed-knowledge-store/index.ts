
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Knowledge base entries for seeding
    const knowledgeEntries = [
      {
        title: "Platform Integration Guide",
        content: "Learn how to integrate various platforms like Gmail, Slack, Discord, and more with your automations.",
        category: "integrations",
        tags: ["platforms", "integration", "setup"]
      },
      {
        title: "Automation Best Practices", 
        content: "Follow these best practices when creating automations: use clear naming, add proper error handling, test thoroughly.",
        category: "best-practices",
        tags: ["automation", "guidelines", "tips"]
      },
      {
        title: "Trigger Configuration",
        content: "Configure triggers effectively by setting proper conditions, using webhooks when needed, and managing scheduling.",
        category: "triggers",
        tags: ["triggers", "webhooks", "scheduling"]
      },
      {
        title: "Action Setup Guide",
        content: "Set up actions properly by configuring the right parameters, handling data mapping, and managing credentials.",
        category: "actions", 
        tags: ["actions", "configuration", "data-mapping"]
      },
      {
        title: "Error Handling Strategies",
        content: "Implement robust error handling with retry mechanisms, fallback actions, and proper logging.",
        category: "error-handling",
        tags: ["errors", "debugging", "reliability"]
      },
      {
        title: "Security Guidelines",
        content: "Follow security best practices: secure credential storage, validate inputs, and use proper authentication.",
        category: "security",
        tags: ["security", "credentials", "authentication"]
      }
    ];

    // Insert knowledge entries
    for (const entry of knowledgeEntries) {
      const { error } = await supabaseClient
        .from('knowledge_store')
        .insert([entry])
        .select();

      if (error) {
        console.error('Error inserting knowledge entry:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully seeded ${knowledgeEntries.length} knowledge entries` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in seed-knowledge-store function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to seed knowledge store',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
