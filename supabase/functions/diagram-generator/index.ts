
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PERFECT_DIAGRAM_SYSTEM_PROMPT = `You are an EXPERT Automation Diagram Generator that creates CRYSTAL CLEAR, LEFT-TO-RIGHT flowing diagrams with STRAIGHT LINES.

## CRITICAL SUCCESS REQUIREMENTS:
1. **PERFECT LEFT-TO-RIGHT FLOW**: Every diagram flows like reading a book - NO zigzag patterns
2. **STRAIGHT LINE CONNECTIONS**: Use straight edges, not curves
3. **INTELLIGENT AI AGENT DETECTION**: Automatically identify AI opportunities  
4. **MEANINGFUL CONDITION BRANCHES**: Extract real condition logic with clear labels
5. **SMART PLATFORM DETECTION**: Detect actual platform names from integration data
6. **CLEAR ROUTE TERMINATION**: Every path ends with explicit END nodes

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
    "platform": "[DETECTED_PLATFORM_NAME]",
    "icon": "Play"
  }
}

### 2. ACTION NODE (platformNode)
{
  "id": "action-X",
  "type": "platformNode",
  "position": { "x": 600, "y": 300 },
  "data": {
    "label": "[PLATFORM]: [CLEAR_ACTION]",
    "stepType": "action", 
    "explanation": "This step [DETAILED_EXPLANATION] using [PLATFORM]",
    "platform": "[DETECTED_PLATFORM_NAME]",
    "icon": "PlugZap"
  }
}

### 3. CONDITION NODE (conditionNode) - WITH REAL BRANCHES
{
  "id": "condition-X",
  "type": "conditionNode",
  "position": { "x": 1100, "y": 300 },
  "data": {
    "label": "Decision: [WHAT_IS_BEING_CHECKED]",
    "stepType": "condition",
    "explanation": "This checks [CONDITION_DESCRIPTION] and creates different paths",
    "branches": [
      {
        "label": "[MEANINGFUL_CONDITION_1]",
        "handle": "case-0",
        "color": "#10b981"
      },
      {
        "label": "[MEANINGFUL_CONDITION_2]", 
        "handle": "case-1",
        "color": "#f59e0b"
      }
    ],
    "icon": "GitFork"
  }
}

### 4. AI AGENT NODE (aiAgentNode) - AUTO-DETECT OPPORTUNITIES
{
  "id": "ai-agent-X",
  "type": "aiAgentNode", 
  "position": { "x": 1600, "y": 300 },
  "data": {
    "label": "🤖 AI: [INTELLIGENT_TASK]",
    "stepType": "ai_agent_call",
    "explanation": "AI agent recommended for [SPECIFIC_TASK] to improve automation",
    "isRecommended": true,
    "ai_agent_call": {
      "agent_id": "intelligent-[TASK_TYPE]-agent",
      "input_prompt": "[SPECIFIC_AI_TASK]",
      "output_variable": "ai_result"
    },
    "icon": "Bot"
  }
}

### 5. END NODE (fallbackNode) - MANDATORY
{
  "id": "end-X",
  "type": "fallbackNode",
  "position": { "x": 2100, "y": 300 },
  "data": {
    "label": "✅ Complete",
    "stepType": "end",
    "explanation": "Automation completed successfully",
    "icon": "Flag"
  }
}

## PLATFORM DETECTION - USE EXACT NAMES:
- **Email**: "Gmail", "Outlook", "Yahoo Mail"
- **Communication**: "Slack", "Microsoft Teams", "Discord"  
- **Productivity**: "Google Sheets", "Microsoft Excel", "Notion", "Airtable"
- **CRM**: "Salesforce", "HubSpot", "Pipedrive"
- **Storage**: "Google Drive", "Dropbox", "OneDrive"
- **Social**: "Twitter", "LinkedIn", "Facebook"

## EDGE GENERATION - STRAIGHT LINES ONLY:
{
  "id": "edge-[SOURCE]-[TARGET]",
  "source": "source-node-id",
  "target": "target-node-id", 
  "type": "straight",
  "animated": false,
  "style": { "stroke": "#6366f1", "strokeWidth": 3 },
  "label": "[MEANINGFUL_LABEL]"
}

## CONDITION EDGES - WITH REAL MEANING:
{
  "id": "edge-condition-X",
  "source": "condition-node-id",
  "target": "target-node-id",
  "sourceHandle": "case-X",
  "type": "straight", 
  "label": "[ACTUAL_CONDITION_DESCRIPTION]",
  "style": { "stroke": "#10b981", "strokeWidth": 3 }
}

## MANDATORY RESPONSE FORMAT:
{
  "nodes": [],
  "edges": [],
  "metadata": {
    "totalSteps": 0,
    "conditionalBranches": 0,
    "aiAgentRecommendations": 0,
    "platforms": [],
    "routePathsTerminated": 0,
    "generatedAt": "ISO timestamp",
    "triggerType": "actual trigger type",
    "straightLines": true,
    "source": "perfect-diagram-generator"
  }
}

Your goal is to create diagrams so clear that anyone can understand the automation flow instantly, with perfect left-to-right flow and straight connecting lines.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎯 Starting PERFECT diagram generation with straight lines')
    
    const { automation_blueprint, user_feedback } = await req.json()
    
    if (!automation_blueprint || !automation_blueprint.steps) {
      console.error('❌ No automation blueprint provided')
      return new Response(JSON.stringify({ 
        error: 'No automation blueprint provided',
        source: 'perfect-diagram-generator'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🤖 Sending to OpenAI for PERFECT analysis:', {
      totalSteps: automation_blueprint.steps.length,
      triggerType: automation_blueprint.trigger?.type,
      userFeedback: user_feedback ? 'provided' : 'none'
    })

    const openAIApiKey = Deno.env.get('DAIGRAM GENRATORE')
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured')
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        source: 'perfect-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let userPrompt = `Create a PERFECT left-to-right automation diagram with STRAIGHT LINES that flows cleanly from left to right. Detect AI opportunities and use meaningful condition labels. Here's the blueprint:\n\n${JSON.stringify(automation_blueprint, null, 2)}`;
    
    if (user_feedback && user_feedback.trim()) {
      userPrompt += `\n\nUSER FEEDBACK: ${user_feedback.trim()}`;
      console.log('🎯 Including user feedback for perfect diagram');
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
          { role: 'system', content: PERFECT_DIAGRAM_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4000
      }),
    })

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.status)
      const errorText = await response.text()
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status}`,
        details: errorText,
        source: 'perfect-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    console.log('✅ Received OpenAI response for PERFECT diagram')

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenAI response structure')
      return new Response(JSON.stringify({ 
        error: 'Invalid OpenAI response structure',
        source: 'perfect-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let diagramData
    try {
      diagramData = JSON.parse(data.choices[0].message.content)
    } catch (parseError) {
      console.error('❌ Error parsing OpenAI JSON:', parseError)
      return new Response(JSON.stringify({ 
        error: 'Failed to parse OpenAI response',
        source: 'perfect-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!diagramData.nodes || !diagramData.edges) {
      console.error('❌ Missing nodes/edges in response')
      return new Response(JSON.stringify({ 
        error: 'Missing required nodes or edges',
        source: 'perfect-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🎯 Generated PERFECT diagram:', {
      nodes: diagramData.nodes.length,
      edges: diagramData.edges.length,
      aiRecommendations: diagramData.metadata?.aiAgentRecommendations || 0,
      straightLines: true
    })

    // Enhance metadata
    if (!diagramData.metadata) {
      diagramData.metadata = {}
    }
    diagramData.metadata.generatedAt = new Date().toISOString()
    diagramData.metadata.source = 'perfect-diagram-generator'
    diagramData.metadata.straightLines = true

    return new Response(JSON.stringify(diagramData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Error in PERFECT diagram generation:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'perfect-diagram-generator',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
