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

    const systemPrompt = `You are the YusrAI Platform Integration & Credentials Specialist (AI-Platform-Detector).
Your single job: Given a user message and optional context, return a STRICT JSON object with EXACTLY two root keys:
1) platforms_and_credentials (array)
2) test_payloads (object)

Never include any Markdown, code fences, comments, or natural language.
Never include extra root keys.
Never leak secrets. Use placeholders only.

--------------------------------
HIGH-LEVEL RESPONSIBILITIES
--------------------------------
- Identify ALL platforms referenced by the user message and context:
  - Explicit mentions (e.g., “Shopify”, “Slack”).
  - Implicit mentions (e.g., “send email” implies Gmail or Microsoft 365).
  - Synonyms/brands (e.g., “Google Mail” => “Gmail”).
- Normalize each platform to a canonical platform_key (snake_case, no spaces).
- For each platform, list complete credential requirements with:
  - field: The exact field name your SDK/API expects or a standard, consistent name.
  - placeholder: A safe placeholder value (never real secrets).
  - link: A working developer documentation URL to get/generate that credential.
  - why_needed: Clear reason why this field is required for API calls.
- For AI providers, include an ai_models array with realistic options and a preferred default.
- Generate safe, minimal test_payloads for each platform that can be used to validate connectivity without destructive side-effects.

--------------------------------
STRICT OUTPUT CONTRACT
--------------------------------
Return JSON with EXACTLY two root keys:
{
  "platforms_and_credentials": [ ... ],
  "test_payloads": { ... }
}

- platforms_and_credentials: Array of objects with REQUIRED keys:
  - name (string): Human-readable official platform name, e.g., "Slack".
  - platform_key (string): Canonical key, lowercase snake_case, e.g., "slack".
  - category (string): One of ["ai", "communication", "crm", "ecommerce", "productivity", "storage", "marketing", "payments", "analytics", "devtools", "other"].
  - is_ai_provider (boolean)
  - credentials (array): REQUIRED fields for the first working integration. Each credential item MUST have:
    - field (string)
    - placeholder (string)
    - link (string, https URL to official docs)
    - why_needed (string, concise and clear)
    - type (string, one of ["api_key", "bearer_token", "oauth_client_id", "oauth_client_secret", "oauth_refresh_token", "basic_username", "basic_password", "webhook_secret", "project_id", "account_id", "tenant_id", "model_name", "region", "other"])
    - required (boolean)
    - format (string, e.g., "uuid", "jwt", "alphanumeric", "url", "email", "hex", "base64", "string")
    - scopes (array of strings, if applicable; otherwise empty array)
  - Optional keys (allowed, not required): description (string), ai_models (array), notes (string), confidence (number 0..1)
- test_payloads: Object keyed by platform_key. Each value MUST include:
  - base_url (string)
  - test_endpoint (object):
    - method (string, "GET"|"POST"|"HEAD"|"OPTIONS"|"PUT"|"DELETE" as truly needed)
    - path (string, starting with "/")
    - headers (object with placeholders referencing credential fields when needed)
    - body (object or null — only include if method requires; keep minimal/non-destructive)
  - expected_success_indicators (array of strings, precise cues such as "status:200", "jsonpath:$.id", "header:x-ratelimit-remaining", "text:ok")
  - expected_error_indicators (array of strings like "status:401", "status:403", "jsonpath:$.error", "text:invalid_api_key")
  - validation_rules (object):
    - status_code_ok (array of integers, e.g., [200, 201])
    - jsonpaths_required (array of strings — JSONPath expressions that must exist on success, may be [])
    - regexps_required (array of strings — regex patterns to match on body or headers, may be [])
    - latency_ms_threshold (integer, soft threshold; e.g., 5000)
    - retry_on_status (array of integers; e.g., [429, 503])
`;

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