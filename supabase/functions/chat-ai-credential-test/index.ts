import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
if (!openaiApiKey) {
  console.error('❌ OpenAI API key not found')
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { platformName, automationContext, credentials } = await req.json()
    
    console.log(`🚀 Chat-AI Credential Test for ${platformName}`)

    // Step 1: Get fresh config from Chat-AI (without real credentials)
    const configPrompt = `Generate a real, working API test configuration for ${platformName} platform.

AUTOMATION CONTEXT: ${JSON.stringify(automationContext, null, 2)}

You must return a JSON object with this exact structure:
{
  "testEndpoint": "https://api.platform.com/actual/endpoint",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer {{api_key}}",
    "Content-Type": "application/json"
  },
  "expectedFields": ["api_key"],
  "authType": "bearer",
  "responseValidation": {
    "successIndicators": ["user", "account", "data"],
    "errorIndicators": ["error", "invalid", "unauthorized"]
  },
  "requestBody": null
}

Requirements:
- Use REAL, documented endpoints for ${platformName}
- Use current field names that ${platformName} actually expects
- Specify the correct authentication method
- NO placeholder credentials - only field names and structure
- Make sure the endpoint actually exists and works

Platform: ${platformName}`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert API integration specialist. Generate real, working API test configurations. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: configPrompt
          }
        ],
        temperature: 0.1,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const configResponse = openaiData.choices[0].message.content

    console.log(`🔧 Generated config for ${platformName}:`, configResponse)

    // Parse the AI response
    let testConfig
    try {
      testConfig = JSON.parse(configResponse)
    } catch (error) {
      throw new Error(`Failed to parse AI config: ${error.message}`)
    }

    // Step 2: Execute the test with real credentials
    const testHeaders = { ...testConfig.headers }
    
    // Replace credential placeholders with real values
    testConfig.expectedFields.forEach((field: string) => {
      if (credentials[field]) {
        Object.keys(testHeaders).forEach(headerKey => {
          testHeaders[headerKey] = testHeaders[headerKey].replace(`{{${field}}}`, credentials[field])
        })
      }
    })

    console.log(`🧪 Testing ${platformName} with endpoint: ${testConfig.testEndpoint}`)

    // Execute the test
    const testResponse = await fetch(testConfig.testEndpoint, {
      method: testConfig.method,
      headers: testHeaders,
      body: testConfig.requestBody ? JSON.stringify(testConfig.requestBody) : undefined,
    })

    const responseText = await testResponse.text()
    let responseData
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw_response: responseText }
    }

    // Analyze the response
    const isSuccess = testResponse.ok
    const hasSuccessIndicators = testConfig.responseValidation.successIndicators.some((indicator: string) =>
      JSON.stringify(responseData).toLowerCase().includes(indicator.toLowerCase())
    )
    const hasErrorIndicators = testConfig.responseValidation.errorIndicators.some((indicator: string) =>
      JSON.stringify(responseData).toLowerCase().includes(indicator.toLowerCase())
    )

    const testResult = {
      success: isSuccess && (hasSuccessIndicators || !hasErrorIndicators),
      status: testResponse.status,
      statusText: testResponse.statusText,
      configUsed: testConfig,
      response: responseData,
      message: isSuccess ? 
        `✅ ${platformName} credentials are working!` : 
        `❌ ${platformName} test failed: ${testResponse.status} ${testResponse.statusText}`,
      details: {
        endpoint: testConfig.testEndpoint,
        method: testConfig.method,
        hasSuccessIndicators,
        hasErrorIndicators,
        credentialFields: testConfig.expectedFields
      }
    }

    console.log(`📊 Test result for ${platformName}:`, testResult)

    return new Response(JSON.stringify(testResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Chat-AI credential test error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      message: `Failed to test credentials: ${error.message}`,
      error: error.message,
      configUsed: null,
      response: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})