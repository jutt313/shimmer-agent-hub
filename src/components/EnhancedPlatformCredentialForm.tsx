
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Eye, EyeOff, Code, PlayCircle, Database } from 'lucide-react';
import { SecureCredentialManager } from '@/utils/secureCredentials';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
  test_payloads?: Array<{
    platform: string;
    test_data: any;
    field_mapping: Record<string, string>;
    api_config: any;
  }>;
}

interface EnhancedPlatformCredentialFormProps {
  platform: Platform;
  automationId: string;
  onClose: () => void;
  onCredentialSaved: (platformName: string) => void;
  onCredentialTested: (platformName: string) => void;
}

const EnhancedPlatformCredentialForm = ({ 
  platform, 
  automationId,
  onClose, 
  onCredentialSaved, 
  onCredentialTested 
}: EnhancedPlatformCredentialFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const [showTestScript, setShowTestScript] = useState(true);
  const [testConfig, setTestConfig] = useState<any>(null);

  // Initialize credentials and check for existing ones
  useEffect(() => {
    if (!user) return;

    const initializeForm = async () => {
      console.log(`🔍 ENHANCED FORM: Initializing for ${platform.name} in automation ${automationId}...`);
      setIsCheckingExisting(true);
      
      // Initialize empty credentials structure from AI-generated fields
      const initialCredentials: Record<string, string> = {};
      platform.credentials.forEach(cred => {
        const normalizedField = cred.field.toLowerCase().replace(/\s+/g, '_');
        initialCredentials[normalizedField] = '';
      });
      
      // Extract test configuration from platform test_payloads if available
      if (platform.test_payloads && platform.test_payloads.length > 0) {
        const testPayload = platform.test_payloads[0];
        setTestConfig(testPayload.api_config || testPayload);
        console.log(`✅ ENHANCED FORM: Using AI-generated test config for ${platform.name}:`, testPayload);
      }
      
      try {
        // Check for existing credentials using UNIFIED system
        const existingCreds = await SecureCredentialManager.getCredentials(
          user.id, 
          platform.name, 
          automationId
        );
        
        if (existingCreds && Object.keys(existingCreds).length > 0) {
          console.log(`✅ ENHANCED FORM: Found existing credentials for ${platform.name}:`, Object.keys(existingCreds));
          
          // Show masked versions in read-only mode
          const maskedCreds: Record<string, string> = {};
          Object.keys(existingCreds).forEach(key => {
            maskedCreds[key] = '••••••••••••••••';
          });
          
          setCredentials(maskedCreds);
          setIsReadOnly(true);
          setTestStatus('success');
          setTestMessage('Credentials are saved and verified in unified system');
        } else {
          console.log(`❌ ENHANCED FORM: No existing credentials for ${platform.name}`);
          setCredentials(initialCredentials);
          setIsReadOnly(false);
          setTestStatus('idle');
          setTestMessage('');
        }
      } catch (error) {
        console.error(`❌ ENHANCED FORM: Error checking existing credentials for ${platform.name}:`, error);
        setCredentials(initialCredentials);
        setIsReadOnly(false);
        setTestStatus('idle');
        setTestMessage('');
      } finally {
        setIsCheckingExisting(false);
      }
    };

    initializeForm();
  }, [user, platform.name, platform.credentials, platform.test_payloads, automationId]);

  const handleInputChange = (field: string, value: string) => {
    if (isReadOnly) return;
    
    const normalizedField = field.toLowerCase().replace(/\s+/g, '_');
    setCredentials(prev => ({
      ...prev,
      [normalizedField]: value
    }));
  };

  const togglePasswordVisibility = (field: string) => {
    const normalizedField = field.toLowerCase().replace(/\s+/g, '_');
    setShowPasswords(prev => ({
      ...prev,
      [normalizedField]: !prev[normalizedField]
    }));
  };

  const validateCredentials = () => {
    if (isReadOnly) return true;
    
    const requiredFields = platform.credentials.map(cred => 
      cred.field.toLowerCase().replace(/\s+/g, '_')
    );
    
    const missingFields = requiredFields.filter(field => !credentials[field]?.trim());
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in all required fields`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const generateLiveTestScript = () => {
    if (!testConfig) return "// No test configuration available\n// AI will generate one during testing";
    
    const baseUrl = testConfig.base_url || testConfig.api_config?.base_url || `https://api.${platform.name.toLowerCase()}.com`;
    const endpoint = testConfig.test_endpoint || testConfig.api_config?.test_endpoint || '/test';
    const method = testConfig.method || 'GET';
    
    // Inject REAL credential values into script (LIVE PREVIEW)
    let authHeader = 'Authorization: Bearer YOUR_API_KEY';
    const apiKeyField = Object.keys(credentials).find(key => 
      key.includes('api_key') || key.includes('token') || key.includes('key')
    );
    
    if (apiKeyField && credentials[apiKeyField] && credentials[apiKeyField] !== '••••••••••••••••') {
      authHeader = `Authorization: Bearer ${credentials[apiKeyField]}`;
    }
    
    return `// 🚀 AI-Generated Live Test Script for ${platform.name}
// This script updates in REAL-TIME as you type!

curl -X ${method} "${baseUrl}${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "${authHeader}" \\
  -d '${JSON.stringify(testConfig.test_data || {}, null, 2)}'

// Expected Success Response:
${JSON.stringify(testConfig.expected_response || { success: true }, null, 2)}

// ✅ This test will verify your ${platform.name} credentials work correctly`;
  };

  const handleTest = async () => {
    if (!user || !validateCredentials() || isReadOnly) return;

    setIsTestingCredentials(true);
    setTestStatus('testing');
    setTestMessage('🧪 Testing credentials with AI-generated configuration...');
    setTestResponse(null);

    try {
      const filteredCredentials = Object.fromEntries(
        Object.entries(credentials).filter(([_, value]) => value.trim() !== '')
      );

      console.log(`🧪 ENHANCED TEST: Testing credentials for ${platform.name} with AI config:`, testConfig);

      const response = await supabase.functions.invoke('test-credential', {
        body: {
          platformName: platform.name,
          credentials: filteredCredentials,
          testConfig: testConfig,
          userId: user.id,
          automationId: automationId,
          universal_ai_testing: true,
          force_ai_generation: true
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Test request failed');
      }

      const result = response.data;
      setTestResponse(result);

      if (result.success) {
        setTestStatus('success');
        setTestMessage('✅ Credentials verified successfully with AI-generated test configuration!');
        toast({
          title: "🎉 Test Successful",
          description: 'Credentials are valid and working with AI test configuration!',
        });
        onCredentialTested(platform.name);
      } else {
        setTestStatus('error');
        setTestMessage(result.message || '❌ Credential test failed');
        toast({
          title: "❌ Test Failed",
          description: result.message || 'Invalid credentials or connection failed',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(error.message || '❌ Test failed');
      setTestResponse({ error: error.message });
      toast({
        title: "❌ Test Error",
        description: error.message || 'Failed to test credentials',
        variant: "destructive",
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const handleSave = async () => {
    if (!user || !validateCredentials() || isReadOnly) return;

    setIsLoading(true);

    try {
      const filteredCredentials = Object.fromEntries(
        Object.entries(credentials).filter(([_, value]) => value.trim() !== '')
      );

      console.log(`💾 ENHANCED SAVE: Saving credentials for ${platform.name} in automation ${automationId}...`);

      const success = await SecureCredentialManager.storeCredentials(
        user.id,
        platform.name,
        filteredCredentials,
        automationId
      );

      if (success) {
        console.log(`✅ ENHANCED SAVE: Successfully saved credentials for ${platform.name}`);
        
        // Update form to read-only immediately
        const maskedCreds: Record<string, string> = {};
        Object.keys(filteredCredentials).forEach(key => {
          maskedCreds[key] = '••••••••••••••••';
        });
        
        setCredentials(maskedCreds);
        setIsReadOnly(true);
        setTestStatus('success');
        setTestMessage('✅ Credentials are saved and verified in unified system');
        
        toast({
          title: "🎉 Success",
          description: `${platform.name} credentials saved successfully in unified system!`,
        });
        
        onCredentialSaved(platform.name);
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error: any) {
      console.error(`❌ ENHANCED SAVE: Failed to save credentials for ${platform.name}:`, error);
      toast({
        title: "❌ Save Failed",
        description: error.message || 'Failed to save credentials',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInputType = (field: string) => {
    const lowerField = field.toLowerCase();
    if (lowerField.includes('password') || 
        lowerField.includes('secret') || 
        lowerField.includes('key') ||
        lowerField.includes('token')) {
      return 'password';
    }
    if (lowerField.includes('email')) {
      return 'email';
    }
    return 'text';
  };

  const shouldShowPasswordToggle = (field: string) => {
    return getInputType(field) === 'password' && !isReadOnly;
  };

  // Show loading state while checking for existing credentials
  if (isCheckingExisting) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-800 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Loading {platform.name} Credentials... (Enhanced Unified System)
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-800 flex items-center gap-3">
            <Database className="h-6 w-6" />
            {isReadOnly ? `${platform.name} Credentials (✅ Saved - Enhanced System)` : `🚀 Setup ${platform.name} Credentials (Enhanced System)`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI-Generated Live Test Script Preview */}
          {testConfig && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Code className="w-6 h-6 text-green-600" />
                  <h4 className="text-lg font-bold text-green-900">🤖 AI-Generated Live Test Script</h4>
                  <span className="text-sm bg-green-200 text-green-800 px-3 py-1 rounded-full font-semibold">LIVE PREVIEW</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTestScript(!showTestScript)}
                  className="text-green-600 hover:text-green-700"
                >
                  {showTestScript ? 'Hide' : 'Show'} Script
                </Button>
              </div>
              
              {showTestScript && (
                <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm text-green-400 overflow-auto max-h-64">
                  <pre>{generateLiveTestScript()}</pre>
                </div>
              )}
              
              <p className="text-sm text-green-700 mt-3 font-medium">
                🚀 This script uses AI-generated test configuration and updates in REAL-TIME as you type your credentials!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Credential Fields */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-purple-800 border-b border-purple-200 pb-2">
                🔐 {platform.name} Credential Fields (AI-Generated)
              </h3>
              
              {platform.credentials.map((cred, index) => {
                const normalizedField = cred.field.toLowerCase().replace(/\s+/g, '_');
                const inputType = getInputType(cred.field);
                const showPassword = showPasswords[normalizedField];
                const currentValue = credentials[normalizedField] || '';
                
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={normalizedField} className="text-sm font-bold text-purple-700">
                        🤖 {cred.field}
                      </Label>
                      {cred.link && !isReadOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(cred.link, '_blank')}
                          className="text-purple-600 hover:text-purple-700 p-2 h-auto"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Get Key
                        </Button>
                      )}
                    </div>
                    
                    <div className="relative">
                      <Input
                        id={normalizedField}
                        type={inputType === 'password' && !showPassword ? 'password' : 'text'}
                        placeholder={isReadOnly ? 'Saved and verified in enhanced system' : cred.placeholder}
                        value={currentValue}
                        onChange={(e) => handleInputChange(cred.field, e.target.value)}
                        className={`rounded-2xl border-purple-300 focus:border-purple-500 focus:ring-purple-200 text-base py-3 ${
                          isReadOnly ? 'bg-green-50 border-green-300 text-green-800' : ''
                        }`}
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                      />
                      
                      {shouldShowPasswordToggle(cred.field) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                          onClick={() => togglePasswordVisibility(cred.field)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {!isReadOnly && (
                      <p className="text-sm text-purple-600 bg-purple-50 rounded-lg p-2">{cred.why_needed}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column: Test Results & Response */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-purple-800 border-b border-purple-200 pb-2">
                🧪 Test Results & Response
              </h3>

              {/* Test Status Display */}
              {testStatus !== 'idle' && (
                <div className={`p-4 rounded-2xl text-sm border-2 ${
                  testStatus === 'success' 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : testStatus === 'error'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testStatus === 'testing' && <Loader2 className="h-5 w-5 animate-spin" />}
                    {testStatus === 'success' && <CheckCircle className="h-5 w-5" />}
                    {testStatus === 'error' && <AlertCircle className="h-5 w-5" />}
                    <span className="font-bold">{testMessage}</span>
                  </div>
                </div>
              )}

              {/* Test Response Box */}
              {testResponse && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Live Test Response
                  </h4>
                  <div className="bg-white rounded-xl p-4 font-mono text-sm max-h-64 overflow-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Placeholder when no test results */}
              {testStatus === 'idle' && !testResponse && (
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 text-center">
                  <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Test your credentials to see the response here</p>
                  <p className="text-gray-500 text-sm mt-2">AI will validate your credentials and show detailed results</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isReadOnly ? (
            <div className="flex justify-center pt-6">
              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-8 py-3 text-lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                ✅ Credentials Saved (Enhanced System)
              </Button>
            </div>
          ) : (
            <div className="flex gap-4 pt-6">
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={isTestingCredentials || isLoading}
                className="flex-1 rounded-2xl border-purple-400 text-purple-700 hover:bg-purple-100 py-3 text-base"
              >
                {isTestingCredentials ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    🧪 Testing with AI Config...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    ✅ AI Test Passed
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-5 w-5 mr-2" />
                    🧪 Test with AI Config
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isLoading || isTestingCredentials || testStatus !== 'success'}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-3 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    💾 Saving to Enhanced System...
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5 mr-2" />
                    💾 Save to Enhanced System
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedPlatformCredentialForm;
