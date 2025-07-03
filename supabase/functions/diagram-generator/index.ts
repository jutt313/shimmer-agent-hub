import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ENHANCED_DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an EXPERT visual automation flow designer that creates comprehensive, professional, and highly interactive React Flow diagrams.

=== YOUR CORE MISSION ===
Generate a COMPLETE, perfectly aligned, and highly interactive visual diagram that shows the EXACT flow of the automation from start to finish. Focus on MAXIMUM INTERACTIVITY, CLEAR VISUAL HIERARCHY, and PROFESSIONAL AESTHETICS.

=== CRITICAL INTERACTIVITY REQUIREMENTS ===
1. ALL nodes MUST have:
   - draggable: true (explicitly set)
   - selectable: true (explicitly set)
   - connectable: false (prevent user connections)
   - Proper positioning with NO OVERLAPS, ensuring the entire automation fits comfortably when zoomed out.

2. ALL edges MUST have:
   - type: 'smoothstep' for professional curves
   - animated: true for flow indication
   - Proper source/target handles (e.g., 'right', 'left', 'top', 'bottom')
   - Clear visual hierarchy with colors
   - **CRITICAL: Every logical connection between steps MUST have a corresponding edge. NO MISSING "ROPES".**

=== ENHANCED LAYOUT REQUIREMENTS ===
1. Node Placement (NO OVERLAPS):
   - **PRIMARY FLOW: STRICTLY LEFT-TO-RIGHT.**
   - Start with trigger at (50, 100).
   - Horizontal spacing: Maintain at least 300px between node centers.
   - Vertical spacing: Adjust as needed for clarity, especially for branches, aiming for minimum 200px.
   - Each node needs a unique, non-overlapping position, creating a clean, lean diagram without unnecessary visual bulk.

2. Professional Styling:
   - Use consistent color scheme per node type.
   - Ensure proper handle positioning.
   - **Nodes should display an icon as their primary label. Full descriptive text for details should be in the 'explanation' field, intended for hover/tooltip functionality on the frontend.**
   - **NO EMOJIS. Use descriptive icon names (e.g., "SlackIcon", "DatabaseIcon", "AgentIcon").**
   - Include platform/integration details within the 'explanation' of the relevant action/trigger node.

3. Edge Routing:
   - Use proper sourceHandle/targetHandle.
   - Color-code conditional paths distinctly for each branch.
   - Animate all connections.
   - Ensure smooth curves without intersections.

=== NODE TYPE SPECIFICATIONS (One Logical Step = One Node) ===
The aim is for a lean diagram where one visual node represents one complete logical step from the automation blueprint. Platform involvement should be integrated into the action/trigger node, NOT a separate node.

