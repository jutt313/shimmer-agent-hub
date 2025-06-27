
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an EXTREMELY DETAILED automation diagram generator. Your job is to create COMPLETE React Flow diagrams that show EVERY SINGLE component from automation blueprints.

CRITICAL MISSION: CREATE A NODE FOR ABSOLUTELY EVERYTHING - NO EXCEPTIONS!

=== WHAT YOU MUST INCLUDE (NO SHORTCUTS) ===

1. EVERY SINGLE STEP FROM THE BLUEPRINT:
   - Main steps (each gets its own node)
   - Nested steps inside conditions (if_true AND if_false paths)
   - Steps inside loops
   - Steps inside retry blocks
   - Steps inside fallback blocks
   - Sub-steps within sub-steps (go deep!)

2. EVERY PLATFORM MENTIONED:
   - Create a platformNode for each integration
   - Even if multiple steps use same platform, show them separately
   - Include platform icons and proper styling

3. EVERY AI AGENT:
   - Create aiAgentNode for each agent
   - Show recommended vs configured agents differently
   - Include Add/Dismiss buttons for recommendations

4. ALL SYSTEM NODES:
   - Trigger nodes (manual, webhook, scheduled)
   - Condition nodes (decision points)
   - Loop nodes (iteration blocks)
   - Delay nodes (wait periods)
   - Retry nodes (error handling)
   - Fallback nodes (backup paths)

=== NODE TYPES - USE EXACTLY THESE ===

- "triggerNode" - for automation triggers
- "platformNode" - for platform integrations/actions
- "conditionNode" - for if/else logic
- "loopNode" - for iteration/repetition
- "delayNode" - for wait/pause steps
- "aiAgentNode" - for AI agent calls
- "retryNode" - for retry logic
- "fallbackNode" - for fallback handling

=== LAYOUT RULES - FOLLOW EXACTLY ===

1. LEFT TO RIGHT FLOW:
   - Start at x: 100, y: 300
   - Each main sequential step: x += 400
   - Maintain proper spacing between nodes

2. BRANCHING LOGIC:
   - Condition TRUE branch: y -= 200 (go UP)
   - Condition FALSE branch: y += 200 (go DOWN)
   - Loop content: y -= 100, then continue horizontally
   - Retry content: same y level, continue horizontally
   - Fallback: primary y-100, fallback y+100

3. MULTIPLE PATHS:
   - Show ALL possible execution paths
   - Connect ALL nodes with proper edges
   - Use different colors for different path types

=== NODE DATA STRUCTURE - MANDATORY FIELDS ===

EVERY node must have:
```json
{
  "id": "unique-identifier",
  "type": "nodeType",
  "position": {"x": number, "y": number},
  "data": {
    "label": "Human readable name",
    "platform": "platform-name-if-applicable",
    "icon": "platform-icon-if-applicable", 
    "explanation": "Detailed description of what this does",
    "stepType": "original-step-type",
    "isRecommended": true/false,
    "onAdd": "function-reference-if-recommended",
    "onDismiss": "function-reference-if-recommended",
    // INCLUDE THE ORIGINAL STEP DATA:
    "action": {...},
    "condition": {...},
    "loop": {...},
    "delay": {...},
    "ai_agent_call": {...},
    "retry": {...},
    "fallback": {...}
  },
  "sourcePosition": "right",
  "targetPosition": "left"
}
```

=== EDGE CONNECTIONS - CONNECT EVERYTHING ===

1. STANDARD EDGES:
```json
{
  "id": "edge-id",
  "source": "source-node-id", 
  "target": "target-node-id",
  "type": "smoothstep",
  "animated": true,
  "style": {"stroke": "#94a3b8", "strokeWidth": 2, "strokeDasharray": "5,5"}
}
```

