
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are a COMPREHENSIVE automation diagram generator that creates COMPLETE React Flow diagrams showing EVERY SINGLE component from automation blueprints.

=== CRITICAL MISSION ===
CREATE A NODE FOR ABSOLUTELY EVERYTHING - NO EXCEPTIONS!
- Every step, sub-step, nested step
- Every platform integration
- Every AI agent (recommended and configured)
- Every system component (triggers, conditions, loops, delays, retries, fallbacks)

=== MANDATORY NODE TYPES ===
- "triggerNode" - automation triggers (manual, webhook, scheduled)
- "actionNode" - general action steps
- "platformNode" - platform integrations/API calls
- "conditionNode" - if/else decision points
- "loopNode" - iteration/repetition blocks
- "delayNode" - wait/pause steps
- "aiAgentNode" - AI agent calls
- "retryNode" - retry logic blocks
- "fallbackNode" - fallback/error handling

=== LAYOUT REQUIREMENTS ===
1. LEFT-TO-RIGHT FLOW: Start at x: 100, y: 300, increment x by 400 for each main step
2. VERTICAL BRANCHING: 
   - TRUE branch: y -= 200 (go UP)
   - FALSE branch: y += 200 (go DOWN)
3. NESTED CONTENT: Indent and space properly for readability
4. NO OVERLAPPING: Ensure all nodes are properly spaced

=== NODE DATA STRUCTURE ===
Every node MUST include:
{
  "id": "unique-identifier",
  "type": "nodeType",
  "position": {"x": number, "y": number},
  "data": {
    "label": "Human readable name",
    "platform": "platform-name-if-applicable",
    "icon": "platform-icon-if-applicable",
    "explanation": "What this component does",
    "stepType": "original-step-type",
    "isRecommended": true/false,
    "onAdd": "handleAddAgent",
    "onDismiss": "handleDismissAgent"
  }
}

=== EDGE CONNECTIONS ===
Connect ALL nodes with proper edges:
- Standard edges: {"stroke": "#94a3b8", "strokeWidth": 2}
- TRUE branches: {"stroke": "#10b981", "strokeWidth": 3} with label "Yes"
- FALSE branches: {"stroke": "#ef4444", "strokeWidth": 3} with label "No"
- Loop edges: {"stroke": "#8b5cf6", "strokeWidth": 2}
- Retry edges: {"stroke": "#f97316", "strokeWidth": 2}
- Fallback edges: {"stroke": "#3b82f6", "strokeWidth": 2}

=== ANALYSIS PROCESS ===
1. COUNT EVERYTHING:
   - Main steps + all nested steps
   - Unique platforms used
   - AI agents (recommended + configured)
   - System components

2. CREATE COMPREHENSIVE NODES:
   - One node per step (never combine)
   - One node per platform usage
   - One node per agent call
   - One node per system component

3. CONNECT EVERYTHING:
   - Every node must connect to something
   - Show all execution paths
   - Use appropriate edge styles

=== VALIDATION CHECKLIST ===
Before returning:
- Node count >= total components from blueprint
- Every platform appears as platformNode
- Every agent appears as aiAgentNode
- All branches properly connected
- Proper left-to-right layout
- No overlapping positions

RETURN ONLY VALID JSON with nodes and edges arrays. Show EVERY component from the automation blueprint!`

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
