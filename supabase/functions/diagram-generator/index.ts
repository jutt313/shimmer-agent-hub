
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced system prompt for better diagram generation
const ENHANCED_DIAGRAM_SYSTEM_PROMPT = `You are a PERFECT Automation Diagram Generator that creates CRYSTAL CLEAR, LEFT-TO-RIGHT flowing diagrams.

## CRITICAL SUCCESS REQUIREMENTS:
1. **PERFECT LEFT-TO-RIGHT FLOW**: Every diagram flows like reading a book
2. **STRAIGHT LINE CONNECTIONS**: Use straight edges, not curves
3. **INTELLIGENT AI AGENT DETECTION**: Automatically identify AI opportunities  
4. **MEANINGFUL CONDITION BRANCHES**: Extract real condition logic with clear labels
5. **SMART PLATFORM DETECTION**: Detect actual platform names from integration data
6. **CLEAR ROUTE TERMINATION**: Every path ends with explicit END nodes

## RESPONSE FORMAT (MUST BE VALID JSON):
{
  "nodes": [
    {
      "id": "trigger-node",
      "type": "triggerNode", 
      "position": { "x": 100, "y": 300 },
      "data": {
        "label": "Webhook Trigger",
        "stepType": "trigger",
        "explanation": "This automation starts when a webhook is received",
        "platform": "Webhook",
        "icon": "Play"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "trigger-node",
      "target": "action-1",
      "type": "straight",
      "animated": false,
      "style": { "stroke": "#6366f1", "strokeWidth": 3 }
    }
  ],
  "metadata": {
    "totalSteps": 1,
    "conditionalBranches": 0,
    "aiAgentRecommendations": 0,
    "platforms": ["Webhook"],
    "generatedAt": "2025-01-01T00:00:00Z",
    "source": "enhanced-diagram-generator"
  }
}

ALWAYS respond with valid JSON only. No markdown, no code blocks, just pure JSON.`;

