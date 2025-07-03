
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ENHANCED_DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an EXPERT visual automation flow designer that creates comprehensive, professional, and highly interactive React Flow diagrams.

=== YOUR CORE MISSION ===
Generate a COMPLETE, perfectly aligned, and highly interactive visual diagram that shows the EXACT flow of the automation from start to finish. Focus on MAXIMUM INTERACTIVITY, CLEAR VISUAL HIERARCHY, and PROFESSIONAL AESTHETICS.

=== CRITICAL REQUIREMENTS ===
1. NO FAKE TRIGGER NODES: Start with the ACTUAL platform/service that triggers the automation (e.g., Google Sheets, not "Trigger")
2. ONE STEP = ONE NODE: Each logical step should be exactly one visual node
3. DYNAMIC CONDITIONS: Support multiple condition branches (not just yes/no) - extract actual conditions from blueprint
4. AGENT INTEGRATION: Show AI agents in the main flow where they belong
5. PLATFORM CONSOLIDATION: Don't create separate platform nodes - integrate platform info into action nodes
6. EXPANDABLE NODES: Provide detailed info in node data for hover expansion

=== NODE TYPE SPECIFICATIONS ===

platformTriggerNode (STARTING NODE):
- Color: Blue theme (#3b82f6)
- Label: Platform name (e.g., "Google Sheets", "Slack", "Webhook")
- Always first node at (50, 100)
- Explanation: Detailed trigger description and platform specifics
- Must have RIGHT output handle only
- Icon: Platform-specific icon name

actionNode:
- Color: Neutral theme (#6b7280)
- Label: Action description (e.g., "Create Task", "Send Message")
- Explanation: Detailed action description including platform integration
- Platform: Platform name if applicable
- Icon: Action-specific icon

conditionNode:
- Color: Orange theme (#f97316)  
- Label: Condition summary
- Explanation: All condition logic details
- Dynamic outputs: Create one output handle for EACH possible condition outcome
- Handle multiple conditions dynamically (not just yes/no)
- Each condition path should have unique sourceHandle and label

aiAgentNode:
- Color: Emerald Green (#10b981)
- Label: Agent name or role
- Explanation: Agent details, model, purpose
- Agent: Agent configuration object
- Icon: "AgentIcon" or agent-specific icon
- Place in main flow where agent is used

loopNode:
- Color: Purple theme (#8b5cf6)
- Label: Loop description
- Explanation: Loop conditions and scope

delayNode:
- Color: Slate Gray (#64748b)  
- Label: Delay duration
- Explanation: Delay details

retryNode:
- Color: Amber (#f59e0b)
- Label: Retry logic
- Explanation: Retry configuration

fallbackNode:
- Color: Indigo (#6366f1)
- Label: Fallback strategy
- Explanation: Fallback details

=== LAYOUT REQUIREMENTS ===
1. Start with actual platform trigger at (50, 100)
2. Left-to-right main flow with 300px horizontal spacing
3. For multiple conditions: branch vertically (some up, some down) to fit all branches in view
4. Ensure entire automation fits in one frame when zoomed out
5. All nodes draggable: true, selectable: true, connectable: false
6. All edges animated: true, type: 'smoothstep'

=== DATA STRUCTURE ===
Each node MUST include:
- id: Unique identifier for runtime tracking
- label: Concise display name
- explanation: Detailed description for hover expansion
- icon: Appropriate icon name (no emojis)
- platform: Platform name if applicable  
- agent: Agent config if applicable
- All interactive properties set correctly

RETURN: Complete JSON with "nodes" and "edges" arrays optimized for the requirements above.`

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    console.log('🚀 Enhanced Dynamic Diagram Generator - Request received');
    
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
                    error: 'Missing automation blueprint - cannot create dynamic diagram'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Enhanced dynamic analysis
        const analyzeBlueprintDynamically = (blueprint) => {
            let totalSteps = 0;
            const platforms = new Set();
            const agents = new Set();
            const conditions = [];
            let actualTrigger = null;
            
            // Extract trigger information
            if (blueprint.trigger) {
                actualTrigger = {
                    type: blueprint.trigger.type,
                    platform: blueprint.trigger.platform,
                    event: blueprint.trigger.event,
                    description: blueprint.trigger.description
                };
            }
            
            const processSteps = (steps) => {
                steps.forEach((step) => {
                    totalSteps++;
                    
                    // Extract platform info
                    if (step.action?.integration) {
                        platforms.add({
                            name: step.action.integration,
                            method: step.action.method,
                            description: step.action.description
                        });
                    }
                    
                    // Extract agent info
                    if (step.ai_agent_call?.agent_id) {
                        agents.add({
                            id: step.ai_agent_call.agent_id,
                            name: step.ai_agent_call.agent_name || step.ai_agent_call.agent_id,
                            role: step.ai_agent_call.role,
                            model: step.ai_agent_call.model,
                            instructions: step.ai_agent_call.instructions
                        });
                    }
                    
                    // Extract dynamic conditions
                    if (step.type === 'condition' && step.condition) {
                        const conditionData = {
                            expression: step.condition.expression,
                            branches: [],
                            step_id: step.id
                        };
                        
                        // Extract all possible outcomes dynamically
                        if (step.condition.if_true) conditionData.branches.push({ label: 'True', steps: step.condition.if_true });
                        if (step.condition.if_false) conditionData.branches.push({ label: 'False', steps: step.condition.if_false });
                        
                        // Look for additional branches
                        Object.keys(step.condition).forEach(key => {
                            if (key.startsWith('if_') && key !== 'if_true' && key !== 'if_false') {
                                const label = key.replace('if_', '').replace('_', ' ');
                                conditionData.branches.push({ 
                                    label: label.charAt(0).toUpperCase() + label.slice(1), 
                                    steps: step.condition[key] 
                                });
                            }
                        });
                        
                        conditions.push(conditionData);
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
                conditions,
                actualTrigger,
                complexity: conditions.length > 2 ? 'high' : totalSteps > 5 ? 'medium' : 'simple'
            };
        };

        const analysis = analyzeBlueprintDynamically(automation_blueprint);
        console.log('📊 Dynamic flow analysis:', analysis);

        // Check OpenAI API key
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            console.error('❌ OpenAI API key not found');
            return new Response(
                JSON.stringify({ error: 'OpenAI API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Enhanced dynamic user prompt
        const userPrompt = `CREATE A DYNAMIC AUTOMATION FLOW DIAGRAM

AUTOMATION TITLE: ${automation_blueprint.description || 'Dynamic Automation Flow'}
COMPLEXITY LEVEL: ${analysis.complexity.toUpperCase()}
TOTAL STEPS: ${analysis.totalSteps}
DYNAMIC CONDITIONS: ${analysis.conditions.length}
PLATFORMS: ${analysis.platforms.map(p => p.name).join(', ')}
AI AGENTS: ${analysis.agents.map(a => a.name).join(', ')}
ACTUAL TRIGGER: ${analysis.actualTrigger ? analysis.actualTrigger.platform || analysis.actualTrigger.type : 'Manual'}

AUTOMATION BLUEPRINT:
${JSON.stringify(automation_blueprint, null, 2)}

DYNAMIC ANALYSIS RESULTS:
- Trigger Details: ${JSON.stringify(analysis.actualTrigger, null, 2)}
- Platform Integrations: ${JSON.stringify(analysis.platforms, null, 2)}
- AI Agents: ${JSON.stringify(analysis.agents, null, 2)}
- Dynamic Conditions: ${JSON.stringify(analysis.conditions, null, 2)}

---
CRITICAL DYNAMIC REQUIREMENTS:

1. REAL PLATFORM TRIGGER (NO FAKE TRIGGERS):
   - Start with actual platform: ${analysis.actualTrigger?.platform || analysis.actualTrigger?.type || 'the actual trigger'}
   - Use platformTriggerNode type for first node
   - Position at (50, 100)

2. DYNAMIC CONDITIONS (NOT HARDCODED YES/NO):
   - For each condition in analysis.conditions, create multiple dynamic output handles
   - Each branch should have unique sourceHandle (e.g., "outcome_high", "outcome_medium", "outcome_low")
   - Support unlimited condition branches based on actual logic

3. AI AGENTS IN MAIN FLOW:
   - Place aiAgentNode in main flow where agents are used
   - Use agent details from analysis.agents
   - Connect with main flow, not separate

4. ONE STEP = ONE NODE:
   - Each blueprint step = exactly one visual node
   - Integrate platform details into action nodes
   - No redundant platform nodes

5. EXPANDABLE NODE DATA:
   - Rich explanation fields for hover expansion
   - Platform details in action nodes
   - Agent configuration in agent nodes

6. DYNAMIC LAYOUT:
   - Fit entire automation in one frame
   - Branch conditions vertically (up/down) for space
   - 300px horizontal spacing
   - Animated smoothstep edges

Create a JSON response with dynamic nodes and edges that perfectly match the blueprint analysis.`;

        console.log('🤖 Generating dynamic diagram with real-time analysis');

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
                temperature: 0.1,
                max_tokens: 4500
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
        console.log('✅ OpenAI response received for dynamic diagram');

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

        // Enhanced post-processing for dynamic behavior
        diagramData.nodes = diagramData.nodes.map(node => ({
            ...node,
            draggable: true,
            selectable: true,
            connectable: false,
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
            sourceHandle: edge.sourceHandle || 'right',
            targetHandle: edge.targetHandle || 'left'
        }));

        console.log('✅ Generated dynamic diagram:', {
            nodes: diagramData.nodes.length,
            edges: diagramData.edges.length,
            nodeTypes: [...new Set(diagramData.nodes.map(n => n.type))],
            dynamicConditions: analysis.conditions.length,
            actualTrigger: analysis.actualTrigger?.platform || 'Manual',
            agentsIntegrated: analysis.agents.length
        });

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 Error in dynamic diagram generator:', error);
        
        return new Response(
            JSON.stringify({
                error: error.message || 'Dynamic diagram generation failed',
                details: error.toString()
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
