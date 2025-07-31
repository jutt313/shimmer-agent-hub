import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, ExternalLink, TestTube, Save, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { UniversalPlatformManager, mapCredentialsForPlatform, AI_MODEL_CONFIGS } from '@/utils/universalPlatformManager';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ModernCredentialFormProps {
  automationId: string;
  platform: {
    name: string;
    credentials: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  };
  onCredentialSaved?: () => void;
  onClose?: () => void;
  isOpen: boolean;
}

const ModernCredentialForm = ({ 
  automationId, 
  platform, 
  onCredentialSaved,
  onClose,
  isOpen
}: ModernCredentialFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [automationContextPayload, setAutomationContextPayload] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [automationContext, setAutomationContext] = useState<any>(null);
  const [aiGeneratedTestConfig, setAiGeneratedTestConfig] = useState<any>(null);
  const [isGeneratingConfig, setIsGeneratingConfig] = useState(false);

  // AI Configuration States
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');

  useEffect(() => {
    if (user && automationId && platform.name) {
      loadExistingCredentials();
      loadAutomationContext();
      generateAITestConfiguration();
    }
  }, [user, automationId, platform.name]);

  useEffect(() => {
    if (automationContext) {
      generateAutomationContextPayload();
    }
  }, [credentials, automationContext, selectedModel, systemPrompt]);

  // Initialize AI model selection for AI platforms
  useEffect(() => {
    const aiConfig = AI_MODEL_CONFIGS[platform.name];
    if (aiConfig && !selectedModel) {
      setSelectedModel(aiConfig.defaultModel);
    }
  }, [platform.name, selectedModel]);

  const loadExistingCredentials = async () => {
    if (!user) return;

    try {
      const existingCredentials = await AutomationCredentialManager.getCredentials(
        automationId,
        platform.name,
        user.id
      );

      if (existingCredentials) {
        setCredentials(existingCredentials);
        
        // Load AI configs if they exist
        if (existingCredentials.model) {
          setSelectedModel(existingCredentials.model);
        }
        if (existingCredentials.system_prompt) {
          setSystemPrompt(existingCredentials.system_prompt);
        }
      }
    } catch (error) {
      console.error('Failed to load existing credentials:', error);
    }
  };

  const loadAutomationContext = async () => {
    try {
      const { data: automationData } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .single();

      if (automationData) {
        setAutomationContext(automationData);
      }
    } catch (error) {
      console.error('Failed to load automation context:', error);
    }
  };

  const generateAITestConfiguration = async () => {
    if (!platform.name) return;
    
    setIsGeneratingConfig(true);
    try {
      console.log(`🤖 FIXED: Generating AI test configuration for ${platform.name}`);
      
      // 🎯 FIX 1: Request specific test configuration, not automation blueprint
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate ONLY a test configuration JSON for ${platform.name} platform.

RETURN ONLY this exact JSON structure:
{
  "platform_name": "${platform.name}",
  "base_url": "https://api.${platform.name.toLowerCase()}.com",
  "test_endpoint": {
    "method": "GET",
    "path": "/me",
    "headers": {
      "Content-Type": "application/json"
    },
    "query_params": {}
  },
  "authentication": {
    "type": "bearer",
    "location": "header",
    "parameter_name": "Authorization",
    "format": "Bearer {api_key}"
  },
  "field_mappings": {
    "api_key": "api_key"
  },
  "success_indicators": {
    "status_codes": [200],
    "response_patterns": ["id", "name", "email"]
  },
  "error_patterns": {
    "401": "Invalid credentials",
    "403": "Access denied"
  },
  "ai_generated": true
}

Platform: ${platform.name}
Return ONLY the JSON with no extra text.`,
          messages: [],
          requestType: 'test_config_generation'
        }
      });

      if (error) {
        console.error('🚨 FIXED: Failed to generate AI test config:', error);
        setAiGeneratedTestConfig(null);
        return;
      }

      // 🎯 FIX 2: Handle ChatAI's wrapped response structure correctly
      console.log('🔍 FIXED: Raw ChatAI response:', data);
      
      let testConfig;
      try {
        // ChatAI returns {response: "JSON_STRING", yusrai_powered: true, ...}
        // We need to extract and parse the response field
        let configText = data?.response || data;
        
        if (typeof configText === 'string') {
          // Extract JSON from the response string
          const jsonMatch = configText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            testConfig = JSON.parse(jsonMatch[0]);
          }
        } else if (typeof configText === 'object') {
          testConfig = configText;
        }

        // 🎯 FIX 3: Validate that config has required fields
        if (testConfig && testConfig.base_url && testConfig.test_endpoint && testConfig.authentication) {
          testConfig.ai_generated = true;
          testConfig.platform_name = platform.name;
          
          // Add success indicators if missing
          if (!testConfig.success_indicators) {
            testConfig.success_indicators = {
              status_codes: [200],
              response_patterns: ["id", "name", "email"]
            };
          }
          
          setAiGeneratedTestConfig(testConfig);
          console.log(`✅ FIXED: AI test configuration generated for ${platform.name}:`, testConfig);
        } else {
          console.warn('🚨 FIXED: Invalid AI test configuration - using fallback');
          // 🎯 FIX 4: Create proper fallback configuration
          const fallbackConfig = {
            platform_name: platform.name,
            base_url: `https://api.${platform.name.toLowerCase()}.com`,
            test_endpoint: {
              method: "GET",
              path: "/me",
              headers: { "Content-Type": "application/json" }
            },
            authentication: {
              type: "bearer",
              location: "header",
              parameter_name: "Authorization",
              format: "Bearer {api_key}"
            },
            field_mappings: { "api_key": "api_key" },
            success_indicators: {
              status_codes: [200],
              response_patterns: ["id", "name"]
            },
            error_patterns: {
              "401": "Invalid credentials",
              "403": "Access denied"
            },
            ai_generated: false,
            fallback_config: true
          };
          
          setAiGeneratedTestConfig(fallbackConfig);
        }

      } catch (parseError) {
        console.error('🚨 FIXED: Failed to parse AI test config:', parseError);
        
        // 🎯 FIX 5: Always provide fallback even on parse error
        const fallbackConfig = {
          platform_name: platform.name,
          base_url: `https://api.${platform.name.toLowerCase()}.com`,
          test_endpoint: {
            method: "GET",
            path: "/test",
            headers: { "Content-Type": "application/json" }
          },
          authentication: {
            type: "bearer",
            location: "header", 
            parameter_name: "Authorization",
            format: "Bearer {api_key}"
          },
          field_mappings: { "api_key": "api_key" },
          success_indicators: {
            status_codes: [200],
            response_patterns: ["success", "data"]
          },
          error_patterns: {
            "401": "Invalid API key",
            "403": "Access denied"
          },
          ai_generated: false,
          fallback_config: true,
          parse_error: true
        };
        
        setAiGeneratedTestConfig(fallbackConfig);
      }

    } catch (error) {
      console.error('🚨 FIXED: Failed to generate AI test configuration:', error);
      
      // 🎯 FIX 6: Always provide fallback on any error
      const fallbackConfig = {
        platform_name: platform.name,
        base_url: `https://api.${platform.name.toLowerCase()}.com`,
        test_endpoint: {
          method: "GET",
          path: "/status",
          headers: { "Content-Type": "application/json" }
        },
        authentication: {
          type: "bearer",
          location: "header",
          parameter_name: "Authorization", 
          format: "Bearer {api_key}"
        },
        field_mappings: { "api_key": "api_key" },
        success_indicators: {
          status_codes: [200],
          response_patterns: ["ok", "status"]
        },
        error_patterns: {
          "401": "Invalid credentials",
          "403": "Access denied"
        },
        ai_generated: false,
        fallback_config: true,
        system_error: true
      };
      
      setAiGeneratedTestConfig(fallbackConfig);
    } finally {
      setIsGeneratingConfig(false);
    }
  };

  const generateAutomationContextPayload = async () => {
    try {
      let credentialsWithAI = { ...credentials };
      if (selectedModel) credentialsWithAI.model = selectedModel;
      if (systemPrompt) credentialsWithAI.system_prompt = systemPrompt;

      const sampleCall = await UniversalPlatformManager.generateSampleCall(
        platform.name,
        credentialsWithAI,
        automationContext
      );
      setAutomationContextPayload(sampleCall);
    } catch (error) {
      console.error('Failed to generate automation context payload:', error);
      const fallbackPayload = {
        task_description: `${platform.name} operation for automation: ${automationContext?.title || 'Unnamed Automation'}`,
        automation_context: 'Automation-aware testing',
        request: {
          method: "GET",
          url: `https://api.${platform.name.toLowerCase()}.com/test`,
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer [YOUR_API_KEY]",
            "User-Agent": "YusrAI-Automation-Context-Test/1.0"
          }
        },
        expected_response: {
          success: true,
          message: "Authentication successful for automation context"
        }
      };
      setAutomationContextPayload(fallbackPayload);
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const hasAllCredentials = platform.credentials.every(cred => 
    credentials[cred.field] && credentials[cred.field].trim() !== ''
  );

  const handleTest = async () => {
    if (!user || !hasAllCredentials) return;

    // 🎯 FIX 7: Remove strict validation that prevents testing with fallback
    if (!aiGeneratedTestConfig) {
      toast({
        title: "⚠️ Configuration Missing",
        description: "Test configuration is not available. Please wait for generation to complete.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setApiResponse(null);
    
    try {
      let credentialsWithAI = { ...credentials };
      if (selectedModel) credentialsWithAI.model = selectedModel;
      if (systemPrompt) credentialsWithAI.system_prompt = systemPrompt;

      console.log(`🧪 FIXED: Testing ${platform.name} with config:`, aiGeneratedTestConfig.ai_generated ? 'AI-generated' : 'fallback');
      console.log(`🎯 FIXED: Sending testConfig to backend:`, aiGeneratedTestConfig);

      const { data: result, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platformName: platform.name,
          credentials: credentialsWithAI,
          testConfig: aiGeneratedTestConfig, // Send the config we have (AI or fallback)
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      setTestResult(result);
      setApiResponse(result.details);
      
      if (result.success) {
        toast({
          title: "✅ Test Successful",
          description: `${platform.name} credentials verified using ${aiGeneratedTestConfig.ai_generated ? 'AI-generated' : 'fallback'} configuration!`,
        });
      } else {
        toast({
          title: "❌ Test Failed", 
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(`💥 FIXED: Test error for ${platform.name}:`, error);
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!user || !hasAllCredentials) return;

    setIsSaving(true);
    try {
      let credentialsToSave = { ...credentials };
      if (selectedModel) credentialsToSave.model = selectedModel;
      if (systemPrompt) credentialsToSave.system_prompt = systemPrompt;

      console.log(`💾 Saving ${platform.name} credentials:`, Object.keys(credentialsToSave));

      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentialsToSave,
        user.id
      );

      if (result.success) {
        toast({
          title: "✅ Dynamic Automation Credentials Saved",
          description: `${platform.name} credentials saved for fully dynamic automation!`,
        });
        onCredentialSaved?.();
        onClose?.();
      } else {
        toast({
          title: "❌ Save Failed",
          description: result.error || "Failed to save credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(`💥 Save error for ${platform.name}:`, error);
      toast({
        title: "Save Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInputType = (field: string) => {
    const lowerField = field.toLowerCase();
    return lowerField.includes('password') || 
           lowerField.includes('secret') || 
           lowerField.includes('key') ||
           lowerField.includes('token') ? 'password' : 'text';
  };

  const isAIPlatform = AI_MODEL_CONFIGS[platform.name];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Dynamic {platform.name} Configuration
          </DialogTitle>
          <div className="text-gray-600 mt-2 space-y-1">
            <p className="font-medium">Automation: {automationContext?.title || 'Loading...'}</p>
            <p className="text-sm">{automationContext?.description || 'Configure your credentials with AI-generated testing.'}</p>
            
            {/* 🎯 FIX 8: Improved UI status logic with proper state transitions */}
            {isGeneratingConfig && (
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating AI test configuration...</span>
              </div>
            )}
            {!isGeneratingConfig && aiGeneratedTestConfig && aiGeneratedTestConfig.ai_generated && (
              <div className="text-xs text-green-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>✅ AI configuration ready: {aiGeneratedTestConfig.base_url}</span>
              </div>
            )}
            {!isGeneratingConfig && aiGeneratedTestConfig && !aiGeneratedTestConfig.ai_generated && (
              <div className="text-xs text-orange-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>⚠️ Using fallback configuration: {aiGeneratedTestConfig.base_url}</span>
              </div>
            )}
            {!isGeneratingConfig && !aiGeneratedTestConfig && (
              <div className="text-xs text-red-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>❌ Configuration generation failed</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-[600px] w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
            {/* Left Side - Credential Form */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 rounded-2xl p-6 border border-purple-200/50">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-purple-600" />
                  Platform Credentials
                </h3>
                
                <div className="space-y-5">
                  {platform.credentials.map((cred, index) => {
                    const inputType = getInputType(cred.field);
                    const showPassword = showPasswords[cred.field];
                    const currentValue = credentials[cred.field] || '';
                    
                    return (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-gray-700">
                              {cred.field}
                            </Label>
                            <div className="group relative">
                              <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              <div className="absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                <strong>Required:</strong> {cred.why_needed}
                                {automationContext && (
                                  <div className="mt-2 pt-2 border-t border-gray-700">
                                    <strong>Automation:</strong> {automationContext.title}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {cred.link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(cred.link, '_blank')}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="relative">
                          <Input
                            type={inputType === 'password' && !showPassword ? 'password' : 'text'}
                            placeholder={cred.placeholder}
                            value={currentValue}
                            onChange={(e) => handleCredentialChange(cred.field, e.target.value)}
                            className="rounded-xl border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white/70 pr-12"
                          />
                          
                          {inputType === 'password' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-purple-100"
                              onClick={() => togglePasswordVisibility(cred.field)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* AI Model Configuration for AI platforms */}
                  {isAIPlatform && (
                    <div className="space-y-5 pt-4 border-t border-purple-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        AI Model Configuration
                      </h4>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">AI Model</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="rounded-xl border-purple-200 focus:border-purple-500">
                            <SelectValue placeholder="Select an AI model" />
                          </SelectTrigger>
                          <SelectContent>
                            {isAIPlatform.models.map((model: any) => (
                              <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {isAIPlatform.supportsSystemPrompt && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">System Prompt (Saved for Automation)</Label>
                          <Textarea
                            placeholder="You are a helpful AI assistant..."
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="rounded-xl border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white/70 min-h-[100px]"
                          />
                          <p className="text-xs text-gray-500">This system prompt will be saved and used for all automation calls.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                  <Button
                    onClick={handleTest}
                    disabled={!hasAllCredentials || isTesting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Credentials
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={!testResult?.success || isSaving}
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Credentials
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Side - Configuration & Test Results */}
            <div className="space-y-4">
              {/* 🎯 FIX 9: Improved configuration status display */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200/50">
                <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Configuration Status
                </h4>
                <div className="text-xs text-indigo-700 space-y-1">
                  <p><strong>Platform:</strong> {platform.name}</p>
                  <p><strong>Status:</strong> {
                    isGeneratingConfig ? '⏳ Generating...' : 
                    aiGeneratedTestConfig?.ai_generated ? '✅ AI Config Ready' :
                    aiGeneratedTestConfig?.fallback_config ? '⚠️ Using Fallback' :
                    '❌ No Configuration'
                  }</p>
                  {aiGeneratedTestConfig && (
                    <p><strong>Endpoint:</strong> {aiGeneratedTestConfig.base_url}</p>
                  )}
                </div>
              </div>

              {/* Test Configuration Display */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200/50">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-green-600" />
                  Test Configuration
                </h4>
                <ScrollArea className="h-[200px] w-full">
                  <div className="bg-gray-900 rounded-xl p-4">
                    <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                      {aiGeneratedTestConfig ? JSON.stringify(aiGeneratedTestConfig, null, 2) : (isGeneratingConfig ? 'Generating configuration...' : 'No configuration available')}
                    </pre>
                  </div>
                </ScrollArea>
              </div>

              {/* API Response */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Test Response
                </h4>
                <ScrollArea className="h-[280px] w-full">
                  <div className="bg-gray-900 rounded-xl p-4">
                    {apiResponse ? (
                      <pre className="text-blue-400 text-sm font-mono whitespace-pre-wrap">
                        {JSON.stringify(apiResponse, null, 2)}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center space-y-2">
                          <TestTube className="w-8 h-8 mx-auto opacity-50" />
                          <p className="text-sm">
                            Click "Test Credentials" to see the API response
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              🔒 Credentials are encrypted and stored securely • 🤖 AI-powered testing with fallback
            </p>
            {testResult?.success && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <TestTube className="w-4 h-4" />
                <span>Ready for automation execution</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModernCredentialForm;
