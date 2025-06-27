
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an expert automation diagram generator for the YusrAI platform. Your task is to convert a raw Automation Blueprint JSON into a clear, understandable visual diagram with React Flow nodes and edges.

**CRITICAL REQUIREMENTS:**
1. **Left-to-Right Flow**: Always arrange nodes from left to right in sequential order
2. **Platform-Specific Nodes**: Create separate nodes for each platform integration (Gmail, Slack, Google Sheets, etc.)
3. **Clear Node Types**: Use distinct nodes for actions, conditions, loops, delays, AI agents, retry, and fallback
4. **Minimal Node Content**: Only icon + platform name in nodes, detailed info in data for hover
5. **Smooth Connections**: Use gentle curves, avoid sharp up/down paths
6. **Dotted Lines**: ALL edges MUST have strokeDasharray: "5,5"
7. **Agent Integration**: Show AI agents as separate nodes with recommendation flags

**Node Structure Requirements:**
Each Node object MUST have:
- id (string): Unique identifier
- type (string): "platformNode", "conditionNode", "loopNode", "delayNode", "aiAgentNode", "retryNode", "fallbackNode"
- position (object): { x: number, y: number } - Left-to-right positioning, x increments by 350-400
- data (object):
    - label (string): Platform name or action type (e.g., "Gmail", "Google Sheets", "Check Condition")
    - icon (string): Platform identifier for icon lookup
    - platform (string): Platform name (Gmail, Slack, etc.)
    - explanation (string): Detailed description for hover
    - action/condition/loop/delay/agent/retry/fallback (object): Original data from blueprint
    - isRecommended (boolean): For AI agents that are recommended
- sourcePosition: "right"
- targetPosition: "left"

**Platform Node Creation:**
For each action step, create a "platformNode" with:
- Specific platform identification (Gmail, Slack, Google Sheets, etc.)
- Platform-specific icon reference
- Clear action description
- Original action data preserved

**Edge Requirements:**
ALL edges MUST have:
- strokeDasharray: "5,5" (dotted lines)
- Appropriate colors:
  - Sequential: { stroke: "#94a3b8", strokeWidth: 2, strokeDasharray: "5,5" }
  - Success/True: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "5,5" }
  - Error/False: { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "5,5" }
  - Loop: { stroke: "#8b5cf6", strokeWidth: 2, strokeDasharray: "5,5" }

**Layout Rules:**
1. Start at x: 100, increment by 350-400 for each sequential step
2. Keep y consistent for main flow (y: 300)
3. Branch conditions: True path y-120, False path y+120
4. Smooth curves only, no sharp angles
5. Show complete automation flow from trigger to end

**Output Format:**
Return JSON with "nodes" and "edges" arrays. Ensure every step in the automation blueprint is represented with appropriate node types and clear platform identification.

Generate clean, professional diagrams that a non-technical user can easily understand the automation flow.`;

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
        content: `Generate a clear, left-to-right React Flow diagram with platform-specific nodes and dotted lines for this automation blueprint:\n\n${JSON.stringify(automation_blueprint, null, 2)}`
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

    console.log('🎨 Generating user-friendly diagram with platform nodes and dotted lines...');

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
        temperature: 0.2,
        max_tokens: 6000
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

    // Ensure all edges have dotted lines and proper styling
    diagramData.edges = diagramData.edges.map(edge => ({
      ...edge,
      type: 'smoothstep',
      style: {
        ...edge.style,
        strokeDasharray: "5,5" // Force dotted lines on all edges
      }
    }));

    console.log(`✅ Generated user-friendly diagram with ${diagramData.nodes.length} nodes and ${diagramData.edges.length} edges (all with dotted lines)`);

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
