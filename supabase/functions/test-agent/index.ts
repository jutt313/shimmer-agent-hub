
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      agent_name,
      system_prompt,
      test_prompt,
      llm_provider,
      model,
      api_key,
      agent_data
    } = await req.json();

    console.log(`🤖 Testing AI Agent: ${agent_name} with ${llm_provider}/${model}`);

    // Validate required fields
    if (!agent_name || !system_prompt || !test_prompt || !llm_provider || !model || !api_key) {
      return new Response(JSON.stringify({
        success: false,
        message: "Missing required fields for agent testing",
        details: { missing_fields: "agent_name, system_prompt, test_prompt, llm_provider, model, api_key are required" }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    let apiUrl: string;
    let requestBody: any;
    let headers: any;

    // Configure API call based on LLM provider
    switch (llm_provider.toLowerCase()) {
      case 'openai':
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        };
        requestBody = {
          model: model,
          messages: [
            { role: 'system', content: system_prompt },
            { role: 'user', content: test_prompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        };
        break;

      case 'claude':
      case 'anthropic':
        apiUrl = 'https://api.anthropic.com/v1/messages';
        headers = {
          'x-api-key': api_key,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        };
        requestBody = {
          model: model,
          max_tokens: 500,
          messages: [
            { role: 'user', content: `${system_prompt}\n\nUser: ${test_prompt}` }
          ]
        };
        break;

      case 'gemini':
      case 'google':
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${api_key}`;
        headers = {
          'Content-Type': 'application/json',
        };
        requestBody = {
          contents: [
            {
              parts: [
                { text: `${system_prompt}\n\nUser: ${test_prompt}` }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7
          }
        };
        break;

      case 'grok':
      case 'xai':
        apiUrl = 'https://api.x.ai/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        };
        requestBody = {
          model: model,
          messages: [
            { role: 'system', content: system_prompt },
            { role: 'user', content: test_prompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        };
        break;

      case 'deepseek':
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        };
        requestBody = {
          model: model,
          messages: [
            { role: 'system', content: system_prompt },
            { role: 'user', content: test_prompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        };
        break;

      default:
        return new Response(JSON.stringify({
          success: false,
          message: `Unsupported LLM provider: ${llm_provider}`,
          details: { supported_providers: ['OpenAI', 'Claude', 'Gemini', 'Grok', 'DeepSeek'] }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
    }

    console.log(`🚀 Calling ${llm_provider} API for agent test...`);

    // Make API call to test the agent
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`❌ ${llm_provider} API error:`, responseData);
      return new Response(JSON.stringify({
        success: false,
        message: `${llm_provider} API error: ${responseData.error?.message || 'Unknown error'}`,
        details: {
          status: response.status,
          error: responseData
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status
      });
    }

    // Extract response based on provider
    let agentResponse: string;
    try {
      switch (llm_provider.toLowerCase()) {
        case 'openai':
        case 'grok':
        case 'xai':
        case 'deepseek':
          agentResponse = responseData.choices[0]?.message?.content || 'No response generated';
          break;

        case 'claude':
        case 'anthropic':
          agentResponse = responseData.content[0]?.text || 'No response generated';
          break;

        case 'gemini':
        case 'google':
          agentResponse = responseData.candidates[0]?.content?.parts[0]?.text || 'No response generated';
          break;

        default:
          agentResponse = 'Could not parse response';
      }
    } catch (parseError) {
      console.error('Error parsing agent response:', parseError);
      agentResponse = 'Error parsing AI response';
    }

    console.log(`✅ Agent test completed for ${agent_name}`);

    return new Response(JSON.stringify({
      success: true,
      message: `AI Agent "${agent_name}" responded successfully with ${llm_provider}/${model}`,
      agent_response: agentResponse,
      details: {
        agent_name,
        llm_provider,
        model,
        system_prompt_length: system_prompt.length,
        test_prompt,
        response_length: agentResponse.length,
        timestamp: new Date().toISOString(),
        agent_data: agent_data
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in test-agent function:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Agent test failed: ${error.message}`,
      details: { error: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
