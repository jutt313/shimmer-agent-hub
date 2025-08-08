
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AutomationResponse {
  summary?: string;
  steps?: string[];
  platforms?: Array<{
    name: string;
    api_config?: any;
    credentials?: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  }>;
  agents?: Array<{
    name: string;
    role: string;
    goal: string;
    rules: string;
    memory: string;
    why_needed: string;
  }>;
  clarification_questions?: string[];
  automation_blueprint?: any;
}

interface AutomationResponseDisplayProps {
  response: AutomationResponse;
  automationId: string;
  onSave?: () => void;
}

const AutomationResponseDisplay = ({ response, automationId, onSave }: AutomationResponseDisplayProps) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    steps: true,
    platforms: false,
    agents: false,
    blueprint: false
  });
  const { toast } = useToast();

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const saveAutomation = async () => {
    setSaving(true);
    try {
      // Update automation with both blueprint and platforms config
      const { error } = await supabase
        .from('automations')
        .update({
          automation_blueprint: response.automation_blueprint,
          platforms_config: response.platforms || [], // Save the platforms config from AI response
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', automationId);

      if (error) throw error;

      setSaved(true);
      toast({
        title: "Success",
        description: "Automation blueprint and platform configurations saved successfully!",
      });
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving automation:', error);
      toast({
        title: "Error",
        description: "Failed to save automation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!response) {
    return (
      <div className="text-center py-8 text-gray-500">
        No automation response to display
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {response.summary && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">📋 Automation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{response.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Steps Section */}
      {response.steps && response.steps.length > 0 && (
        <Card>
          <Collapsible open={openSections.steps} onOpenChange={() => toggleSection('steps')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    🔄 Automation Steps ({response.steps.length})
                  </CardTitle>
                  {openSections.steps ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ol className="space-y-3">
                  {response.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">{index + 1}</Badge>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Platforms Section */}
      {response.platforms && response.platforms.length > 0 && (
        <Card>
          <Collapsible open={openSections.platforms} onOpenChange={() => toggleSection('platforms')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    🔗 Required Platforms ({response.platforms.length})
                  </CardTitle>
                  {openSections.platforms ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  {response.platforms.map((platform, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-800 mb-2">{platform.name}</h4>
                      {platform.credentials && platform.credentials.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Required Credentials:</p>
                          <ul className="space-y-1">
                            {platform.credentials.map((cred, credIndex) => (
                              <li key={credIndex} className="text-sm text-gray-600">
                                <Badge variant="outline" className="mr-2">{cred.field}</Badge>
                                {cred.why_needed}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* AI Agents Section */}
      {response.agents && response.agents.length > 0 && (
        <Card>
          <Collapsible open={openSections.agents} onOpenChange={() => toggleSection('agents')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    🤖 AI Agents ({response.agents.length})
                  </CardTitle>
                  {openSections.agents ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  {response.agents.map((agent, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-semibold text-blue-800 mb-2">{agent.name}</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Role:</strong> {agent.role}</p>
                        <p><strong>Goal:</strong> {agent.goal}</p>
                        <p><strong>Rules:</strong> {agent.rules}</p>
                        <p><strong>Why Needed:</strong> {agent.why_needed}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Blueprint Section */}
      {response.automation_blueprint && (
        <Card>
          <Collapsible open={openSections.blueprint} onOpenChange={() => toggleSection('blueprint')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    📋 Automation Blueprint
                  </CardTitle>
                  {openSections.blueprint ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-auto max-h-64">
                    {JSON.stringify(response.automation_blueprint, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Clarification Questions */}
      {response.clarification_questions && response.clarification_questions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">❓ Clarification Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {response.clarification_questions.map((question, index) => (
                <li key={index} className="text-yellow-700">• {question}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {response.automation_blueprint && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={saveAutomation}
            disabled={saving || saved}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 rounded-xl shadow-lg"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved Successfully
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Automation"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AutomationResponseDisplay;
