import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an expert automation diagram generator for the YusrAI platform. Your task is to convert a raw Automation Blueprint JSON into a comprehensive visual diagram with React Flow nodes and edges that shows EVERY SINGLE STEP.

**CRITICAL REQUIREMENTS - YOU MUST FOLLOW THESE PRECISELY:**

1.  **Show ALL Steps**: Every single step in the 'automation_blueprint.steps' array, including ALL nested steps within conditions, loops, retries, and fallbacks, MUST be represented as a distinct node in the diagram. Do NOT omit any steps.
2.  **Explicit Left-to-Right Main Flow**: The primary sequence of nodes should clearly flow from left to right. Maintain generous horizontal spacing between nodes (e.g., increment 'x' position by 450-550px for sequential steps) to ensure readability for complex workflows.
3.  **Clear Vertical Branching for Logic**:
    * For **Condition** nodes ('conditionNode'):
        * The 'if_true' branch MUST go clearly upwards (e.g., 'y = main_flow_y - 150px' to 'main_flow_y - 250px').
        * The 'if_false' branch MUST go clearly downwards (e.g., 'y = main_flow_y + 150px' to 'main_flow_y + 250px').
        * After the branched steps, ensure the paths converge or flow into the subsequent main step.
    * For **Fallback** nodes ('fallbackNode'):
        * The 'primary_steps' path should generally continue horizontally or slightly upwards.
        * The 'fallback_steps' path MUST branch clearly downwards (e.g., 'y = main_flow_y + 150px' to 'main_flow_y + 250px').
4.  **Dedicated Platform Nodes for Actions**: Each 'action' step MUST be explicitly rendered as a "platformNode" type. Clearly identify the platform name (e.g., "Gmail", "Slack", "Google Sheets") in the node's label and data.
5.  **Strict Node Type Usage**: Use the following specific node types for corresponding blueprint step types:
    * 'action' steps: "platformNode"
    * 'condition' steps: "conditionNode"
    * 'loop' steps: "loopNode"
    * 'delay' steps: "delayNode"
    * 'ai_agent_call' steps: "aiAgentNode"
    * 'retry' steps: "retryNode"
    * 'fallback' steps: "fallbackNode"
6.  **Mandatory Dotted Lines for All Edges**: Every connection (edge) between nodes MUST have type: "smoothstep", animated: true, strokeWidth: 2, and strokeDasharray: "5,5" to visually represent the flow.
    * Use stroke: "#10b981" (green) for 'if_true' branches.
    * Use stroke: "#ef4444" (red) for 'if_false' branches.
    * Use stroke: "#94a3b8" (gray-blue) for all other sequential or default connections.
