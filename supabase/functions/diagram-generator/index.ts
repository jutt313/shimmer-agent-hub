
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ENHANCED_DIAGRAM_GENERATOR_SYSTEM_PROMPT = `You are an EXPERT automation diagram generator that creates COMPREHENSIVE React Flow diagrams.

=== CRITICAL MISSION ===
Generate a COMPLETE visual diagram showing EVERY component from the automation blueprint - NO EXCEPTIONS!

=== STRICT REQUIREMENTS ===
1. CREATE ONE NODE FOR EACH:
   - Main automation step
   - Platform integration (separate node per platform usage)
   - AI agent call (separate node per agent)
   - Condition/decision point
   - Loop iteration
   - Delay/wait period
   - Retry mechanism
   - Fallback handler
   - Trigger point

2. MANDATORY NODE TYPES:
   - "triggerNode" - automation triggers
   - "platformNode" - platform integrations 
   - "actionNode" - general actions
   - "conditionNode" - decision points
   - "loopNode" - iterations
   - "delayNode" - wait periods
   - "aiAgentNode" - AI agent calls
   - "retryNode" - retry logic
   - "fallbackNode" - error handling

3. LAYOUT RULES:
   - Start: x: 100, y: 300
   - Horizontal spacing: +400 per main step
   - Vertical branching: ±200 for conditions
   - NO overlapping nodes
   - Left-to-right flow

4. NODE STRUCTURE (EXACT FORMAT):
{
  "id": "unique-id",
  "type": "nodeType",
  "position": {"x": number, "y": number},
  "data": {
    "label": "Clear description",
    "platform": "platform-name",
    "icon": "icon-name",
    "explanation": "What this does",
    "stepType": "step-type"
  }
}

5. EDGE CONNECTIONS:
   - Standard: {"stroke": "#94a3b8", "strokeWidth": 2}
   - Condition TRUE: {"stroke": "#10b981", "strokeWidth": 3, "label": "Yes"}
   - Condition FALSE: {"stroke": "#ef4444", "strokeWidth": 3, "label": "No"}

=== VALIDATION CHECKLIST ===
Before returning, ensure:
- Node count >= expected components
- Every platform has a platformNode
- Every agent has an aiAgentNode
- All conditions have proper branching
- No missing connections
- Proper positioning

RETURN ONLY VALID JSON with "nodes" and "edges" arrays.`

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    console.log('🚀 ENHANCED Diagram Generator - Request received');
    
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

        console.log('📋 DIAGNOSTIC: Raw blueprint received');
        console.log('📋 Blueprint exists:', !!automation_blueprint);
        console.log('📋 Blueprint steps exist:', !!automation_blueprint?.steps);
        console.log('📋 Blueprint steps count:', automation_blueprint?.steps?.length || 0);
        
        if (automation_blueprint) {
            console.log('📋 FULL BLUEPRINT ANALYSIS:', JSON.stringify(automation_blueprint, null, 2));
        }

        if (!automation_blueprint || !automation_blueprint.steps) {
            console.error('❌ Missing or invalid automation blueprint');
            return new Response(
                JSON.stringify({ 
                    error: 'Missing or invalid automation blueprint',
                    received: automation_blueprint
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ENHANCED COMPREHENSIVE ANALYSIS
        const analyzeBlueprint = (blueprint) => {
            console.log('🔍 STARTING COMPREHENSIVE ANALYSIS');
            
            let totalSteps = 0;
            const platforms = new Set();
            const agents = new Set();
            let conditions = 0;
            let loops = 0;
            let delays = 0;
            let retries = 0;
            let fallbacks = 0;
            const detailedSteps = [];

            const processSteps = (steps, depth = 0, parentPath = '') => {
                console.log(`🔍 Processing ${steps.length} steps at depth ${depth}`);
                
                steps.forEach((step, index) => {
                    const stepPath = `${parentPath}step-${index}`;
                    totalSteps++;
                    
                    console.log(`📝 Step ${totalSteps}: ${step.name || step.type} (${step.type})`);
                    
                    detailedSteps.push({
                        path: stepPath,
                        name: step.name || `Step ${totalSteps}`,
                        type: step.type,
                        depth: depth
                    });
                    
                    // Platform detection
                    if (step.action?.integration) {
                        platforms.add(step.action.integration);
                        console.log(`🔌 Found platform: ${step.action.integration}`);
                    }
                    
                    // Agent detection
                    if (step.ai_agent_call?.agent_id) {
                        agents.add(step.ai_agent_call.agent_id);
                        console.log(`🤖 Found agent: ${step.ai_agent_call.agent_id}`);
                    }
                    
                    // System component detection
                    switch (step.type) {
                        case 'condition':
                            conditions++;
                            console.log(`🔀 Found condition: ${step.condition?.expression}`);
                            if (step.condition?.if_true) {
                                console.log(`✅ Condition TRUE branch: ${step.condition.if_true.length} steps`);
                                processSteps(step.condition.if_true, depth + 1, `${stepPath}-true-`);
                            }
                            if (step.condition?.if_false) {
                                console.log(`❌ Condition FALSE branch: ${step.condition.if_false.length} steps`);
                                processSteps(step.condition.if_false, depth + 1, `${stepPath}-false-`);
                            }
                            break;
                        case 'loop':
                            loops++;
                            console.log(`🔄 Found loop: ${step.loop?.array_source}`);
                            if (step.loop?.steps) {
                                console.log(`🔄 Loop contains: ${step.loop.steps.length} steps`);
                                processSteps(step.loop.steps, depth + 1, `${stepPath}-loop-`);
                            }
                            break;
                        case 'delay':
                            delays++;
                            console.log(`⏱️ Found delay: ${step.delay?.duration_seconds}s`);
                            break;
                        case 'retry':
                            retries++;
                            console.log(`🔁 Found retry: ${step.retry?.max_attempts} attempts`);
                            if (step.retry?.steps) {
                                processSteps(step.retry.steps, depth + 1, `${stepPath}-retry-`);
                            }
                            break;
                        case 'fallback':
                            fallbacks++;
                            console.log(`🛡️ Found fallback`);
                            if (step.fallback?.primary_steps) {
                                processSteps(step.fallback.primary_steps, depth + 1, `${stepPath}-primary-`);
                            }
                            if (step.fallback?.fallback_steps) {
                                processSteps(step.fallback.fallback_steps, depth + 1, `${stepPath}-fallback-`);
                            }
                            break;
                    }
                });
            };

            processSteps(blueprint.steps);
            
            const analysis = {
                totalSteps,
                platforms: Array.from(platforms),
                agents: Array.from(agents),
                conditions,
                loops,
                delays,
                retries,
                fallbacks,
                expectedMinNodes: totalSteps + platforms.size + agents.size + 1, // +1 for trigger
                detailedSteps
            };
            
            console.log('📊 FINAL COMPREHENSIVE ANALYSIS:');
            console.log(`📈 Total Steps Found: ${analysis.totalSteps}`);
            console.log(`🔌 Platforms Found: ${analysis.platforms.join(', ')} (${analysis.platforms.length})`);
            console.log(`🤖 Agents Found: ${analysis.agents.join(', ')} (${analysis.agents.length})`);
            console.log(`🔀 Conditions: ${analysis.conditions}`);
            console.log(`🔄 Loops: ${analysis.loops}`);
            console.log(`⏱️ Delays: ${analysis.delays}`);
            console.log(`🔁 Retries: ${analysis.retries}`);
            console.log(`🛡️ Fallbacks: ${analysis.fallbacks}`);
            console.log(`🎯 Expected Minimum Nodes: ${analysis.expectedMinNodes}`);
            
            return analysis;
        };

        const analysis = analyzeBlueprint(automation_blueprint);

        // Check OpenAI API key
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            console.error('❌ OpenAI API key not found');
            return new Response(
                JSON.stringify({ error: 'OpenAI API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ENHANCED USER PROMPT with detailed requirements
        const userPrompt = `CREATE A COMPREHENSIVE AUTOMATION DIAGRAM

BLUEPRINT ANALYSIS:
- Total Steps: ${analysis.totalSteps}
- Platforms: ${analysis.platforms.join(', ')} (${analysis.platforms.length} unique)
- AI Agents: ${analysis.agents.join(', ')} (${analysis.agents.length} unique)
- Conditions: ${analysis.conditions}
- Loops: ${analysis.loops}
- Delays: ${analysis.delays}
- Retries: ${analysis.retries}
- Fallbacks: ${analysis.fallbacks}

MINIMUM NODES REQUIRED: ${analysis.expectedMinNodes}

DETAILED STEP BREAKDOWN:
${analysis.detailedSteps.map(step => `- ${step.name} (${step.type}) at depth ${step.depth}`).join('\n')}

FULL BLUEPRINT:
${JSON.stringify(automation_blueprint, null, 2)}

MANDATORY REQUIREMENTS:
1. Create ${analysis.expectedMinNodes}+ nodes minimum
2. One platformNode for each platform: ${analysis.platforms.join(', ')}
3. One aiAgentNode for each agent: ${analysis.agents.join(', ')}
4. Show all ${analysis.conditions} conditions with branching
5. Show all ${analysis.loops} loops with internal steps
6. Show all ${analysis.delays} delays
7. Show all ${analysis.retries} retries
8. Show all ${analysis.fallbacks} fallbacks
9. Connect everything with proper edges
10. Use left-to-right layout with vertical branching

EXAMPLE NODES:
- Trigger: {"id": "trigger", "type": "triggerNode", "position": {"x": 100, "y": 300}, "data": {"label": "Start", "stepType": "trigger"}}
- Platform: {"id": "platform-sheets", "type": "platformNode", "position": {"x": 500, "y": 300}, "data": {"label": "Google Sheets", "platform": "Google Sheets", "stepType": "platform"}}

Return ONLY valid JSON with nodes and edges arrays showing EVERY component!`;

        console.log('🤖 Calling OpenAI with ENHANCED prompt');
        console.log(`📏 Prompt length: ${userPrompt.length} characters`);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',  // Using more powerful model
                messages: [
                    { role: "system", content: ENHANCED_DIAGRAM_GENERATOR_SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
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
        console.log(`📏 Response length: ${result.choices[0].message.content.length} characters`);

        if (!result.choices || result.choices.length === 0) {
            console.error('❌ No response from OpenAI');
            return new Response(
                JSON.stringify({ error: 'No response from OpenAI' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const diagramDataString = result.choices[0].message.content;
        console.log('📄 Raw AI response preview:', diagramDataString.substring(0, 500) + '...');

        let diagramData;
        try {
            diagramData = JSON.parse(diagramDataString);
            console.log('✅ JSON parsing successful');
        } catch (parseError) {
            console.error('❌ JSON parsing error:', parseError);
            console.error('❌ Raw content:', diagramDataString);
            return new Response(
                JSON.stringify({ 
                    error: 'Failed to parse AI response as JSON',
                    raw_content: diagramDataString.substring(0, 1000)
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // COMPREHENSIVE VALIDATION
        if (!diagramData || !diagramData.nodes || !diagramData.edges) {
            console.error('❌ Invalid diagram structure:', diagramData);
            return new Response(
                JSON.stringify({ 
                    error: 'Invalid diagram structure from AI',
                    received: diagramData
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const nodeCount = diagramData.nodes.length;
        const edgeCount = diagramData.edges.length;

        console.log('🎯 DIAGRAM GENERATION RESULTS:');
        console.log(`📊 Generated nodes: ${nodeCount} (expected: ${analysis.expectedMinNodes})`);
        console.log(`🔗 Generated edges: ${edgeCount}`);
        console.log('📋 Node types:', [...new Set(diagramData.nodes.map(n => n.type))]);

        // VALIDATION CHECK
        if (nodeCount < analysis.expectedMinNodes * 0.8) {
            const warningMessage = `Insufficient nodes: Generated ${nodeCount} but expected ${analysis.expectedMinNodes}`;
            console.warn(`⚠️ ${warningMessage}`);
            diagramData.warning = warningMessage;
        }

        // Check for platform coverage
        const generatedPlatformNodes = diagramData.nodes.filter(n => n.type === 'platformNode');
        console.log(`🔌 Generated platform nodes: ${generatedPlatformNodes.length} (expected: ${analysis.platforms.length})`);
        
        if (generatedPlatformNodes.length < analysis.platforms.length) {
            console.warn(`⚠️ Missing platform nodes: Expected ${analysis.platforms.length}, got ${generatedPlatformNodes.length}`);
        }

        // Enhance edges with proper styling
        diagramData.edges = diagramData.edges.map(edge => ({
            ...edge,
            type: edge.type || 'smoothstep',
            animated: edge.animated !== undefined ? edge.animated : true,
            style: {
                stroke: edge.style?.stroke || '#94a3b8',
                strokeWidth: edge.style?.strokeWidth || 2,
                ...edge.style
            }
        }));

        console.log('✅ ENHANCED diagram generation completed successfully!');

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 CRITICAL ERROR in diagram generator:', error);
        console.error('💥 Error stack:', error.stack);
        
        return new Response(
            JSON.stringify({
                error: error.message || 'Enhanced diagram generation failed',
                details: error.toString(),
                stack: error.stack?.substring(0, 500)
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