2. CONDITION EDGES:
- TRUE path: green (#10b981) with label "Yes"
- FALSE path: red (#ef4444) with label "No"

3. SPECIAL PATHS:
- Loop edges: purple (#8b5cf6)
- Retry edges: orange (#f97316)
- Fallback edges: blue (#3b82f6)

=== COMPREHENSIVE ANALYSIS PROCESS ===

1. COUNT EVERYTHING FIRST:
   - Count main steps
   - Count nested steps (recursively)
   - Count unique platforms
   - Count AI agents
   - Count system components

2. CREATE NODES FOR EACH:
   - One node per step (no combining)
   - One node per platform usage
   - One node per agent call
   - One node per system component

3. LAYOUT SYSTEMATICALLY:
   - Place trigger first (leftmost)
   - Follow execution flow left-to-right
   - Branch appropriately for conditions
   - Show all possible paths

4. CONNECT EVERYTHING:
   - Every node must have connections
   - No orphaned nodes
   - Clear flow direction
   - Proper path visualization

=== VALIDATION REQUIREMENTS ===

Before returning your diagram, verify:
- Node count >= step count from blueprint
- Every platform appears as a node
- Every agent appears as a node  
- All branches are connected
- All paths lead somewhere
- Proper positioning (no overlaps)

=== EXAMPLE OUTPUT STRUCTURE ===

```json
{
  "nodes": [
    {
      "id": "trigger-1",
      "type": "triggerNode", 
      "position": {"x": 100, "y": 300},
      "data": {
        "label": "Manual Trigger",
        "explanation": "User manually starts this automation",
        "stepType": "trigger"
      }
    },
    {
      "id": "step-1",
      "type": "platformNode",
      "position": {"x": 500, "y": 300}, 
      "data": {
        "label": "Google Sheets",
        "platform": "google_sheets",
        "icon": "sheets",
        "explanation": "Fetch data from Google Sheets",
        "stepType": "action",
        "action": {...}
      }
    }
    // ... CONTINUE FOR EVERY COMPONENT
  ],
  "edges": [
    {
      "id": "trigger-to-step1",
      "source": "trigger-1",
      "target": "step-1", 
      "type": "smoothstep",
      "animated": true,
      "style": {"stroke": "#94a3b8", "strokeWidth": 2, "strokeDasharray": "5,5"}
    }
    // ... CONNECT EVERYTHING
  ]
}
```

=== FINAL REQUIREMENTS ===

- Return ONLY valid JSON (no other text)
- Include nodes AND edges arrays
- Every component gets its own node
- Every connection gets its own edge
- Use proper node types exactly as specified
- Include all data fields as required
- Follow layout rules precisely
- Show complete automation flow

REMEMBER: If the blueprint has 10 steps, your diagram should have AT LEAST 10 nodes. If there are 5 platforms, show 5 platform nodes. If there are 3 agents, show 3 agent nodes. EVERYTHING must be visible and connected!`

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    console.log('🎨 COMPREHENSIVE Diagram Generator - Request received');
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        console.error('❌ Invalid method:', req.method);
        return new Response(
            JSON.stringify({ error: 'Method Not Allowed', source: 'diagram-generator' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const requestBody = await req.json();
        const { automation_blueprint } = requestBody;

        console.log('📊 COMPREHENSIVE Analysis - Blueprint received:', !!automation_blueprint);
        
        if (!automation_blueprint || !automation_blueprint.steps) {
            console.error('❌ Missing or invalid automation blueprint');
            return new Response(
                JSON.stringify({ 
                    error: 'Missing or invalid automation blueprint',
                    source: 'comprehensive-validation'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // COMPREHENSIVE STEP COUNTING
        const countAllComponents = (steps: any[]): { 
            totalSteps: number, 
            platforms: Set<string>, 
            agents: Set<string>,
            conditions: number,
            loops: number,
            delays: number,
            retries: number,
            fallbacks: number
        } => {
            let totalSteps = 0;
            const platforms = new Set<string>();
            const agents = new Set<string>();
            let conditions = 0;
            let loops = 0;
            let delays = 0;
            let retries = 0;
            let fallbacks = 0;

            const processSteps = (stepList: any[]) => {
                stepList.forEach(step => {
                    totalSteps++;
                    
                    // Count platforms
                    if (step.action?.integration) {
                        platforms.add(step.action.integration);
                    }
                    
                    // Count agents
                    if (step.ai_agent_call?.agent_id) {
                        agents.add(step.ai_agent_call.agent_id);
                    }
                    
                    // Count system components
                    if (step.type === 'condition') {
                        conditions++;
                        if (step.condition?.if_true) processSteps(step.condition.if_true);
                        if (step.condition?.if_false) processSteps(step.condition.if_false);
                    }
                    if (step.type === 'loop') {
                        loops++;
                        if (step.loop?.steps) processSteps(step.loop.steps);
                    }
                    if (step.type === 'delay') delays++;
                    if (step.type === 'retry') {
                        retries++;
                        if (step.retry?.steps) processSteps(step.retry.steps);
                    }
                    if (step.type === 'fallback') {
                        fallbacks++;
                        if (step.fallback?.primary_steps) processSteps(step.fallback.primary_steps);
                        if (step.fallback?.fallback_steps) processSteps(step.fallback.fallback_steps);
                    }
                });
            };

            processSteps(steps);
            return { totalSteps, platforms, agents, conditions, loops, delays, retries, fallbacks };
        };

        const analysis = countAllComponents(automation_blueprint.steps);
        
        console.log('🔍 COMPREHENSIVE ANALYSIS RESULTS:');
        console.log(`📈 Total Steps: ${analysis.totalSteps}`);
        console.log(`🔌 Unique Platforms: ${Array.from(analysis.platforms).join(', ')} (${analysis.platforms.size})`);
        console.log(`🤖 AI Agents: ${Array.from(analysis.agents).join(', ')} (${analysis.agents.size})`);
        console.log(`🔀 Conditions: ${analysis.conditions}`);
        console.log(`🔄 Loops: ${analysis.loops}`);
        console.log(`⏱️ Delays: ${analysis.delays}`);
        console.log(`🔁 Retries: ${analysis.retries}`);
        console.log(`🛡️ Fallbacks: ${analysis.fallbacks}`);

        const expectedMinimumNodes = analysis.totalSteps + analysis.platforms.size + analysis.agents.size + 1; // +1 for trigger
        console.log(`🎯 MINIMUM EXPECTED NODES: ${expectedMinimumNodes}`);

        // Check OpenAI API key
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            console.error('❌ OpenAI API key not found');
            return new Response(
                JSON.stringify({ 
                    error: 'OpenAI API key not configured',
                    source: 'comprehensive-config'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // COMPREHENSIVE USER PROMPT
        const userPrompt = `GENERATE A COMPLETE AUTOMATION DIAGRAM FOR THIS BLUEPRINT:

BLUEPRINT ANALYSIS SUMMARY:
- Total Steps: ${analysis.totalSteps}
- Platforms: ${Array.from(analysis.platforms).join(', ')} (${analysis.platforms.size} unique)  
- AI Agents: ${Array.from(analysis.agents).join(', ')} (${analysis.agents.size} unique)
- Conditions: ${analysis.conditions}
- Loops: ${analysis.loops}  
- Delays: ${analysis.delays}
- Retries: ${analysis.retries}
- Fallbacks: ${analysis.fallbacks}

MINIMUM NODES REQUIRED: ${expectedMinimumNodes}

FULL BLUEPRINT DATA:
${JSON.stringify(automation_blueprint, null, 2)}

MANDATORY REQUIREMENTS:
1. Create ${expectedMinimumNodes}+ nodes minimum
2. Show every platform as a separate platformNode  
3. Show every agent as a separate aiAgentNode
4. Show every condition as a conditionNode with branching
5. Show every loop as a loopNode with internal steps
6. Show every delay as a delayNode
7. Show every retry as a retryNode  
8. Show every fallback as a fallbackNode
9. Connect all nodes with proper edges
10. Use left-to-right layout with proper branching

CREATE THE MOST COMPREHENSIVE DIAGRAM POSSIBLE!
Return only JSON with nodes and edges arrays.`;

        const messages = [
            { role: "system", content: DIAGRAM_GENERATOR_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
        ];

        console.log('🤖 Calling OpenAI with COMPREHENSIVE prompt...');
        console.log(`📝 User prompt length: ${userPrompt.length}`);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4.1-2025-04-14',
                messages: messages,
                response_format: { type: "json_object" },
                temperature: 0.1,
                max_tokens: 16000
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ OpenAI API error:', errorData);
            return new Response(
                JSON.stringify({ 
                    error: `OpenAI API error: ${JSON.stringify(errorData)}`,
                    source: 'openai-comprehensive'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const result = await response.json();
        console.log('✅ OpenAI COMPREHENSIVE response received');

        if (!result.choices || result.choices.length === 0) {
            console.error('❌ No response from OpenAI');
            return new Response(
                JSON.stringify({ 
                    error: 'No response from OpenAI',
                    source: 'openai-comprehensive-response'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const diagramDataString = result.choices[0].message.content;
        console.log('📄 Raw response length:', diagramDataString.length);

        let diagramData;
        try {
            diagramData = JSON.parse(diagramDataString);
        } catch (parseError) {
            console.error('❌ JSON parsing error:', parseError);
            console.error('❌ Raw content preview:', diagramDataString.substring(0, 1000));
            return new Response(
                JSON.stringify({ 
                    error: 'Failed to parse AI response as JSON',
                    source: 'json-parsing-comprehensive',
                    raw_content_preview: diagramDataString.substring(0, 500)
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // COMPREHENSIVE VALIDATION
        if (!diagramData || !diagramData.nodes || !diagramData.edges) {
            console.error('❌ Invalid diagram structure received:', diagramData);
            return new Response(
                JSON.stringify({ 
                    error: 'Invalid diagram structure from AI',
                    source: 'comprehensive-structure-validation',
                    received: diagramData
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const nodeCount = diagramData.nodes.length;
        const edgeCount = diagramData.edges.length;

        console.log('🎯 COMPREHENSIVE RESULTS:');
        console.log(`📊 Generated nodes: ${nodeCount} (expected minimum: ${expectedMinimumNodes})`);
        console.log(`🔗 Generated edges: ${edgeCount}`);

        // STRICT VALIDATION
        if (nodeCount < expectedMinimumNodes * 0.8) {
            const warningMessage = `INSUFFICIENT NODES: Generated ${nodeCount} but expected minimum ${expectedMinimumNodes}. Missing components!`;
            console.warn(`⚠️ ${warningMessage}`);
            
            // Add warning to response but still return the diagram
            diagramData.warning = warningMessage;
        }

        // Enhance edges with comprehensive styling
        diagramData.edges = diagramData.edges.map((edge: any) => ({
            ...edge,
            type: edge.type || 'smoothstep',
            animated: edge.animated !== undefined ? edge.animated : true,
            style: {
                stroke: edge.style?.stroke || '#94a3b8',
                strokeWidth: edge.style?.strokeWidth || 2,
                strokeDasharray: edge.style?.strokeDasharray || '5,5'
            }
        }));

        console.log('✅ COMPREHENSIVE diagram generation successful!');
        console.log('📋 Node types generated:', [...new Set(diagramData.nodes.map((n: any) => n.type))]);
        console.log('🔗 Edge types generated:', [...new Set(diagramData.edges.map((e: any) => e.type))]);

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 COMPREHENSIVE ERROR:', error);
        console.error('💥 Error stack:', error.stack);
        
        return new Response(
            JSON.stringify({
                error: error.message || 'Comprehensive diagram generation failed',
                source: 'comprehensive-catch-all',
                details: error.toString(),
                stack: error.stack?.substring(0, 500),
                user_message: "Comprehensive diagram generation failed. The system has been enhanced to capture every component."
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