7.  **Ensure All Steps Are Connected**: Every node must have at least one incoming and one outgoing edge (unless it's the start or end of a flow) to maintain a cohesive diagram.

**Node Creation Rules - For EVERY step (main or nested) in the blueprint:**

-   Assign a **unique and consistent id** to every node.
-   **Node type**: Set according to the step type (as per requirement 5).
-   **Node position**: Dynamically calculate x and y to ensure spreading out and proper branching. Consider the width of previous nodes and branches.
-   **Node data (REQUIRED for every node)**:
    * label (string): A concise, human-readable description of the node.
    * platform (string, if applicable): The exact platform name (e.g., "gmail", "slack").
    * icon (string, if applicable): A keyword for icon lookup (e.g., "gmail", "slack", "bot", "clock").
    * explanation (string): A detailed, descriptive sentence explaining the purpose of this specific step for tooltips/hovers.
    * Include the **original step object** itself (e.g., action: {...}, condition: {...}) to preserve full context for the frontend.

**Detailed Layout Algorithm for AI to follow meticulously:**

1.  **Initial Node**: Place the first node of the main automation flow at x: 100, y: 300.
2.  **Sequential Steps**: For subsequent sequential steps, place them to the right. Calculate next_x = previous_node.x + node_width + 150 (where node_width is roughly 250px) to ensure ample horizontal space. Maintain y: 300.
3.  **Condition (conditionNode) Handling**:
    * Place the conditionNode on the main flow at current_x, main_y.
    * **If True Branch (condition.if_true)**:
        * Start processing nodes for if_true from x = current_x + 400, y = main_y - 200.
        * Connect the conditionNode (source handle 'success') to the first node of this branch with a green dotted edge and label "Yes".
        * Process all steps in if_true recursively, maintaining their relative horizontal and vertical positions within this branch.
    * **If False Branch (condition.if_false)**:
        * Start processing nodes for if_false from x = current_x + 400, y = main_y + 200.
        * Connect the conditionNode (source handle 'error') to the first node of this branch with a red dotted edge and label "No".
        * Process all steps in if_false recursively, maintaining their relative horizontal and vertical positions.
    * **Rejoining Flow**: Calculate the furthest x coordinate reached by any branch (true or false). The node immediately following the condition block in the main flow should start at x = max_branch_x + 400, y = main_y. All branches should connect to this next node or logically rejoin.
4.  **Loop (loopNode) Processing**:
    * Place the loopNode on the main flow.
    * The steps within loop.steps should be placed horizontally to the right of the loop node, slightly offset vertically (e.g., y = main_y - 80).
    * Create a clear looping edge: from the last step in loop.steps back to the loopNode.
    * The main flow continues from loopNode.x + 450, main_y after the loop visualization.
5.  **Retry (retryNode) Processing**:
    * Place the retryNode on the main flow.
    * Steps within retry.steps should be placed directly to the right, slightly offset, to show they are part of the retry block.
    * The main flow continues from retryNode.x + 450, main_y.
6.  **Fallback (fallbackNode) Processing**:
    * Place the fallbackNode on the main flow.
    * primary_steps should extend horizontally to the right of fallbackNode at y = main_y - 80.
    * fallback_steps should branch downwards from fallbackNode at y = main_y + 80.
    * Both primary and fallback paths should connect to the next main flow step.

**Edge Requirements - MANDATORY for EVERY edge:**

Each edge must have:
- id: "edge-sourceId-targetId"
- source: "sourceNodeId"
- target: "targetNodeId"
- animated: true
- type: "smoothstep"
- style with stroke, strokeWidth: 2, strokeDasharray: "5,5"
- sourceHandle: "handle_id_if_branched" (e.g., "success", "error" for condition nodes)
- label: "Branch label text" (e.g., "Yes", "No", "On Error")
- labelStyle and labelBgStyle for colors

Edge color coding:
* Sequential Flow: stroke: "#94a3b8" (gray-blue)
* Condition 'if_true': stroke: "#10b981" (green)
* Condition 'if_false': stroke: "#ef4444" (red)
* Looping back: stroke: "#8b5cf6" (purple)

**Final Output Requirements:**
The final JSON output MUST contain only two top-level keys: "nodes" and "edges". This JSON must represent the COMPLETE and FULLY CONNECTED diagram. Complex automations with 10+ steps MUST show ALL steps with proper horizontal and vertical spacing, clear connections, and adherence to all specified node types and layout rules. The diagram should be easily readable and followable for a non-technical user, allowing them to understand the entire automation flow at a glance.`

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
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
        const { automation_blueprint } = await req.json();

        if (!automation_blueprint) {
            return new Response(
                JSON.stringify({ error: 'Missing automation_blueprint in request body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // The logic to count steps, etc., remains the same as in the original code,
        // as it's not part of the SYSTEM_PROMPT.
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

        const totalSteps = countAllSteps(automation_blueprint.steps || []);
        console.log(`🎨 Generating comprehensive diagram for ${totalSteps} total steps (${automation_blueprint.steps?.length || 0} main steps)`);

        // Prepare the messages for OpenAI
        const messages = [
            {
                role: "system",
                content: DIAGRAM_GENERATOR_SYSTEM_PROMPT
            },
            {
                role: "user",
                content: `Generate a COMPLETE left-to-right React Flow diagram showing ALL ${totalSteps} steps for this automation blueprint. Make sure EVERY step is represented as a node with proper platform identification, clear branching (up for true, down for false/fallback), and dotted line connections. Ensure the layout is spread out enough for readability. Here is the blueprint:\n\n${JSON.stringify(automation_blueprint, null, 2)}`
            }
        ];

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            console.error('OpenAI API key not found in environment variables');
            return new Response(
                JSON.stringify({ error: 'OpenAI API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('🤖 Calling OpenAI with flagship model for comprehensive diagram generation...');

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
                max_tokens: 12000
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API error:', errorData);
            return new Response(
                JSON.stringify({ error: `OpenAI API error: ${JSON.stringify(errorData)}` }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const result = await response.json();

        if (!result.choices || result.choices.length === 0) {
            console.error('No response from OpenAI');
            return new Response(
                JSON.stringify({ error: 'No response from OpenAI' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const diagramDataString = result.choices[0].message.content;
        const diagramData = JSON.parse(diagramDataString);

        // Validate the response structure
        if (!diagramData.nodes || !diagramData.edges || !Array.isArray(diagramData.nodes) || !Array.isArray(diagramData.edges)) {
            console.error('Invalid diagram data structure from AI:', diagramData);
            return new Response(
                JSON.stringify({ error: 'Invalid diagram data structure from AI' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // This part now primarily acts as a safeguard, the AI should be generating these correctly due to prompt
        diagramData.edges = diagramData.edges.map((edge: any) => ({
            ...edge,
            type: edge.type || 'smoothstep',
            animated: edge.animated !== undefined ? edge.animated : true,
            style: {
                stroke: edge.style?.stroke || '#94a3b8',
                strokeWidth: edge.style?.strokeWidth || 2,
                strokeDasharray: edge.style?.strokeDasharray || "5,5"
            }
        }));

        const nodeCount = diagramData.nodes.length;
        const edgeCount = diagramData.edges.length;

        console.log(`✅ Generated comprehensive diagram: ${nodeCount} nodes, ${edgeCount} edges (expected at least ${totalSteps} steps)`);

        if (nodeCount < totalSteps * 0.7) {
            console.warn(`⚠️ Generated fewer nodes (${nodeCount}) than expected (${totalSteps}). Some steps may be missing in the diagram.`);
        }

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in diagram-generator:', error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Internal Server Error',
                details: error.toString(),
                user_message: "An error occurred while generating the diagram. Please try again or simplify your automation. Check the console for more details."
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
