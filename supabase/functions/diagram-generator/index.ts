
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are a specialized automation diagram generator. Your ONLY job is to convert automation blueprints into complete React Flow diagrams.

CRITICAL REQUIREMENTS - FOLLOW EXACTLY:

1. SHOW EVERY SINGLE STEP: You must create a node for EVERY step in the automation blueprint, including all nested steps within conditions, loops, retries, and fallbacks.

2. NODE TYPES - Use these specific types:
   - 'action' steps → "platformNode" 
   - 'condition' steps → "conditionNode"
   - 'loop' steps → "loopNode"
   - 'delay' steps → "delayNode"
   - 'ai_agent_call' steps → "aiAgentNode"
   - 'retry' steps → "retryNode"
   - 'fallback' steps → "fallbackNode"

3. LAYOUT RULES:
   - Main flow: Left to right, increment x by 400px between sequential steps
   - Start at x: 100, y: 300 for first node
   - Condition branches: if_true goes UP (y-200), if_false goes DOWN (y+200)
   - All other sequential flows continue horizontally

4. NODE DATA - EVERY node must have:
   - id: unique identifier
   - type: one of the types above
   - position: {x, y} coordinates
   - data: {
       label: human-readable name,
       platform: platform name if applicable,
       icon: platform icon if applicable,
       explanation: detailed description,
       [original step data]: include the full step object
     }

5. EDGES - Connect ALL nodes with:
   - type: "smoothstep"
   - animated: true
   - style: {stroke: "#94a3b8", strokeWidth: 2, strokeDasharray: "5,5"}
   - Green (#10b981) for if_true branches
   - Red (#ef4444) for if_false branches

6. COMPREHENSIVE COVERAGE: If the blueprint has N steps, your diagram must have AT LEAST N nodes. Include ALL nested steps.

OUTPUT FORMAT: Return ONLY valid JSON with "nodes" and "edges" arrays. No other text or explanation.`

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    console.log('🎨 Diagram Generator - Request received');
    
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

        console.log('📊 Input validation - Blueprint received:', !!automation_blueprint);
        console.log('📊 Blueprint steps count:', automation_blueprint?.steps?.length || 0);

        if (!automation_blueprint) {
            console.error('❌ Missing automation_blueprint in request');
            return new Response(
                JSON.stringify({ 
                    error: 'Missing automation_blueprint in request body',
                    source: 'diagram-generator-validation'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!automation_blueprint.steps || !Array.isArray(automation_blueprint.steps)) {
            console.error('❌ Invalid or missing steps in blueprint');
            return new Response(
                JSON.stringify({ 
                    error: 'Invalid or missing steps in automation blueprint',
                    source: 'diagram-generator-validation',
                    blueprint: automation_blueprint
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Count all steps including nested ones
        const countAllSteps = (steps: any[]): number => {
            let count = 0;
            steps.forEach(step => {
                count++;
                if (step.condition) {
                    if (step.condition.if_true) count += countAllSteps(step.condition.if_true);
                    if (step.condition.if_false) count += countAllSteps(step.condition.if_false);
                }
                if (step.loop && step.loop.steps) count += countAllSteps(step.loop.steps);
                if (step.retry && step.retry.steps) count += countAllSteps(step.retry.steps);
                if (step.fallback) {
                    if (step.fallback.primary_steps) count += countAllSteps(step.fallback.primary_steps);
                    if (step.fallback.fallback_steps) count += countAllSteps(step.fallback.fallback_steps);
                }
            });
            return count;
        };

        const totalSteps = countAllSteps(automation_blueprint.steps);
        console.log(`🎯 Target: Generate diagram for ${totalSteps} total steps (${automation_blueprint.steps.length} main steps)`);

        // Check OpenAI API key
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            console.error('❌ OpenAI API key not found');
            return new Response(
                JSON.stringify({ 
                    error: 'OpenAI API key not configured',
                    source: 'diagram-generator-config'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Prepare the messages for OpenAI with detailed instructions
        const userPrompt = `Generate a complete React Flow diagram for this automation blueprint. 

BLUEPRINT:
${JSON.stringify(automation_blueprint, null, 2)}

REQUIREMENTS:
- Create ${totalSteps} nodes minimum (one for each step including nested)
- Use proper node types as specified in the system prompt
- Include ALL steps from the blueprint
- Connect all nodes with proper edges
- Use left-to-right layout with branching for conditions

Return only the JSON with nodes and edges arrays.`;

        const messages = [
            {
                role: "system",
                content: DIAGRAM_GENERATOR_SYSTEM_PROMPT
            },
            {
                role: "user",
                content: userPrompt
            }
        ];

        console.log('🤖 Calling OpenAI with enhanced prompt...');
        console.log('📝 User prompt length:', userPrompt.length);

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
                    source: 'openai-api'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const result = await response.json();
        console.log('✅ OpenAI response received');

        if (!result.choices || result.choices.length === 0) {
            console.error('❌ No response from OpenAI');
            return new Response(
                JSON.stringify({ 
                    error: 'No response from OpenAI',
                    source: 'openai-response'
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
            console.error('❌ Raw content:', diagramDataString.substring(0, 500));
            return new Response(
                JSON.stringify({ 
                    error: 'Failed to parse AI response as JSON',
                    source: 'json-parsing',
                    raw_content: diagramDataString.substring(0, 500)
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Comprehensive validation
        if (!diagramData || typeof diagramData !== 'object') {
            console.error('❌ Invalid diagram data structure');
            return new Response(
                JSON.stringify({ 
                    error: 'Invalid diagram data structure from AI',
                    source: 'data-validation',
                    received: typeof diagramData
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!diagramData.nodes || !Array.isArray(diagramData.nodes)) {
            console.error('❌ Missing or invalid nodes array');
            return new Response(
                JSON.stringify({ 
                    error: 'Missing or invalid nodes array from AI',
                    source: 'nodes-validation',
                    received: diagramData
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!diagramData.edges || !Array.isArray(diagramData.edges)) {
            console.error('❌ Missing or invalid edges array');
            return new Response(
                JSON.stringify({ 
                    error: 'Missing or invalid edges array from AI',
                    source: 'edges-validation',
                    received: diagramData
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const nodeCount = diagramData.nodes.length;
        const edgeCount = diagramData.edges.length;

        console.log(`📊 Generated diagram: ${nodeCount} nodes, ${edgeCount} edges`);
        console.log(`🎯 Expected at least: ${totalSteps} nodes`);

        // Validate that we got a reasonable number of nodes
        if (nodeCount < totalSteps * 0.5) {
            console.warn(`⚠️ Generated significantly fewer nodes (${nodeCount}) than expected (${totalSteps})`);
            console.warn('⚠️ This suggests the AI didn\'t follow instructions properly');
        }

        // Enhance edges with proper styling
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

        console.log('✅ Diagram generation successful!');
        console.log(`📈 Final output: ${nodeCount} nodes, ${edgeCount} edges`);

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 Unexpected error in diagram-generator:', error);
        console.error('💥 Error stack:', error.stack);
        
        return new Response(
            JSON.stringify({
                error: error.message || 'Internal Server Error',
                source: 'diagram-generator-catch',
                details: error.toString(),
                stack: error.stack?.substring(0, 500),
                user_message: "Diagram generation failed. Check the console for detailed error information."
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
