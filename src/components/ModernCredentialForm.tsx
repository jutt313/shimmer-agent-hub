
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info, ExternalLink, TestTube, Save, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { UniversalPlatformManager } from '@/utils/universalPlatformManager';
import { useAuth } from '@/contexts/AuthContext';

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

  useEffect(() => {
    if (user && automationId && platform.name) {
      loadExistingCredentials();
      loadAutomationContext();
    }
  }, [user, automationId, platform.name]);

  useEffect(() => {
    if (automationContext) {
      generateAutomationContextPayload();
    }
  }, [credentials, automationContext]);

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
      }
    } catch (error) {
      console.error('Failed to load existing credentials:', error);
    }
  };

  const loadAutomationContext = async () => {
    try {
      // Get automation context from Supabase
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

  const generateAutomationContextPayload = async () => {
    try {
      const sampleCall = await UniversalPlatformManager.generateSampleCall(
        platform.name,
        credentials,
        automationContext
      );
      setAutomationContextPayload(sampleCall);
    } catch (error) {
      console.error('Failed to generate automation context payload:', error);
      // Fallback to basic payload
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

    setIsTesting(true);
    setApiResponse(null);
    
    try {
      const result = await UniversalPlatformManager.testCredentials(
        platform.name,
        credentials,
        automationContext
      );

      setTestResult(result);
      setApiResponse(result.response_details);
      
      if (result.success) {
        toast({
          title: "Automation Context Test Successful",
          description: `${platform.name} credentials work with your automation workflow!`,
        });
      } else {
        toast({
          title: "Automation Context Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
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
      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentials,
        user.id
      );

      if (result.success) {
        toast({
          title: "Automation Credentials Saved",
          description: `${platform.name} credentials saved for this automation!`,
        });
        onCredentialSaved?.();
        onClose?.();
      } else {
        toast({
          title: "Save Failed",
          description: result.error || "Failed to save credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Configure {platform.name} for Automation
          </DialogTitle>
          <div className="text-gray-600 mt-2 space-y-1">
            <p className="font-medium">Automation: {automationContext?.title || 'Loading...'}</p>
            <p className="text-sm">{automationContext?.description || 'Test your credentials with real automation workflow operations.'}</p>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
          {/* Left Side - Credential Form */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 rounded-2xl p-6 border border-purple-200/50">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-purple-600" />
                Automation-Specific Credentials
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
                              <strong>For this automation:</strong> {cred.why_needed}
                              {automationContext && (
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                  <strong>Workflow:</strong> {automationContext.title}
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
                      Testing with Automation...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test with Automation
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
                      Save for Automation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side - Automation Context API Playground */}
          <div className="space-y-4">
            {/* Automation Context Info */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200/50">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Automation Context
              </h4>
              <div className="text-xs text-indigo-700 space-y-1">
                <p><strong>Workflow:</strong> {automationContext?.title || 'Loading...'}</p>
                <p><strong>Purpose:</strong> {automationContextPayload?.task_description || 'Testing credentials...'}</p>
              </div>
            </div>

            {/* Request Payload */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200/50">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-green-600" />
                Automation API Request
              </h4>
              <div className="bg-gray-900 rounded-xl p-4 overflow-auto" style={{ height: '200px' }}>
                <pre className="text-green-400 text-sm font-mono">
                  {automationContextPayload ? JSON.stringify(automationContextPayload.request, null, 2) : 'Loading automation context...'}
                </pre>
              </div>
            </div>

            {/* API Response */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Automation API Response
              </h4>
              <div className="bg-gray-900 rounded-xl p-4 overflow-auto" style={{ height: '280px' }}>
                {apiResponse ? (
                  <pre className="text-blue-400 text-sm font-mono">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center space-y-2">
                      <TestTube className="w-8 h-8 mx-auto opacity-50" />
                      <p className="text-sm">
                        Click "Test with Automation" to see how your credentials work with the actual automation workflow
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="pt-4 border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              🔒 Credentials are encrypted and stored securely • 🤖 AI-powered automation context testing
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
