
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ENHANCED_DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an EXPERT visual automation flow designer that creates comprehensive, professional, and highly interactive React Flow diagrams.

=== YOUR CORE MISSION ===
Generate a COMPLETE, perfectly aligned, and highly interactive visual diagram that shows the EXACT flow of the automation from start to finish. Focus on MAXIMUM INTERACTIVITY, CLEAR VISUAL HIERARCHY, and PROFESSIONAL AESTHETICS.

=== CRITICAL INTERACTIVITY REQUIREMENTS ===
1. ALL nodes MUST have:
   - draggable: true (explicitly set)
   - selectable: true (explicitly set)
   - connectable: false (prevent user connections)
   - Proper positioning with NO OVERLAPS

2. ALL edges MUST have:
   - type: 'smoothstep' for professional curves
   - animated: true for flow indication
   - Proper source/target handles
   - Clear visual hierarchy with colors

=== ENHANCED LAYOUT REQUIREMENTS ===
1. Node Placement (NO OVERLAPS):
   - Start with trigger at (50, 100)
   - Horizontal spacing: 300px minimum between node centers
   - Vertical spacing: 200px minimum for branches
   - Each node needs unique, non-overlapping position

2. Professional Styling:
   - Use consistent color scheme per node type
   - Ensure proper handle positioning
   - Add meaningful labels and descriptions
   - Include platform/integration details

3. Edge Routing:
   - Use proper sourceHandle/targetHandle
   - Color-code conditional paths (green=Yes, red=No)
   - Animate all connections
   - Ensure smooth curves without intersections

=== NODE TYPE SPECIFICATIONS ===

