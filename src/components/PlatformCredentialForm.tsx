
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Eye, EyeOff, Code } from 'lucide-react';
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

interface PlatformCredentialFormProps {
  platform: Platform;
  onClose: () => void;
  onCredentialSaved: (platformName: string) => void;
  onCredentialTested: (platformName: string) => void;
}

const PlatformCredentialForm = ({ 
  platform, 
  onClose, 
  onCredentialSaved, 
  onCredentialTested 
}: PlatformCredentialFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const [showTestScript, setShowTestScript] = useState(false);
  const [testConfig, setTestConfig] = useState<any>(null);

  // Initialize credentials and check for existing ones
  useEffect(() => {
    if (!user) return;

    const initializeForm = async () => {
      console.log(`🔍 Initializing form for ${platform.name}...`);
      setIsCheckingExisting(true);
      
      // Initialize empty credentials structure
      const initialCredentials: Record<string, string> = {};
      platform.credentials.forEach(cred => {
        const normalizedField = cred.field.toLowerCase().replace(/\s+/g, '_');
        initialCredentials[normalizedField] = '';
      });
      
      // Extract test configuration from platform test_payloads if available
      if (platform.test_payloads && platform.test_payloads.length > 0) {
        const testPayload = platform.test_payloads[0];
        setTestConfig(testPayload.api_config || testPayload);
        console.log(`✅ Using pre-generated test config for ${platform.name}:`, testPayload);
      }
      
      try {
        // Check for existing credentials
        const existingCreds = await SecureCredentialManager.getCredentials(user.id, platform.name);
        
        if (existingCreds && Object.keys(existingCreds).length > 0) {
          console.log(`✅ Found existing credentials for ${platform.name}`);
          
          // Show masked versions in read-only mode
          const maskedCreds: Record<string, string> = {};
          Object.keys(existingCreds).forEach(key => {
            maskedCreds[key] = '••••••••••••••••';
          });
          
          setCredentials(maskedCreds);
          setIsReadOnly(true);
          setTestStatus('success');
          setTestMessage('Credentials are saved and verified');
        } else {
          console.log(`❌ No existing credentials for ${platform.name}`);
          setCredentials(initialCredentials);
          setIsReadOnly(false);
          setTestStatus('idle');
          setTestMessage('');
        }
      } catch (error) {
        console.error(`❌ Error checking existing credentials for ${platform.name}:`, error);
        setCredentials(initialCredentials);
        setIsReadOnly(false);
        setTestStatus('idle');
        setTestMessage('');
      } finally {
        setIsCheckingExisting(false);
      }
    };

    initializeForm();
  }, [user, platform.name, platform.credentials, platform.test_payloads]);

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
    if (!testConfig) return "No test configuration available";
    
    const baseUrl = testConfig.base_url || testConfig.api_config?.base_url || `https://api.${platform.name.toLowerCase()}.com`;
    const endpoint = testConfig.test_endpoint || testConfig.api_config?.test_endpoint || '/test';
    const method = testConfig.method || 'GET';
    
    // Inject real credential values into script
    let authHeader = 'Authorization: Bearer YOUR_API_KEY';
    const apiKeyField = Object.keys(credentials).find(key => 
      key.includes('api_key') || key.includes('token') || key.includes('key')
    );
    
    if (apiKeyField && credentials[apiKeyField] && credentials[apiKeyField] !== '••••••••••••••••') {
      authHeader = `Authorization: Bearer ${credentials[apiKeyField]}`;
    }
    
    return `curl -X ${method} "${baseUrl}${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "${authHeader}" \\
  -d '${JSON.stringify(testConfig.test_data || {}, null, 2)}'

Expected Success Response:
${JSON.stringify(testConfig.expected_response || { success: true }, null, 2)}`;
  };

  const handleTest = async () => {
    if (!user || !validateCredentials() || isReadOnly) return;

    setIsTestingCredentials(true);
    setTestStatus('testing');
    setTestMessage('Testing credentials...');

    try {
      const filteredCredentials = Object.fromEntries(
        Object.entries(credentials).filter(([_, value]) => value.trim() !== '')
      );

      const response = await supabase.functions.invoke('test-credential', {
        body: {
          platformName: platform.name,
          credentials: filteredCredentials,
          testConfig: testConfig,
          userId: user.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Test request failed');
      }

      const result = response.data;

      if (result.success) {
        setTestStatus('success');
        setTestMessage('Credentials verified successfully!');
        toast({
          title: "Test Successful",
          description: 'Credentials are valid and working!',
        });
        onCredentialTested(platform.name);
      } else {
        setTestStatus('error');
        setTestMessage(result.message || 'Credential test failed');
        toast({
          title: "Test Failed",
          description: result.message || 'Invalid credentials or connection failed',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(error.message || 'Test failed');
      toast({
        title: "Test Error",
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

      console.log(`💾 Saving credentials for ${platform.name}...`);

      const success = await SecureCredentialManager.storeCredentials(
        user.id,
        platform.name,
        filteredCredentials
      );

      if (success) {
        console.log(`✅ Successfully saved credentials for ${platform.name}`);
        
        // Update form to read-only immediately
        const maskedCreds: Record<string, string> = {};
        Object.keys(filteredCredentials).forEach(key => {
          maskedCreds[key] = '••••••••••••••••';
        });
        
        setCredentials(maskedCreds);
        setIsReadOnly(true);
        setTestStatus('success');
        setTestMessage('Credentials are saved and verified');
        
        toast({
          title: "Success",
          description: `${platform.name} credentials saved successfully!`,
        });
        
        // Notify parent component immediately
        onCredentialSaved(platform.name);
        
        // Close the modal after a short delay
        setTimeout(() => onClose(), 1000);
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error: any) {
      console.error(`❌ Failed to save credentials for ${platform.name}:`, error);
      toast({
        title: "Save Failed",
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
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-800">
              Loading {platform.name} Credentials...
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-purple-800">
            {isReadOnly ? `${platform.name} Credentials (Saved)` : `Setup ${platform.name} Credentials`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live Test Script Preview */}
          {testConfig && !isReadOnly && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-blue-900">Live Test Script Preview</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTestScript(!showTestScript)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showTestScript ? 'Hide' : 'Show'} Script
                </Button>
              </div>
              
              {showTestScript && (
                <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono text-green-400 overflow-auto max-h-48">
                  <pre>{generateLiveTestScript()}</pre>
                </div>
              )}
              
              <p className="text-xs text-blue-700 mt-2">
                💡 This script updates in real-time as you enter your credentials below
              </p>
            </div>
          )}

          {/* Credential Input Fields */}
          {platform.credentials.map((cred, index) => {
            const normalizedField = cred.field.toLowerCase().replace(/\s+/g, '_');
            const inputType = getInputType(cred.field);
            const showPassword = showPasswords[normalizedField];
            const currentValue = credentials[normalizedField] || '';
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={normalizedField} className="text-sm font-medium text-purple-700">
                    {cred.field}
                  </Label>
                  {cred.link && !isReadOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(cred.link, '_blank')}
                      className="text-purple-600 hover:text-purple-700 p-1 h-auto"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get Key
                    </Button>
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    id={normalizedField}
                    type={inputType === 'password' && !showPassword ? 'password' : 'text'}
                    placeholder={isReadOnly ? 'Saved and verified' : cred.placeholder}
                    value={currentValue}
                    onChange={(e) => handleInputChange(cred.field, e.target.value)}
                    className={`rounded-2xl border-purple-300 focus:border-purple-500 focus:ring-purple-200 ${
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-full"
                      onClick={() => togglePasswordVisibility(cred.field)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                
                {!isReadOnly && (
                  <p className="text-xs text-purple-600">{cred.why_needed}</p>
                )}
              </div>
            );
          })}

          {/* Test Status Display */}
          {testStatus !== 'idle' && (
            <div className={`p-3 rounded-2xl text-sm ${
              testStatus === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : testStatus === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {testStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                {testStatus === 'success' && <CheckCircle className="h-4 w-4" />}
                {testStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                <span>{testMessage}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isReadOnly ? (
            <div className="flex justify-center pt-4">
              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Credentials Saved
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={isTestingCredentials || isLoading}
                className="flex-1 rounded-2xl border-purple-400 text-purple-700 hover:bg-purple-100"
              >
                {isTestingCredentials ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tested ✓
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isLoading || isTestingCredentials || testStatus !== 'success'}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Credentials'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformCredentialForm;
