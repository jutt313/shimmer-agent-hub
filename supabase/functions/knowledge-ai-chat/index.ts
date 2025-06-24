import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENFORCED_KNOWLEDGE_SYSTEM_PROMPT = `You are Universal Memory AI, a specialized automation expert for the YusrAI Platform.

CRITICAL COMPLIANCE REQUIREMENT: You MUST respond with BOTH human-readable text AND valid structured JSON. Non-compliance will result in response rejection.

MANDATORY RESPONSE FORMAT:

Provide a helpful explanation followed by this EXACT JSON structure:

\`\`\`json
{
  "summary": "Clear 2-3 line description of what this automation does (MANDATORY - never empty)",
  "steps": [
    "Step 1: Detailed specific action to take",
    "Step 2: Next concrete action with specifics", 
    "Step 3: Continue with actionable steps",
    "Step 4: Include at least 4-6 detailed steps"
  ],
  "platforms": [
    {
      "name": "Platform Name (Gmail, Slack, etc.)",
      "api_config": {
        "base_url": "https://api.platform.com (REAL URL REQUIRED)",
        "auth_type": "bearer_token|api_key|oauth|basic_auth",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "method_name": {
            "endpoint": "specific/endpoint/path",
            "http_method": "POST|GET|PUT|DELETE",
            "required_params": ["param1", "param2"],
            "optional_params": ["param3"],
            "example_request": {"key": "value"}
          }
        }
      },
      "credentials": [
        {
          "field": "api_key",
          "placeholder": "Enter your API key here",
          "link": "https://platform.com/api-keys",
          "why_needed": "Required to authenticate API requests"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "SpecificAgentName",
      "role": "Detailed role description",
      "goal": "Specific objective this agent accomplishes",
      "rules": "Detailed operating principles",
      "memory": "Initial memory context",
      "why_needed": "Detailed explanation of why this agent is essential"
    }
  ],
  "clarification_questions": [],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Detailed automation workflow description",
    "trigger": {
      "type": "manual|scheduled|webhook"
    },
    "steps": [
      {
        "id": "step_1",
        "name": "Descriptive Step Name",
        "type": "action",
        "action": {
          "integration": "platform_name",
          "method": "specific_method",
          "parameters": {},
          "platform_credential_id": "credential_reference"
        }
      }
    ],
    "variables": {}
  }
}
\`\`\`

EXAMPLE RESPONSE for "Create automation to backup Notion pages to Google Drive":

I'll help you create a comprehensive automation for backing up your Notion pages to Google Drive. This will ensure your important data is safely stored and accessible.

\`\`\`json
{
  "summary": "This automation regularly exports all Notion pages from your workspace and uploads them as PDF/HTML files to a designated Google Drive folder for backup purposes.",
  "steps": [
    "Connect to Notion API and retrieve list of all accessible pages and databases",
    "Export each page in PDF and HTML format using Notion's export functionality", 
    "Create organized folder structure in Google Drive based on Notion workspace hierarchy",
    "Upload exported files to corresponding Google Drive folders with timestamps",
    "Update backup log with completion status and file counts",
    "Send notification summary of backup results via email or Slack"
  ],
  "platforms": [
    {
      "name": "Notion",
      "api_config": {
        "base_url": "https://api.notion.com/v1",
        "auth_type": "bearer_token",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "search_pages": {
            "endpoint": "search",
            "http_method": "POST",
            "required_params": [],
            "optional_params": ["query", "filter"],
            "example_request": {"query": "", "filter": {"value": "page", "property": "object"}}
          },
          "get_page": {
            "endpoint": "pages/{page_id}",
            "http_method": "GET",
            "required_params": ["page_id"],
            "optional_params": [],
            "example_request": {}
          }
        }
      },
      "credentials": [
        {
          "field": "integration_token",
          "placeholder": "secret_XXXXXXXXXXXXXXX",
          "link": "https://www.notion.so/my-integrations",
          "why_needed": "Required to access your Notion pages and databases for backup"
        }
      ]
    },
    {
      "name": "Google Drive",
      "api_config": {
        "base_url": "https://www.googleapis.com/drive/v3",
        "auth_type": "oauth",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "upload_file": {
            "endpoint": "files",
            "http_method": "POST",
            "required_params": ["name", "parents"],
            "optional_params": ["description"],
            "example_request": {"name": "backup.pdf", "parents": ["folder_id"]}
          },
          "create_folder": {
            "endpoint": "files",
            "http_method": "POST",
            "required_params": ["name", "mimeType"],
            "optional_params": ["parents"],
            "example_request": {"name": "Notion Backup", "mimeType": "application/vnd.google-apps.folder"}
          }
        }
      },
      "credentials": [
        {
          "field": "access_token",
          "placeholder": "ya29.a0...",
          "link": "https://console.cloud.google.com/apis/credentials",
          "why_needed": "OAuth token required to upload files to your Google Drive"
        },
        {
          "field": "backup_folder_id",
          "placeholder": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
          "link": "https://drive.google.com",
          "why_needed": "Specific folder ID where Notion backups will be stored"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "NotionBackupManager",
      "role": "Notion content export and backup coordination specialist",
      "goal": "Systematically export all Notion content and organize it for reliable backup storage",
      "rules": "Process pages hierarchically, maintain folder structure, handle rate limits, verify file integrity",
      "memory": "Previous backup timestamps, file organization preferences, error patterns and recovery methods",
      "why_needed": "Essential for managing complex export process, handling API rate limits, and ensuring complete backup coverage"
    }
  ],
  "clarification_questions": [],
  "automation_blueprint": {
    "version": "1.0.0", 
    "description": "Automated Notion to Google Drive backup system",
    "trigger": {
      "type": "scheduled"
    },
    "steps": [
      {
        "id": "fetch_notion_pages",
        "name": "Fetch All Notion Pages",
        "type": "action",
        "action": {
          "integration": "notion",
          "method": "search_pages",
          "parameters": {
            "filter": {"value": "page", "property": "object"}
          },
          "platform_credential_id": "notion_cred"
        }
      },
      {
        "id": "process_backup",
        "name": "Process Backup Operations",
        "type": "ai_agent_call",
        "ai_agent_call": {
          "agent_id": "notion_backup_manager",
          "input_prompt": "Organize and backup these Notion pages: {{notion_pages}}",
          "output_variable": "backup_results"
        }
      },
      {
        "id": "upload_to_drive",
        "name": "Upload to Google Drive",
        "type": "action",
        "action": {
          "integration": "google_drive",
          "method": "upload_file",
          "parameters": {
            "files": "{{backup_files}}",
            "parents": ["{{backup_folder_id}}"]
          },
          "platform_credential_id": "gdrive_cred"
        }
      }
    ],
    "variables": {
      "notion_pages": "",
      "backup_files": "",
      "backup_results": ""
    }
  }
}
\`\`\`

CRITICAL RULES:
1. ALWAYS include human-readable explanation before JSON
2. NEVER respond without ALL required JSON fields filled completely
3. ALWAYS include at least 4-6 detailed steps
4. ALWAYS include complete platform API configurations
5. ALWAYS include detailed credential requirements
6. ALWAYS include specific AI agent recommendations
7. JSON must be valid and parseable

PENALTY WARNING: Incomplete responses will be rejected and retried automatically.`;

