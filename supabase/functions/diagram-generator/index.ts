
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

class CompactDiagramBuilder {
    private nodes: DiagramNode[] = [];
    private edges: DiagramEdge[] = [];
    private nodeIndex = 0;
    // Reduced spacing for more compact layout
    private readonly NODE_WIDTH = 280;
    private readonly NODE_HEIGHT = 120;
    private readonly HORIZONTAL_GAP = 200; // Reduced from 350
    private readonly VERTICAL_GAP = 150;   // Reduced from 200
    private readonly START_X = 50;
    private readonly START_Y = 100;

    constructor(private blueprint: any) {}

    build(): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
        console.log('🔧 Compact Diagram Builder - Processing blueprint:', {
            hasSteps: !!this.blueprint.steps,
            stepCount: this.blueprint.steps?.length || 0,
            hasTrigger: !!this.blueprint.trigger
        });
        
        // Create trigger node
        this.createTriggerNode();
        
        // Process all steps with enhanced conditional handling
        if (this.blueprint.steps && this.blueprint.steps.length > 0) {
            this.processStepsWithConditionals(this.blueprint.steps);
        }
        
        console.log('✅ Compact diagram built:', {
            totalNodes: this.nodes.length,
            totalEdges: this.edges.length,
            nodeTypes: [...new Set(this.nodes.map(n => n.type))]
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
                label: trigger?.explanation || trigger?.type || 'S3 File Upload',
                platform: platform || 'aws',
                trigger: trigger,
                explanation: trigger?.explanation || 'Detects new file uploads in S3 bucket',
                stepType: 'trigger',
                expandedData: {
                    service: platform || 'AWS S3',
                    eventType: 'file-upload',
                    configuration: trigger
                }
            }
        };
        
