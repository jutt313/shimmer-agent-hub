
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

class EnhancedDiagramBuilder {
    private nodes: DiagramNode[] = [];
    private edges: DiagramEdge[] = [];
    private nodeIndex = 0;
    private readonly NODE_WIDTH = 320;
    private readonly NODE_HEIGHT = 140;
    private readonly HORIZONTAL_GAP = 350;
    private readonly VERTICAL_GAP = 200;
    private readonly START_X = 50;
    private readonly START_Y = 100;

    constructor(private blueprint: any) {}

    build(): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
        console.log('🔧 Enhanced Diagram Builder - Processing blueprint:', {
            hasSteps: !!this.blueprint.steps,
            stepCount: this.blueprint.steps?.length || 0,
            hasTrigger: !!this.blueprint.trigger,
            triggerType: this.blueprint.trigger?.type
        });
        
        // Step 1: Create trigger node
        this.createTriggerNode();
        
        // Step 2: Process all steps sequentially
        if (this.blueprint.steps && this.blueprint.steps.length > 0) {
            this.processAllSteps(this.blueprint.steps);
        }
        
        console.log('✅ Enhanced diagram built:', {
            totalNodes: this.nodes.length,
            totalEdges: this.edges.length,
            nodeTypes: [...new Set(this.nodes.map(n => n.type))],
            platforms: [...new Set(this.nodes.map(n => n.data?.platform).filter(Boolean))]
        });
        