serve(async (req) => {
  console.log('🚀 Diagram generator function called - Enhanced version');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎯 Starting enhanced diagram generation');
    
    // Phase 1: Verify Secret Configuration
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('🔑 API Key Check:', {
      exists: !!openAIApiKey,
      length: openAIApiKey?.length || 0,
      prefix: openAIApiKey?.substring(0, 7) || 'none'
    });
    
    if (!openAIApiKey) {
      console.error('❌ CRITICAL: OpenAI API key not found in environment');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured in Supabase secrets. Please add OPENAI_API_KEY.',
        source: 'enhanced-diagram-generator',
        phase: 'secret-verification'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Phase 2: Request Parsing and Validation
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📝 Request parsed successfully:', {
        hasBlueprint: !!requestBody.automation_blueprint,
        hasFeedback: !!requestBody.user_feedback,
        blueprintSteps: requestBody.automation_blueprint?.steps?.length || 0
      });
    } catch (parseError) {
      console.error('❌ Request parsing failed:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        source: 'enhanced-diagram-generator',
        phase: 'request-parsing'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { automation_blueprint, user_feedback } = requestBody;
    
    if (!automation_blueprint || !automation_blueprint.steps) {
      console.error('❌ No automation blueprint provided');
      return new Response(JSON.stringify({ 
        error: 'No automation blueprint provided with steps',
        source: 'enhanced-diagram-generator',
        phase: 'blueprint-validation'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📊 Blueprint analysis:', {
      totalSteps: automation_blueprint.steps.length,
      triggerType: automation_blueprint.trigger?.type,
      userFeedback: user_feedback ? 'provided' : 'none'
    });

    // Phase 3: Enhanced OpenAI Integration
    let userPrompt = `Create a PERFECT left-to-right automation diagram with STRAIGHT LINES. Analyze this blueprint and generate a comprehensive flow diagram:\n\n${JSON.stringify(automation_blueprint, null, 2)}`;
    
    if (user_feedback && user_feedback.trim()) {
      userPrompt += `\n\nUSER FEEDBACK: ${user_feedback.trim()}`;
      console.log('🎯 Including user feedback for improvement');
    }

    console.log('🤖 Calling OpenAI API with enhanced model...');

    // Enhanced OpenAI API call with retry logic
    let response;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`📡 OpenAI API attempt ${attempt}/${maxAttempts}`);
      
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14', // Using the flagship model
            messages: [
              { role: 'system', content: ENHANCED_DIAGRAM_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 4000
          }),
        });

        console.log(`📡 OpenAI response status (attempt ${attempt}):`, response.status);
        
        if (response.ok) {
          break; // Success, exit retry loop
        } else {
          const errorText = await response.text();
          console.error(`❌ OpenAI API error (attempt ${attempt}):`, response.status, errorText);
          
          if (attempt === maxAttempts) {
            return new Response(JSON.stringify({ 
              error: `OpenAI API failed after ${maxAttempts} attempts: ${response.status} - ${errorText}`,
              source: 'enhanced-diagram-generator',
              phase: 'openai-api-call'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (fetchError) {
        console.error(`❌ OpenAI fetch error (attempt ${attempt}):`, fetchError);
        
        if (attempt === maxAttempts) {
          return new Response(JSON.stringify({ 
            error: `OpenAI fetch failed after ${maxAttempts} attempts: ${fetchError.message}`,
            source: 'enhanced-diagram-generator',
            phase: 'openai-fetch'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    if (!response) {
      return new Response(JSON.stringify({ 
        error: 'Failed to get response from OpenAI after all attempts',
        source: 'enhanced-diagram-generator',
        phase: 'openai-no-response'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Phase 4: Enhanced Response Processing
    let data;
    try {
      data = await response.json();
      console.log('✅ OpenAI response parsed successfully');
    } catch (jsonError) {
      console.error('❌ Failed to parse OpenAI JSON response:', jsonError);
      return new Response(JSON.stringify({ 
        error: 'OpenAI returned invalid JSON response',
        source: 'enhanced-diagram-generator',
        phase: 'response-parsing'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenAI response structure:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid OpenAI response structure - missing choices',
        source: 'enhanced-diagram-generator',
        phase: 'response-validation'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Phase 5: Diagram Data Processing
    let diagramData;
    try {
      const content = data.choices[0].message.content;
      console.log('📋 OpenAI content received, length:', content?.length || 0);
      
      diagramData = JSON.parse(content);
      console.log('✅ Diagram data parsed successfully');
    } catch (parseError) {
      console.error('❌ Error parsing diagram JSON:', parseError);
      console.error('❌ Raw content:', data.choices[0].message.content);
      
      // Fallback: Create a simple diagram structure
      diagramData = {
        nodes: [
          {
            id: "fallback-trigger",
            type: "triggerNode",
            position: { x: 100, y: 300 },
            data: {
              label: `${automation_blueprint.trigger?.type || 'Manual'} Trigger`,
              stepType: "trigger",
              explanation: "Automation starting point",
              platform: automation_blueprint.trigger?.platform || "System",
              icon: "Play"
            }
          }
        ],
        edges: [],
        metadata: {
          totalSteps: 1,
          conditionalBranches: 0,
          aiAgentRecommendations: 0,
          platforms: [automation_blueprint.trigger?.platform || "System"],
          generatedAt: new Date().toISOString(),
          source: "fallback-diagram-generator",
          fallback: true
        }
      };
      
      console.log('🔄 Using fallback diagram structure');
    }

    // Phase 6: Final Validation and Enhancement
    if (!diagramData.nodes || !diagramData.edges) {
      console.error('❌ Missing nodes/edges in diagram data:', diagramData);
      return new Response(JSON.stringify({ 
        error: 'Generated diagram missing required nodes or edges',
        source: 'enhanced-diagram-generator',
        phase: 'final-validation'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Enhance metadata
    if (!diagramData.metadata) {
      diagramData.metadata = {};
    }
    diagramData.metadata.generatedAt = new Date().toISOString();
    diagramData.metadata.source = 'enhanced-diagram-generator';
    diagramData.metadata.straightLines = true;
    diagramData.metadata.enhanced = true;

    console.log('🎯 Enhanced diagram generated successfully:', {
      nodes: diagramData.nodes.length,
      edges: diagramData.edges.length,
      aiRecommendations: diagramData.metadata?.aiAgentRecommendations || 0,
      platforms: diagramData.metadata?.platforms?.length || 0
    });

    return new Response(JSON.stringify(diagramData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Unexpected error in enhanced diagram generation:', error);
    
    return new Response(JSON.stringify({ 
      error: `Unexpected error: ${error.message}`,
      source: 'enhanced-diagram-generator',
      phase: 'unexpected-error',
      timestamp: new Date().toISOString(),
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
