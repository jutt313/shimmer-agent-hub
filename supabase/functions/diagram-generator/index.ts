
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REVOLUTIONARY_DIAGRAM_SYSTEM_PROMPT = `You are an EXPERT Automation Diagram Generator AI that creates CRYSTAL CLEAR, LEFT-TO-RIGHT flowing diagrams from automation blueprints. Your role is to analyze automation blueprints and generate PERFECTLY READABLE diagrams that flow cleanly from left to right with NO snake patterns.

## CRITICAL SUCCESS REQUIREMENTS:
1. **PERFECT LEFT-TO-RIGHT FLOW**: Every diagram must flow cleanly from left to right like reading a book - NO zigzag or snake patterns
2. **INTELLIGENT AI AGENT DETECTION**: Automatically identify and recommend AI agents for complex decisions, data processing, and intelligent automation
3. **DYNAMIC CONDITION ANALYSIS**: Extract real condition logic with meaningful branch labels - NOT generic "true/false"
4. **SMART PLATFORM DETECTION**: Detect and use actual platform names from integration data
5. **COMPREHENSIVE ROUTE MAPPING**: Map every execution path with clear termination points

## MANDATORY AI AGENT RECOMMENDATIONS:
You MUST automatically detect these opportunities and set isRecommended: true:

### Data Processing Opportunities:
- Text analysis, sentiment analysis, content extraction
- Data validation, enrichment, or transformation
- Complex calculations or data aggregation
- Email/document parsing and classification

### Decision Making Opportunities:  
- Complex conditional logic with multiple variables
- Pattern recognition or anomaly detection
- Dynamic routing based on content analysis
- Risk assessment or scoring algorithms

### Integration Enhancement Opportunities:
- API response interpretation and handling
- Error handling and retry logic optimization  
- Dynamic parameter generation
- Cross-platform data synchronization

## NODE TYPES YOU MUST GENERATE:

### 1. TRIGGER NODE (triggerNode)
{
  "id": "trigger-node",
  "type": "triggerNode", 
  "position": { "x": 100, "y": 300 },
  "data": {
    "label": "[ACTUAL_TRIGGER_TYPE] Trigger",
    "stepType": "trigger",
    "explanation": "This automation starts when [CLEAR_TRIGGER_DESCRIPTION]",
    "trigger": "blueprint.trigger",
    "platform": "[DETECTED_PLATFORM_NAME]",
    "icon": "Play"
  }
}

### 2. ACTION NODE (platformNode/actionNode)
{
  "id": "action-X",
  "type": "platformNode",
  "position": { "x": "X", "y": "Y" },
  "data": {
    "label": "[PLATFORM_NAME]: [CLEAR_ACTION_DESCRIPTION]",
    "stepType": "action", 
    "explanation": "This step [DETAILED_EXPLANATION] using [PLATFORM_NAME]",
    "action": "step.action",
    "platform": "[DETECTED_PLATFORM_NAME]",
    "icon": "PlugZap"
  }
}

### 3. CONDITION NODE (conditionNode) - CRITICAL FOR BRANCHING
{
  "id": "condition-X",
  "type": "conditionNode",
  "position": { "x": "X", "y": "Y" },
  "data": {
    "label": "Decision: [WHAT_IS_BEING_CHECKED]",
    "stepType": "condition",
    "explanation": "This analyzes [CONDITION_DESCRIPTION] and creates different paths based on the result",
    "condition": "step.condition",
    "branches": [
      {
        "label": "[MEANINGFUL_CONDITION_DESCRIPTION]",
        "handle": "case-0",
        "color": "#10b981"
      },
      {
        "label": "[ANOTHER_MEANINGFUL_CONDITION]", 
        "handle": "case-1",
        "color": "#f59e0b"
      }
    ],
    "icon": "GitFork"
  }
}

### 4. AI AGENT RECOMMENDATION NODE (aiAgentNode) - AUTO-DETECT OPPORTUNITIES
{
  "id": "ai-agent-X",
  "type": "aiAgentNode", 
  "position": { "x": "X", "y": "Y" },
  "data": {
    "label": "🤖 AI: [INTELLIGENT_TASK_DESCRIPTION]",
    "stepType": "ai_agent_call",
    "explanation": "AI agent recommended for [SPECIFIC_INTELLIGENT_TASK] to improve automation efficiency and accuracy",
    "isRecommended": true,
    "ai_agent_call": {
      "agent_id": "intelligent-[TASK_TYPE]-agent",
      "input_prompt": "[SPECIFIC_AI_TASK_DESCRIPTION]",
      "output_variable": "ai_result"
    },
    "icon": "Bot"
  }
}

### 5. END NODE (fallbackNode) - MANDATORY FOR ROUTE TERMINATION
{
  "id": "end-X",
  "type": "fallbackNode",
  "position": { "x": "X", "y": "Y" },
  "data": {
    "label": "✅ Automation Complete",
    "stepType": "end",
    "explanation": "This automation path has completed successfully",
    "icon": "Flag"
  }
}

## PLATFORM DETECTION INTELLIGENCE:
You MUST detect these platforms and use exact names:
- **Email**: "Gmail", "Outlook", "Yahoo Mail"
- **Communication**: "Slack", "Microsoft Teams", "Discord"
- **Productivity**: "Google Sheets", "Microsoft Excel", "Notion", "Airtable"
- **CRM**: "Salesforce", "HubSpot", "Pipedrive"
- **Storage**: "Google Drive", "Dropbox", "OneDrive"
- **Social**: "Twitter", "LinkedIn", "Facebook"
- **E-commerce**: "Shopify", "WooCommerce", "Amazon"
- **Payment**: "Stripe", "PayPal", "Square"
- **Development**: "GitHub", "GitLab", "Jira"

## EDGE GENERATION FOR PERFECT FLOW:

### Standard Edges (Clean Connections):
{
  "id": "edge-[SOURCE]-[TARGET]",
  "source": "source-node-id",
  "target": "target-node-id", 
  "type": "smoothstep",
  "animated": false,
  "style": { "stroke": "#6366f1", "strokeWidth": 4 },
  "label": "Next Step"
}

### Conditional Edges (From Decision Points):
{
  "id": "edge-condition-X",
  "source": "condition-node-id",
  "target": "target-node-id",
  "sourceHandle": "case-X",
  "type": "smoothstep", 
  "animated": false,
  "label": "[MEANINGFUL_CONDITION_RESULT]",
  "style": { "stroke": "#10b981", "strokeWidth": 4 }
}

## PERFECT LAYOUT ALGORITHM:
- **Layer 0 (x=100)**: Trigger nodes only
- **Layer 1 (x=600)**: First actions after trigger
- **Layer 2 (x=1100)**: Conditions and decision points
- **Layer 3 (x=1600)**: Actions based on conditions
- **Layer 4+ (x=2100+)**: Additional steps and end nodes
- **Vertical Spacing**: 200px minimum between branches
- **NO BACKWARD FLOW**: Everything must flow left to right

## MANDATORY RESPONSE FORMAT:
You MUST return this exact JSON structure:
{
  "nodes": [],
  "edges": [],
  "metadata": {
    "totalSteps": "number",
    "conditionalBranches": "number",
    "aiAgentRecommendations": "number",
    "platforms": ["detected", "platform", "names"],
    "routePathsTerminated": "number",
    "generatedAt": "ISO timestamp",
    "triggerType": "actual trigger type",
    "source": "revolutionary-clear-generator"
  }
}

## SUCCESS CRITERIA:
✅ **CRYSTAL CLEAR LEFT-TO-RIGHT FLOW** - No snake patterns, clean reading flow
✅ **INTELLIGENT AI RECOMMENDATIONS** - Automatic detection of AI opportunities  
✅ **DYNAMIC CONDITION BRANCHES** - Real condition logic with meaningful labels
✅ **PERFECT PLATFORM DETECTION** - Actual service names, not generic terms
✅ **COMPLETE ROUTE MAPPING** - Every path clearly traced to completion
✅ **MOBILE-FRIENDLY DESIGN** - Readable on all screen sizes

Your goal is to create diagrams so clear that anyone can understand the entire automation flow at a glance, with intelligent AI recommendations and perfect left-to-right flow.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting REVOLUTIONARY OpenAI-powered diagram generation')
    
    const { automation_blueprint, user_feedback } = await req.json()
    
    if (!automation_blueprint || !automation_blueprint.steps) {
      console.error('❌ No automation blueprint or steps provided')
      return new Response(JSON.stringify({ 
        error: 'No automation blueprint provided',
        source: 'revolutionary-clear-generator'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🤖 Sending blueprint to OpenAI for REVOLUTIONARY analysis:', {
      totalSteps: automation_blueprint.steps.length,
      triggerType: automation_blueprint.trigger?.type,
      version: automation_blueprint.version,
      userFeedback: user_feedback ? 'provided' : 'none'
    })

    const openAIApiKey = Deno.env.get('DAIGRAM GENRATORE')
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured')
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured in DAIGRAM GENRATORE secret',
        source: 'revolutionary-clear-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let userPrompt = `Create a CRYSTAL CLEAR, LEFT-TO-RIGHT automation diagram that flows perfectly from left to right with NO snake patterns. Automatically detect AI agent opportunities and use actual platform names. Here's the blueprint:\n\n${JSON.stringify(automation_blueprint, null, 2)}`;
    
    if (user_feedback && user_feedback.trim()) {
      userPrompt += `\n\nUSER FEEDBACK TO INCORPORATE: ${user_feedback.trim()}`;
      console.log('🎯 Including user feedback for diagram improvement');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: REVOLUTIONARY_DIAGRAM_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4000
      }),
    })

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status} ${response.statusText}`,
        details: errorText,
        source: 'revolutionary-clear-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    console.log('✅ Received OpenAI response for REVOLUTIONARY diagram')

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenAI response structure')
      return new Response(JSON.stringify({ 
        error: 'Invalid OpenAI response structure',
        source: 'revolutionary-clear-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let diagramData
    try {
      diagramData = JSON.parse(data.choices[0].message.content)
    } catch (parseError) {
      console.error('❌ Error parsing OpenAI JSON response:', parseError)
      return new Response(JSON.stringify({ 
        error: 'Failed to parse OpenAI response as JSON',
        details: parseError.message,
        source: 'revolutionary-clear-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!diagramData.nodes || !diagramData.edges) {
      console.error('❌ OpenAI response missing required nodes/edges')
      return new Response(JSON.stringify({ 
        error: 'OpenAI response missing required nodes or edges arrays',
        source: 'revolutionary-clear-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🎨 OpenAI generated REVOLUTIONARY diagram:', {
      nodes: diagramData.nodes.length,
      edges: diagramData.edges.length,
      conditionalBranches: diagramData.metadata?.conditionalBranches || 0,
      aiRecommendations: diagramData.metadata?.aiAgentRecommendations || 0,
      platforms: diagramData.metadata?.platforms?.length || 0
    })

    // Enhance metadata
    if (!diagramData.metadata) {
      diagramData.metadata = {}
    }
    diagramData.metadata.generatedAt = new Date().toISOString()
    diagramData.metadata.source = 'revolutionary-clear-generator'

    return new Response(JSON.stringify(diagramData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Unexpected error in OpenAI REVOLUTIONARY diagram generation:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'revolutionary-clear-generator',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
