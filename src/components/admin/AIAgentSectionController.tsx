
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3,
  Brain,
  TestTube,
  MessageSquare,
  Users,
  Database,
  Workflow,
  Target,
  ChevronDown,
  CheckCircle
} from 'lucide-react';

interface SectionConfig {
  id?: string;
  section_name: string;
  custom_instructions: string;
  rules: string[];
  examples: string[];
  is_active: boolean;
}

const SECTION_DEFINITIONS = {
  summary: {
    name: 'Summary Section',
    icon: MessageSquare,
    description: '2-3 line business explanation of automation purpose',
    defaultInstructions: 'Keep summary concise, business-focused, and under 3 lines. Focus on the business value and outcome.',
    placeholder: 'This automation helps users by...',
    helpText: 'The summary should explain WHAT the automation does and WHY it\'s valuable in simple business terms.'
  },
  steps: {
    name: 'Steps Section', 
    icon: Workflow,
    description: 'Numbered step-by-step process breakdown',
    defaultInstructions: 'Provide clear, numbered steps with data transformation details. Include input/output for each step.',
    placeholder: '1. Connect to platform\n2. Extract data\n3. Transform data...',
    helpText: 'Break down the automation into logical, sequential steps that are easy to follow and understand.'
  },
  platforms: {
    name: 'Platforms Section',
    icon: Database,
    description: 'Platform credentials and integration requirements',
    defaultInstructions: 'Use exact platform names and real credential field names. Include OAuth flows where applicable.',
    placeholder: 'Platform: Slack\nCredentials: OAuth token, Bot token\nPermissions: Read messages, Send messages',
    helpText: 'Specify exactly which platforms are used and what credentials/permissions are needed.'
  },
  clarification_questions: {
    name: 'Clarification Questions',
    icon: TestTube,
    description: 'Specific questions to gather missing information',
    defaultInstructions: 'Ask specific, actionable questions, maximum 5 per response. Make questions clear and focused.',
    placeholder: '1. Which Slack channel should receive notifications?\n2. What triggers should activate this automation?',
    helpText: 'Ask targeted questions to fill in gaps in the automation requirements.'
  },
  agents: {
    name: 'AI Agents Section',
    icon: Brain,
    description: 'AI agent recommendations and specifications',
    defaultInstructions: 'Recommend agents for complex decision-making and data processing. Include agent goals and rules.',
    placeholder: 'Agent: Content Moderator\nGoal: Review and classify incoming content\nRules: Flag inappropriate content, Categorize by topic',
    helpText: 'Suggest AI agents that can handle complex logic, decision-making, or data processing within the automation.'
  },
  test_payloads: {
    name: 'Test Payloads Section',
    icon: Target,
    description: 'Real API endpoints and test configurations',
    defaultInstructions: 'Include base_url, test_endpoint, success/error indicators, validation_rules for dynamic testing.',
    placeholder: 'base_url: https://api.platform.com\ntest_endpoint: /v1/auth/test\nmethod: GET\nexpected_response: {"status": "success"}',
    helpText: 'Define how to test the integration with real API endpoints and what responses to expect.'
  },
  execution_blueprint: {
    name: 'Execution Blueprint',
    icon: Settings,
    description: 'Complete technical execution specification',
    defaultInstructions: 'Include base_url, exact endpoints, methods, headers for each workflow step with error handling.',
    placeholder: 'Step 1:\n  endpoint: /v1/users\n  method: POST\n  headers: {"Authorization": "Bearer {{token}}"}\n  body: {"name": "{{user_name}}"}',
    helpText: 'Provide the complete technical specification for executing each step of the automation.'
  }
};

