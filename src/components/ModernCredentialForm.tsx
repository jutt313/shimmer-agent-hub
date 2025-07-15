
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info, ExternalLink, TestTube, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
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
  const [apiPayload, setApiPayload] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  useEffect(() => {
    if (user && automationId && platform.name) {
      loadExistingCredentials();
      generateSamplePayload();
    }
  }, [user, automationId, platform.name]);

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

  const generateSamplePayload = () => {
    const samplePayload = {
      method: "GET",
      url: `https://api.${platform.name.toLowerCase()}.com/v1/auth/verify`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer [YOUR_API_KEY]",
        "User-Agent": "YusrAI-Platform-Test/1.0"
      }
    };
    setApiPayload(samplePayload);
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update payload with real credential
    if (apiPayload && value) {
      const updatedPayload = { ...apiPayload };
      if (updatedPayload.headers && updatedPayload.headers.Authorization) {
        updatedPayload.headers.Authorization = `Bearer ${value}`;
      }
      setApiPayload(updatedPayload);
    }
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
      const result = await AutomationCredentialManager.testCredentials(
        user.id,
        automationId,
        platform.name,
        credentials
      );

      setTestResult(result);
      
      // Mock API response for demonstration
      const mockResponse = {
        status: result.success ? 200 : 401,
        statusText: result.success ? "OK" : "Unauthorized",
        data: result.success ? {
          authenticated: true,
          user_id: "12345",
          permissions: ["read", "write"],
          rate_limit: {
            remaining: 4999,
            limit: 5000,
            reset_time: "2024-01-15T12:00:00Z"
          }
        } : {
          error: "Invalid API key",
          code: "UNAUTHORIZED",
          message: result.message
        },
        headers: {
          "content-type": "application/json",
          "x-ratelimit-remaining": "4999",
          "x-ratelimit-limit": "5000"
        },
        request_time_ms: 145
      };
      
      setApiResponse(mockResponse);
      
      if (result.success) {
        toast({
          title: "Credentials Verified",
          description: `${platform.name} credentials are working correctly!`,
        });
      } else {
        toast({
          title: "Test Failed",
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
          title: "Credentials Saved",
          description: `${platform.name} credentials saved successfully!`,
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
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
            Configure {platform.name} Credentials
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Test your credentials first, then save them securely for this automation.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
          {/* Left Side - Credential Form */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 rounded-2xl p-6 border border-purple-200/50">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Platform Credentials</h3>
              
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
                              {cred.why_needed}
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

          {/* Right Side - API Playground */}
          <div className="space-y-4">
            {/* Request Payload */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200/50">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">API Request</h4>
              <div className="bg-gray-900 rounded-xl p-4 overflow-auto" style={{ height: '200px' }}>
                <pre className="text-green-400 text-sm font-mono">
                  {JSON.stringify(apiPayload, null, 2)}
                </pre>
              </div>
            </div>

            {/* API Response */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">API Response</h4>
              <div className="bg-gray-900 rounded-xl p-4 overflow-auto" style={{ height: '280px' }}>
                {apiResponse ? (
                  <pre className="text-blue-400 text-sm font-mono">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p className="text-center">
                      Click "Test Credentials" to see the API response
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200/50">
          <p className="text-xs text-center text-gray-500">
            Credentials are encrypted and stored securely • AI-powered platform support
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModernCredentialForm;
