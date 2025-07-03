
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const FIXED_DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an expert automation flow diagram generator that creates ACCURATE visual representations of automation blueprints.

=== CRITICAL RULES ===
1. NEVER create fake "Trigger" nodes - use the ACTUAL trigger from blueprint.trigger
2. ONE STEP = ONE NODE - each blueprint.steps[i] becomes exactly one visual node
3. DYNAMIC CONDITIONS - extract ALL condition branches, not just yes/no
4. SHOW ALL AGENTS - place AI agents where they belong in the flow
5. CONNECT EVERYTHING - ensure all nodes have proper source/target connections

=== NODE TYPES ===
- platformTriggerNode: ONLY for the actual trigger (webhook, manual, scheduled)
- actionNode: For action steps (API calls, integrations, operations)
- conditionNode: For condition steps with DYNAMIC branches based on actual conditions
- aiAgentNode: For AI agent steps (OpenAI, Claude, custom agents)
- loopNode: For loop/iteration steps
- delayNode: For delay/wait steps
- retryNode: For retry logic steps
- fallbackNode: For error handling steps

=== FLOW ANALYSIS ===
Analyze the blueprint step by step:
1. Start with blueprint.trigger - create ONE platformTriggerNode
2. For each step in blueprint.steps - create the appropriate node type
3. For conditions - analyze ALL possible outcomes and create dynamic branches
4. For nested steps (condition.if_true, condition.if_false, loop.steps, etc.) - process recursively
5. Connect ALL nodes with proper edges

=== POSITIONING ===
- Start trigger at (50, 100)
- Horizontal spacing: 300px between main flow steps
- Vertical spacing: 200px between condition branches
- Ensure complex flows fit in viewport when zoomed out

=== OUTPUT FORMAT ===
Return ONLY valid JSON with "nodes" and "edges" arrays.
Each node must have: id, type, position, data
Each edge must have: id, source, target, sourceHandle, targetHandle
NO explanatory text, ONLY the JSON diagram data.`

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    console.log('🚀 Fixed Diagram Generator - Request received');
    
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method Not Allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const requestBody = await req.json();
        const { automation_blueprint } = requestBody;

        if (!automation_blueprint || !automation_blueprint.steps) {
            return new Response(
                JSON.stringify({ error: 'Missing automation blueprint' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('📋 Processing blueprint with', automation_blueprint.steps.length, 'steps');

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            return new Response(
                JSON.stringify({ error: 'OpenAI API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create a focused prompt with the actual blueprint
        const blueprintAnalysis = analyzeBlueprint(automation_blueprint);
        const userPrompt = `Generate a complete flow diagram for this automation:

TRIGGER: ${JSON.stringify(automation_blueprint.trigger)}
STEPS: ${JSON.stringify(automation_blueprint.steps, null, 2)}

ANALYSIS:
- Total Steps: ${blueprintAnalysis.totalSteps}
- Conditions: ${blueprintAnalysis.conditionCount}
- AI Agents: ${blueprintAnalysis.agentCount}
- Platforms: ${blueprintAnalysis.platforms.join(', ')}

Create nodes for EVERY step and connect them properly. Start with the real trigger, not a fake one.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: "system", content: FIXED_DIAGRAM_GENERATOR_SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
                max_tokens: 4000
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ OpenAI API error:', errorData);
            return new Response(
                JSON.stringify({ error: `OpenAI API error: ${JSON.stringify(errorData)}` }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const result = await response.json();
        const diagramDataString = result.choices[0].message.content;
        
        let diagramData;
        try {
            diagramData = JSON.parse(diagramDataString);
        } catch (parseError) {
            console.error('❌ JSON parsing error:', parseError);
            return new Response(
                JSON.stringify({ 
                    error: 'Failed to parse AI response as JSON',
                    raw_content: diagramDataString.substring(0, 500)
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!diagramData || !diagramData.nodes || !diagramData.edges) {
            console.error('❌ Invalid diagram structure');
            return new Response(
                JSON.stringify({ error: 'Invalid diagram structure from AI' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Post-process nodes and edges to ensure they're properly formatted
        diagramData.nodes = diagramData.nodes.map((node: any, index: number) => ({
            ...node,
            id: node.id || `node-${index}`,
            draggable: true,
            selectable: true,
            connectable: false,
            position: {
                x: typeof node.position?.x === 'number' ? node.position.x : 50 + (index * 300),
                y: typeof node.position?.y === 'number' ? node.position.y : 100
            }
        }));

        diagramData.edges = diagramData.edges.map((edge: any, index: number) => ({
            ...edge,
            id: edge.id || `edge-${index}`,
            type: 'smoothstep',
            animated: true,
            style: {
                stroke: edge.style?.stroke || '#3b82f6',
                strokeWidth: 2,
                ...edge.style
            }
        }));

        console.log('✅ Generated diagram:', {
            nodes: diagramData.nodes.length,
            edges: diagramData.edges.length,
            expectedSteps: blueprintAnalysis.totalSteps
        });

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 Error in diagram generator:', error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Diagram generation failed',
                details: error.toString()
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

function analyzeBlueprint(blueprint: any) {
    let totalSteps = 0;
    let conditionCount = 0;
    let agentCount = 0;
    const platforms = new Set<string>();

    const analyzeSteps = (steps: any[]) => {
        steps.forEach(step => {
            totalSteps++;
            
            if (step.action?.integration) {
                platforms.add(step.action.integration);
            }
            
            if (step.type === 'condition') {
                conditionCount++;
                if (step.condition?.if_true) analyzeSteps(step.condition.if_true);
                if (step.condition?.if_false) analyzeSteps(step.condition.if_false);
            }
            
            if (step.type === 'ai_agent_call' || step.ai_agent_call) {
                agentCount++;
            }
            
            if (step.loop?.steps) analyzeSteps(step.loop.steps);
            if (step.retry?.steps) analyzeSteps(step.retry.steps);
            if (step.fallback?.primary_steps) analyzeSteps(step.fallback.primary_steps);
            if (step.fallback?.fallback_steps) analyzeSteps(step.fallback.fallback_steps);
        });
    };

    if (blueprint.steps) {
        analyzeSteps(blueprint.steps);
    }

    return {
        totalSteps,
        conditionCount,
        agentCount,
        platforms: Array.from(platforms)
    };
}
