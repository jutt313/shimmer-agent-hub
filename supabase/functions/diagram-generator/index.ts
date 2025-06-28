
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ENHANCED_DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an EXPERT visual automation flow designer that creates comprehensive, professional, and intuitive React Flow diagrams, mirroring the visual quality of n8n and Make.com.

=== YOUR CORE MISSION ===
Generate a COMPLETE, perfectly aligned, and highly readable visual diagram that shows the EXACT flow of the automation from start to finish, step by step. Prioritize absolute CLARITY, AESTHETICS, and NO VISUAL CLUTTER.

=== STRICT LAYOUT AND VISUAL REQUIREMENTS ===
1.  Node Placement & Spacing (Grid-like Precision):
    * Maintain strict LEFT-TO-RIGHT flow for the primary automation path.
    * Ensure consistent horizontal spacing: A typical distance of 350-450 pixels between the centers of horizontally adjacent nodes.
    * Ensure consistent vertical spacing for branched or parallel paths: A typical vertical offset of 150-250 pixels between the centers of vertically adjacent nodes.
    * CRITICAL: ABSOLUTELY NO NODE OVERLAPS WHATSOEVER. Adjust x and y positions precisely to prevent any overlap.
    * Align nodes vertically when they represent a direct continuation or a clean converging point.
    * Nodes should generally be centered on their y coordinate for their "row" or "lane" unless explicitly branching.
    * Group related nodes logically to form clear visual clusters or sections within the flow.

