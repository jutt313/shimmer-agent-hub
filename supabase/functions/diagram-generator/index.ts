
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlueprintStep {
  id: string;
  name: string;
  type: string;
  description?: string;
  action?: any;
  ai_agent_call?: any;
}

interface ExecutionBlueprint {
  version: string;
  description: string;
  trigger: { type: string };
  steps: BlueprintStep[];
  variables: Record<string, any>;
}

interface DiagramRequest {
  automation_id: string;
  blueprint: {
    automation_id: string;
    title: string;
    description: string;
    yusrai_powered: boolean;
    seven_sections_validated: boolean;
    summary: string;
    steps: string[];
    platforms: any[];
    agents: any[];
    clarification_questions: string[];
    test_payloads: Record<string, any>;
    execution_blueprint: ExecutionBlueprint;
    workflow?: {
      nodes: any[];
      edges: any[];
    };
  };
  user_id: string;
}

const generateDiagramFromBlueprint = (blueprint: DiagramRequest['blueprint']): string => {
  console.log('📊 Generating diagram from YusrAI blueprint...');
  
  try {
    // Validate blueprint structure
    if (!blueprint.execution_blueprint) {
      console.log('⚠️ No execution blueprint found, creating from steps...');
      blueprint.execution_blueprint = {
        version: '1.0.0',
        description: blueprint.summary || blueprint.description || 'YusrAI Automation',
        trigger: { type: 'manual' },
        steps: blueprint.steps?.map((step: string, index: number) => ({
          id: `step_${index + 1}`,
          name: step,
          type: 'action',
          description: step
        })) || [],
        variables: {}
      };
    }

    const steps = blueprint.execution_blueprint.steps || [];
    const platforms = blueprint.platforms || [];
    const agents = blueprint.agents || [];

    // Create Mermaid diagram
    let mermaidDiagram = `flowchart TD\n`;
    mermaidDiagram += `    START([🚀 Start YusrAI Automation])\n`;
    mermaidDiagram += `    START --> INIT\n`;
    mermaidDiagram += `    INIT[⚙️ Initialize YusrAI System]\n`;

    // Add platform setup nodes
    if (platforms.length > 0) {
      mermaidDiagram += `    INIT --> PLATFORMS\n`;
      mermaidDiagram += `    PLATFORMS{🔧 Platform Setup}\n`;
      
      platforms.forEach((platform: any, index: number) => {
        const platformId = `PLATFORM_${index + 1}`;
        mermaidDiagram += `    PLATFORMS --> ${platformId}\n`;
        mermaidDiagram += `    ${platformId}[🔌 ${platform.name}]\n`;
        mermaidDiagram += `    ${platformId} --> STEP_1\n`;
      });
    } else {
      mermaidDiagram += `    INIT --> STEP_1\n`;
    }

    // Add execution steps
    steps.forEach((step: BlueprintStep, index: number) => {
      const stepId = `STEP_${index + 1}`;
      const nextStepId = `STEP_${index + 2}`;
      
      // Determine step icon based on type
      let stepIcon = '📋';
      if (step.type === 'ai_agent_call') stepIcon = '🤖';
      else if (step.type === 'action') stepIcon = '⚡';
      else if (step.type === 'condition') stepIcon = '🔀';
      else if (step.type === 'data_processing') stepIcon = '💾';

      mermaidDiagram += `    ${stepId}[${stepIcon} ${step.name}]\n`;
      
      if (index < steps.length - 1) {
        mermaidDiagram += `    ${stepId} --> ${nextStepId}\n`;
      } else {
        mermaidDiagram += `    ${stepId} --> END\n`;
      }
    });

    // Add AI agents as separate nodes
    if (agents.length > 0) {
      mermaidDiagram += `    subgraph AGENTS [🤖 AI Agents]\n`;
      agents.forEach((agent: any, index: number) => {
        const agentId = `AGENT_${index + 1}`;
        mermaidDiagram += `        ${agentId}[${agent.name}]\n`;
      });
      mermaidDiagram += `    end\n`;
    }

    // Add end node
    mermaidDiagram += `    END([✅ YusrAI Automation Complete])\n`;

    // Add styling
    mermaidDiagram += `    classDef startEnd fill:#e1f5fe,stroke:#0277bd,stroke-width:2px\n`;
    mermaidDiagram += `    classDef platform fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px\n`;
    mermaidDiagram += `    classDef step fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px\n`;
    mermaidDiagram += `    classDef agent fill:#fff3e0,stroke:#f57c00,stroke-width:2px\n`;
    mermaidDiagram += `    class START,END startEnd\n`;
    mermaidDiagram += `    class INIT,PLATFORMS platform\n`;
    
    // Apply styling to steps
    steps.forEach((_, index: number) => {
      mermaidDiagram += `    class STEP_${index + 1} step\n`;
    });

    // Apply styling to platforms
    platforms.forEach((_, index: number) => {
      mermaidDiagram += `    class PLATFORM_${index + 1} platform\n`;
    });

    // Apply styling to agents
    agents.forEach((_, index: number) => {
      mermaidDiagram += `    class AGENT_${index + 1} agent\n`;
    });

    console.log('✅ Mermaid diagram generated successfully');
    return mermaidDiagram;

  } catch (error) {
    console.error('❌ Error generating diagram:', error);
    
    // Fallback simple diagram
    return `flowchart TD
    START([🚀 Start YusrAI Automation])
    START --> PROCESS[⚡ Process Automation]
    PROCESS --> END([✅ Complete])
    classDef startEnd fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef step fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    class START,END startEnd
    class PROCESS step`;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { automation_id, blueprint, user_id }: DiagramRequest = await req.json();

    console.log('📊 Diagram generation request received:', {
      automation_id,
      user_id,
      yusrai_powered: blueprint.yusrai_powered,
      seven_sections_validated: blueprint.seven_sections_validated,
      platforms_count: blueprint.platforms?.length || 0,
      steps_count: blueprint.steps?.length || 0,
      agents_count: blueprint.agents?.length || 0
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate the Mermaid diagram
    const mermaidDiagram = generateDiagramFromBlueprint(blueprint);

    // Save the diagram to database
    const { data: diagramData, error: diagramError } = await supabase
      .from('automation_diagrams')
      .upsert({
        automation_id,
        user_id,
        diagram_type: 'mermaid',
        diagram_data: mermaidDiagram,
        blueprint_data: blueprint,
        yusrai_powered: blueprint.yusrai_powered,
        seven_sections_validated: blueprint.seven_sections_validated,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (diagramError) {
      console.error('❌ Database error:', diagramError);
      throw diagramError;
    }

    console.log('✅ Diagram saved successfully:', diagramData.id);

    return new Response(JSON.stringify({
      success: true,
      diagram_id: diagramData.id,
      diagram_data: mermaidDiagram,
      yusrai_powered: blueprint.yusrai_powered,
      seven_sections_validated: blueprint.seven_sections_validated,
      message: 'YusrAI automation diagram generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('💥 Diagram generation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to generate YusrAI automation diagram'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
