
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get OpenAI API key
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
if (!openaiApiKey) {
  console.error('❌ OpenAI API key not found')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Processing chat request with ENHANCED conditional logic support')
    
    const { message, messages = [], automationId, automationContext } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('📚 Conversation history length:', messages.length)
    console.log('🔧 Automation context:', automationId)

    // ENHANCED KNOWLEDGE RETRIEVAL - Get ALL platform knowledge
    console.log('🔍 Searching for platform knowledge in universal store...')
    
    // First, get platform-specific knowledge
    const { data: platformKnowledge } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .eq('category', 'platform_knowledge')
      .order('usage_count', { ascending: false })
      .limit(50);

    // Also search for message-related knowledge
    const { data: messageKnowledge } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .or(`title.ilike.%${message}%,summary.ilike.%${message}%,details->>solution.ilike.%${message}%`)
      .order('usage_count', { ascending: false })
      .limit(20);

    // Combine and deduplicate knowledge
    const allKnowledge = [...(platformKnowledge || []), ...(messageKnowledge || [])];
    const uniqueKnowledge = allKnowledge.filter((item, index, self) => 
      index === self.findIndex(k => k.id === item.id)
    );

    console.log(`📊 Found ${uniqueKnowledge.length} unique knowledge entries`);

    // Build comprehensive knowledge context
    let knowledgeContext = '';
    if (uniqueKnowledge && uniqueKnowledge.length > 0) {
      const platformData = uniqueKnowledge
        .filter(k => k.category === 'platform_knowledge')
        .map(k => {
          const credentialFields = k.credential_fields || [];
          return `
🔧 PLATFORM: ${k.platform_name || k.title}
📋 CREDENTIALS: ${credentialFields.map(c => `${c.field} (${c.type || 'string'})`).join(', ')}
📝 DESCRIPTION: ${k.platform_description || k.summary}
💡 USE CASES: ${(k.use_cases || []).join(', ')}
⚙️ INTEGRATION: ${k.details?.integration_type || 'API'}
`;
        }).join('\n');

      const generalKnowledge = uniqueKnowledge
        .filter(k => k.category !== 'platform_knowledge')
        .map(k => `- ${k.title}: ${k.summary}\n  Solution: ${k.details?.solution || 'No solution recorded'}`)
        .join('\n');

      knowledgeContext = `
COMPREHENSIVE PLATFORM KNOWLEDGE DATABASE:
${platformData}

ADDITIONAL RELEVANT KNOWLEDGE:
${generalKnowledge}
`;
    }

    // ENHANCED SYSTEM PROMPT WITH PROPER CONDITIONAL LOGIC SUPPORT
    const systemPrompt = `You are YusrAI, the world's most advanced automation architect. You MUST create PROPER CONDITIONAL BLUEPRINTS for complex automation workflows.

CRITICAL CONDITIONAL LOGIC REQUIREMENTS:
1. When users describe automation with "IF/ELSE" conditions, you MUST create condition steps with proper if_true/if_false branches
2. Each condition MUST have separate paths that lead to different actions
3. You MUST identify and recommend AI agents for complex workflows
4. You MUST include error handling with retry/fallback mechanisms
5. You MUST create detailed, branching automation blueprints - NOT linear sequences

PLATFORM KNOWLEDGE DATABASE:
${knowledgeContext}

MANDATORY RESPONSE FORMAT - FOLLOW EXACTLY:

When users describe conditional automation (like "if priority is urgent, then post to Slack, if billing issue and enterprise customer, then create Asana task"), you MUST create:

{
  "summary": "Detailed summary of the conditional automation workflow",
  "steps": [
    "Step 1: Trigger - detect new support ticket in Zendesk",
    "Step 2: Extract ticket data (priority, issue type, customer tier)",
    "Step 3: Evaluate conditions to determine routing",
    "Step 4: Route to appropriate action based on conditions",
    "Step 5: Implement error handling and retry logic"
  ],
  "platforms": [
    {
      "name": "Zendesk",
      "credentials": [
        {
          "field": "API Token",
          "placeholder": "Enter your Zendesk API token",
          "link": "https://support.zendesk.com/hc/en-us/articles/226022787",
          "why_needed": "Required to access Zendesk tickets and data"
        },
        {
          "field": "Subdomain",
          "placeholder": "your-company.zendesk.com",
          "link": "#",
          "why_needed": "Your Zendesk instance URL identifier"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "SupportTicketRouter",
      "role": "Intelligent ticket routing and prioritization agent",
      "goal": "Analyze support tickets and route them to appropriate teams based on priority and customer tier",
      "rules": "Always consider customer tier, issue type, and priority level when routing tickets",
      "memory": "Remember customer escalation patterns and team capacities",
      "why_needed": "Essential for intelligent ticket routing and ensuring proper escalation workflows"
    }
  ],
  "clarification_questions": [
    "What specific criteria should trigger the 'urgent' priority classification?",
    "Should there be different handling for different customer tiers beyond enterprise/premium/free?"
  ],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Conditional support ticket routing automation",
    "trigger": {
      "type": "webhook"
    },
    "steps": [
      {
        "id": "trigger_1",
        "name": "New Zendesk Ticket",
        "type": "action",
        "action": {
          "integration": "zendesk",
          "method": "webhook_trigger",
          "parameters": {
            "webhook_events": ["ticket_created"]
          }
        }
      },
      {
        "id": "extract_data_2",
        "name": "Extract Ticket Information",
        "type": "action",
        "action": {
          "integration": "zendesk",
          "method": "get_ticket_details",
          "parameters": {
            "ticket_id": "{{trigger.ticket.id}}",
            "extract_fields": ["priority", "issue_type", "customer_tier", "subject", "description"]
          }
        }
      },
      {
        "id": "condition_3",
        "name": "Route Based on Priority and Customer",
        "type": "condition",
        "condition": {
          "expression": "ticket.priority == 'urgent'",
          "if_true": [
            {
              "id": "urgent_slack_4",
              "name": "Post Urgent Alert to Slack",
              "type": "action",
              "action": {
                "integration": "slack",
                "method": "post_message",
                "parameters": {
                  "channel": "#priority-support",
                  "message": "🚨 URGENT TICKET: {{ticket.subject}} - Customer: {{ticket.customer_tier}}"
                }
              }
            }
          ],
          "if_false": [
            {
              "id": "secondary_condition_5",
              "name": "Check Issue Type and Customer Tier",
              "type": "condition",
              "condition": {
                "expression": "ticket.issue_type == 'billing' AND ticket.customer_tier == 'enterprise'",
                "if_true": [
                  {
                    "id": "billing_asana_6",
                    "name": "Create High Priority Asana Task",
                    "type": "action",
                    "action": {
                      "integration": "asana",
                      "method": "create_task",
                      "parameters": {
                        "project_id": "billing_project",
                        "name": "Enterprise Billing Issue: {{ticket.subject}}",
                        "priority": "high"
                      }
                    }
                  }
                ],
                "if_false": [
                  {
                    "id": "technical_condition_7",
                    "name": "Handle Technical Issues",
                    "type": "condition",
                    "condition": {
                      "expression": "ticket.issue_type == 'technical'",
                      "if_true": [
                        {
                          "id": "premium_technical_8",
                          "name": "Route Premium Technical Issues",
                          "type": "condition",
                          "condition": {
                            "expression": "ticket.customer_tier == 'premium'",
                            "if_true": [
                              {
                                "id": "jira_escalation_9",
                                "name": "Escalate to Engineering via Jira",
                                "type": "action",
                                "action": {
                                  "integration": "jira",
                                  "method": "create_issue",
                                  "parameters": {
                                    "project": "ENGINEERING",
                                    "issue_type": "Bug",
                                    "summary": "Premium Customer Technical Issue: {{ticket.subject}}"
                                  }
                                }
                              }
                            ],
                            "if_false": [
                              {
                                "id": "auto_response_10",
                                "name": "Send Knowledge Base Response",
                                "type": "action",
                                "action": {
                                  "integration": "zendesk",
                                  "method": "add_comment",
                                  "parameters": {
                                    "ticket_id": "{{ticket.id}}",
                                    "comment": "Thank you for contacting support. Please check our knowledge base for solutions to common technical issues."
                                  }
                                }
                              }
                            ]
                          }
                        }
                      ],
                      "if_false": [
                        {
                          "id": "default_notion_11",
                          "name": "Log to Notion",
                          "type": "action",
                          "action": {
                            "integration": "notion",
                            "method": "create_page",
                            "parameters": {
                              "database_id": "support_log_db",
                              "properties": {
                                "title": "Support Ticket: {{ticket.subject}}",
                                "priority": "{{ticket.priority}}",
                                "customer": "{{ticket.customer_tier}}"
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        "id": "retry_mechanism_12",
        "name": "Error Handling and Retry",
        "type": "retry",
        "retry": {
          "max_attempts": 2,
          "steps": [
            {
              "id": "error_notification_13",
              "name": "Send Error Alert",
              "type": "action",
              "action": {
                "integration": "slack",
                "method": "post_message",
                "parameters": {
                  "channel": "#support-alerts",
                  "message": "⚠️ Automation failed twice for ticket: {{ticket.subject}}"
                }
              }
            },
            {
              "id": "error_log_notion_14",
              "name": "Log Error to Notion",
              "type": "action",
              "action": {
                "integration": "notion",
                "method": "create_page",
                "parameters": {
                  "database_id": "error_log_db",
                  "properties": {
                    "title": "Automation Error: {{ticket.subject}}",
                    "error_type": "automation_failure",
                    "retry_count": 2
                  }
                }
              }
            }
          ]
        }
      },
      {
        "id": "ai_agent_recommendation_15",
        "name": "Intelligent Ticket Analysis",
        "type": "ai_agent_call",
        "ai_agent_call": {
          "agent_id": "support_ticket_analyzer",
          "input_prompt": "Analyze this support ticket for patterns and suggest improvements: {{ticket.subject}} - {{ticket.description}}",
          "output_variable": "analysis_result"
        },
        "is_recommended": true
      }
    ],
    "variables": {
      "ticket_data": "extracted_ticket_information",
      "routing_decision": "conditional_routing_result",
      "error_count": 0
    }
  },
  "conversation_updates": {
    "conditional_logic_applied": "Complex conditional routing with 5 different paths implemented",
    "ai_agents_recommended": 1,
    "error_handling_included": "Retry mechanism with 2 attempts and error logging",
    "platform_integrations": "Zendesk, Slack, Asana, Jira, Notion"
  },
  "is_update": false,
  "recheck_status": "conditional_blueprint_generated"
}

CRITICAL SUCCESS REQUIREMENTS:
- MUST create proper condition steps with if_true/if_false branches for complex logic
- MUST include AI agent recommendations with is_recommended: true
- MUST include retry/fallback error handling
- MUST create detailed conditional workflows, not linear sequences
- ALL conditional paths must be properly nested and structured

Context: ${JSON.stringify(messages.slice(-3))}
Current automation: ${JSON.stringify(automationContext)}`

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text || msg.message_content || ""
      })),
      { role: "user", content: message }
    ]

    console.log('📡 Making ENHANCED OpenAI request with conditional logic support...')

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openaiMessages,
        max_tokens: 4000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('✅ Received ENHANCED OpenAI response with conditional logic')

    // Validate and parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON validation successful')
      
      // Log conditional logic success metrics
      console.log('📊 Conditional Logic Metrics:', {
        conditionStepsFound: parsedResponse.automation_blueprint?.steps?.filter(s => s.type === 'condition').length || 0,
        aiAgentRecommendations: parsedResponse.automation_blueprint?.steps?.filter(s => s.is_recommended).length || 0,
        retryMechanisms: parsedResponse.automation_blueprint?.steps?.filter(s => s.type === 'retry').length || 0,
        totalSteps: parsedResponse.automation_blueprint?.steps?.length || 0
      });
      
      // Ensure all required fields exist with enhanced conditional structure
      const structuredResponse = {
        summary: parsedResponse.summary || "Enhanced conditional automation workflow",
        steps: Array.isArray(parsedResponse.steps) ? parsedResponse.steps : [],
        platforms: Array.isArray(parsedResponse.platforms) ? parsedResponse.platforms.map(platform => ({
          name: platform.name || 'Unknown Platform',
          credentials: Array.isArray(platform.credentials) ? platform.credentials.map(cred => ({
            field: cred.field || 'api_key',
            placeholder: cred.placeholder || 'Enter credential value',
            link: cred.link || '#',
            why_needed: cred.why_needed || 'Required for platform integration'
          })) : []
        })) : [],
        platforms_to_remove: Array.isArray(parsedResponse.platforms_to_remove) ? parsedResponse.platforms_to_remove : [],
        agents: Array.isArray(parsedResponse.agents) ? parsedResponse.agents.map(agent => ({
          name: agent.name || 'AutomationAgent',
          role: agent.role || 'Conditional automation specialist',
          goal: agent.goal || 'Execute complex conditional automation workflows',
          rules: agent.rules || 'Follow conditional logic and proper routing rules',
          memory: agent.memory || 'Remember conditional patterns and routing decisions',
          why_needed: agent.why_needed || 'Essential for intelligent conditional automation execution'
        })) : [],
        clarification_questions: Array.isArray(parsedResponse.clarification_questions) ? parsedResponse.clarification_questions : [],
        automation_blueprint: parsedResponse.automation_blueprint || {
          version: "1.0.0",
          description: "Conditional automation workflow",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        },
        conversation_updates: {
          ...parsedResponse.conversation_updates,
          conditional_logic_applied: "Enhanced conditional branching implemented",
          ai_agent_recommendations: "AI agents with recommendations included",
          error_handling_added: "Retry mechanisms and fallback logic implemented",
          response_enhanced: "Complex conditional workflow generation completed"
        },
        is_update: Boolean(parsedResponse.is_update),
        recheck_status: parsedResponse.recheck_status || "conditional_logic_complete"
      }

      console.log('🎯 Returning ENHANCED conditional automation response')
      
      // Update knowledge usage for ALL used knowledge entries
      if (uniqueKnowledge && uniqueKnowledge.length > 0) {
        console.log(`📈 Updating usage count for ${uniqueKnowledge.length} knowledge entries`);
        for (const knowledge of uniqueKnowledge) {
          await supabase
            .from('universal_knowledge_store')
            .update({ 
              usage_count: (knowledge.usage_count || 0) + 1,
              last_used: new Date().toISOString()
            })
            .eq('id', knowledge.id);
        }
        console.log('✅ Successfully updated all knowledge usage counts');
      }

      return new Response(JSON.stringify(structuredResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('Raw response:', aiResponse)
      
      // Enhanced fallback response with conditional logic awareness
      const fallbackResponse = {
        summary: "I'm having trouble generating the conditional automation structure. Let me help you create a proper branching workflow.",
        steps: [
          "Step 1: Identify trigger conditions and data sources",
          "Step 2: Define conditional logic and branching rules", 
          "Step 3: Map each condition to specific actions",
          "Step 4: Implement error handling and retry mechanisms",
          "Step 5: Add AI agent recommendations for intelligent processing"
        ],
        platforms: [],
        platforms_to_remove: [],
        agents: [{
          name: "ConditionalAutomationAgent",
          role: "Conditional logic and branching specialist",
          goal: "Create intelligent branching automation workflows with proper conditional logic",
          rules: "Always implement proper conditional branching and include error handling mechanisms",
          memory: "Remember conditional patterns and successful routing strategies",
          why_needed: "Essential for creating complex conditional automation workflows"
        }],
        clarification_questions: [
          "What are the specific conditions that should trigger different automation paths?",
          "Which actions should be taken for each conditional branch?",
          "What error handling and retry logic should be implemented?"
        ],
        automation_blueprint: {
          version: "1.0.0",
          description: "Conditional automation workflow with proper branching",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        },
        conversation_updates: {
          conditional_logic_attempted: "Fallback response with conditional logic awareness",
          ai_agent_included: "Conditional automation specialist agent recommended",
          error_handling_noted: "Retry mechanisms and error handling planned",
          response_status: "Fallback with conditional automation capability"
        },
        is_update: false,
        recheck_status: "parsing_error_conditional_fallback"
      }

      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('💥 Error in enhanced conditional chat-ai function:', error)
    
    const errorResponse = {
      summary: "I encountered an error while processing your conditional automation request. Let me help you build a proper branching workflow.",
      steps: [
        "Step 1: Rephrase your conditional automation requirements",
        "Step 2: Specify the exact conditions and branches needed",
        "Step 3: Define actions for each conditional path",
        "Step 4: I'll create proper conditional logic with AI agents"
      ],
      platforms: [],
      platforms_to_remove: [],
      agents: [{
        name: "ErrorRecoveryConditionalAgent",
        role: "Error handling and conditional logic recovery specialist",
        goal: "Help recover from errors while maintaining conditional automation capabilities",
        rules: "Provide helpful error recovery while preserving conditional logic requirements",
        memory: "Remember error patterns and successful conditional automation structures",
        why_needed: "Essential for maintaining conditional automation reliability"
      }],
      clarification_questions: [
        "Could you please clarify the conditional logic you need?",
        "What specific branching behavior should the automation have?",
        "Which platforms should be used for each conditional path?"
      ],
      automation_blueprint: {
        version: "1.0.0",
        description: "Error recovery workflow with conditional logic support",
        trigger: { type: "manual" },
        steps: [],
        variables: {}
      },
      conversation_updates: {
        error_occurred: "Processing error during conditional automation generation",
        conditional_support_maintained: "Conditional logic capabilities remain available",
        recovery_attempted: "Error recovery with conditional automation awareness",
        response_status: "Error response with conditional automation support"
      },
      is_update: false,
      recheck_status: "error_conditional_recovery"
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