triggerNode: 
- Color: Red theme (#dc2626)
- Always first node at (50, 100)
- Label: Concise, typically an icon representing the trigger (e.g., "GoogleSheetsTriggerIcon", "WebhookIcon").
- Explanation: Include trigger type, schedule, and the platform/service involved (e.g., "Detects new rows in Google Sheets").
- Must have RIGHT output handle.

actionNode:
- Color: Neutral Blue (#60a5fa)
- Label: Concise, usually an icon representing the action or the associated platform (e.g., "AsanaTaskIcon", "SlackMessageIcon", "DataExtractionIcon").
- Explanation: Include a clear description of the action, parameters, and **explicitly mention the platform involved if applicable** (e.g., "Creates a new task in Asana using extracted data," "Sends a message via Slack").
- **CRITICAL: This node type should encompass actions that interact with platforms. A separate 'platformNode' should NOT be created for a specific action (e.g., 'Google Sheet' node followed by a 'Detect Row' node should become ONE 'Detect Row (Google Sheet)' node).**

conditionNode:
- Color: Orange theme (#f97316)
- Label: Concise, usually an icon (e.g., "ConditionIcon").
- Explanation: Brief description of the condition.
- **Output Paths: Handle MULTIPLE, DYNAMIC output paths, each with a clear label reflecting the outcome (e.g., "Success", "Failure", "Status: Pending", "Option A", "Option B"). Each path MUST have a unique, descriptive sourceHandle (e.g., "outcome_success", "outcome_failure", "status_pending"). Paths should flow clearly, potentially branching vertically (up/down) to maintain horizontal flow for the main sequence.**
- **Edge Styling: Each conditional path should have a distinct color for clarity (e.g., green for positive paths, red for negative/error paths, or other distinct colors for different conditions).**

aiAgentNode:
- Color: Emerald Green (#10b981)
- Label: Concise, usually an icon (e.g., "AgentIcon").
- Explanation: Include agent name, purpose, model details, and any AI integration specifics (e.g., "Summarizes text using TaskCreationAgent").
- **Placement: Integrate contextually where the AI agent is called within the automation flow, as a distinct logical step.**

loopNode:
- Color: Purple theme (#8b5cf6)
- Label: Concise, usually an icon (e.g., "LoopIcon").
- Explanation: Show iteration details, conditions, loop scope and limits.

delayNode:
- Color: Slate Gray (#64748b)
- Label: Concise, usually an icon (e.g., "DelayIcon").
- Explanation: Include timing information, show delay duration clearly.

retryNode:
- Color: Amber (#f59e0b)
- Label: Concise, usually an icon (e.g., "RetryIcon").
- Explanation: Include retry count, conditions, show error handling strategy.

fallbackNode:
- Color: Indigo (#6366f1)
- Label: Concise, usually an icon (e.g., "FallbackIcon").
- Explanation: Include fallback strategy details, show alternative path clearly.

**NOTE on 'platformNode'**: The 'platformNode' type, as a standalone node only representing a platform, should be generally AVOIDED for specific actions. Its purpose is typically for a general "integration setup" or a dashboard-level representation, which is not the focus of this per-automation flow diagram. Integrate platform details directly into trigger/action nodes.

=== ENHANCED DATA STRUCTURE ===
Each node data object MUST include:
- id: A unique identifier for runtime highlighting/tracking (e.g., 'step-1-google-sheet-detect').
- label: CONCISE, primary display (ideally just an icon or very short name/verb).
- explanation: DETAILED description of function, parameters, **platform/agent specifics**, and what the step accomplishes (for hover/tooltip).
- stepType: Original blueprint type (e.g., 'action', 'trigger').
- platform: (Optional) The name of the platform if this node directly interacts with one.
- agent: (Optional) The name of the AI agent if this node involves an AI agent.
- icon: APPROPRIATE ICON NAME (e.g., "SlackIcon", "AsanaIcon", "GoogleSheetsIcon", "AgentIcon", "ConditionIcon", "LoopIcon"). NO EMOJIS.
- Interactive properties for UI enhancement (draggable, selectable, connectable set to false).

=== VISUALIZATION REQUIREMENTS FOR RUNTIME (Frontend will use 'id' field): ===
- Ensure each node has a unique 'id' to allow frontend to visually indicate active steps (e.g., glow, loading circle) during live execution.
- ALL logical transitions between steps in the automation blueprint MUST have a corresponding animated edge.

=== VALIDATION CHECKLIST ===
✓ Every node has unique, non-overlapping position, optimized for left-to-right flow and "full automation in frame" visibility.
✓ All nodes are draggable and selectable.
✓ All edges are animated smoothstep type.
✓ Conditional nodes have proper branching for multiple, dynamic paths, with distinct edges.
✓ Professional color scheme throughout.
✓ Complete logical flow from trigger to end, with ALL necessary "ropes" (edges) present.
✓ **Each visual node represents ONE clear, logical step from the automation blueprint.**
✓ **Platform interactions are integrated into action/trigger nodes, avoiding redundant 'platformNode's for specific actions.**
✓ All integrations (platforms, AI agents) are represented accurately and concisely within the flow.
✓ Clear visual hierarchy and spacing.
✓ Proper handle positioning and unique IDs.
✓ Nodes display concise labels (icons preferred) with full details in 'explanation' for hover.

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
                expectedNodes: totalSteps + platforms.size + agents.size + 1, // Re-evaluating this; should be closer to totalSteps
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
TOTAL STEPS FROM BLUEPRINT: ${analysis.totalSteps}
CONDITIONAL BRANCHES: ${analysis.conditionalBranches}
PLATFORMS INVOLVED: ${analysis.platforms.join(', ')} (${analysis.platforms.length} total)
AI AGENTS INVOLVED: ${analysis.agents.join(', ')} (${analysis.agents.length} total)
STEP TYPES PRESENT: ${analysis.stepTypes.join(', ')}
TRIGGER TYPE: ${analysis.trigger?.type || 'manual'}

AUTOMATION BLUEPRINT (for precise parsing into nodes):
${JSON.stringify(automation_blueprint, null, 2)}

---
CRITICAL INTERACTIVE DIAGRAM REQUIREMENTS:

1. MAXIMUM INTERACTIVITY:
   - Every node MUST be draggable: true and selectable: true
   - NO overlapping positions - calculate exact coordinates.
   - Smooth responsive interactions with proper hover states.

2. PROFESSIONAL, LEAN LAYOUT (One Logical Step = One Visual Node):
   - **Start trigger at (50, 100).**
   - **PRIMARY FLOW: STRICTLY LEFT-TO-RIGHT.**
   - Horizontal spacing: Maintain at least 300px between node centers.
   - Vertical spacing: Adjust as needed for clarity for branches (min 200px), ensuring a compact and readable diagram.
   - Calculate positions to prevent ANY overlaps.
   - **CRITICAL: Each entry in 'automation_blueprint.steps' MUST correspond to EXACTLY ONE visual node in the diagram, UNLESS the step itself explicitly contains nested logic (like a condition or loop with sub-steps).**
   - **Platform interaction details (e.g., 'Google Sheet', 'Asana', 'Slack') should be integrated INTO the relevant action/trigger node's 'explanation' and 'icon', NOT as separate 'platformNode's.**

3. ENHANCED VISUAL HIERARCHY:
   - Use specified color schemes for each node type.
   - Animate ALL edges with 'smoothstep' curves.
   - Color-code conditional paths distinctly for each branch.
   - Professional typography and spacing.

4. COMPLETE FLOW REPRESENTATION (No Missing "Ropes"):
   - **Every logical transition between steps in the 'automation_blueprint' MUST be represented by an animated edge.**
   - Include ALL AI agents as 'aiAgentNode's contextually where they are used.
   - Represent ALL step types from blueprint.
   - Ensure logical flow from trigger to completion with all connections correctly drawn.

5. ROBUST CONTROL FLOW REPRESENTATION:
   - Clear conditional branching with labeled paths and distinct edges.
   - Proper 'retryNode', 'loopNode', and 'fallbackNode' representation, ensuring all internal steps and exit paths are correctly visualized with edges.

Your response MUST be ONLY a JSON object with "nodes" and "edges" arrays optimized for maximum interactivity and professional appearance. Focus on creating a diagram that users can immediately interact with through dragging, selecting, and exploring.`

        console.log('🤖 Generating enhanced interactive diagram');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
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
            // No longer relying on expectedNodes based on platforms.size; closer to totalSteps
            expectedNodes: analysis.totalSteps, 
            actualNodes: diagramData.nodes.length,
            completeness: Math.round((diagramData.nodes.length / analysis.totalSteps) * 100) + '%' // Use totalSteps for completeness
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