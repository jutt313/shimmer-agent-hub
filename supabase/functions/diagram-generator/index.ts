// supabase/functions/diagram-generator/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { calculateEnhancedLayout } from '../../src/utils/diagramLayout.ts'; //

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
    position?: { x: number; y: number }; // Made optional, as layout will set it
    data: any;
    draggable?: boolean;
    selectable?: boolean;
    connectable?: boolean;
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
        
        console.log('Applying enhanced layout algorithm...');
        const layoutedData = calculateEnhancedLayout(this.nodes, this.edges, { //
            nodeWidth: this.NODE_WIDTH,
            nodeHeight: this.NODE_HEIGHT,
            horizontalGap: this.HORIZONTAL_GAP,
            verticalGap: this.VERTICAL_GAP,
            startX: this.START_X,
            startY: this.START_Y,
        });
        this.nodes = layoutedData.nodes;
        this.edges = layoutedData.edges;

        console.log('✅ Enhanced diagram built and layouted:', {
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
            type: platform ? 'platformTriggerNode' : 'triggerNode', //
            // Position will be set by the layout algorithm
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

    private processAllSteps(steps: BlueprintStep[], parentId: string = 'trigger-node', isNested: boolean = false) {
        let previousNodeId = parentId; // Keep track for sequential connections

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`🔄 Processing step ${i + 1}/${steps.length} (Nested: ${isNested}):`, {
                type: step.type,
                hasAction: !!step.action,
                hasCondition: !!step.condition,
                hasAiAgent: !!step.ai_agent_call,
                previousNode: previousNodeId
            });
            
            const nodeId = `step-${this.nodeIndex++}`;
            const node = this.createEnhancedNodeForStep(step, nodeId);
            this.nodes.push(node);
            
            // Create edge from previous node in the sequence
            this.createEdge(previousNodeId, nodeId, undefined, 'target'); // Connect to target handle of current node

            // If it's a conditional or branching step, it might have internal flows
            if (step.type === 'condition' || step.type === 'loop' || step.type === 'retry' || step.type === 'fallback') {
                this.handleNestedSteps(step, nodeId);
            }
            
            previousNodeId = nodeId; // Update previous node for next iteration
        }
    }

    private createEnhancedNodeForStep(step: BlueprintStep, nodeId: string): DiagramNode {
        // Position will be set by the layout algorithm
        console.log(`🎨 Creating node for step type: ${step.type}`);
        
        // Enhanced node creation based on step type
        switch (step.type) {
            case 'condition':
                return this.createConditionNode(step, nodeId);
                
            case 'ai_agent_call':
                return this.createAIAgentNode(step, nodeId);
                
            case 'delay':
                return this.createDelayNode(step, nodeId);
                
            case 'loop':
                return this.createLoopNode(step, nodeId);
                
            case 'retry':
                return this.createRetryNode(step, nodeId);
                
            case 'fallback':
                return this.createFallbackNode(step, nodeId);
                
            default:
                return this.createActionNode(step, nodeId);
        }
    }

    private createConditionNode(step: BlueprintStep, nodeId: string): DiagramNode {
        const branches = this.extractConditionBranches(step.condition);
        
        return {
            id: nodeId,
            type: 'conditionNode', //
            data: {
                label: step.explanation || 'Condition Check',
                icon: 'branch',
                condition: step.condition,
                explanation: step.explanation,
                branches: branches, // Pass all detected branches
                stepType: 'condition'
            }
        };
    }

    private createAIAgentNode(step: BlueprintStep, nodeId: string): DiagramNode {
        const isRecommended = step.ai_agent_call?.is_recommended || false; //
        
        return {
            id: nodeId,
            type: 'aiAgentNode', //
            data: {
                label: step.explanation || `AI Agent: ${step.ai_agent_call?.agent_id || 'Unknown'}`,
                icon: 'bot',
                agent: step.ai_agent_call,
                explanation: step.explanation,
                stepType: 'ai_agent_call',
                isRecommended: isRecommended // Pass recommended status
            }
        };
    }

    private createDelayNode(step: BlueprintStep, nodeId: string): DiagramNode {
        return {
            id: nodeId,
            type: 'delayNode',
            data: {
                label: step.explanation || `Delay: ${step.delay?.duration || 'Unknown'}`,
                icon: 'clock',
                delay: step.delay,
                explanation: step.explanation,
                stepType: 'delay'
            }
        };
    }

    private createLoopNode(step: BlueprintStep, nodeId: string): DiagramNode {
        return {
            id: nodeId,
            type: 'loopNode', //
            data: {
                label: step.explanation || 'Loop',
                icon: 'repeat',
                loop: step.loop,
                explanation: step.explanation,
                stepType: 'loop'
            }
        };
    }

    private createRetryNode(step: BlueprintStep, nodeId: string): DiagramNode {
        return {
            id: nodeId,
            type: 'retryNode', //
            data: {
                label: step.explanation || 'Retry Logic',
                icon: 'refresh',
                retry: step.retry,
                explanation: step.explanation,
                stepType: 'retry'
            }
        };
    }

    private createFallbackNode(step: BlueprintStep, nodeId: string): DiagramNode {
        return {
            id: nodeId,
            type: 'fallbackNode', //
            data: {
                label: step.explanation || 'Fallback Handler',
                icon: 'shield',
                fallback: step.fallback,
                explanation: step.explanation,
                stepType: 'fallback'
            }
        };
    }

    private createActionNode(step: BlueprintStep, nodeId: string): DiagramNode {
        const platform = this.extractPlatform(step.action);
        const method = step.action?.method || '';
        
        // Determine if this should be a platform node
        const nodeType = platform ? 'platformNode' : 'actionNode';
        
        return {
            id: nodeId,
            type: nodeType,
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

    private handleNestedSteps(step: BlueprintStep, parentNodeId: string) {
        // Handle condition branches
        if (step.type === 'condition' && step.condition) {
            const branches = this.extractConditionBranches(step.condition);
            branches.forEach(branch => {
                const branchSteps = step.condition[branch.stepsKey || branch.handle]; 
                if (branchSteps && branchSteps.length > 0) {
                    console.log(`🌿 Processing branch '${branch.label}' with ${branchSteps.length} steps`);
                    // Create the first node of the branch and connect it
                    const firstBranchNodeId = `branch-${branch.handle}-${this.nodeIndex++}`;
                    const firstBranchNode = this.createEnhancedNodeForStep(branchSteps[0], firstBranchNodeId);
                    this.nodes.push(firstBranchNode);
                    this.createEdge(parentNodeId, firstBranchNodeId, branch.handle, 'target'); //

                    // Process subsequent steps in this branch
                    this.processAllSteps(branchSteps.slice(1), firstBranchNodeId, true);
                }
            });
        }
        
        // Handle loop steps
        if (step.type === 'loop' && step.loop?.steps) {
            console.log('🔄 Processing loop with', step.loop.steps.length, 'steps');
            this.processAllSteps(step.loop.steps, parentNodeId, true); // Nested steps within the loop
        }
        
        // Handle retry steps
        if (step.type === 'retry' && step.retry?.steps) {
            console.log('🔄 Processing retry with', step.retry.steps.length, 'steps');
            this.processAllSteps(step.retry.steps, parentNodeId, true); // Nested steps within the retry
        }
        
        // Handle fallback steps
        if (step.type === 'fallback' && step.fallback) {
            if (step.fallback.primary_steps && step.fallback.primary_steps.length > 0) {
                console.log('🔄 Processing primary fallback with', step.fallback.primary_steps.length, 'steps');
                const primaryNodeId = `fallback-primary-${this.nodeIndex++}`;
                const primaryNode = this.createEnhancedNodeForStep(step.fallback.primary_steps[0], primaryNodeId);
                this.nodes.push(primaryNode);
                this.createEdge(parentNodeId, primaryNodeId, 'primary', 'target'); //
                this.processAllSteps(step.fallback.primary_steps.slice(1), primaryNodeId, true);
            }
            if (step.fallback.fallback_steps && step.fallback.fallback_steps.length > 0) {
                console.log('🔄 Processing fallback steps with', step.fallback.fallback_steps.length, 'steps');
                const fallbackNodeId = `fallback-secondary-${this.nodeIndex++}`;
                const fallbackNode = this.createEnhancedNodeForStep(step.fallback.fallback_steps[0], fallbackNodeId);
                this.nodes.push(fallbackNode);
                this.createEdge(parentNodeId, fallbackNodeId, 'fallback', 'target'); //
                this.processAllSteps(step.fallback.fallback_steps.slice(1), fallbackNodeId, true);
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
                stroke: this.getEdgeColor(sourceHandle), //
                strokeWidth: 2
            }
        };
        
        if (sourceHandle) edge.sourceHandle = sourceHandle;
        if (targetHandle) edge.targetHandle = targetHandle;
        
        this.edges.push(edge);
        console.log('🔗 Created edge:', { source, target, sourceHandle });
    }

    private getEdgeColor(sourceHandle?: string): string { //
        switch (sourceHandle) {
            case 'true':
            case 'yes':
            case 'success':
            case 'existing':
            case 'she': 
            case 'task':
            case 'new':
                return '#10b981'; // Green
            case 'false':
            case 'no':
            case 'error':
            case 'he': 
                return '#ef4444'; // Red
            case 'urgent':
                return '#ef4444'; // Red
            case 'followup':
                return '#f59e0b'; // Amber
            case 'goat': 
                return '#8B5CF6'; // Purple for unique cases
            case 'primary': // For fallback primary path
                return '#10b981';
            case 'fallback': // For fallback alternative path
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

    private extractConditionBranches(condition: any): Array<{ label: string; handle: string; color: string; stepsKey?: string }> {
        const branches = [];
        
        if (!condition) {
            return [
                { label: 'Yes', handle: 'true', color: '#10b981', stepsKey: 'if_true' },
                { label: 'No', handle: 'false', color: '#ef4444', stepsKey: 'if_false' }
            ];
        }
        
        // Check for explicit branches as named properties (if_true, if_false)
        if (condition.if_true) {
            branches.push({ label: 'True', handle: 'true', color: '#10b981', stepsKey: 'if_true' });
        }
        
        if (condition.if_false) {
            branches.push({ label: 'False', handle: 'false', color: '#ef4444', stepsKey: 'if_false' });
        }
        
        // Analyze condition expression for specific cases like "name contains she/he/goat"
        if (condition.expression && typeof condition.expression === 'string') {
            const expr = condition.expression.toLowerCase();
            if (expr.includes('name contains she')) {
                branches.push({ label: 'Name: She', handle: 'she', color: '#10b981', stepsKey: 'if_name_she' });
            }
            if (expr.includes('name contains he')) {
                branches.push({ label: 'Name: He', handle: 'he', color: '#ef4444', stepsKey: 'if_name_he' });
            }
            if (expr.includes('name contains goat')) {
                branches.push({ label: 'Name: Goat', handle: 'goat', color: '#8B5CF6', stepsKey: 'if_name_goat' });
            }
            if (expr.includes('urgent')) {
                branches.push({ label: 'Urgent', handle: 'urgent', color: '#ef4444', stepsKey: 'if_urgent' });
            }
            if (expr.includes('task')) {
                branches.push({ label: 'Task', handle: 'task', color: '#10b981', stepsKey: 'if_task' });
            }
            if (expr.includes('follow')) {
                branches.push({ label: 'Follow-up', handle: 'followup', color: '#f59e0b', stepsKey: 'if_followup' });
            }
            if (expr.includes('existing') || expr.includes('found')) {
                branches.push({ label: 'Existing', handle: 'existing', color: '#3b82f6', stepsKey: 'if_existing' });
            }
            if (expr.includes('new') || expr.includes('not found')) {
                branches.push({ label: 'New', handle: 'new', color: '#10b981', stepsKey: 'if_new' });
            }
        }
        
        // Filter out duplicate handles, prioritize explicit 'true'/'false' if general ones exist
        const uniqueBranches = Array.from(new Map(branches.map(item => [item.handle, item])).values());

        // Default branches if none found (ensure a fallback for rendering)
        if (uniqueBranches.length === 0) {
            return [
                { label: 'Yes', handle: 'true', color: '#10b981', stepsKey: 'if_true' },
                { label: 'No', handle: 'false', color: '#ef4444', stepsKey: 'if_false' }
            ];
        }

        return uniqueBranches;
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
        const diagramData = builder.build(); // This now includes layout calculation

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