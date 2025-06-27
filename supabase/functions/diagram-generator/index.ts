
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an expert automation diagram generator for the YusrAI platform. Your task is to convert a raw Automation Blueprint JSON into a visual diagram represented by React Flow nodes and edges.

Your output MUST be a single JSON object with two top-level keys: "nodes" (an array of Node objects) and "edges" (an array of Edge objects).

Node Structure:
Each Node object in the "nodes" array MUST have these properties:
- id (string): Unique identifier for the node.
- type (string): Custom node type. Use "actionNode", "conditionNode", "loopNode", "delayNode", "aiAgentNode", "retryNode", or "fallbackNode".
- position (object): { x: number, y: number } - Logical coordinates for placement. Start x from 100, and increment x by ~350-400 for sequential steps. Adjust y for branches.
- data (object):
    - label (string): Primary text for the node (e.g., "Send Email", "Check Condition").
    - explanation (string): A short, clear description of what the step does.
    - platform (string, optional): For actionNode, the integration name (e.g., "Slack", "Gmail").
    - action (object, optional): Original action object from blueprint if type is 'actionNode'.
    - condition (object, optional): Original condition object from blueprint if type is 'conditionNode'.
    - loop (object, optional): Original loop object from blueprint if type is 'loopNode'.
    - delay (object, optional): Original delay object from blueprint if type is 'delayNode'.
    - agent (object, optional): Original ai_agent_call object from blueprint if type is 'aiAgentNode'.
    - retry (object, optional): Original retry object from blueprint if type is 'retryNode'.
    - fallback (object, optional): Original fallback object from blueprint if type is 'fallbackNode'.
    - stepType (string): The original step type from blueprint.
- sourcePosition (string, optional): "right" for most nodes.
- targetPosition (string, optional): "left" for most nodes.

Edge Structure:
Each Edge object in the "edges" array MUST have these properties:
- id (string): Unique identifier for the edge (e.g., "nodeA-nodeB-success").
- source (string): The ID of the source node.
- target (string): The ID of the target node.
- animated (boolean): true for active flows, false for static connections.
- type (string): Use "smoothstep" for curved edges.
- style (object): ALWAYS include { stroke: string, strokeWidth: number, strokeDasharray: "5,5" } - Use strokeDasharray for dotted lines.
- label (string, optional): For conditional branches, use "Success", "Error", "True", "False".
- sourceHandle (string, optional): For condition nodes, use "success" or "error" to denote the output path.
- labelStyle (object, optional): Style for edge labels.
- labelBgStyle (object, optional): Background style for edge labels.

**IMPORTANT EDGE STYLING RULES:**
- ALL edges MUST have strokeDasharray: "5,5" for dotted lines
- Use different colors for different types of connections:
  - Sequential flow: { stroke: "#94a3b8", strokeWidth: 2, strokeDasharray: "5,5" }
  - Success/True: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "5,5" }
  - Error/False: { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "5,5" }
  - Loop: { stroke: "#8b5cf6", strokeWidth: 2, strokeDasharray: "5,5" }
  - Retry: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "5,5" }

**VISUALIZATION RULES - MAKE.COM STYLE LAYOUT:**

1. **Sequential Flow:** Position action/delay/aiAgent nodes sequentially from left to right with 350-400px spacing.

2. **Condition Nodes:** 
   - True path branches UPWARD (y - 120) with green color (#10b981)
   - False path branches DOWNWARD (y + 120) with red color (#ef4444)
   - Use sourceHandle: "success" for true, "error" for false

3. **Loop Nodes:** 
   - Loop content positioned to the right with slight downward offset
   - Use purple color (#8b5cf6) for loop edges

4. **Retry Nodes:**
   - Amber/orange color scheme (#f59e0b)
   - Show retry attempts in the explanation

5. **Fallback Nodes:**
   - Primary path goes up-right, fallback path goes down-right
   - Use blue (#3b82f6) for primary, gray (#6b7280) for fallback

6. **Color Palette (Soft, 15% opacity backgrounds):**
   - Action: Blue (#3b82f6) - soft blue background
   - Condition: Green/Red split (#10b981/#ef4444)
   - Loop: Purple (#8b5cf6)
   - Delay: Gray (#6b7280)
   - AI Agent: Gradient purple-blue
   - Retry: Amber (#f59e0b)
   - Fallback: Blue/Gray combination

7. **Node Spacing:** 
   - Horizontal: 350-400px between sequential nodes
   - Vertical: 120-150px for branch separation
   - Ensure no overlapping paths

**Input:** You will receive the \`automation_blueprint\` JSON.
**Output:** The \`nodes\` and \`edges\` JSON in the specified \`react-flow\` format with dotted lines.

Generate intelligent, visually appealing diagrams that clearly show the automation flow with proper branching, colors, spacing, and dotted connection lines.`;

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

    // Prepare the messages for OpenAI
    const messages = [
      {
        role: "system",
        content: DIAGRAM_GENERATOR_SYSTEM_PROMPT
      },
      {
        role: "user", 
        content: `Generate the React Flow nodes and edges with dotted lines for the following automation blueprint:\n\n${JSON.stringify(automation_blueprint, null, 2)}`
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

    console.log('🎨 Generating AI-powered diagram with dotted lines...');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 4000
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

    // Ensure all edges have dotted lines by adding strokeDasharray if missing
    diagramData.edges = diagramData.edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        strokeDasharray: "5,5" // Force dotted lines on all edges
      }
    }));

    console.log(`✅ Generated diagram with ${diagramData.nodes.length} nodes and ${diagramData.edges.length} edges (all with dotted lines)`);

    return new Response(JSON.stringify(diagramData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in diagram-generator:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal Server Error',
        details: error.toString()
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
