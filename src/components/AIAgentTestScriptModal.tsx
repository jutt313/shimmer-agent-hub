
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AIAgentTestScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentData: {
    name: string;
    role: string;
    rule?: string;
    goal: string;
    memory?: string;
    why_needed?: string;
    system_prompt?: string;
    identity_context?: string;
    operational_rules?: string;
    goals_criteria?: string;
    capabilities_tools?: string;
  };
  llmProvider: string;
  model: string;
  apiKey: string;
}

const AIAgentTestScriptModal = ({
  isOpen,
  onClose,
  agentData,
  llmProvider,
  model,
  apiKey
}: AIAgentTestScriptModalProps) => {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Generate complete system prompt from ChatAI data
  const generateCompleteSystemPrompt = () => {
    if (agentData.system_prompt) {
      return agentData.system_prompt;
    }

    // Fallback: construct from individual fields
    return `# AI Agent System Prompt

## AGENT IDENTITY & CONTEXT
Name: ${agentData.name}
Role: ${agentData.role}
Purpose: ${agentData.why_needed || 'Automation assistant'}

## OPERATIONAL RULES & CONSTRAINTS
${agentData.rule || 'Follow best practices and user guidelines'}

## GOALS & SUCCESS CRITERIA
${agentData.goal}

## MEMORY & CONTEXT
${agentData.memory || 'No specific memory context provided'}

## CAPABILITIES & TOOLS
- LLM Provider: ${llmProvider}
- Model: ${model}
- Context-aware decision making
- Automation workflow integration
`;
  };

  const handleTestAgent = async () => {
    setIsTesting(true);
    setTestStatus('testing');
    setTestResult(null);

    try {
      console.log('🤖 Testing AI Agent with ChatAI system prompt:', agentData.name);

      const systemPrompt = generateCompleteSystemPrompt();
      const testPrompt = `Hello! I am testing your capabilities as an AI agent. Please introduce yourself and explain your role in this automation. Then demonstrate your decision-making abilities with a simple scenario.`;

      const { data, error } = await supabase.functions.invoke('test-agent', {
        body: {
          agent_name: agentData.name,
          system_prompt: systemPrompt,
          test_prompt: testPrompt,
          llm_provider: llmProvider,
          model: model,
          api_key: apiKey,
          agent_data: agentData
        }
      });

      if (error) throw error;

      setTestResult(data);
      const finalStatus = data.success ? 'success' : 'error';
      setTestStatus(finalStatus);

      if (data.success) {
        toast({
          title: "✅ Agent Test Successful",
          description: `${agentData.name} responded correctly with ${llmProvider}/${model}!`,
        });
      } else {
        toast({
          title: "❌ Agent Test Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Agent test error:', error);
      const errorResult = {
        success: false,
        message: error.message || 'Agent test failed',
        details: { error: error.message }
      };
      
      setTestStatus('error');
      setTestResult(errorResult);
      
      toast({
        title: "Test Failed",
        description: `Failed to test AI Agent: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white shadow-lg">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-900">AI Agent Test Script</h3>
              <p className="text-sm text-purple-600 font-normal">
                {agentData.name} • {llmProvider}/{model} • ChatAI Generated
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
              <Play className="w-3 h-3 mr-1" />
              Live Testing
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 rounded-xl p-1">
            <TabsTrigger value="script" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Code className="w-4 h-4 mr-2" />
              System Prompt
            </TabsTrigger>
            <TabsTrigger value="agent-data" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Agent Data
            </TabsTrigger>
            <TabsTrigger value="test-response" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Play className="w-4 h-4 mr-2" />
              Test Response
            </TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="mt-6">
            <div className="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-purple-900 mb-4">Complete System Prompt</h4>
              <ScrollArea className="h-96 w-full rounded-xl border border-purple-200/50 bg-gray-900 p-4">
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {generateCompleteSystemPrompt()}
                </pre>
              </ScrollArea>
              <p className="text-xs text-purple-600 mt-3">
                🚀 This system prompt was generated from ChatAI agent recommendations and will be used for testing
              </p>
            </div>
          </TabsContent>

          <TabsContent value="agent-data" className="mt-6">
            <div className="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-purple-900 mb-4">ChatAI Agent Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50/50 rounded-lg">
                    <h5 className="font-medium text-purple-800">Name</h5>
                    <p className="text-sm text-purple-700">{agentData.name}</p>
                  </div>
                  <div className="p-3 bg-purple-50/50 rounded-lg">
                    <h5 className="font-medium text-purple-800">Role</h5>
                    <p className="text-sm text-purple-700">{agentData.role}</p>
                  </div>
                  <div className="p-3 bg-purple-50/50 rounded-lg">
                    <h5 className="font-medium text-purple-800">Why Needed</h5>
                    <p className="text-sm text-purple-700">{agentData.why_needed || 'Not specified'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/50 rounded-lg">
                    <h5 className="font-medium text-blue-800">Goal</h5>
                    <p className="text-sm text-blue-700">{agentData.goal}</p>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-lg">
                    <h5 className="font-medium text-blue-800">Rules</h5>
                    <p className="text-sm text-blue-700">{agentData.rule || 'No specific rules'}</p>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-lg">
                    <h5 className="font-medium text-blue-800">Memory Context</h5>
                    <p className="text-sm text-blue-700">{agentData.memory || 'No memory context'}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="test-response" className="mt-6">
            <div className="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-purple-900">Live Agent Test</h4>
                {testStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {testStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              </div>
              
              {testResult ? (
                <div className={`rounded-xl p-4 border ${
                  testResult.success 
                    ? 'bg-green-50/50 border-green-200 text-green-900' 
                    : 'bg-red-50/50 border-red-200 text-red-900'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold">
                      {testResult.success ? 'Agent Test Successful' : 'Agent Test Failed'}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{testResult.message}</p>
                  {testResult.agent_response && (
                    <div className="mt-3">
                      <h5 className="font-medium mb-2">Agent Response:</h5>
                      <div className="bg-white/70 rounded-lg p-3 text-sm">
                        {testResult.agent_response}
                      </div>
                    </div>
                  )}
                  {testResult.details && (
                    <ScrollArea className="h-32 w-full rounded-lg bg-white/50 p-3 mt-3">
                      <pre className="text-xs font-mono">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    </ScrollArea>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-purple-600">
                  <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Click "Test Agent" to run a live test with this system prompt</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-purple-200/50">
          <Button
            onClick={handleTestAgent}
            disabled={isTesting}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Agent...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Agent with {llmProvider}/{model}
              </>
            )}
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            className="px-8 rounded-xl border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAgentTestScriptModal;
