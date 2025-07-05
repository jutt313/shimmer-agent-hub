
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COMPREHENSIVE_DIAGRAM_SYSTEM_PROMPT = `You are an EXPERT Automation Diagram Generator AI that creates intelligent, comprehensive flow diagrams from automation blueprints. Your role is to analyze automation blueprints and generate perfect diagram structures with complete route mapping and AI recommendations.

## CORE RESPONSIBILITIES:
1. **DYNAMIC TRIGGER ANALYSIS**: Analyze trigger types dynamically - never hardcode trigger labels
2. **INTELLIGENT CONDITION PROCESSING**: Extract actual condition logic, create meaningful branch labels
3. **COMPLETE ROUTE MAPPING**: Map every possible execution path from start to finish
4. **AI AGENT DETECTION**: Identify opportunities for AI agent recommendations
5. **PLATFORM INTEGRATION**: Recognize and categorize platform connections
6. **MOBILE-OPTIMIZED LAYOUT**: Generate layouts that work perfectly on all screen sizes

## NODE TYPES YOU MUST GENERATE:

### 1. TRIGGER NODE (triggerNode)
- **Purpose**: Starting point of automation
- **Dynamic Logic**: Analyze trigger.type and create appropriate label
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "trigger-node",
    "type": "triggerNode",
    "position": { "x": 200, "y": 200 },
    "data": {
      "label": "[DYNAMIC_TRIGGER_TYPE] TRIGGER",
      "stepType": "trigger",
      "explanation": "Detailed explanation of how this trigger works",
      "trigger": blueprint.trigger,
      "platform": trigger.platform || trigger.integration,
      "icon": "Zap"
    }
  }
  \`\`\`

### 2. ACTION NODE (actionNode/platformNode)
- **Purpose**: Executes specific actions or platform integrations
- **Dynamic Logic**: Detect if action has integration/platform, use platformNode if yes
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "node-X",
    "type": "actionNode" | "platformNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "Action: [DYNAMIC_ACTION_NAME]",
      "stepType": "action",
      "explanation": "What this action accomplishes in the workflow",
      "action": step.action,
      "platform": step.action?.integration,
      "icon": "Zap" | "PlugZap"
    }
  }
  \`\`\`

### 3. CONDITION NODE (conditionNode)
- **Purpose**: Decision points with multiple branches
- **CRITICAL**: NEVER hardcode condition branches - extract from blueprint
- **Dynamic Logic**: Parse condition.cases array, create branch for each case + default
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "node-X",
    "type": "conditionNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "[CONDITION_NAME]",
      "stepType": "condition",
      "explanation": "Decision logic: [DESCRIBE_WHAT_IS_BEING_EVALUATED]",
      "condition": step.condition,
      "branches": [
        {
          "label": "[ACTUAL_CASE_LABEL]",
          "handle": "case-0",
          "color": "#8b5cf6"
        }
      ],
      "icon": "GitFork"
    }
  }
  \`\`\`

### 4. AI AGENT NODE (aiAgentNode)
- **Purpose**: AI-powered decision making and processing
- **Dynamic Logic**: Detect ai_agent_call OR recommend AI where beneficial
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "node-X",
    "type": "aiAgentNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "AI Agent: [AGENT_NAME]",
      "stepType": "ai_agent_call",
      "explanation": "AI processing: [WHAT_AI_DOES]",
      "isRecommended": true/false,
      "agent": step.ai_agent_call,
      "icon": "Bot"
    }
  }
  \`\`\`

### 5. LOOP NODE (loopNode)
- **Purpose**: Iterates through collections
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "node-X",
    "type": "loopNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "Loop: [ARRAY_SOURCE]",
      "stepType": "loop",
      "explanation": "Iterates through [ARRAY_SOURCE] executing steps for each item",
      "loop": step.loop,
      "icon": "Repeat"
    }
  }
  \`\`\`

### 6. DELAY NODE (delayNode)
- **Purpose**: Pauses automation execution
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "node-X",
    "type": "delayNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "Delay: [FORMATTED_TIME]",
      "stepType": "delay",
      "explanation": "Pauses automation for [TIME] - used for timing or rate limiting",
      "delay": step.delay,
      "icon": "Clock"
    }
  }
  \`\`\`

### 7. RETRY NODE (retryNode)
- **Purpose**: Handles failure recovery with retry logic
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "node-X",
    "type": "retryNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "Retry ([MAX_ATTEMPTS] attempts)",
      "stepType": "retry",
      "explanation": "Retries operation up to [MAX_ATTEMPTS] times on failure",
      "retry": step.retry,
      "icon": "RefreshCw"
    }
  }
  \`\`\`

### 8. STOP/END NODE (fallbackNode)
- **Purpose**: Termination points for automation paths
- **Required Data Structure**:
  \`\`\`json
  {
    "id": "stop-node-X",
    "type": "fallbackNode",
    "position": { "x": X, "y": Y },
    "data": {
      "label": "AUTOMATION END" | "PATH END: [REASON]",
      "stepType": "end" | "stop",
      "explanation": "This automation path concludes here",
      "icon": "Flag"
    }
  }
  \`\`\`

## EDGE GENERATION REQUIREMENTS:

### Standard Edges:
\`\`\`json
{
  "id": "edge-[SOURCE]-[TARGET]",
  "source": "source-node-id",
  "target": "target-node-id",
  "type": "smoothstep",
  "animated": true,
  "style": { "stroke": "#8b5cf6", "strokeWidth": 3 }
}
\`\`\`

### Conditional Edges (from condition nodes):
\`\`\`json
{
  "id": "edge-condition-branch-X",
  "source": "condition-node-id",
  "target": "target-node-id",
  "sourceHandle": "case-X",
  "type": "smoothstep",
  "animated": true,
  "label": "[ACTUAL_CONDITION_LABEL]",
  "style": { "stroke": "#8b5cf6", "strokeWidth": 3 }
}
\`\`\`

## LAYOUT ALGORITHM:
- **X-Spacing**: 450px between major workflow layers
- **Y-Spacing**: 200px between parallel branches
- **Starting Position**: x: 200, y: 200
- **Conditional Branching**: Spread branches vertically, center around parent
- **Mobile Optimization**: Ensure minimum node width of 240px

## ROUTE MAPPING INTELLIGENCE:
1. **Trace Every Path**: From trigger through all possible execution routes
2. **Add END Nodes**: Where routes naturally terminate without continuation
3. **Branch Analysis**: For conditions, map each case to its outcome
4. **Error Paths**: Include retry failure paths and fallback scenarios
5. **AI Opportunities**: Recommend AI agents where decision-making is complex

## RESPONSE FORMAT:
You MUST return a JSON object with this exact structure:
\`\`\`json
{
  "nodes": [/* array of node objects */],
  "edges": [/* array of edge objects */],
  "metadata": {
    "totalSteps": number,
    "conditionalBranches": number,
    "aiAgentRecommendations": number,
    "platforms": ["array", "of", "platform", "names"],
    "routePathsTerminated": number,
    "generatedAt": "ISO timestamp",
    "triggerType": "trigger type from blueprint"
  }
}
\`\`\`

## CRITICAL SUCCESS FACTORS:
✅ **NEVER HARDCODE**: All labels, branches, conditions must be extracted from blueprint
✅ **COMPLETE ROUTING**: Every possible execution path must be mapped
✅ **AI RECOMMENDATIONS**: Identify and flag opportunities for AI enhancement
✅ **MOBILE FIRST**: Ensure perfect mobile experience
✅ **PLATFORM DETECTION**: Recognize and categorize all integrations
✅ **ERROR HANDLING**: Map failure scenarios and recovery paths

Your expertise in automation analysis and diagram generation is crucial for creating production-ready, intelligent automation visualizations.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting OpenAI-powered intelligent diagram generation')
    
    const { automation_blueprint } = await req.json()
    
    if (!automation_blueprint || !automation_blueprint.steps) {
      console.error('❌ No automation blueprint or steps provided')
      return new Response(JSON.stringify({ 
        error: 'No automation blueprint provided',
        source: 'openai-diagram-generator'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🤖 Sending blueprint to OpenAI for intelligent analysis:', {
      totalSteps: automation_blueprint.steps.length,
      triggerType: automation_blueprint.trigger?.type,
      version: automation_blueprint.version
    })

    const openAIApiKey = Deno.env.get('DAIGRAM GENRATORE')
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured')
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured in DAIGRAM GENRATORE secret',
        source: 'openai-diagram-generator'
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
            content: `Analyze this automation blueprint and generate a comprehensive, intelligent diagram with complete route mapping and AI recommendations:\n\n${JSON.stringify(automation_blueprint, null, 2)}`
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
        source: 'openai-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    console.log('✅ Received OpenAI response')

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenAI response structure')
      return new Response(JSON.stringify({ 
        error: 'Invalid OpenAI response structure',
        source: 'openai-diagram-generator'
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
        source: 'openai-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!diagramData.nodes || !diagramData.edges) {
      console.error('❌ OpenAI response missing required nodes/edges')
      return new Response(JSON.stringify({ 
        error: 'OpenAI response missing required nodes or edges arrays',
        source: 'openai-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🎨 OpenAI generated intelligent diagram:', {
      nodes: diagramData.nodes.length,
      edges: diagramData.edges.length,
      conditionalBranches: diagramData.metadata?.conditionalBranches || 0,
      aiRecommendations: diagramData.metadata?.aiAgentRecommendations || 0,
      platforms: diagramData.metadata?.platforms?.length || 0
    })

    // Enhance metadata with generation timestamp
    if (!diagramData.metadata) {
      diagramData.metadata = {}
    }
    diagramData.metadata.generatedAt = new Date().toISOString()
    diagramData.metadata.source = 'openai-intelligent-generator'

    return new Response(JSON.stringify(diagramData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Unexpected error in OpenAI diagram generation:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'openai-diagram-generator',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
