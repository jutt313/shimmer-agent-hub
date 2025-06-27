
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an expert automation diagram generator for the YusrAI platform. Your task is to convert a raw Automation Blueprint JSON into a comprehensive visual diagram with React Flow nodes and edges that shows EVERY SINGLE STEP.

**CRITICAL REQUIREMENTS:**
1. **Show ALL Steps**: Every step in the automation_blueprint.steps array MUST be represented as a node - no exceptions
2. **Left-to-Right Main Flow**: Primary sequence flows from left to right (x increments by 400-500px)
3. **Vertical Branching**: For conditions, true path goes up (y-150), false path goes down (y+150)
4. **Platform-Specific Nodes**: Each action gets its own platformNode with clear platform identification
5. **Separate Node Types**: condition, loop, delay, ai_agent_call, retry, fallback each get their specific node types
6. **Dotted Lines**: ALL edges MUST have strokeDasharray: "5,5"
7. **Complete Coverage**: Handle nested steps within conditions, loops, retries, and fallbacks

**Node Creation Rules:**
For EVERY step in the blueprint:
- **Action steps**: Use "platformNode" type with platform name (Gmail, Slack, etc.)
- **Condition steps**: Use "conditionNode" type, create branches for if_true and if_false
- **Loop steps**: Use "loopNode" type, then process all nested steps
- **AI Agent steps**: Use "aiAgentNode" type with agent identification
- **Delay steps**: Use "delayNode" type with duration info
- **Retry steps**: Use "retryNode" type, then process nested steps
- **Fallback steps**: Use "fallbackNode" type with primary/fallback branches

**Node Structure (REQUIRED for every node):**
{
  "id": "unique-id",
  "type": "platformNode|conditionNode|loopNode|delayNode|aiAgentNode|retryNode|fallbackNode",
  "position": { "x": number, "y": number },
  "data": {
    "label": "Platform Name or Action Type",
    "platform": "platform-name",
    "icon": "platform-identifier",
    "explanation": "detailed-description",
    "action|condition|loop|delay|agent|retry|fallback": original_step_data
  },
  "sourcePosition": "right",
  "targetPosition": "left"
}

**Layout Algorithm:**
1. **Main Flow**: Start at x:100, y:300, increment x by 450 for each sequential step
2. **Condition Branches**: 
   - True branch: y = main_y - 150
   - False branch: y = main_y + 150
   - Rejoin at x + 450 from condition node
3. **Loop Processing**: Process all nested steps with x-offset, then continue main flow
4. **Retry Processing**: Show retry wrapper, then process nested steps
5. **Fallback Processing**: Show primary and fallback branches

**Edge Requirements (MANDATORY):**
ALL edges must have:
- "type": "smoothstep"
- "animated": true
- "style": { "stroke": "#94a3b8", "strokeWidth": 2, "strokeDasharray": "5,5" }

**Processing Nested Steps:**
- Always recurse into condition.if_true and condition.if_false arrays
- Always recurse into loop.steps arrays  
- Always recurse into retry.steps arrays
- Always recurse into fallback.primary_steps and fallback.fallback_steps arrays
- Assign unique IDs to ALL nested steps
- Connect nested steps with appropriate edges

**Output Requirements:**
Return JSON with "nodes" and "edges" arrays. EVERY step from the blueprint MUST appear as a node. Complex automations with 10+ steps should show ALL steps with proper spacing and connections.

Generate a complete diagram where a non-technical user can follow the automation from start to finish, seeing every platform, condition, loop, and agent involved.`;

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

    // Count total steps including nested ones for validation
    const countAllSteps = (steps) => {
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

    // Prepare the messages for OpenAI with detailed blueprint
    const messages = [
      {
        role: "system",
        content: DIAGRAM_GENERATOR_SYSTEM_PROMPT
      },
      {
        role: "user", 
        content: `Generate a COMPLETE left-to-right React Flow diagram showing ALL ${totalSteps} steps for this automation blueprint. Make sure EVERY step is represented as a node with proper platform identification and dotted line connections:\n\n${JSON.stringify(automation_blueprint, null, 2)}`
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

    // Call OpenAI API with increased token limit and flagship model
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14', // Use flagship model
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.1, // Lower temperature for consistency
        max_tokens: 12000 // Increased token limit for complex diagrams
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

    // Ensure all edges have proper styling with dotted lines
    diagramData.edges = diagramData.edges.map(edge => ({
      ...edge,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#94a3b8',
        strokeWidth: 2,
        strokeDasharray: "5,5"
      }
    }));

    // Validate that we got a reasonable number of nodes
    const nodeCount = diagramData.nodes.length;
    const edgeCount = diagramData.edges.length;
    
    console.log(`✅ Generated comprehensive diagram: ${nodeCount} nodes, ${edgeCount} edges (expected ~${totalSteps} steps)`);
    
    if (nodeCount < totalSteps * 0.7) {
      console.warn(`⚠️ Generated fewer nodes (${nodeCount}) than expected (${totalSteps}). Some steps may be missing.`);
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
        details: error.toString()
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
