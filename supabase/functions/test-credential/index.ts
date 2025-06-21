
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestRequest {
  type: 'platform' | 'agent';
  platform_name?: string;
  credential_fields?: Record<string, string>;
  agent_id?: string;
  platform_credential_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        }
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const body: TestRequest = await req.json()
    console.log('🧪 Test request received:', body)

    let testResult = {
      success: false,
      user_message: '',
      technical_details: {}
    }

    if (body.type === 'platform') {
      testResult = await testPlatformCredential(body.platform_name!, body.credential_fields!)
      
      // Save platform test result to database
      if (body.platform_credential_id) {
        await supabaseClient
          .from('credential_test_results')
          .insert({
            platform_credential_id: body.platform_credential_id,
            test_status: testResult.success ? 'passed' : 'failed',
            test_message: testResult.user_message,
            technical_details: testResult.technical_details
          })
      }
    } else if (body.type === 'agent') {
      testResult = await testAIAgent(body.agent_id!, supabaseClient)
      
      // Save agent test result to database
      await supabaseClient
        .from('agent_test_results')
        .insert({
          ai_agent_id: body.agent_id,
          test_status: testResult.success ? 'passed' : 'failed',
          test_message: testResult.user_message,
          technical_details: testResult.technical_details
        })
    }

    return new Response(
      JSON.stringify(testResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        user_message: 'Test failed due to an internal error. Please try again.',
        technical_details: { error: error.message }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function testPlatformCredential(platformName: string, credentials: Record<string, string>) {
  console.log(`🔧 Testing ${platformName} credentials`)

  try {
    switch (platformName.toLowerCase()) {
      case 'gmail':
        return await testGmail(credentials)
      case 'slack':
        return await testSlack(credentials)
      case 'asana':
        return await testAsana(credentials)
      case 'trello':
        return await testTrello(credentials)
      case 'microsoft teams':
        return await testMicrosoftTeams(credentials)
      case 'help scout':
        return await testHelpScout(credentials)
      default:
        return {
          success: false,
          user_message: `Testing for ${platformName} is not yet implemented. Please contact support.`,
          technical_details: { platform: platformName, error: 'Platform not supported' }
        }
    }
  } catch (error) {
    return {
      success: false,
      user_message: `Failed to test ${platformName} credentials. Please check your credentials and try again.`,
      technical_details: { platform: platformName, error: error.message }
    }
  }
}

async function testGmail(credentials: Record<string, string>) {
  const { oauth_token } = credentials
  
  if (!oauth_token) {
    return {
      success: false,
      user_message: 'OAuth token is required for Gmail integration.',
      technical_details: { missing_field: 'oauth_token' }
    }
  }

  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${oauth_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      return {
        success: false,
        user_message: 'Gmail OAuth token is invalid or expired. Please re-authorize your Gmail account.',
        technical_details: { status: response.status, response: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `Gmail connection successful! Connected to ${data.emailAddress}`,
      technical_details: { email: data.emailAddress, messages_total: data.messagesTotal }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to Gmail. Please check your internet connection and try again.',
      technical_details: { error: error.message }
    }
  }
}

async function testSlack(credentials: Record<string, string>) {
  const { bot_token } = credentials
  
  if (!bot_token) {
    return {
      success: false,
      user_message: 'Bot token is required for Slack integration.',
      technical_details: { missing_field: 'bot_token' }
    }
  }

  try {
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bot_token}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    if (!data.ok) {
      return {
        success: false,
        user_message: 'Slack bot token is invalid. Please check your bot token and ensure it has the necessary permissions.',
        technical_details: { error: data.error, response: data }
      }
    }

    return {
      success: true,
      user_message: `Slack connection successful! Connected to ${data.team} as ${data.user}`,
      technical_details: { team: data.team, user: data.user, team_id: data.team_id }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to Slack. Please check your internet connection and try again.',
      technical_details: { error: error.message }
    }
  }
}

async function testAsana(credentials: Record<string, string>) {
  const { personal_access_token } = credentials
  
  if (!personal_access_token) {
    return {
      success: false,
      user_message: 'Personal access token is required for Asana integration.',
      technical_details: { missing_field: 'personal_access_token' }
    }
  }

  try {
    const response = await fetch('https://app.asana.com/api/1.0/users/me', {
      headers: {
        'Authorization': `Bearer ${personal_access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      return {
        success: false,
        user_message: 'Asana personal access token is invalid. Please check your token and try again.',
        technical_details: { status: response.status, response: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `Asana connection successful! Connected as ${data.data.name}`,
      technical_details: { user: data.data.name, email: data.data.email, gid: data.data.gid }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to Asana. Please check your internet connection and try again.',
      technical_details: { error: error.message }
    }
  }
}

async function testTrello(credentials: Record<string, string>) {
  const { api_key, token } = credentials
  
  if (!api_key || !token) {
    return {
      success: false,
      user_message: 'Both API key and token are required for Trello integration.',
      technical_details: { missing_fields: !api_key ? ['api_key'] : ['token'] }
    }
  }

  try {
    const response = await fetch(`https://api.trello.com/1/members/me?key=${api_key}&token=${token}`)

    if (!response.ok) {
      const errorData = await response.text()
      return {
        success: false,
        user_message: 'Trello API key or token is invalid. Please check your credentials and try again.',
        technical_details: { status: response.status, response: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `Trello connection successful! Connected as ${data.fullName}`,
      technical_details: { user: data.fullName, username: data.username, id: data.id }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to Trello. Please check your internet connection and try again.',
      technical_details: { error: error.message }
    }
  }
}

async function testMicrosoftTeams(credentials: Record<string, string>) {
  const { access_token } = credentials
  
  if (!access_token) {
    return {
      success: false,
      user_message: 'Access token is required for Microsoft Teams integration.',
      technical_details: { missing_field: 'access_token' }
    }
  }

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      return {
        success: false,
        user_message: 'Microsoft Teams access token is invalid or expired. Please re-authorize your Microsoft account.',
        technical_details: { status: response.status, response: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `Microsoft Teams connection successful! Connected as ${data.displayName}`,
      technical_details: { user: data.displayName, email: data.mail, id: data.id }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to Microsoft Teams. Please check your internet connection and try again.',
      technical_details: { error: error.message }
    }
  }
}

async function testHelpScout(credentials: Record<string, string>) {
  const { api_key } = credentials
  
  if (!api_key) {
    return {
      success: false,
      user_message: 'API key is required for Help Scout integration.',
      technical_details: { missing_field: 'api_key' }
    }
  }

  try {
    const response = await fetch('https://api.helpscout.net/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      return {
        success: false,
        user_message: 'Help Scout API key is invalid. Please check your API key and try again.',
        technical_details: { status: response.status, response: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `Help Scout connection successful! Connected as ${data.firstName} ${data.lastName}`,
      technical_details: { user: `${data.firstName} ${data.lastName}`, email: data.email, id: data.id }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to Help Scout. Please check your internet connection and try again.',
      technical_details: { error: error.message }
    }
  }
}

async function testAIAgent(agentId: string, supabaseClient: any) {
  console.log(`🤖 Testing AI Agent: ${agentId}`)

  try {
    // Fetch agent details
    const { data: agent, error } = await supabaseClient
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (error || !agent) {
      return {
        success: false,
        user_message: 'AI Agent not found. Please check the agent configuration.',
        technical_details: { error: error?.message || 'Agent not found' }
      }
    }

    const { llm_provider, model, api_key, agent_name, agent_role } = agent

    if (!llm_provider || !model || !api_key) {
      return {
        success: false,
        user_message: 'AI Agent is missing required configuration (LLM provider, model, or API key).',
        technical_details: { 
          missing: {
            llm_provider: !llm_provider,
            model: !model,
            api_key: !api_key
          }
        }
      }
    }

    // Test the specific LLM provider
    const testResult = await testLLMProvider(llm_provider, model, api_key, agent_name, agent_role)
    return testResult

  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to test AI Agent. Please check the agent configuration and try again.',
      technical_details: { error: error.message }
    }
  }
}

async function testLLMProvider(provider: string, model: string, apiKey: string, agentName: string, agentRole: string) {
  const testPrompt = `Hello! I am ${agentName}, and my role is: ${agentRole}. Please respond with a simple "Hello back!" to confirm the connection is working.`

  try {
    switch (provider.toLowerCase()) {
      case 'openai':
        return await testOpenAI(model, apiKey, testPrompt)
      case 'claude':
        return await testClaude(model, apiKey, testPrompt)
      case 'gemini':
        return await testGemini(model, apiKey, testPrompt)
      case 'grok':
        return await testGrok(model, apiKey, testPrompt)
      case 'deepseek':
        return await testDeepSeek(model, apiKey, testPrompt)
      default:
        return {
          success: false,
          user_message: `LLM provider "${provider}" is not yet supported for testing.`,
          technical_details: { provider, error: 'Provider not supported' }
        }
    }
  } catch (error) {
    return {
      success: false,
      user_message: `Failed to test ${provider} connection. Please check your API key and try again.`,
      technical_details: { provider, model, error: error.message }
    }
  }
}

async function testOpenAI(model: string, apiKey: string, prompt: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        user_message: `OpenAI API key is invalid or model "${model}" is not accessible. Please check your credentials.`,
        technical_details: { status: response.status, error: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `OpenAI connection successful! Model "${model}" is working correctly.`,
      technical_details: { model, response: data.choices[0]?.message?.content }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to OpenAI. Please check your internet connection and API key.',
      technical_details: { error: error.message }
    }
  }
}

async function testClaude(model: string, apiKey: string, prompt: string) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        user_message: `Claude API key is invalid or model "${model}" is not accessible. Please check your credentials.`,
        technical_details: { status: response.status, error: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `Claude connection successful! Model "${model}" is working correctly.`,
      technical_details: { model, response: data.content[0]?.text }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to Claude. Please check your internet connection and API key.',
      technical_details: { error: error.message }
    }
  }
}

async function testGemini(model: string, apiKey: string, prompt: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        user_message: `Gemini API key is invalid or model "${model}" is not accessible. Please check your credentials.`,
        technical_details: { status: response.status, error: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `Gemini connection successful! Model "${model}" is working correctly.`,
      technical_details: { model, response: data.candidates[0]?.content?.parts[0]?.text }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to Gemini. Please check your internet connection and API key.',
      technical_details: { error: error.message }
    }
  }
}

async function testGrok(model: string, apiKey: string, prompt: string) {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        user_message: `Grok API key is invalid or model "${model}" is not accessible. Please check your credentials.`,
        technical_details: { status: response.status, error: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `Grok connection successful! Model "${model}" is working correctly.`,
      technical_details: { model, response: data.choices[0]?.message?.content }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to Grok. Please check your internet connection and API key.',
      technical_details: { error: error.message }
    }
  }
}

async function testDeepSeek(model: string, apiKey: string, prompt: string) {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        user_message: `DeepSeek API key is invalid or model "${model}" is not accessible. Please check your credentials.`,
        technical_details: { status: response.status, error: errorData }
      }
    }

    const data = await response.json()
    return {
      success: true,
      user_message: `DeepSeek connection successful! Model "${model}" is working correctly.`,
      technical_details: { model, response: data.choices[0]?.message?.content }
    }
  } catch (error) {
    return {
      success: false,
      user_message: 'Failed to connect to DeepSeek. Please check your internet connection and API key.',
      technical_details: { error: error.message }
    }
  }
}
