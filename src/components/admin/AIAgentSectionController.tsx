
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Target
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
    defaultInstructions: 'Keep summary concise, business-focused, and under 3 lines'
  },
  steps: {
    name: 'Steps Section', 
    icon: Workflow,
    description: 'Numbered step-by-step process breakdown',
    defaultInstructions: 'Provide clear, numbered steps with data transformation details'
  },
  platforms: {
    name: 'Platforms Section',
    icon: Database,
    description: 'Platform credentials and integration requirements',
    defaultInstructions: 'Use exact platform names and real credential field names'
  },
  clarification_questions: {
    name: 'Clarification Questions',
    icon: TestTube,
    description: 'Specific questions to gather missing information',
    defaultInstructions: 'Ask specific, actionable questions, maximum 5 per response'
  },
  agents: {
    name: 'AI Agents Section',
    icon: Brain,
    description: 'AI agent recommendations and specifications',
    defaultInstructions: 'Recommend agents for complex decision-making and data processing'
  },
  test_payloads: {
    name: 'Test Payloads Section',
    icon: Target,
    description: 'Real API endpoints and test configurations',
    defaultInstructions: 'Include base_url, test_endpoint, success/error indicators, validation_rules'
  },
  execution_blueprint: {
    name: 'Execution Blueprint',
    icon: Settings,
    description: 'Complete technical execution specification',
    defaultInstructions: 'Include base_url, exact endpoints, methods, headers for each workflow step'
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

      if (error) throw error;

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
        configs[config.section_name] = {
          ...config,
          rules: config.rules || [],
          examples: config.examples || []
        };
      });

      setSectionConfigs(configs);
    } catch (error) {
      console.error('Error loading section configurations:', error);
      toast({
        title: "Error Loading Configurations",
        description: "Failed to load section configurations",
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

      if (error) throw error;

      toast({
        title: "✅ Configuration Saved",
        description: `${SECTION_DEFINITIONS[sectionName as keyof typeof SECTION_DEFINITIONS].name} configuration saved successfully`,
      });
    } catch (error) {
      console.error('Error saving section configuration:', error);
      toast({
        title: "❌ Save Failed",
        description: "Failed to save section configuration",
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
    const newRule = `New rule for ${SECTION_DEFINITIONS[sectionName as keyof typeof SECTION_DEFINITIONS].name}`;
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
    const newExample = `Example for ${SECTION_DEFINITIONS[sectionName as keyof typeof SECTION_DEFINITIONS].name}`;
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
    updateSectionConfig(sectionName, 'custom_instructions', SECTION_DEFINITIONS[sectionName as keyof typeof SECTION_DEFINITIONS].defaultInstructions);
    updateSectionConfig(sectionName, 'rules', []);
    updateSectionConfig(sectionName, 'examples', []);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading section configurations...</div>;
  }

  const currentSection = SECTION_DEFINITIONS[activeSection as keyof typeof SECTION_DEFINITIONS];
  const currentConfig = sectionConfigs[activeSection];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            AI Section Controller
          </h2>
          <p className="text-gray-600">
            Customize each of the 7 mandatory ChatAI response sections
          </p>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-white/50 rounded-2xl p-1">
          {Object.entries(SECTION_DEFINITIONS).map(([key, section]) => {
            const IconComponent = section.icon;
            const isActive = sectionConfigs[key]?.is_active;
            return (
              <TabsTrigger 
                key={key}
                value={key} 
                className="flex flex-col items-center gap-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-xs">{section.name.split(' ')[0]}</span>
                {isActive && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">Active</Badge>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(SECTION_DEFINITIONS).map((sectionKey) => (
          <TabsContent key={sectionKey} value={sectionKey} className="mt-6">
            <Card className="rounded-3xl border shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(currentSection.icon, { className: "h-6 w-6 text-purple-600" })}
                    <div>
                      <CardTitle className="text-xl">{currentSection.name}</CardTitle>
                      <CardDescription>{currentSection.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${sectionKey}-active`} className="text-sm font-medium">
                      Active
                    </Label>
                    <Switch
                      id={`${sectionKey}-active`}
                      checked={currentConfig?.is_active}
                      onCheckedChange={(checked) => updateSectionConfig(sectionKey, 'is_active', checked)}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Custom Instructions */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Custom Instructions
                  </Label>
                  <Textarea
                    placeholder={`Add custom instructions for ${currentSection.name}...`}
                    value={currentConfig?.custom_instructions || ''}
                    onChange={(e) => updateSectionConfig(sectionKey, 'custom_instructions', e.target.value)}
                    className="min-h-[100px] rounded-xl border-purple-200 focus:border-purple-500"
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
                      onClick={() => addRule(sectionKey)}
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
                          onChange={(e) => updateRule(sectionKey, index, e.target.value)}
                          className="rounded-xl"
                          placeholder="Enter rule..."
                        />
                        <Button
                          onClick={() => removeRule(sectionKey, index)}
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
                      onClick={() => addExample(sectionKey)}
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
                          onChange={(e) => updateExample(sectionKey, index, e.target.value)}
                          className="rounded-xl"
                          placeholder="Enter example..."
                          rows={2}
                        />
                        <Button
                          onClick={() => removeExample(sectionKey, index)}
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
                    onClick={() => saveSectionConfiguration(sectionKey)}
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
                    onClick={() => resetToDefaults(sectionKey)}
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
          </TabsContent>
        ))}
      </Tabs>

      {/* Status Card */}
      <Card className="rounded-3xl border shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Section Control Status</h3>
              <p className="text-sm text-blue-700">
                Active sections: {Object.values(sectionConfigs).filter(config => config?.is_active).length}/7 • 
                ChatAI will use these configurations for all automation responses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAgentSectionController;