// Validation function for knowledge responses
const validateKnowledgeResponse = (response: any): { isValid: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!response.summary || response.summary.trim().length < 15) {
    missing.push('summary (must be descriptive, 15+ characters)');
  }
  
  if (!response.steps || !Array.isArray(response.steps) || response.steps.length < 4) {
    missing.push('steps (must be array with at least 4 detailed steps)');
  }
  
  if (!response.platforms || !Array.isArray(response.platforms) || response.platforms.length === 0) {
    missing.push('platforms (must include at least one platform with API config)');
  } else {
    response.platforms.forEach((platform: any, index: number) => {
      if (!platform.credentials || platform.credentials.length === 0) {
        missing.push(`platforms[${index}].credentials`);
      }
      if (!platform.api_config || !platform.api_config.base_url || !platform.api_config.methods) {
        missing.push(`platforms[${index}].api_config (must include base_url and methods)`);
      }
    });
  }
  
  if (!response.agents || !Array.isArray(response.agents) || response.agents.length === 0) {
    missing.push('agents (must include at least one AI agent)');
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, category = null, userRole = 'user', context = 'general' } = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get enhanced context from knowledge store
    const { data: knowledgeData } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .or(`title.ilike.%${message}%,summary.ilike.%${message}%`)
      .order('usage_count', { ascending: false })
      .limit(5);

    let knowledgeContext = '';
    if (knowledgeData && knowledgeData.length > 0) {
      knowledgeContext = `\n\nEXISTING KNOWLEDGE:\n${knowledgeData.map(k => 
        `- ${k.title}: ${k.summary}\n  Solution: ${k.details?.solution || 'No solution recorded'}`
      ).join('\n')}`;
    }

    // Get platform context
    const { count: automationsCount } = await supabase
      .from('automations')
      .select('*', { count: 'exact', head: true });

    const platformContext = `\nPlatform Context: User is ${userRole}. Provide comprehensive automation solutions.`;

    // Retry mechanism for compliance
    let attempts = 0;
    let finalResponse = '';
    
    while (attempts < 3) {
      console.log(`Knowledge AI attempt ${attempts + 1}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: ENFORCED_KNOWLEDGE_SYSTEM_PROMPT + platformContext + knowledgeContext
            },
            { 
              role: 'user', 
              content: message 
            }
          ],
          max_tokens: 4000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let aiResponse = data.choices[0].message.content;

      // Extract and validate JSON from response
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch) {
        try {
          const parsedJSON = JSON.parse(jsonMatch[1]);
          const validation = validateKnowledgeResponse(parsedJSON);
          
          if (validation.isValid) {
            console.log('✅ Knowledge response validation passed');
            finalResponse = aiResponse;
            break;
          } else {
            console.log(`❌ Knowledge response validation failed. Missing: ${validation.missing.join(', ')}`);
            attempts++;
            
            if (attempts < 3) {
              // Force retry with specific requirements
              const retryMessage = `${message}\n\nYour previous response was incomplete. REQUIRED: ${validation.missing.join(', ')}. Provide COMPLETE response with ALL required fields filled with detailed information.`;
              message = retryMessage;
            }
          }
        } catch (e) {
          console.log('Failed to parse JSON from knowledge response');
          attempts++;
        }
      } else {
        console.log('No JSON found in knowledge response');
        attempts++;
      }
      
      if (attempts >= 3) {
        finalResponse = aiResponse; // Use last attempt
      }
    }

    // Clean response
    finalResponse = finalResponse.replace(/[%&'*]/g, '').trim();

    // Update usage count for used knowledge
    if (knowledgeData && knowledgeData.length > 0) {
      for (const knowledge of knowledgeData) {
        await supabase
          .from('universal_knowledge_store')
          .update({ 
            usage_count: (knowledge.usage_count || 0) + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', knowledge.id);
      }
    }

    return new Response(JSON.stringify({ response: finalResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in knowledge-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
