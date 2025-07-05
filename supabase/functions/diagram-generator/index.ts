
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COMPREHENSIVE_DIAGRAM_SYSTEM_PROMPT = `You are an EXPERT Automation Diagram Generator AI that creates CLEAR, UNDERSTANDABLE flow diagrams from automation blueprints. Your role is to analyze automation blueprints and generate SIMPLE, LEFT-TO-RIGHT flowing diagrams that anyone can understand.

## CORE RESPONSIBILITIES:
1. **CLEAR LEFT-TO-RIGHT FLOW**: Create diagrams that flow cleanly from left to right like reading a book
2. **DYNAMIC ANALYSIS**: Never hardcode - analyze each blueprint dynamically
3. **PLATFORM INTELLIGENCE**: Detect platforms and use appropriate icons/labels
4. **SIMPLE EXPLANATIONS**: Make every step crystal clear and easy to understand
5. **COMPLETE ROUTING**: Map every path but keep it simple and readable

## DIAGRAM PRINCIPLES:
- **CLARITY FIRST**: Every node should be immediately understandable
- **LEFT-TO-RIGHT**: Trigger → Actions → Conditions → More Actions → End
- **NO SNAKE PATTERNS**: Avoid confusing zigzag layouts
- **MEANINGFUL LABELS**: Use actual platform names, not generic terms
- **CLEAR CONNECTIONS**: Each connection should have a clear purpose

## NODE TYPES YOU MUST GENERATE:

### 1. TRIGGER NODE (triggerNode)
- **Purpose**: Starting point - what starts this automation
- **DYNAMIC DETECTION**: Read trigger.type and create appropriate label
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "trigger-node",
    "type": "triggerNode",
    "position": { "x": 100, "y": 200 },
    "data": {
      "label": "[ACTUAL_TRIGGER_TYPE] Trigger",
      "stepType": "trigger",
      "explanation": "This automation starts when [CLEAR_TRIGGER_DESCRIPTION]",
      "trigger": blueprint.trigger,
      "platform": trigger.platform || trigger.integration,
      "icon": "Play"
    }
  }
  \`\`\`

### 2. ACTION NODE (actionNode/platformNode)
- **Purpose**: Does something specific
- **PLATFORM DETECTION**: If action has platform/integration, use platformNode
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "action-X",
    "type": "platformNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "[PLATFORM_NAME]: [CLEAR_ACTION]",
      "stepType": "action",
      "explanation": "This step [WHAT_IT_DOES] using [PLATFORM_NAME]",
      "action": step.action,
      "platform": step.action?.integration,
      "icon": "PlugZap"
    }
  }
  \`\`\`

### 3. CONDITION NODE (conditionNode)
- **Purpose**: Makes decisions with multiple paths
- **DYNAMIC BRANCHES**: Extract actual condition cases, never hardcode
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "condition-X",
    "type": "conditionNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "Check: [WHAT_IS_BEING_CHECKED]",
      "stepType": "condition",
      "explanation": "This checks [CONDITION_DESCRIPTION] and creates different paths based on the result",
      "condition": step.condition,
      "branches": [
        {
          "label": "[ACTUAL_CASE_DESCRIPTION]",
          "handle": "case-0",
          "color": "#10b981"
        }
      ],
      "icon": "GitFork"
    }
  }
  \`\`\`

### 4. AI AGENT NODE (aiAgentNode)
- **Purpose**: AI makes intelligent decisions
- **AI RECOMMENDATIONS**: Flag opportunities for AI enhancement
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "ai-agent-X",
    "type": "aiAgentNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "AI: [AGENT_PURPOSE]",
      "stepType": "ai_agent_call",
      "explanation": "AI agent [WHAT_AI_DOES] to make intelligent decisions",
      "isRecommended": true/false,
      "ai_agent_call": step.ai_agent_call,
      "icon": "Bot"
    }
  }
  \`\`\`

### 5. LOOP NODE (loopNode)
- **Purpose**: Repeats actions for multiple items
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "loop-X",
    "type": "loopNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "Repeat for each: [ITEM_TYPE]",
      "stepType": "loop",
      "explanation": "This repeats the following actions for each [ITEM_TYPE] in [SOURCE]",
      "loop": step.loop,
      "icon": "Repeat"
    }
  }
  \`\`\`

### 6. DELAY NODE (delayNode)
- **Purpose**: Waits before continuing
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "delay-X",
    "type": "delayNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "Wait [TIME_DESCRIPTION]",
      "stepType": "delay",
      "explanation": "Pauses the automation for [TIME] before continuing",
      "delay": step.delay,
      "icon": "Clock"
    }
  }
  \`\`\`

### 7. RETRY NODE (retryNode)
- **Purpose**: Tries again if something fails
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "retry-X",
    "type": "retryNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "Try again (up to [MAX] times)",
      "stepType": "retry",
      "explanation": "If this fails, it will try again up to [MAX] times before giving up",
      "retry": step.retry,
      "icon": "RefreshCw"
    }
  }
  \`\`\`

### 8. END NODE (fallbackNode)
- **Purpose**: Shows where automation paths finish
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "end-X",
    "type": "fallbackNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "Automation Complete",
      "stepType": "end",
      "explanation": "This automation path is now finished",
      "icon": "Flag"
    }
  }
  \`\`\`

## EDGE GENERATION FOR CLEAR FLOW:

### Standard Edges (Simple Connections):
\`\`\`json
{
  "id": "edge-[SOURCE]-[TARGET]",
  "source": "source-node-id",
  "target": "target-node-id",
  "type": "smoothstep",
  "animated": false,
  "style": { "stroke": "#6366f1", "strokeWidth": 4 },
  "label": "Next"
}
\`\`\`

### Conditional Edges (From Decision Points):
\`\`\`json
{
  "id": "edge-condition-X",
  "source": "condition-node-id",
  "target": "target-node-id",
  "sourceHandle": "case-X",
  "type": "smoothstep",
  "animated": false,
  "label": "[CLEAR_CONDITION_RESULT]",
  "style": { "stroke": "#10b981", "strokeWidth": 4 }
}
\`\`\`

## LAYOUT ALGORITHM FOR CLEAR FLOW:
- **X-Position**: Start at 100, then 550, 1000, 1450... (450px gaps)
- **Y-Position**: Center around 200, spread branches vertically
- **Layer Logic**: Trigger (Layer 0) → Actions (Layer 1) → Conditions (Layer 2) → More Actions (Layer 3) → End (Final Layer)
- **Branch Spacing**: 180px between parallel branches
- **NO BACKWARD FLOW**: Everything flows left to right only

## PLATFORM DETECTION INTELLIGENCE:
- **Gmail/Email**: Use "Gmail" or "Email" as platform
- **Slack**: Use "Slack" as platform  
- **Zapier/Make**: Use actual integration name
- **Database**: Use "Database" or specific DB name
- **Webhook**: Use "Webhook" as platform
- **API**: Use service name if available

## RESPONSE FORMAT:
You MUST return a JSON object with this exact structure:
\`\`\`json
{
  "nodes": [/* array of node objects with clear labels */],
  "edges": [/* array of edge objects with clear connections */],
  "metadata": {
    "totalSteps": number,
    "conditionalBranches": number,
    "aiAgentRecommendations": number,
    "platforms": ["actual", "platform", "names"],
    "routePathsTerminated": number,
    "generatedAt": "ISO timestamp",
    "triggerType": "actual trigger type",
    "source": "openai-clear-generator"
  }
}
\`\`\`

## CRITICAL SUCCESS FACTORS:
✅ **CRYSTAL CLEAR**: Every label should be immediately understandable
✅ **LEFT-TO-RIGHT**: Clean flow like reading a book
✅ **NO HARDCODING**: Extract everything dynamically from blueprint
✅ **REAL PLATFORMS**: Use actual service names, not generic terms
✅ **SIMPLE ROUTING**: Map every path but keep it clean
✅ **CLEAR CONNECTIONS**: Every edge should have obvious purpose

Your goal is to create diagrams that a non-technical person can look at and immediately understand what the automation does, step by step, from left to right.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting CLEAR OpenAI-powered diagram generation')
    
    const { automation_blueprint } = await req.json()
    
    if (!automation_blueprint || !automation_blueprint.steps) {
      console.error('❌ No automation blueprint or steps provided')
      return new Response(JSON.stringify({ 
        error: 'No automation blueprint provided',
        source: 'openai-clear-generator'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🤖 Sending blueprint to OpenAI for CLEAR analysis:', {
      totalSteps: automation_blueprint.steps.length,
      triggerType: automation_blueprint.trigger?.type,
      version: automation_blueprint.version
    })

    const openAIApiKey = Deno.env.get('DAIGRAM GENRATORE')
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured')
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured in DAIGRAM GENRATORE secret',
        source: 'openai-clear-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
          { role: 'system', content: COMPREHENSIVE_DIAGRAM_SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Create a CLEAR, UNDERSTANDABLE automation diagram that flows LEFT-TO-RIGHT. Use actual platform names and make it simple to understand. Here's the blueprint:\n\n${JSON.stringify(automation_blueprint, null, 2)}`
          }
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
        source: 'openai-clear-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    console.log('✅ Received OpenAI response for CLEAR diagram')

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenAI response structure')
      return new Response(JSON.stringify({ 
        error: 'Invalid OpenAI response structure',
        source: 'openai-clear-generator'
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
        source: 'openai-clear-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!diagramData.nodes || !diagramData.edges) {
      console.error('❌ OpenAI response missing required nodes/edges')
      return new Response(JSON.stringify({ 
        error: 'OpenAI response missing required nodes or edges arrays',
        source: 'openai-clear-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🎨 OpenAI generated CLEAR diagram:', {
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
    diagramData.metadata.source = 'openai-clear-generator'

    return new Response(JSON.stringify(diagramData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Unexpected error in OpenAI CLEAR diagram generation:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'openai-clear-generator',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