        return {
            nodes: this.nodes,
            edges: this.edges
        };
    }

    private createTriggerNode() {
        const trigger = this.blueprint.trigger;
        const platform = this.extractPlatform(trigger);
        
        const triggerNode: DiagramNode = {
            id: 'trigger-node',
            type: platform ? 'platformTriggerNode' : 'triggerNode',
            position: { x: this.START_X, y: this.START_Y },
            data: {
                label: trigger?.explanation || trigger?.type || 'Manual Trigger',
                platform: platform,
                trigger: trigger,
                explanation: trigger?.explanation || 'This automation starts when triggered',
                stepType: 'trigger'
            }
        };
        
        this.nodes.push(triggerNode);
        console.log('📍 Created trigger node:', {
            id: triggerNode.id,
            type: triggerNode.type,
            platform: platform
        });
    }

    private processAllSteps(steps: BlueprintStep[]) {
        let lastNodeId = 'trigger-node';
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`🔄 Processing step ${i + 1}/${steps.length}:`, {
                type: step.type,
                hasAction: !!step.action,
                hasCondition: !!step.condition,
                hasAiAgent: !!step.ai_agent_call
            });
            
            const nodeId = `step-${this.nodeIndex++}`;
            const node = this.createEnhancedNodeForStep(step, nodeId, i);
            this.nodes.push(node);
            
            // Create edge from previous node
            this.createEdge(lastNodeId, nodeId);
            
            // Handle nested steps and branches
            lastNodeId = this.handleNestedSteps(step, nodeId) || nodeId;
        }
    }

    private createEnhancedNodeForStep(step: BlueprintStep, nodeId: string, index: number): DiagramNode {
        const x = this.START_X + ((index + 1) * this.HORIZONTAL_GAP);
        const y = this.START_Y;
        const position = { x, y };
        
        console.log(`🎨 Creating node for step type: ${step.type}`);
        
        // Enhanced node creation based on step type
        switch (step.type) {
            case 'condition':
                return this.createConditionNode(step, nodeId, position);
                
            case 'ai_agent_call':
                return this.createAIAgentNode(step, nodeId, position);
                
            case 'delay':
                return this.createDelayNode(step, nodeId, position);
                
            case 'loop':
                return this.createLoopNode(step, nodeId, position);
                
            case 'retry':
                return this.createRetryNode(step, nodeId, position);
                
            case 'fallback':
                return this.createFallbackNode(step, nodeId, position);
                
            default:
                return this.createActionNode(step, nodeId, position);
        }
    }

    private createConditionNode(step: BlueprintStep, nodeId: string, position: { x: number; y: number }): DiagramNode {
        const branches = this.extractConditionBranches(step.condition);
        
        return {
            id: nodeId,
            type: 'conditionNode',
            position,
            data: {
                label: step.explanation || 'Condition Check',
                icon: 'branch',
                condition: step.condition,
                explanation: step.explanation,
                branches: branches,
                stepType: 'condition'
            }
        };
    }

    private createAIAgentNode(step: BlueprintStep, nodeId: string, position: { x: number; y: number }): DiagramNode {
        return {
            id: nodeId,
            type: 'aiAgentNode',
            position,
            data: {
                label: step.explanation || `AI Agent: ${step.ai_agent_call?.agent_id || 'Unknown'}`,
                icon: 'bot',
                agent: step.ai_agent_call,
                explanation: step.explanation,
                stepType: 'ai_agent_call'
            }
        };
    }

    private createDelayNode(step: BlueprintStep, nodeId: string, position: { x: number; y: number }): DiagramNode {
        return {
            id: nodeId,
            type: 'delayNode',
            position,
            data: {
                label: step.explanation || `Delay: ${step.delay?.duration || 'Unknown'}`,
                icon: 'clock',
                delay: step.delay,
                explanation: step.explanation,
                stepType: 'delay'
            }
        };
    }

    private createLoopNode(step: BlueprintStep, nodeId: string, position: { x: number; y: number }): DiagramNode {
        return {
            id: nodeId,
            type: 'loopNode',
            position,
            data: {
                label: step.explanation || 'Loop',
                icon: 'repeat',
                loop: step.loop,
                explanation: step.explanation,
                stepType: 'loop'
            }
        };
    }

    private createRetryNode(step: BlueprintStep, nodeId: string, position: { x: number; y: number }): DiagramNode {
        return {
            id: nodeId,
            type: 'retryNode',
            position,
            data: {
                label: step.explanation || 'Retry Logic',
                icon: 'refresh',
                retry: step.retry,
                explanation: step.explanation,
                stepType: 'retry'
            }
        };
    }

    private createFallbackNode(step: BlueprintStep, nodeId: string, position: { x: number; y: number }): DiagramNode {
        return {
            id: nodeId,
            type: 'fallbackNode',
            position,
            data: {
                label: step.explanation || 'Fallback Handler',
                icon: 'shield',
                fallback: step.fallback,
                explanation: step.explanation,
                stepType: 'fallback'
            }
        };
    }

    private createActionNode(step: BlueprintStep, nodeId: string, position: { x: number; y: number }): DiagramNode {
        const platform = this.extractPlatform(step.action);
        const method = step.action?.method || '';
        
        // Determine if this should be a platform node
        const nodeType = platform ? 'platformNode' : 'actionNode';
        
        return {
            id: nodeId,
            type: nodeType,
            position,
            data: {
                label: step.explanation || method || 'Action Step',
                icon: 'settings',
                platform: platform,
                action: step.action,
                stepType: step.type,
                explanation: step.explanation,
                stepDetails: {
                    integration: platform,
                    method: method,
                    endpoint: step.action?.endpoint,
                    parameters: step.action?.parameters
                }
            }
        };
    }

    private handleNestedSteps(step: BlueprintStep, nodeId: string): string | null {
        let lastNodeId: string | null = null;
        
        // Handle condition branches
        if (step.type === 'condition' && step.condition) {
            if (step.condition.if_true && step.condition.if_true.length > 0) {
                console.log('🌿 Processing TRUE branch with', step.condition.if_true.length, 'steps');
                this.processConditionalBranch(step.condition.if_true, nodeId, 'true');
            }
            
            if (step.condition.if_false && step.condition.if_false.length > 0) {
                console.log('🌿 Processing FALSE branch with', step.condition.if_false.length, 'steps');
                this.processConditionalBranch(step.condition.if_false, nodeId, 'false');
            }
        }
        
        // Handle loop steps
        if (step.type === 'loop' && step.loop?.steps) {
            console.log('🔄 Processing loop with', step.loop.steps.length, 'steps');
            this.processNestedSteps(step.loop.steps, nodeId);
        }
        
        // Handle retry steps
        if (step.type === 'retry' && step.retry?.steps) {
            console.log('🔄 Processing retry with', step.retry.steps.length, 'steps');
            this.processNestedSteps(step.retry.steps, nodeId);
        }
        
        // Handle fallback steps
        if (step.type === 'fallback' && step.fallback) {
            if (step.fallback.primary_steps) {
                console.log('🔄 Processing primary fallback with', step.fallback.primary_steps.length, 'steps');
                this.processNestedSteps(step.fallback.primary_steps, nodeId);
            }
            if (step.fallback.fallback_steps) {
                console.log('🔄 Processing fallback steps with', step.fallback.fallback_steps.length, 'steps');
                this.processNestedSteps(step.fallback.fallback_steps, nodeId);
            }
        }
        
        return lastNodeId;
    }

    private processConditionalBranch(steps: BlueprintStep[], parentId: string, branchType: string) {
        const branchY = this.START_Y + (branchType === 'true' ? this.VERTICAL_GAP : this.VERTICAL_GAP * 2);
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const nodeId = `branch-${branchType}-${this.nodeIndex++}`;
            const position = {
                x: this.START_X + ((this.nodeIndex + 1) * this.HORIZONTAL_GAP),
                y: branchY
            };
            
            const node = this.createEnhancedNodeForStep(step, nodeId, this.nodeIndex);
            node.position = position;
            this.nodes.push(node);
            
            // Create edge from parent condition node
            if (i === 0) {
                this.createEdge(parentId, nodeId, branchType);
            } else {
                this.createEdge(`branch-${branchType}-${this.nodeIndex - 1}`, nodeId);
            }
        }
    }

    private processNestedSteps(steps: BlueprintStep[], parentId: string) {
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const nodeId = `nested-${this.nodeIndex++}`;
            const position = {
                x: this.START_X + ((this.nodeIndex + 1) * this.HORIZONTAL_GAP),
                y: this.START_Y + this.VERTICAL_GAP
            };
            
            const node = this.createEnhancedNodeForStep(step, nodeId, this.nodeIndex);
            node.position = position;
            this.nodes.push(node);
            
            // Create edge
            if (i === 0) {
                this.createEdge(parentId, nodeId);
            } else {
                this.createEdge(`nested-${this.nodeIndex - 1}`, nodeId);
            }
        }
    }

    private createEdge(source: string, target: string, sourceHandle?: string, targetHandle?: string) {
        const edgeId = `edge-${source}-${target}${sourceHandle ? `-${sourceHandle}` : ''}`;
        
        const edge: DiagramEdge = {
            id: edgeId,
            source,
            target,
            type: 'smoothstep',
            animated: true,
            style: {
                stroke: this.getEdgeColor(sourceHandle),
                strokeWidth: 2
            }
        };
        
        if (sourceHandle) edge.sourceHandle = sourceHandle;
        if (targetHandle) edge.targetHandle = targetHandle;
        
        this.edges.push(edge);
        console.log('🔗 Created edge:', { source, target, sourceHandle });
    }

    private getEdgeColor(sourceHandle?: string): string {
        switch (sourceHandle) {
            case 'true':
            case 'yes':
            case 'success':
                return '#10b981';
            case 'false':
            case 'no':
            case 'error':
                return '#ef4444';
            case 'urgent':
                return '#ef4444';
            case 'task':
                return '#10b981';
            case 'followup':
                return '#f59e0b';
            default:
                return '#3b82f6';
        }
    }

    private extractPlatform(actionOrTrigger: any): string {
        if (!actionOrTrigger) return '';
        
        // Try different possible property names
        return actionOrTrigger.integration || 
               actionOrTrigger.platform || 
               actionOrTrigger.service || 
               actionOrTrigger.provider || 
               '';
    }

    private extractConditionBranches(condition: any): Array<{ label: string; handle: string; color: string }> {
        const branches = [];
        
        if (!condition) {
            return [
                { label: 'Yes', handle: 'yes', color: '#10b981' },
                { label: 'No', handle: 'no', color: '#ef4444' }
            ];
        }
        
        // Check for explicit branches
        if (condition.if_true) {
            branches.push({ label: 'True', handle: 'true', color: '#10b981' });
        }
        
        if (condition.if_false) {
            branches.push({ label: 'False', handle: 'false', color: '#ef4444' });
        }
        
        // Analyze condition expression for specific cases
        if (condition.expression) {
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
            if (expr.includes('existing') || expr.includes('found')) {
                branches.push({ label: 'Existing', handle: 'existing', color: '#3b82f6' });
            }
            if (expr.includes('new') || expr.includes('not found')) {
                branches.push({ label: 'New', handle: 'new', color: '#10b981' });
            }
        }
        
        // Default branches if none found
        if (branches.length === 0) {
            branches.push(
                { label: 'Yes', handle: 'yes', color: '#10b981' },
                { label: 'No', handle: 'no', color: '#ef4444' }
            );
        }
        
        return branches;
    }
}

serve(async (req) => {
    console.log('🚀 Enhanced Diagram Generator - Request received');
    
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

        console.log('📋 Processing enhanced blueprint:', {
            hasSteps: !!automation_blueprint.steps,
            stepCount: automation_blueprint.steps?.length || 0,
            hasTrigger: !!automation_blueprint.trigger,
            triggerType: automation_blueprint.trigger?.type,
            stepTypes: automation_blueprint.steps?.map((s: any) => s.type) || []
        });

        // Use enhanced diagram builder
        const builder = new EnhancedDiagramBuilder(automation_blueprint);
        const diagramData = builder.build();

        console.log('✅ Generated enhanced diagram data:', {
            nodes: diagramData.nodes.length,
            edges: diagramData.edges.length,
            nodeTypes: [...new Set(diagramData.nodes.map(n => n.type))],
            platforms: [...new Set(diagramData.nodes.map(n => n.data?.platform).filter(Boolean))]
        });

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 Error in enhanced diagram generator:', error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Enhanced diagram generation failed',
                details: error.toString()
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