2.  Path Drawing (Edges - Smooth and Intentional):
    * Always use smoothstep edge type for clean, professional curves.
    * All edges MUST be animated: true to indicate flow.
    * Conditional Paths (Decision Nodes):
        * For conditionNode (e.g., "Is High Priority?"), draw two distinctly labeled and colored paths:
            * "Yes" Path (True): Clearly labeled "Yes". This path should typically go to the upper-right or straight right from the condition node. Use vibrant green (#10b981) with strokeWidth: 3. Source Handle: success.
            * "No" Path (False): Clearly labeled "No". This path should typically go to the lower-right or straight right from the condition node. Use clear red (#ef4444) with strokeWidth: 3. Source Handle: error.
        * Ensure conditional branches diverge cleanly and do not cross or intersect other nodes/edges unnecessarily. They should re-converge or terminate clearly.
    * Multiple Paths Leading to Same Next Step (Convergence): When multiple paths (e.g., from different conditional branches, or parallel actions) need to connect to a single subsequent node, ensure these incoming edges converge cleanly and intuitively into that node. Avoid tangled lines at the merge point. Use clear routing.
    * Error/Fallback Paths: If a step has on_error or is part of a retry/fallback mechanism, draw distinct paths (e.g., dashed, different color) to represent the alternative flow on failure or fallback execution. Label them appropriately (e.g., "On Error", "Fallback").
    * Standard Flow: For all other sequential steps and general connections, use a subtle but clear stroke color (e.g., #3b82f6 or #94a3b8) and strokeWidth: 2.

3.  Comprehensive Component Inclusion and Details:
    * Trigger Node: Always include a triggerNode at the very beginning (start at x: 100, y: 300).
    * Every Automation Step: For each step in the blueprint (action, condition, loop, delay, ai_agent_call, retry, fallback), create a corresponding node.
    * Dedicated Platform Nodes: For each unique action.integration (platform used), create a dedicated platformNode. This node visually represents the integration point.
    * Dedicated AI Agent Nodes: For each ai_agent_call, create a dedicated aiAgentNode to highlight the AI's role.
    * Node Data: Ensure data object for each node includes:
        * label: Concise, descriptive name for the node.
        * platform: The name of the integrated platform (for actionNode, platformNode).
        * icon: A relevant icon name (e.g., 'mail', 'sheet', 'slack', 'bot', 'clock').
        * explanation: A brief sentence describing what this step or component does.
        * stepType: The original type from the blueprint (e.g., 'action', 'condition').
        * Specific data for node types: condition object for conditionNode, loop object for loopNode, agent object for aiAgentNode, delay object for delayNode, retry object for retryNode, fallback object for fallbackNode.

4.  Node/Edge Color Palette Guidance (Use these colors consistently):
    * triggerNode: Red (#dc2626)
    * platformNode: Blue (#3b82f6)
    * actionNode: Neutral Blue (#60a5fa)
    * conditionNode: Orange (#f97316)
    * loopNode: Purple (#8b5cf6)
    * aiAgentNode: Emerald Green (#10b981)
    * delayNode: Slate Gray (#64748b)
    * retryNode: Amber (#f59e0b)
    * fallbackNode: Indigo (#6366f1)
    * Standard Edge: #3b82f6 or #94a3b8
    * Yes Edge: #10b981
    * No Edge: #ef4444

=== VALIDATION REQUIREMENTS (Reiterate and Strengthen) ===
✓ Every platform mentioned in the blueprint has a corresponding platformNode.
✓ Every AI agent mentioned has an aiAgentNode.
✓ All conditionNodes have clearly drawn and labeled "Yes" and "No" branching paths.
✓ The overall flow is strictly LEFT TO RIGHT and intuitive.
✓ All nodes are logically connected, and there are NO missing or broken connections.
✓ Nodes and edges DO NOT OVERLAP each other.
✓ The diagram is visually clean, professional, and easy to understand at a glance.

=== OUTPUT FORMAT ===
Return ONLY valid JSON with "nodes" and "edges" arrays.
The output should be a complete and highly polished visual representation of the automation workflow.
REMEMBER: You're creating the blueprint for a professional diagram that a user would instantly understand and trust.`

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    console.log('🚀 Enhanced Visual Flow Generator - Request received');
    
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        console.error('❌ Invalid method:', req.method);
        return new Response(
            JSON.stringify({ error: 'Method Not Allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const requestBody = await req.json();
        const { automation_blueprint } = requestBody;

        console.log('📋 Blueprint analysis - Steps:', automation_blueprint?.steps?.length || 0);
        
        if (!automation_blueprint || !automation_blueprint.steps) {
            console.error('❌ Missing automation blueprint');
            return new Response(
                JSON.stringify({ 
                    error: 'Missing automation blueprint - cannot create visual flow'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Enhanced analysis for better prompting
        const analyzeBlueprint = (blueprint) => {
            let totalSteps = 0;
            const platforms = new Set();
            const agents = new Set();
            const stepTypes = new Set();
            
            const processSteps = (steps) => {
                steps.forEach((step) => {
                    totalSteps++;
                    stepTypes.add(step.type);
                    
                    if (step.action?.integration) {
                        platforms.add(step.action.integration);
                    }
                    
                    if (step.ai_agent_call?.agent_id) {
                        agents.add(step.ai_agent_call.agent_id);
                    }
                    
                    // Process nested steps
                    if (step.condition?.if_true) processSteps(step.condition.if_true);
                    if (step.condition?.if_false) processSteps(step.condition.if_false);
                    if (step.loop?.steps) processSteps(step.loop.steps);
                    if (step.retry?.steps) processSteps(step.retry.steps);
                    if (step.fallback?.primary_steps) processSteps(step.fallback.primary_steps);
                    if (step.fallback?.fallback_steps) processSteps(step.fallback.fallback_steps);
                });
            };

            processSteps(blueprint.steps);
            
            return {
                totalSteps,
                platforms: Array.from(platforms),
                agents: Array.from(agents),
                stepTypes: Array.from(stepTypes),
                trigger: blueprint.trigger
            };
        };

        const analysis = analyzeBlueprint(automation_blueprint);
        console.log('📊 Flow analysis:', analysis);

        // Check OpenAI API key
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            console.error('❌ OpenAI API key not found');
            return new Response(
                JSON.stringify({ error: 'OpenAI API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Enhanced user prompt focusing on visual flow
        const userPrompt = `CREATE A VISUAL AUTOMATION FLOW DIAGRAM

AUTOMATION BLUEPRINT TITLE: ${automation_blueprint.description || 'Automation Flow'}
TOTAL STEPS IN BLUEPRINT: ${analysis.totalSteps}
UNIQUE PLATFORMS USED: ${analysis.platforms.join(', ')} (${analysis.platforms.length} total)
UNIQUE AI AGENTS USED: ${analysis.agents.join(', ')} (${analysis.agents.length} total)
TYPES OF STEPS IN BLUEPRINT: ${analysis.stepTypes.join(', ')}
AUTOMATION TRIGGER TYPE: ${analysis.trigger?.type || 'manual'}

FULL AUTOMATION BLUEPRINT JSON (for precise parsing of details):
${JSON.stringify(automation_blueprint, null, 2)}

---
CRITICAL INSTRUCTIONS FOR DIAGRAM GENERATION:
Based on the FULL AUTOMATION BLUEPRINT JSON provided above, meticulously generate the "nodes" and "edges" arrays for a React Flow diagram.

Adhere strictly to ALL "STRICT LAYOUT AND VISUAL REQUIREMENTS", "NODE STRUCTURE", "EDGE CONNECTIONS", "Node/Edge Color Palette Guidance", and "VALIDATION REQUIREMENTS" defined in the SYSTEM PROMPT.

PAY EXTREME ATTENTION TO:
1.  NO OVERLAPS: Ensure no nodes overlap at all. Adjust positions if needed.
2.  CLEAN BRANCHING: For conditional nodes, ensure "Yes" and "No" paths diverge clearly and merge cleanly if they lead to a common next step.
3.  CONVERGING PATHS: If multiple paths lead to a single node, ensure the incoming edges merge smoothly and intuitively without tangles.
4.  CONSISTENT SPACING: Maintain the specified horizontal and vertical spacing guidelines.
5.  COMPREHENSIVE DETAIL: Include all platforms, agents, step details, and rules as labels and explanations in the node's data.
6.  AESTHETICS: Make it look professional and easy to follow, like a top-tier automation builder.

Your response MUST be ONLY a JSON object containing the nodes and edges arrays.
`;

        console.log('🤖 Generating visual flow with enhanced prompt');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4.1-2025-04-14', // Updated to use the flagship model
                messages: [
                    { role: "system", content: ENHANCED_DIAGRAM_GENERATOR_SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2, // Keep temperature low for deterministic layout
                max_tokens: 4000 // Increased tokens for complex blueprints
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
        console.log('✅ OpenAI response received');

        if (!result.choices || result.choices.length === 0) {
            console.error('❌ No response from OpenAI');
            return new Response(
                JSON.stringify({ error: 'No response from OpenAI' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

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
                JSON.stringify({ 
                    error: 'Invalid diagram structure from AI'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Apply default styles and ensure interactivity (as per previous logic)
        diagramData.edges = diagramData.edges.map(edge => ({
            ...edge,
            type: edge.type || 'smoothstep',
            animated: edge.animated !== undefined ? edge.animated : true,
            style: {
                stroke: edge.style?.stroke || '#3b82f6',
                strokeWidth: edge.style?.strokeWidth || 2,
                ...edge.style
            },
            sourceHandle: edge.sourceHandle // Ensure sourceHandle is preserved for conditionals
        }));

        diagramData.nodes = diagramData.nodes.map(node => ({
            ...node,
            draggable: true,
            selectable: true,
            connectable: false // Connections should be from AI-generated edges
        }));

        console.log('✅ Generated interactive visual flow:', {
            nodes: diagramData.nodes.length,
            edges: diagramData.edges.length,
            nodeTypes: [...new Set(diagramData.nodes.map(n => n.type))]
        });

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 Error in visual flow generator:', error);
        
        return new Response(
            JSON.stringify({
                error: error.message || 'Visual flow generation failed',
                details: error.toString()
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
