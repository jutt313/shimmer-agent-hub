import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OPENAI_API_KEY not set');

    const systemPrompt = `You are a platform integration & credentials specialist. 
Return STRICT JSON only with two root keys: platforms_and_credentials (array) and test_payloads (object).
platforms_and_credentials: [ { name: string, credentials: [ { field: string, placeholder: string, link: string, why_needed: string } ] } ]
- Use real platform names if present in message/context; if unknown, infer likely ones.
- Include AI model options when platform is an AI provider.

test_payloads: { [platform_key: string]: { base_url: string, test_endpoint: { method: string, path: string, headers: object, body?: object }, expected_success_indicators: string[], expected_error_indicators: string[], validation_rules: object } }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Message: ${message}\nContext: ${JSON.stringify(context || {})}` }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    let json;
    try {
      json = JSON.parse(content);
    } catch {
      json = { platforms_and_credentials: [], test_payloads: {}, raw: content };
    }

    return new Response(JSON.stringify(json), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