const AIAgentSectionController = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('summary');
  const [sectionConfigs, setSectionConfigs] = useState<Record<string, SectionConfig>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSectionConfigurations();
  }, []);

  const loadSectionConfigurations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_section_configurations')
        .select('*');

      if (error) {
        console.error('Error loading configurations:', error);
        toast({
          title: "Error Loading Configurations",
          description: "Failed to load section configurations. Please check your permissions.",
          variant: "destructive",
        });
        return;
      }

      const configs: Record<string, SectionConfig> = {};
      
      // Initialize with defaults
      Object.keys(SECTION_DEFINITIONS).forEach(sectionName => {
        configs[sectionName] = {
          section_name: sectionName,
          custom_instructions: SECTION_DEFINITIONS[sectionName as keyof typeof SECTION_DEFINITIONS].defaultInstructions,
          rules: [],
          examples: [],
          is_active: true
        };
      });

      // Override with saved configs
      data?.forEach((config: any) => {
        if (configs[config.section_name]) {
          configs[config.section_name] = {
            ...config,
            rules: config.rules || [],
            examples: config.examples || []
          };
        }
      });

      setSectionConfigs(configs);
    } catch (error) {
      console.error('Error loading section configurations:', error);
      toast({
        title: "Error Loading Configurations",
        description: "An unexpected error occurred while loading configurations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSectionConfiguration = async (sectionName: string) => {
    setSaving(true);
    try {
      const config = sectionConfigs[sectionName];
      
      const { error } = await supabase
        .from('ai_section_configurations')
        .upsert({
          section_name: sectionName,
          custom_instructions: config.custom_instructions,
          rules: config.rules,
          examples: config.examples,
          is_active: config.is_active
        });

      if (error) {
        console.error('Error saving configuration:', error);
        toast({
          title: "❌ Save Failed",
          description: `Failed to save ${SECTION_DEFINITIONS[sectionName as keyof typeof SECTION_DEFINITIONS].name} configuration.`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ Configuration Saved",
        description: `${SECTION_DEFINITIONS[sectionName as keyof typeof SECTION_DEFINITIONS].name} configuration saved successfully!`,
      });
    } catch (error) {
      console.error('Error saving section configuration:', error);
      toast({
        title: "❌ Save Failed",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSectionConfig = (sectionName: string, field: keyof SectionConfig, value: any) => {
    setSectionConfigs(prev => ({
      ...prev,
      [sectionName]: {
        ...prev[sectionName],
        [field]: value
      }
    }));
  };

  const addRule = (sectionName: string) => {
    const newRule = '';
    updateSectionConfig(sectionName, 'rules', [...(sectionConfigs[sectionName]?.rules || []), newRule]);
  };

  const removeRule = (sectionName: string, index: number) => {
    const rules = [...(sectionConfigs[sectionName]?.rules || [])];
    rules.splice(index, 1);
    updateSectionConfig(sectionName, 'rules', rules);
  };

  const updateRule = (sectionName: string, index: number, value: string) => {
    const rules = [...(sectionConfigs[sectionName]?.rules || [])];
    rules[index] = value;
    updateSectionConfig(sectionName, 'rules', rules);
  };

  const addExample = (sectionName: string) => {
    const newExample = '';
    updateSectionConfig(sectionName, 'examples', [...(sectionConfigs[sectionName]?.examples || []), newExample]);
  };

  const removeExample = (sectionName: string, index: number) => {
    const examples = [...(sectionConfigs[sectionName]?.examples || [])];
    examples.splice(index, 1);
    updateSectionConfig(sectionName, 'examples', examples);
  };

  const updateExample = (sectionName: string, index: number, value: string) => {
    const examples = [...(sectionConfigs[sectionName]?.examples || [])];
    examples[index] = value;
    updateSectionConfig(sectionName, 'examples', examples);
  };

  const resetToDefaults = (sectionName: string) => {
    const sectionDef = SECTION_DEFINITIONS[sectionName as keyof typeof SECTION_DEFINITIONS];
    updateSectionConfig(sectionName, 'custom_instructions', sectionDef.defaultInstructions);
    updateSectionConfig(sectionName, 'rules', []);
    updateSectionConfig(sectionName, 'examples', []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading section configurations...</span>
      </div>
    );
  }

  const currentSectionDef = SECTION_DEFINITIONS[activeSection as keyof typeof SECTION_DEFINITIONS];
  const currentConfig = sectionConfigs[activeSection];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            AI Section Controller
          </h2>
          <p className="text-gray-600">
            Configure how ChatAI responds for each of the 7 mandatory sections
          </p>
        </div>
      </div>

      {/* Section Selection Dropdown */}
      <Card className="rounded-3xl border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Section Selection
          </CardTitle>
          <CardDescription>
            Choose which section to configure. Each section controls how the AI responds to automation requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label className="text-sm font-medium">Select Section to Configure</Label>
            <Select value={activeSection} onValueChange={setActiveSection}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="Choose a section" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SECTION_DEFINITIONS).map(([key, section]) => {
                  const IconComponent = section.icon;
                  const isActive = sectionConfigs[key]?.is_active;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{section.name}</span>
                        {isActive && <CheckCircle className="w-3 h-3 text-green-500" />}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Current Section Configuration */}
      <Card className="rounded-3xl border shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {React.createElement(currentSectionDef.icon, { className: "h-6 w-6 text-purple-600" })}
              <div>
                <CardTitle className="text-xl">{currentSectionDef.name}</CardTitle>
                <CardDescription>{currentSectionDef.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`${activeSection}-active`} className="text-sm font-medium">
                Active
              </Label>
              <Switch
                id={`${activeSection}-active`}
                checked={currentConfig?.is_active}
                onCheckedChange={(checked) => updateSectionConfig(activeSection, 'is_active', checked)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Help Text */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">How this section works:</h4>
            <p className="text-sm text-blue-700">{currentSectionDef.helpText}</p>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Custom Instructions
            </Label>
            <Textarea
              placeholder={currentSectionDef.placeholder}
              value={currentConfig?.custom_instructions || ''}
              onChange={(e) => updateSectionConfig(activeSection, 'custom_instructions', e.target.value)}
              className="min-h-[120px] rounded-xl border-purple-200 focus:border-purple-500"
            />
          </div>

          {/* Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Rules ({currentConfig?.rules?.length || 0})
              </Label>
              <Button
                onClick={() => addRule(activeSection)}
                size="sm"
                variant="outline"
                className="rounded-xl"
                disabled={saving}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Rule
              </Button>
            </div>
            <div className="space-y-2">
              {currentConfig?.rules?.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={rule}
                    onChange={(e) => updateRule(activeSection, index, e.target.value)}
                    className="rounded-xl"
                    placeholder="Enter a rule for this section..."
                  />
                  <Button
                    onClick={() => removeRule(activeSection, index)}
                    size="sm"
                    variant="destructive"
                    className="rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Examples ({currentConfig?.examples?.length || 0})
              </Label>
              <Button
                onClick={() => addExample(activeSection)}
                size="sm"
                variant="outline"
                className="rounded-xl"
                disabled={saving}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Example
              </Button>
            </div>
            <div className="space-y-2">
              {currentConfig?.examples?.map((example, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Textarea
                    value={example}
                    onChange={(e) => updateExample(activeSection, index, e.target.value)}
                    className="rounded-xl"
                    placeholder="Enter an example for this section..."
                    rows={3}
                  />
                  <Button
                    onClick={() => removeExample(activeSection, index)}
                    size="sm"
                    variant="destructive"
                    className="rounded-xl mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={() => saveSectionConfiguration(activeSection)}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              {saving ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>

            <Button
              onClick={() => resetToDefaults(activeSection)}
              variant="outline"
              className="rounded-xl"
              disabled={saving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card className="rounded-3xl border shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Configuration Status</h3>
              <p className="text-sm text-blue-700">
                Active sections: {Object.values(sectionConfigs).filter(config => config?.is_active).length}/7 • 
                Current section: {currentSectionDef.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAgentSectionController;
