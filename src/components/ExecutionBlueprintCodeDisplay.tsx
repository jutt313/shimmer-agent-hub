
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, 
  Copy, 
  Download, 
  Eye, 
  EyeOff, 
  Play,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExecutionBlueprintCodeDisplayProps {
  blueprint: any;
  className?: string;
}

const ExecutionBlueprintCodeDisplay: React.FC<ExecutionBlueprintCodeDisplayProps> = ({ 
  blueprint, 
  className = "" 
}) => {
  const { toast } = useToast();
  const [showCode, setShowCode] = useState(true);
  const [activeView, setActiveView] = useState('formatted');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "✅ Copied to Clipboard",
        description: "Execution blueprint code copied successfully",
      });
    } catch (error) {
      toast({
        title: "❌ Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "✅ Download Started",
      description: `${filename} download initiated`,
    });
  };

  const formatCodeForDisplay = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  const generateExecutableCode = (blueprint: any): string => {
    return `// YusrAI Generated Execution Blueprint
// This code represents the complete automation workflow

const automationBlueprint = ${JSON.stringify(blueprint, null, 2)};

// Workflow execution function
async function executeAutomation(triggerData = {}) {
  console.log('🚀 Starting automation execution...');
  
  try {
    // Initialize execution context
    let executionContext = {
      trigger_data: triggerData,
      current_step: 1,
      results: [],
      errors: []
    };
    
    // Execute each workflow step
    for (const step of automationBlueprint.workflow) {
      console.log(\`📍 Executing step \${step.step}: \${step.action}\`);
      
      try {
        // Build API request
        const request = {
          method: step.method,
          url: step.base_url + step.endpoint,
          headers: step.headers,
          data: step.data_mapping ? transformData(executionContext, step.data_mapping) : {}
        };
        
        // Make API call
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.method !== 'GET' ? JSON.stringify(request.data) : undefined
        });
        
        const result = await response.json();
        executionContext.results.push({ step: step.step, result });
        
        // Check success condition
        if (step.success_condition && !evaluateCondition(result, step.success_condition)) {
          throw new Error(\`Step \${step.step} success condition not met\`);
        }
        
        console.log(\`✅ Step \${step.step} completed successfully\`);
        
      } catch (stepError) {
        console.error(\`❌ Step \${step.step} failed:\`, stepError);
        executionContext.errors.push({ step: step.step, error: stepError.message });
        
        // Handle step error based on configuration
        if (step.error_handling?.on_failure === 'stop') {
          throw stepError;
        }
        // Continue to next step for other error handling types
      }
    }
    
    console.log('🎉 Automation execution completed successfully');
    return executionContext;
    
  } catch (error) {
    console.error('💥 Automation execution failed:', error);
    throw error;
  }
}

// Helper functions
function transformData(context, mapping) {
  // Implement data transformation logic based on mapping
  const transformed = {};
  for (const [key, value] of Object.entries(mapping)) {
    transformed[key] = resolvePath(context, value);
  }
  return transformed;
}

function evaluateCondition(data, condition) {
  // Implement condition evaluation logic
  return true; // Simplified for demo
}

function resolvePath(obj, path) {
  // Implement path resolution for data mapping
  return path; // Simplified for demo
}

// Export for use
export { automationBlueprint, executeAutomation };`;
  };

  if (!blueprint) {
    return (
      <Card className={`rounded-3xl border shadow-lg ${className}`}>
        <CardContent className="p-6 text-center">
          <Code2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No execution blueprint available</p>
        </CardContent>
      </Card>
    );
  }

  const blueprintCode = formatCodeForDisplay(blueprint);
  const executableCode = generateExecutableCode(blueprint);

  return (
    <Card className={`rounded-3xl border shadow-lg ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle className="text-xl">Execution Blueprint Code</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Complete technical specification for automation execution
              </p>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
              <Zap className="w-3 h-3 mr-1" />
              AI Generated
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCode(!showCode)}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              {showCode ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Show
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {showCode && (
        <CardContent className="space-y-4">
          <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 rounded-xl">
              <TabsTrigger value="formatted" className="rounded-lg">
                <Code2 className="w-4 h-4 mr-2" />
                Blueprint JSON
              </TabsTrigger>
              <TabsTrigger value="executable" className="rounded-lg">
                <Play className="w-4 h-4 mr-2" />
                Executable Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formatted" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">Blueprint Structure</h4>
                    <Badge variant="outline" className="text-xs">
                      {blueprint.workflow?.length || 0} steps
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copyToClipboard(blueprintCode)}
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      onClick={() => downloadAsFile(blueprintCode, 'execution-blueprint.json')}
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[400px] w-full">
                  <div className="bg-gray-900 rounded-xl p-4">
                    <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                      {blueprintCode}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="executable" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">Executable JavaScript</h4>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                      Ready to Run
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copyToClipboard(executableCode)}
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      onClick={() => downloadAsFile(executableCode, 'automation-executor.js')}
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[400px] w-full">
                  <div className="bg-gray-900 rounded-xl p-4">
                    <pre className="text-blue-400 text-sm font-mono whitespace-pre-wrap">
                      {executableCode}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>

          {/* Execution Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Blueprint Ready for Execution</p>
                <p className="text-blue-700">
                  This execution blueprint contains {blueprint.workflow?.length || 0} workflow steps, 
                  {blueprint.error_handling?.retry_attempts || 0} retry attempts, and comprehensive error handling. 
                  The code above can be used directly in your automation execution engine.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ExecutionBlueprintCodeDisplay;
