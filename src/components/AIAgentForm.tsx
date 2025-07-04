
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface AIAgentFormProps {
  automationId?: string;
  onClose: () => void;
  onAgentSaved?: (agentName: string, agentId?: string, llmProvider?: string, model?: string, config?: any, apiKey?: string) => void;
  initialAgentData?: {
    name: string;
    role: string;
    goal: string;
    rules?: string;
    memory?: string;
    why_needed?: string;
  };
}

const llmOptions = {
  "OpenAI": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini"],
  "Claude": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
  "Gemini": ["gemini-pro", "gemini-1.5-pro-latest", "gemini-1.0-pro"],
  "Grok": ["grok-1", "grok-1.5"],
  "DeepSeek": ["deepseek-chat", "deepseek-coder"]
};

const AIAgentForm = ({ automationId, onClose, onAgentSaved, initialAgentData }: AIAgentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedLLM, setSelectedLLM] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    rule: "",
    goal: "",
    memory: "",
    apiKey: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Auto-fill form when initialAgentData is provided
  useEffect(() => {
    if (initialAgentData) {
      setFormData({
        name: initialAgentData.name || "",
        role: initialAgentData.role || "",
        rule: initialAgentData.rules || "",
        goal: initialAgentData.goal || "",
        memory: initialAgentData.memory || "",
        apiKey: ""
      });
    }
  }, [initialAgentData]);

  const handleTestAPI = async () => {
    if (!formData.name || !selectedLLM || !selectedModel || !formData.role || !formData.goal || !formData.apiKey) {
      toast({
        title: "Error",
        description: "Please fill all required fields before testing.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      console.log('🤖 Testing AI Agent:', formData.name);

      // First save the agent temporarily to get an ID for testing
      const agentConfig = {
        automation_id: automationId || '00000000-0000-0000-0000-000000000000',
        agent_name: formData.name.trim(),
        agent_role: formData.role.trim(),
        agent_goal: formData.goal.trim(),
        agent_rules: formData.rule.trim() || null,
        agent_memory: formData.memory.trim() ? { context: formData.memory.trim() } : null,
        llm_provider: selectedLLM,
        model: selectedModel,
        api_key: formData.apiKey,
      };

      const { data: tempAgent, error: saveError } = await supabase
        .from('ai_agents')
        .insert(agentConfig)
        .select()
        .single();

      if (saveError) throw saveError;

      // Test the agent
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          type: 'agent',
          agent_id: tempAgent.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Test Successful",
          description: data.user_message,
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: data.user_message,
          variant: "destructive",
        });
        console.error('Agent test technical details:', data.technical_details);
      }

      // Delete the temporary agent after testing
      await supabase
        .from('ai_agents')
        .delete()
        .eq('id', tempAgent.id);

    } catch (error: any) {
      console.error('AI Agent test error:', error);
      toast({
        title: "Test Failed",
        description: `Failed to test AI Agent: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !selectedLLM || !selectedModel || !formData.role || !formData.goal || !formData.apiKey) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Prepare agent configuration
      const agentConfig = {
        role: formData.role.trim(),
        goal: formData.goal.trim(),
        rules: formData.rule.trim() || null,
        memory: formData.memory.trim() || null,
      };

      // Only save to ai_agents table if we have an automationId
      if (automationId && user?.id) {
        // For database storage, try to parse memory as JSON if it's provided
        let memoryForDB = null;
        if (formData.memory.trim()) {
          try {
            memoryForDB = JSON.parse(formData.memory.trim());
          } catch (e) {
            // If it's not valid JSON, store as simple string object
            memoryForDB = { context: formData.memory.trim() };
          }
        }

        const { data, error } = await supabase
          .from('ai_agents')
          .insert({
            automation_id: automationId,
            agent_name: formData.name.trim(),
            agent_role: formData.role.trim(),
            agent_goal: formData.goal.trim(),
            agent_rules: formData.rule.trim() || null,
            agent_memory: memoryForDB,
            llm_provider: selectedLLM,
            model: selectedModel,
            api_key: formData.apiKey,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: `AI Agent "${formData.name}" saved with ${selectedLLM}/${selectedModel}!`,
        });
        
        onAgentSaved?.(data.agent_name, data.id, selectedLLM, selectedModel, agentConfig, formData.apiKey);
      } else {
        // Handle case where no automationId is provided (e.g., from Index page)
        toast({
          title: "Agent Configuration",
          description: `AI Agent "${formData.name}" configured with ${selectedLLM}/${selectedModel}! This will be used for general chat.`,
        });
        
        onAgentSaved?.(formData.name.trim(), undefined, selectedLLM, selectedModel, agentConfig, formData.apiKey);
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error saving AI agent:", error);
      toast({
        title: "Error",
        description: `Failed to save AI Agent: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white/80 backdrop-blur-md rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 relative"
        style={{
          boxShadow: '0 0 60px rgba(92, 142, 246, 0.3), 0 0 120px rgba(154, 94, 255, 0.2)'
        }}
      >
        {/* Close button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 rounded-full hover:bg-gray-100/50"
        >
          <X className="w-5 h-5" />
        </Button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Configure AI Agent
        </h2>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-gray-700 font-medium">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter agent name"
              className="mt-2 rounded-xl border-0 bg-white/60 shadow-md focus:shadow-lg transition-shadow"
              style={{ boxShadow: '0 0 15px rgba(154, 94, 255, 0.1)' }}
            />
          </div>

          {/* LLM Selection */}
          <div>
            <Label className="text-gray-700 font-medium">Choose LLM</Label>
            <Select value={selectedLLM} onValueChange={setSelectedLLM}>
              <SelectTrigger 
                className="mt-2 rounded-xl border-0 bg-white/60 shadow-md focus:shadow-lg transition-shadow"
                style={{ boxShadow: '0 0 15px rgba(154, 94, 255, 0.1)' }}
              >
                <SelectValue placeholder="Select LLM" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-0 bg-white/90 backdrop-blur-md shadow-2xl">
                {Object.keys(llmOptions).map((llm) => (
                  <SelectItem key={llm} value={llm} className="rounded-lg">{llm}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          {selectedLLM && (
            <div>
              <Label className="text-gray-700 font-medium">Choose Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger 
                  className="mt-2 rounded-xl border-0 bg-white/60 shadow-md focus:shadow-lg transition-shadow"
                  style={{ boxShadow: '0 0 15px rgba(154, 94, 255, 0.1)' }}
                >
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-0 bg-white/90 backdrop-blur-md shadow-2xl">
                  {llmOptions[selectedLLM as keyof typeof llmOptions].map((model) => (
                    <SelectItem key={model} value={model} className="rounded-lg">{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Role */}
          <div>
            <Label htmlFor="role" className="text-gray-700 font-medium">Role</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              placeholder="Define the agent's role"
              className="mt-2 rounded-xl border-0 bg-white/60 shadow-md focus:shadow-lg transition-shadow"
              style={{ boxShadow: '0 0 15px rgba(154, 94, 255, 0.1)' }}
            />
          </div>

          {/* Rule */}
          <div>
            <Label htmlFor="rule" className="text-gray-700 font-medium">Rule</Label>
            <Textarea
              id="rule"
              value={formData.rule}
              onChange={(e) => setFormData({...formData, rule: e.target.value})}
              placeholder="Set the rules for the agent"
              className="mt-2 rounded-xl border-0 bg-white/60 shadow-md focus:shadow-lg transition-shadow resize-none"
              style={{ boxShadow: '0 0 15px rgba(154, 94, 255, 0.1)' }}
              rows={3}
            />
          </div>

          {/* Goal */}
          <div>
            <Label htmlFor="goal" className="text-gray-700 font-medium">Goal</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData({...formData, goal: e.target.value})}
              placeholder="Define the agent's goals"
              className="mt-2 rounded-xl border-0 bg-white/60 shadow-md focus:shadow-lg transition-shadow resize-none"
              style={{ boxShadow: '0 0 15px rgba(154, 94, 255, 0.1)' }}
              rows={3}
            />
          </div>

          {/* Memory */}
          <div>
            <Label htmlFor="memory" className="text-gray-700 font-medium">Memory</Label>
            <Textarea
              id="memory"
              value={formData.memory}
              onChange={(e) => setFormData({...formData, memory: e.target.value})}
              placeholder="Set memory context for the agent (simple text or JSON)"
              className="mt-2 rounded-xl border-0 bg-white/60 shadow-md focus:shadow-lg transition-shadow resize-none"
              style={{ boxShadow: '0 0 15px rgba(154, 94, 255, 0.1)' }}
              rows={3}
            />
          </div>

          {/* API Key */}
          <div>
            <Label htmlFor="apiKey" className="text-gray-700 font-medium">API Key</Label>
            <div className="flex gap-3 mt-2">
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                placeholder="Enter your API key"
                className="flex-1 rounded-xl border-0 bg-white/60 shadow-md focus:shadow-lg transition-shadow"
                style={{ boxShadow: '0 0 15px rgba(154, 94, 255, 0.1)' }}
              />
              <Button
                onClick={handleTestAPI}
                disabled={testing}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                style={{ boxShadow: '0 0 20px rgba(92, 142, 246, 0.3)' }}
              >
                {testing ? "Testing..." : "Test"}
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0 text-lg font-medium disabled:opacity-50"
              style={{ boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)' }}
            >
              {isSaving ? "Saving..." : "Save Agent"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentForm;
