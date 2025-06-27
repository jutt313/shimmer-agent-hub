
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ENHANCED_DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an EXPERT visual automation flow designer that creates comprehensive React Flow diagrams similar to Make.com and Zapier.

=== YOUR MISSION ===
Create a VISUAL AUTOMATION FLOW that shows exactly how the automation works from start to finish, step by step.

=== CORE PRINCIPLES ===
1. Think like Make.com or Zapier - show the ACTUAL FLOW of data and actions
2. Every platform integration gets its own node
3. Every AI agent gets its own node  
4. Every condition creates branching paths (Yes/No)
5. Every loop shows iteration clearly
6. Show the REAL WORKFLOW - how data flows from one step to the next

=== REQUIRED NODE TYPES ===
- "triggerNode" - How the automation starts
- "platformNode" - Platform integrations (Google Sheets, Slack, etc.)
- "actionNode" - General actions and processing
- "conditionNode" - Decision points with Yes/No branches
- "loopNode" - Iterations and repeating actions
- "delayNode" - Wait periods
- "aiAgentNode" - AI agent calls
- "retryNode" - Retry mechanisms
- "fallbackNode" - Error handling

=== LAYOUT RULES ===
- Start at x: 100, y: 300
- Flow LEFT TO RIGHT
- Horizontal spacing: +350 between main steps
- Vertical branching: ±150 for conditions
- Keep nodes organized and readable
- NO overlapping nodes

=== NODE STRUCTURE (EXACT FORMAT) ===
{
  "id": "unique-descriptive-id",
  "type": "nodeType",
  "position": {"x": number, "y": number},
  "data": {
    "label": "Clear, descriptive label",
    "platform": "platform-name",
    "icon": "icon-name",
    "explanation": "What this step does",
    "stepType": "step-type"
  }
}

=== EDGE CONNECTIONS ===
- Standard flow: {"stroke": "#3b82f6", "strokeWidth": 2, "animated": true}
- Condition YES: {"stroke": "#10b981", "strokeWidth": 3, "label": "Yes", "animated": true}
- Condition NO: {"stroke": "#ef4444", "strokeWidth": 3, "label": "No", "animated": true}
- Loop flow: {"stroke": "#8b5cf6", "strokeWidth": 2, "animated": true}

=== EXAMPLES ===
Trigger Node:
{
  "id": "trigger-start",
  "type": "triggerNode",
  "position": {"x": 100, "y": 300},
  "data": {
    "label": "New Email Received",
    "platform": "Email",
    "icon": "mail",
    "explanation": "Automation starts when new email arrives",
    "stepType": "trigger"
  }
}

Platform Node:
{
  "id": "platform-sheets",
  "type": "platformNode", 
  "position": {"x": 450, "y": 300},
  "data": {
    "label": "Update Google Sheets",
    "platform": "Google Sheets",
    "icon": "sheet",
    "explanation": "Add new row with email data",
    "stepType": "platform"
  }
}

Condition Node (creates branching):
{
  "id": "condition-priority",
  "type": "conditionNode",
  "position": {"x": 800, "y": 300},
  "data": {
    "label": "Is High Priority?",
    "explanation": "Check if email is marked urgent",
    "stepType": "condition"
  }
}

=== CONDITION BRANCHING ===
When you create a condition node, you MUST create separate paths:
- YES path: continues at same Y level or Y-150
- NO path: continues at Y+150
- Connect with appropriate edge labels

=== AI AGENT INTEGRATION ===
Every AI agent call gets its own aiAgentNode:
{
  "id": "agent-analyzer",
  "type": "aiAgentNode",
  "position": {"x": 1150, "y": 200},
  "data": {
    "label": "AI Content Analyzer",
    "agent": {"agent_id": "content-analyzer"},
    "explanation": "AI processes and categorizes the content",
    "stepType": "ai_agent_call"
  }
}

=== VALIDATION REQUIREMENTS ===
Before returning, ensure:
✓ Every platform mentioned has a platformNode
✓ Every AI agent has an aiAgentNode
✓ All conditions have proper YES/NO branching
✓ Flow goes LEFT TO RIGHT logically
✓ All nodes are properly connected
✓ No missing or broken connections

=== OUTPUT FORMAT ===
Return ONLY valid JSON with "nodes" and "edges" arrays.
Make the flow VISUAL and LOGICAL - like a real automation builder tool.

REMEMBER: You're creating a VISUAL REPRESENTATION of how the automation actually works, not just a list of components!`

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

AUTOMATION OVERVIEW:
- Title: ${automation_blueprint.description || 'Automation Flow'}
- Total Steps: ${analysis.totalSteps}
- Platforms: ${analysis.platforms.join(', ')} (${analysis.platforms.length} total)
- AI Agents: ${analysis.agents.join(', ')} (${analysis.agents.length} total)
- Step Types: ${analysis.stepTypes.join(', ')}
- Trigger: ${analysis.trigger?.type || 'manual'}

VISUAL FLOW REQUIREMENTS:
1. Start with a trigger node showing how this automation begins
2. Create a platformNode for each platform: ${analysis.platforms.join(', ')}
3. Create an aiAgentNode for each agent: ${analysis.agents.join(', ')}
4. Show the ACTUAL FLOW - how data moves from step to step
5. For conditions: create YES/NO branching paths
6. For loops: show the iteration clearly
7. Make it look like Make.com or Zapier - visual and logical

AUTOMATION BLUEPRINT:
${JSON.stringify(automation_blueprint, null, 2)}

INSTRUCTIONS:
- Think of this as a VISUAL WORKFLOW BUILDER
- Every step should be connected logically
- Show the user exactly how their automation will execute
- Make branching paths clear for conditions
- Position nodes so they don't overlap
- Use descriptive labels that explain what each step does

Create a comprehensive visual flow that shows exactly how this automation works from start to finish!`;

        console.log('🤖 Generating visual flow with enhanced prompt');

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
                temperature: 0.2,
                max_tokens: 16000
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

        // Enhance edges with proper styling and interactivity
        diagramData.edges = diagramData.edges.map(edge => ({
            ...edge,
            type: 'smoothstep',
            animated: true,
            style: {
                stroke: edge.style?.stroke || '#3b82f6',
                strokeWidth: edge.style?.strokeWidth || 2,
                ...edge.style
            }
        }));

        // Enhance nodes for better interactivity
        diagramData.nodes = diagramData.nodes.map(node => ({
            ...node,
            draggable: true,
            selectable: true,
            connectable: false
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