triggerNode: 
- Color: Red theme (#dc2626)
- Always first node at (50, 100)
- Include trigger type, schedule, platform details
- Must have RIGHT output handle

platformNode:
- Color: Blue theme (#3b82f6) 
- Include platform name, connection details
- Clear integration information

actionNode:
- Color: Neutral Blue (#60a5fa)
- Include action description, parameters
- Show what the step accomplishes

conditionNode:
- Color: Orange theme (#f97316)
- MUST have TWO output paths:
  - sourceHandle: "success" → Green edge (#10b981)
  - sourceHandle: "error" → Red edge (#ef4444)
- Label paths clearly as "Yes" and "No"

aiAgentNode:
- Color: Emerald Green (#10b981)
- Include agent name, purpose, model details
- Show AI integration clearly

loopNode:
- Color: Purple theme (#8b5cf6)
- Show iteration details, conditions
- Include loop scope and limits

delayNode:
- Color: Slate Gray (#64748b)
- Include timing information
- Show delay duration clearly

retryNode:
- Color: Amber (#f59e0b)
- Include retry count, conditions
- Show error handling strategy

fallbackNode:
- Color: Indigo (#6366f1)
- Include fallback strategy details
- Show alternative path clearly

=== ENHANCED DATA STRUCTURE ===
Each node data object MUST include:
- label: Clear, descriptive name
- explanation: Brief description of function
- stepType: Original blueprint type
- platform/agent/condition/etc: Relevant specific data
- icon: Appropriate icon name
- Interactive properties for UI enhancement

=== VALIDATION CHECKLIST ===
✓ Every node has unique, non-overlapping position
✓ All nodes are draggable and selectable
✓ All edges are animated smoothstep type
✓ Conditional nodes have proper branching
✓ Professional color scheme throughout
✓ Complete flow from trigger to end
✓ All integrations represented as nodes
✓ Clear visual hierarchy and spacing
✓ Proper handle positioning and IDs

RETURN: Complete JSON with "nodes" and "edges" arrays optimized for maximum interactivity and professional appearance.`

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    console.log('🚀 Enhanced Interactive Diagram Generator - Request received');
    
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
                    error: 'Missing automation blueprint - cannot create interactive diagram'
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
            let conditionalBranches = 0;
            
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
                    
                    if (step.type === 'condition') {
                        conditionalBranches++;
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
                conditionalBranches,
                trigger: blueprint.trigger,
                expectedNodes: totalSteps + platforms.size + agents.size + 1,
                complexity: conditionalBranches > 0 ? 'high' : totalSteps > 5 ? 'medium' : 'simple'
            };
        };

        const analysis = analyzeBlueprint(automation_blueprint);
        console.log('📊 Enhanced flow analysis:', analysis);

        // Check OpenAI API key
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            console.error('❌ OpenAI API key not found');
            return new Response(
                JSON.stringify({ error: 'OpenAI API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Enhanced user prompt focusing on interactivity
        const userPrompt = `CREATE AN INTERACTIVE AUTOMATION FLOW DIAGRAM

AUTOMATION TITLE: ${automation_blueprint.description || 'Automation Flow'}
COMPLEXITY LEVEL: ${analysis.complexity.toUpperCase()}
EXPECTED NODES: ${analysis.expectedNodes}
TOTAL STEPS: ${analysis.totalSteps}
CONDITIONAL BRANCHES: ${analysis.conditionalBranches}
PLATFORMS: ${analysis.platforms.join(', ')} (${analysis.platforms.length} total)
AI AGENTS: ${analysis.agents.join(', ')} (${analysis.agents.length} total)
STEP TYPES: ${analysis.stepTypes.join(', ')}
TRIGGER TYPE: ${analysis.trigger?.type || 'manual'}

AUTOMATION BLUEPRINT (for precise parsing):
${JSON.stringify(automation_blueprint, null, 2)}

---
CRITICAL INTERACTIVE DIAGRAM REQUIREMENTS:

1. MAXIMUM INTERACTIVITY:
   - Every node MUST be draggable: true and selectable: true
   - NO overlapping positions - calculate exact coordinates
   - Smooth responsive interactions with proper hover states

2. PROFESSIONAL LAYOUT:
   - Start trigger at (50, 100)
   - Horizontal spacing: 300px minimum between centers
   - Vertical spacing: 200px for branches
   - Calculate positions to prevent ANY overlaps

3. ENHANCED VISUAL HIERARCHY:
   - Use specified color schemes for each node type
   - Animate ALL edges with smoothstep curves
   - Color-code conditional paths (green/red)
   - Professional typography and spacing

4. COMPLETE FLOW REPRESENTATION:
   - Include ALL platforms as dedicated platformNodes
   - Include ALL AI agents as aiAgentNodes
   - Represent ALL step types from blueprint
   - Ensure logical flow from trigger to completion

5. ROBUST ERROR HANDLING:
   - Clear conditional branching with labeled paths
   - Proper retry/fallback node representation
   - Comprehensive edge routing without intersections

Your response MUST be ONLY a JSON object with "nodes" and "edges" arrays optimized for maximum interactivity and professional appearance. Focus on creating a diagram that users can immediately interact with through dragging, selecting, and exploring.`;

        console.log('🤖 Generating enhanced interactive diagram');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4.1-2025-04-14',
                messages: [
                    { role: "system", content: ENHANCED_DIAGRAM_GENERATOR_SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1, // Very low for consistent layouts
                max_tokens: 4500 // Increased for complex diagrams
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
        console.log('✅ OpenAI response received for interactive diagram');

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

        // Enhanced post-processing for maximum interactivity
        diagramData.nodes = diagramData.nodes.map(node => ({
            ...node,
            draggable: true,
            selectable: true,
            connectable: false,
            // Ensure positions are numbers and non-overlapping
            position: {
                x: typeof node.position?.x === 'number' ? node.position.x : 50,
                y: typeof node.position?.y === 'number' ? node.position.y : 100
            }
        }));

        diagramData.edges = diagramData.edges.map(edge => ({
            ...edge,
            type: 'smoothstep',
            animated: true,
            style: {
                stroke: edge.style?.stroke || '#3b82f6',
                strokeWidth: edge.style?.strokeWidth || 2,
                ...edge.style
            },
            // Ensure proper handle connections
            sourceHandle: edge.sourceHandle || 'right',
            targetHandle: edge.targetHandle || 'left'
        }));

        // Validation checks
        const nodePositions = new Set();
        const hasOverlaps = diagramData.nodes.some(node => {
            const key = `${Math.round(node.position.x/50)}-${Math.round(node.position.y/50)}`;
            if (nodePositions.has(key)) {
                console.warn('⚠️ Potential node overlap detected');
                return true;
            }
            nodePositions.add(key);
            return false;
        });

        console.log('✅ Generated enhanced interactive diagram:', {
            nodes: diagramData.nodes.length,
            edges: diagramData.edges.length,
            nodeTypes: [...new Set(diagramData.nodes.map(n => n.type))],
            hasOverlaps,
            expectedNodes: analysis.expectedNodes,
            actualNodes: diagramData.nodes.length,
            completeness: Math.round((diagramData.nodes.length / analysis.expectedNodes) * 100) + '%'
        });

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 Error in interactive diagram generator:', error);
        
        return new Response(
            JSON.stringify({
                error: error.message || 'Interactive diagram generation failed',
                details: error.toString()
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