        this.nodes.push(triggerNode);
    }

    private processStepsWithConditionals(steps: BlueprintStep[]) {
        let lastNodeId = 'trigger-node';
        let currentX = this.START_X + this.HORIZONTAL_GAP;
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const nodeId = `step-${this.nodeIndex++}`;
            
            // Create node with enhanced data
            const node = this.createEnhancedNode(step, nodeId, currentX, this.START_Y);
            this.nodes.push(node);
            
            // Create edge from previous node
            this.createEdge(lastNodeId, nodeId);
            
            // Handle conditional branching
            if (step.type === 'condition') {
                const branchResults = this.handleConditionalBranches(step, nodeId, currentX);
                if (branchResults.length > 0) {
                    // Move to next position after all branches
                    currentX += this.HORIZONTAL_GAP * 2;
                    lastNodeId = branchResults[branchResults.length - 1];
                } else {
                    currentX += this.HORIZONTAL_GAP;
                    lastNodeId = nodeId;
                }
            } else {
                currentX += this.HORIZONTAL_GAP;
                lastNodeId = nodeId;
            }
        }
    }

    private createEnhancedNode(step: BlueprintStep, nodeId: string, x: number, y: number): DiagramNode {
        const position = { x, y };
        
        // Determine node type and enhanced data based on step
        const nodeData = this.buildNodeData(step);
        
        return {
            id: nodeId,
            type: nodeData.type,
            position,
            data: {
                ...nodeData.data,
                expandedData: nodeData.expandedData,
                clickToExpand: true
            }
        };
    }

    private buildNodeData(step: BlueprintStep) {
        switch (step.type) {
            case 'condition':
                return {
                    type: 'conditionNode',
                    data: {
                        label: step.explanation || 'File Type Check',
                        icon: 'branch',
                        condition: step.condition,
                        explanation: step.explanation,
                        stepType: 'condition'
                    },
                    expandedData: {
                        conditionType: 'File Extension Check',
                        branches: ['CSV Processing', 'JSON Processing'],
                        logic: step.condition?.expression || 'Check file extension (.csv or .json)',
                        outcomes: step.condition
                    }
                };
                
            case 'ai_agent_call':
                return {
                    type: 'aiAgentNode',
                    data: {
                        label: step.explanation || `AI: ${step.ai_agent_call?.agent_id || 'FileProcessingAgent'}`,
                        icon: 'bot',
                        agent: step.ai_agent_call,
                        explanation: step.explanation,
                        stepType: 'ai_agent_call'
                    },
                    expandedData: {
                        agentName: step.ai_agent_call?.agent_id || 'FileProcessingAgent',
                        model: step.ai_agent_call?.model || 'gpt-4',
                        role: step.ai_agent_call?.role || 'File Processing Specialist',
                        capabilities: ['File validation', 'Error handling', 'Data processing'],
                        configuration: step.ai_agent_call
                    }
                };
                
            case 'retry':
                return {
                    type: 'retryNode',
                    data: {
                        label: step.explanation || 'Retry Logic',
                        icon: 'refresh',
                        retry: step.retry,
                        explanation: step.explanation,
                        stepType: 'retry'
                    },
                    expandedData: {
                        maxAttempts: step.retry?.max_attempts || 1,
                        strategy: 'Exponential backoff',
                        applicable: 'All processing steps',
                        configuration: step.retry
                    }
                };
                
            case 'notification':
                const platform = this.extractPlatform(step.action);
                return {
                    type: platform ? 'platformNode' : 'actionNode',
                    data: {
                        label: step.explanation || 'Send Notification',
                        platform: platform,
                        action: step.action,
                        stepType: step.type,
                        explanation: step.explanation
                    },
                    expandedData: {
                        service: platform || 'Email/Slack',
                        recipients: step.action?.recipients || ['DevOps Team'],
                        template: step.action?.template || 'Error notification',
                        configuration: step.action
                    }
                };
                
            default:
                const defaultPlatform = this.extractPlatform(step.action);
                return {
                    type: defaultPlatform ? 'platformNode' : 'actionNode',
                    data: {
                        label: step.explanation || step.action?.method || 'Process Step',
                        platform: defaultPlatform,
                        action: step.action,
                        stepType: step.type,
                        explanation: step.explanation
                    },
                    expandedData: {
                        service: defaultPlatform || 'Processing Service',
                        operation: step.action?.method || 'Data processing',
                        parameters: step.action?.parameters || {},
                        configuration: step.action
                    }
                };
        }
    }

    private handleConditionalBranches(step: BlueprintStep, parentId: string, parentX: number): string[] {
        const branchResults: string[] = [];
        
        if (step.condition) {
            // CSV branch (true path)
            if (step.condition.if_true && step.condition.if_true.length > 0) {
                const csvBranchId = this.createBranch(
                    step.condition.if_true, 
                    parentId, 
                    'csv', 
                    parentX + this.HORIZONTAL_GAP, 
                    this.START_Y - this.VERTICAL_GAP,
                    'CSV Processing Path'
                );
                branchResults.push(csvBranchId);
            }
            
            // JSON branch (false path)
            if (step.condition.if_false && step.condition.if_false.length > 0) {
                const jsonBranchId = this.createBranch(
                    step.condition.if_false, 
                    parentId, 
                    'json', 
                    parentX + this.HORIZONTAL_GAP, 
                    this.START_Y + this.VERTICAL_GAP,
                    'JSON Processing Path'
                );
                branchResults.push(jsonBranchId);
            }
        }
        
        return branchResults;
    }

    private createBranch(
        branchSteps: BlueprintStep[], 
        parentId: string, 
        branchType: string, 
        startX: number, 
        startY: number,
        branchLabel: string
    ): string {
        let lastNodeId = parentId;
        let currentX = startX;
        
        for (let i = 0; i < branchSteps.length; i++) {
            const step = branchSteps[i];
            const nodeId = `branch-${branchType}-${this.nodeIndex++}`;
            
            const node = this.createEnhancedNode(step, nodeId, currentX, startY);
            // Add branch context to node data
            node.data.branchContext = {
                type: branchType,
                label: branchLabel,
                position: i + 1,
                total: branchSteps.length
            };
            
            this.nodes.push(node);
            
            // Create edge (first node connects to parent with handle)
            if (i === 0) {
                this.createEdge(parentId, nodeId, branchType === 'csv' ? 'true' : 'false');
            } else {
                this.createEdge(lastNodeId, nodeId);
            }
            
            lastNodeId = nodeId;
            currentX += this.HORIZONTAL_GAP;
        }
        
        return lastNodeId;
    }

    private createEdge(source: string, target: string, sourceHandle?: string) {
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
        
        this.edges.push(edge);
    }

    private getEdgeColor(sourceHandle?: string): string {
        switch (sourceHandle) {
            case 'true':
            case 'csv':
                return '#10b981'; // Green for CSV
            case 'false':
            case 'json':
                return '#3b82f6'; // Blue for JSON
            case 'error':
                return '#ef4444'; // Red for errors
            default:
                return '#6b7280'; // Gray for default
        }
    }

    private extractPlatform(actionOrTrigger: any): string {
        if (!actionOrTrigger) return '';
        
        return actionOrTrigger.integration || 
               actionOrTrigger.platform || 
               actionOrTrigger.service || 
               actionOrTrigger.provider || 
               '';
    }
}

serve(async (req) => {
    console.log('🚀 Compact Diagram Generator - Request received');
    
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

        console.log('📋 Processing compact blueprint:', {
            hasSteps: !!automation_blueprint.steps,
            stepCount: automation_blueprint.steps?.length || 0,
            stepTypes: automation_blueprint.steps?.map((s: any) => s.type) || []
        });

        // Use compact diagram builder
        const builder = new CompactDiagramBuilder(automation_blueprint);
        const diagramData = builder.build();

        console.log('✅ Generated compact diagram:', {
            nodes: diagramData.nodes.length,
            edges: diagramData.edges.length,
            nodeTypes: [...new Set(diagramData.nodes.map(n => n.type))]
        });

        return new Response(JSON.stringify(diagramData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 Error in compact diagram generator:', error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Compact diagram generation failed',
                details: error.toString()
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
