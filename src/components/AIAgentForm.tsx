import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client"; // ADD THIS IMPORT
import { useAuth } from "@/contexts/AuthContext"; // ADD THIS IMPORT
import { useToast } from "@/components/ui/use-toast"; // ADD THIS IMPORT

interface AIAgentFormProps {
  automationId: string; // ADD THIS PROP: The ID of the current automation
  onClose: () => void;
  onAgentSaved: (agentName: string, agentId: string) => void; // ADD THIS PROP: Callback when agent is saved
}

const llmOptions = {
  "OpenAI": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini"], // Added more models
  "Claude": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"], // Added more specific Claude models
  "Gemini": ["gemini-pro", "gemini-1.5-pro-latest", "gemini-1.0-pro"], // Added more specific Gemini models
  "Grok": ["grok-1", "grok-1.5"], // Simplified Grok options
  "DeepSeek": ["deepseek-chat", "deepseek-coder"] // Simplified DeepSeek options
};

const AIAgentForm = ({ automationId, onClose, onAgentSaved }: AIAgentFormProps) => { // Destructure new props
  const { user } = useAuth(); // Get authenticated user
  const { toast } = useToast(); // Get toast function

  const [selectedLLM, setSelectedLLM] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    rule: "",
    goal: "",
    memory: "",
    apiKey: "" // This will ideally be stored in platform_credentials later, but keeping for now
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleTestAPI = () => {
    toast({
      title: "Test Connection",
      description: "API testing functionality is not yet implemented for AI agents.",
      variant: "default",
    });
    // API test logic would go here, likely calling a backend function
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    if (!formData.name || !selectedLLM || !selectedModel || !formData.role || !formData.goal || !formData.apiKey) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Save AI Agent details to public.ai_agents table
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          automation_id: automationId, // Associate with the current automation
          agent_name: formData.name.trim(),
          agent_role: formData.role.trim(),
          agent_goal: formData.goal.trim(),
          agent_rules: formData.rule.trim() || null, // Allow null for optional fields
          agent_memory: formData.memory.trim() ? JSON.parse(formData.memory.trim()) : null, // Assuming memory might be JSON
          // Note: LLM and Model are not directly in ai_agents table.
          // In a real scenario, you'd save the API key to platform_credentials
          // and potentially link the agent to a platform/model setup.
          // For now, we'll focus on the core agent fields.
          // API Key storage logic would go here, possibly to platform_credentials for security
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `AI Agent "${formData.name}" saved!`,
      });
      
      // Call the onAgentSaved callback passed from parent (AutomationDetail)
      onAgentSaved(data.agent_name, data.id); // Pass name and new agent ID
      onClose(); // Close the form
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
              placeholder="Set memory context for the agent (e.g., JSON string)"
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
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                style={{ boxShadow: '0 0 20px rgba(92, 142, 246, 0.3)' }}
              >
                Test
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving} // Disable button while saving
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