
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlueprintStep {
    id?: string;
    type: string;
    action?: any;
    condition?: any;
    ai_agent_call?: any;
    loop?: any;
    delay?: any;
    retry?: any;
    fallback?: any;
    explanation?: string;
}

interface DiagramNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
}

interface DiagramEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: string;
    animated?: boolean;
    style?: any;
}

class DiagramBuilder {
    private nodes: DiagramNode[] = [];
    private edges: DiagramEdge[] = [];
    private currentX = 50;
    private currentY = 100;
    private nodeSpacing = 350;
    private verticalSpacing = 200;

    constructor(private blueprint: any) {}

    build(): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
        console.log('🔧 Building diagram for blueprint with', this.blueprint.steps?.length || 0, 'steps');
        
        // Step 1: Create trigger node
        this.createTriggerNode();
        
        // Step 2: Process all steps
        if (this.blueprint.steps && this.blueprint.steps.length > 0) {
            this.processSteps(this.blueprint.steps);
        }
        
        console.log('✅ Diagram built:', {
            nodes: this.nodes.length,
            edges: this.edges.length
        });
        
        return {
            nodes: this.nodes,
            edges: this.edges
        };
    }

    private createTriggerNode() {
        const trigger = this.blueprint.trigger;
        const triggerNode: DiagramNode = {
            id: 'trigger-node',
            type: 'platformTriggerNode',
            position: { x: this.currentX, y: this.currentY },
            data: {
                label: trigger?.type || 'Manual Trigger',
                platform: this.extractPlatform(trigger),
                trigger: trigger,
                explanation: trigger?.explanation || 'This automation starts when triggered'
            }
        };
        
        this.nodes.push(triggerNode);
        this.currentX += this.nodeSpacing;
        
        console.log('📍 Created trigger node:', triggerNode.id);
    }

    private processSteps(steps: BlueprintStep[], parentId = 'trigger-node') {
        let lastNodeId = parentId;
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const nodeId = `step-${Date.now()}-${i}`;
            
            console.log(`🔄 Processing step ${i + 1}:`, step.type);
            
            const node = this.createNodeForStep(step, nodeId);
            this.nodes.push(node);
            
            // Create edge from previous node
            if (lastNodeId) {
                this.createEdge(lastNodeId, nodeId);
            }
            
            // Handle nested steps
            lastNodeId = this.handleNestedSteps(step, nodeId);
        }
    }

    private createNodeForStep(step: BlueprintStep, nodeId: string): DiagramNode {
        const position = { x: this.currentX, y: this.currentY };
        this.currentX += this.nodeSpacing;
        
        // Determine node type and data based on step
        switch (step.type) {
            case 'condition':
                return {
                    id: nodeId,
                    type: 'conditionNode',
                    position,
                    data: {
                        label: step.explanation || 'Condition Check',
                        icon: 'branch',
                        condition: step.condition,
                        explanation: step.explanation,
                        branches: this.extractConditionBranches(step.condition)
                    }
                };
                
            case 'ai_agent_call':
                return {
                    id: nodeId,
                    type: 'aiAgentNode',
                    position,
                    data: {
                        label: step.explanation || 'AI Agent Call',
                        icon: 'bot',
                        agent: step.ai_agent_call,
                        explanation: step.explanation
                    }
                };
                
            case 'delay':
                return {
                    id: nodeId,
                    type: 'delayNode',
                    position,
                    data: {
                        label: step.explanation || 'Delay',
                        icon: 'clock',
                        delay: step.delay,
                        explanation: step.explanation
                    }
                };
                
            case 'loop':
                return {
                    id: nodeId,
                    type: 'loopNode',
                    position,
                    data: {
                        label: step.explanation || 'Loop',
                        icon: 'repeat',
                        loop: step.loop,
                        explanation: step.explanation
                    }
                };
                
            case 'retry':
                return {
                    id: nodeId,
                    type: 'retryNode',
                    position,
                    data: {
                        label: step.explanation || 'Retry Logic',
                        icon: 'refresh',
                        retry: step.retry,
                        explanation: step.explanation
                    }
                };
                
            case 'fallback':
                return {
                    id: nodeId,
                    type: 'fallbackNode',
                    position,
                    data: {
                        label: step.explanation || 'Fallback Handler',
                        icon: 'shield',
                        fallback: step.fallback,
                        explanation: step.explanation
                    }
                };
                
            default:
                // Default to action node
                return {
                    id: nodeId,
                    type: 'actionNode',
                    position,
                    data: {
                        label: step.explanation || step.action?.method || 'Action Step',
                        icon: 'settings',
                        platform: this.extractPlatform(step.action),
                        action: step.action,
                        stepType: step.type,
                        explanation: step.explanation,
                        stepDetails: {
                            integration: step.action?.integration,
                            method: step.action?.method,
                            endpoint: step.action?.endpoint,
                            parameters: step.action?.parameters
                        }
                    }
                };
        }
    }

    private handleNestedSteps(step: BlueprintStep, nodeId: string): string {
        let lastNodeId = nodeId;
        
        // Handle condition branches
        if (step.type === 'condition' && step.condition) {
            if (step.condition.if_true && step.condition.if_true.length > 0) {
                const branchY = this.currentY + this.verticalSpacing;
                const savedY = this.currentY;
                this.currentY = branchY;
                
                this.processSteps(step.condition.if_true, nodeId);
                
                this.currentY = savedY;
            }
            
            if (step.condition.if_false && step.condition.if_false.length > 0) {
                const branchY = this.currentY + this.verticalSpacing * 2;
                const savedY = this.currentY;
                this.currentY = branchY;
                
                this.processSteps(step.condition.if_false, nodeId);
                
                this.currentY = savedY;
            }
        }
        
        // Handle loop steps
        if (step.type === 'loop' && step.loop?.steps) {
            this.processSteps(step.loop.steps, nodeId);
        }
        
        // Handle retry steps
        if (step.type === 'retry' && step.retry?.steps) {
            this.processSteps(step.retry.steps, nodeId);
        }
        
        // Handle fallback steps
        if (step.type === 'fallback' && step.fallback) {
            if (step.fallback.primary_steps) {
                this.processSteps(step.fallback.primary_steps, nodeId);
            }
            if (step.fallback.fallback_steps) {
                this.processSteps(step.fallback.fallback_steps, nodeId);
            }
        }
        
        return lastNodeId;
    }

    private createEdge(source: string, target: string, sourceHandle?: string, targetHandle?: string) {
        const edge: DiagramEdge = {
            id: `edge-${source}-${target}`,
            source,
            target,
            type: 'smoothstep',
            animated: true,
            style: {
                stroke: '#3b82f6',
                strokeWidth: 2
            }
        };
        
        if (sourceHandle) edge.sourceHandle = sourceHandle;
        if (targetHandle) edge.targetHandle = targetHandle;
        
        this.edges.push(edge);
        console.log('🔗 Created edge:', edge.id);
    }

    private extractPlatform(action: any): string {
        if (!action) return '';
        return action.integration || action.platform || '';
    }

    private extractConditionBranches(condition: any): Array<{ label: string; handle: string; color: string }> {
        const branches = [];
        
        if (condition?.if_true) {
            branches.push({ label: 'True', handle: 'true', color: '#10b981' });
        }
        
        if (condition?.if_false) {
            branches.push({ label: 'False', handle: 'false', color: '#ef4444' });
        }
        
        // Add more sophisticated condition analysis here
        if (condition?.expression) {
            const expr = condition.expression.toLowerCase();
            if (expr.includes('urgent')) {
                branches.push({ label: 'Urgent', handle: 'urgent', color: '#ef4444' });
            }
            if (expr.includes('task')) {
                branches.push({ label: 'Task', handle: 'task', color: '#10b981' });
            }
            if (expr.includes('follow')) {
                branches.push({ label: 'Follow-up', handle: 'followup', color: '#f59e0b' });
            }
        }
        
        return branches.length > 0 ? branches : [
            { label: 'Yes', handle: 'yes', color: '#10b981' },
            { label: 'No', handle: 'no', color: '#ef4444' }
        ];
    }
}

serve(async (req) => {
    console.log('🚀 Diagram Generator - Request received');
    
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
        const requestBody = await req.json();
        const { automation_blueprint } = requestBody;

        if (!automation_blueprint) {
            return new Response(
                JSON.stringify({ error: 'Missing automation blueprint' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('📋 Processing blueprint:', {
            hasSteps: !!automation_blueprint.steps,
            stepCount: automation_blueprint.steps?.length || 0,
            hasTrigger: !!automation_blueprint.trigger
        });

        // Use deterministic diagram builder instead of AI
        const builder = new DiagramBuilder(automation_blueprint);
        const diagramData = builder.build();

        console.log('✅ Generated diagram data:', {
            nodes: diagramData.nodes.length,
            edges: diagramData.edges.length
        });

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 Error in diagram generator:', error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Diagram generation failed',
                details: error.toString()
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
