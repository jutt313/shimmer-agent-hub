
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced system prompt for agent-aware diagram generation
const ENHANCED_DIAGRAM_SYSTEM_PROMPT = `You are a PERFECT Automation Diagram Generator that creates CRYSTAL CLEAR, LEFT-TO-RIGHT flowing diagrams with INTELLIGENT AI AGENT INTEGRATION.

## CRITICAL SUCCESS REQUIREMENTS:
1. **PERFECT LEFT-TO-RIGHT FLOW**: Every diagram flows like reading a book
2. **STRAIGHT LINE CONNECTIONS**: Use straight edges, not curves
3. **INTELLIGENT AI AGENT DETECTION**: Automatically identify AI opportunities and mark them as isRecommended: true
4. **MEANINGFUL CONDITION BRANCHES**: Extract real condition logic with clear labels
5. **SMART PLATFORM DETECTION**: Detect actual platform names from integration data
6. **CLEAR ROUTE TERMINATION**: Every path ends with explicit END nodes

## AI AGENT NODE REQUIREMENTS:
- ALWAYS set "isRecommended": true for AI agent nodes
- Use type: "aiAgentNode" for AI agents
- Include complete agent data in node.data.agentData
- Add proper add/dismiss functionality

## RESPONSE FORMAT (MUST BE VALID JSON):
{
  "nodes": [
    {
      "id": "ai-agent-node-1",
      "type": "aiAgentNode", 
      "position": { "x": 400, "y": 300 },
      "data": {
        "label": "TypeformAgent: Enhance Data",
        "stepType": "aiAgent",
        "platform": "TypeformAgent",
        "isRecommended": true,
        "agentData": {
          "name": "TypeformAgent",
          "role": "Data Processor",
          "why_needed": "Enhances form data processing",
          "platform": "OpenAI"
        },
        "status": "pending",
        "showActions": true,
        "icon": "Bot"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-to-agent",
      "source": "trigger-node",
      "target": "ai-agent-node-1",
      "type": "straight",
      "animated": false,
      "style": { "stroke": "#8b5cf6", "strokeWidth": 3 }
    }
  ],
  "metadata": {
    "totalSteps": 5,
    "conditionalBranches": 1,
    "aiAgentRecommendations": 1,
    "platforms": ["Typeform", "OpenAI"],
    "generatedAt": "2025-01-01T00:00:00Z",
    "source": "enhanced-agent-aware-diagram-generator"
  }
}

ALWAYS respond with valid JSON only. No markdown, no code blocks, just pure JSON.`;

serve(async (req) => {
  console.log('🚀 Enhanced Agent-Aware Diagram Generator called');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not found');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        source: 'enhanced-agent-aware-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { automation_blueprint, user_feedback } = await req.json();
    
    if (!automation_blueprint || !automation_blueprint.steps) {
      return new Response(JSON.stringify({ 
        error: 'No automation blueprint provided with steps',
        source: 'enhanced-agent-aware-diagram-generator'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📊 Enhanced blueprint analysis for agent integration:', {
      totalSteps: automation_blueprint.steps.length,
      triggerType: automation_blueprint.trigger?.type,
      userFeedback: user_feedback ? 'provided' : 'none'
    });

    let userPrompt = `Create a PERFECT left-to-right automation diagram with STRAIGHT LINES and INTELLIGENT AI AGENT INTEGRATION. 

CRITICAL: For every AI agent or AI-related step, you MUST:
1. Set "isRecommended": true
2. Use type: "aiAgentNode"
3. Include complete agentData object
4. Set "status": "pending" and "showActions": true

Analyze this blueprint and generate a comprehensive flow diagram with proper AI agent visualization:

${JSON.stringify(automation_blueprint, null, 2)}`;
    
    if (user_feedback && user_feedback.trim()) {
      userPrompt += `\n\nUSER FEEDBACK: ${user_feedback.trim()}`;
      console.log('🎯 Including user feedback for agent-aware improvement');
    }

    console.log('🤖 Calling OpenAI API for enhanced agent-aware diagram...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: ENHANCED_DIAGRAM_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API failed: ${response.status} - ${errorText}`,
        source: 'enhanced-agent-aware-diagram-generator'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json();
    let diagramData;
    
    try {
      const content = data.choices[0].message.content;
      diagramData = JSON.parse(content);
      console.log('✅ Enhanced agent-aware diagram parsed successfully');
    } catch (parseError) {
      console.error('❌ Error parsing enhanced diagram JSON:', parseError);
      
      // Fallback with proper AI agent structure
      diagramData = {
        nodes: [
          {
            id: "enhanced-trigger",
            type: "triggerNode",
            position: { x: 100, y: 300 },
            data: {
              label: `${automation_blueprint.trigger?.type || 'Manual'} Trigger`,
              stepType: "trigger",
              platform: automation_blueprint.trigger?.platform || "System",
              icon: "Play"
            }
          },
          {
            id: "ai-agent-fallback",
            type: "aiAgentNode",
            position: { x: 400, y: 300 },
            data: {
              label: "AI Agent: Process Data",
              stepType: "aiAgent",
              platform: "AI Agent",
              isRecommended: true,
              agentData: {
                name: "ProcessorAgent",
                role: "Data Processor",
                why_needed: "Enhances automation with AI processing",
                platform: "OpenAI"
              },
              status: "pending",
              showActions: true,
              icon: "Bot"
            }
          }
        ],
        edges: [
          {
            id: "edge-fallback",
            source: "enhanced-trigger",
            target: "ai-agent-fallback",
            type: "straight",
            style: { stroke: "#8b5cf6", strokeWidth: 3 }
          }
        ],
        metadata: {
          totalSteps: 2,
          aiAgentRecommendations: 1,
          platforms: [automation_blueprint.trigger?.platform || "System", "OpenAI"],
          generatedAt: new Date().toISOString(),
          source: "enhanced-agent-aware-fallback-generator",
          fallback: true
        }
      };
    }

    // Enhance metadata for agent awareness
    if (!diagramData.metadata) {
      diagramData.metadata = {};
    }
    diagramData.metadata.generatedAt = new Date().toISOString();
    diagramData.metadata.source = 'enhanced-agent-aware-diagram-generator';
    diagramData.metadata.agentAware = true;
    diagramData.metadata.enhanced = true;

    const agentNodes = diagramData.nodes?.filter(n => n.data?.isRecommended) || [];
    console.log('🎯 Enhanced agent-aware diagram generated:', {
      nodes: diagramData.nodes?.length || 0,
      edges: diagramData.edges?.length || 0,
      aiAgentNodes: agentNodes.length,
      platforms: diagramData.metadata?.platforms?.length || 0
    });

    return new Response(JSON.stringify(diagramData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Enhanced agent-aware diagram generation error:', error);
    
    return new Response(JSON.stringify({ 
      error: `Enhanced diagram generation failed: ${error.message}`,
      source: 'enhanced-agent-aware-diagram-generator',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
