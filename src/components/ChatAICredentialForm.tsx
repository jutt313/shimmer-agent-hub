import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Eye, EyeOff, ExternalLink, Zap, Code2, CheckCircle, AlertCircle, Settings, TestTube } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedCredentialManager } from '@/utils/unifiedCredentialManager';
import { extractTestScript, injectCredentials, formatExecutableScript } from '@/utils/platformTestScriptExtractor';
import { PlatformPersistenceManager } from '@/utils/platformPersistenceManager';
import { DataFlowValidator } from '@/utils/dataFlowValidator';

interface Platform {
  name: string;
  testConfig?: any;
  test_payloads?: any[];
  chatai_data?: any;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface ChatAICredentialFormProps {
  platform: Platform;
  automationId: string;
  onClose: () => void;
  onCredentialSaved: (platformName: string) => void;
  onCredentialTested: (platformName: string) => void;
}

// CRITICAL FIX: Intelligent TLD detection function (same as before but improved)
const generateIntelligentBaseUrl = (platformName: string): string => {
  const cleanPlatform = platformName.toLowerCase().replace(/\s+/g, '');
  
  // Specific platform mappings for known exceptions
  if (cleanPlatform.includes('elevenlabs') || cleanPlatform.includes('11labs')) {
    return 'https://api.elevenlabs.io';
  }
  
  if (cleanPlatform.includes('openai')) {
    return 'https://api.openai.com';
  }
  
  if (cleanPlatform.includes('slack')) {
    return 'https://slack.com/api';
  }
  
  if (cleanPlatform.includes('notion')) {
    return 'https://api.notion.com';
  }
  
  // Smart TLD detection based on platform name patterns
  if (cleanPlatform.endsWith('.io') || cleanPlatform.includes('.io')) {
    const domain = cleanPlatform.replace(/\.io.*/, '');
    return `https://api.${domain}.io`;
  }
  
  if (cleanPlatform.endsWith('.ai') || cleanPlatform.includes('.ai')) {
    const domain = cleanPlatform.replace(/\.ai.*/, '');
    return `https://api.${domain}.ai`;
  }
  
  if (cleanPlatform.endsWith('.dev') || cleanPlatform.includes('.dev')) {
    const domain = cleanPlatform.replace(/\.dev.*/, '');
    return `https://api.${domain}.dev`;
  }
  
  if (cleanPlatform.endsWith('.co') || cleanPlatform.includes('.co')) {
    const domain = cleanPlatform.replace(/\.co.*/, '');
    return `https://api.${domain}.co`;
  }
  
  // Default to .com for unknown platforms
  return `https://api.${cleanPlatform}.com`;
};

// CRITICAL FIX: Intelligent endpoint generation
const generateIntelligentEndpoint = (platformName: string): string => {
  const cleanPlatform = platformName.toLowerCase();
  
  if (cleanPlatform.includes('elevenlabs') || cleanPlatform.includes('11labs')) {
    return '/v1/user';
  }
  
  if (cleanPlatform.includes('openai')) {
    return '/v1/models';
  }
  
  if (cleanPlatform.includes('slack')) {
    return '/auth.test';
  }
  
  if (cleanPlatform.includes('notion')) {
    return '/v1/users/me';
  }
  
  // Default endpoint
  return '/me';
};

const ChatAICredentialForm = ({ 
  platform, 
  automationId, 
  onClose, 
  onCredentialSaved, 
  onCredentialTested 
}: ChatAICredentialFormProps) => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testScript, setTestScript] = useState<string>('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [existingCredentials, setExistingCredentials] = useState<boolean>(false);

  // CRITICAL FIX: Enhanced platform name resolution with persistence
  const getPlatformName = useCallback(() => {
    // First, try to get name from props
    if (platform?.name) {
      const cleanName = platform.name.replace(/[*_`#]/g, '').trim();
      if (cleanName && cleanName !== '') {
        console.log('✅ Platform name from props:', cleanName);
        return cleanName;
      }
    }

    // Second, try to load from persistence
    if (automationId) {
      console.log('🔍 Attempting to load platform name from persistence');
      const persistedData = PlatformPersistenceManager.loadAllPlatformsData(automationId);
      if (persistedData.length > 0) {
        const firstPlatform = persistedData[0];
        console.log('✅ Platform name from persistence:', firstPlatform.name);
        return firstPlatform.name;
      }
    }

    // Last resort fallback
    console.warn('⚠️ Using fallback platform name');
    return 'Platform';
  }, [platform?.name, automationId]);

  const platformName = getPlatformName();
  
  console.log('🔍 ChatAI Credential Form initialized for platform:', platformName);
  console.log('🔍 Platform object received:', platform);
  console.log('🔍 ChatAI testConfig available:', !!platform?.testConfig);
  console.log('🔍 ChatAI test_payloads available:', platform?.test_payloads?.length || 0);

  // Create storage key for this platform's test response
  const getStorageKey = () => `testResponse_${platformName}_${automationId}`;

  // Load persisted test response from localStorage
  const loadPersistedTestResponse = () => {
    try {
      const storageKey = getStorageKey();
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log(`📱 Loading persisted test response for ${platformName}:`, parsed);
        setTestResponse(parsed.testResponse);
        setTestStatus(parsed.testStatus);
      }
    } catch (error) {
      console.error('Failed to load persisted test response:', error);
    }
  };

  // Save test response to localStorage for persistence
  const saveTestResponseToPersistence = (response: any, status: string) => {
    try {
      const storageKey = getStorageKey();
      const dataToStore = {
        testResponse: response,
        testStatus: status,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      console.log(`💾 Saved test response to localStorage for ${platformName}:`, dataToStore);
    } catch (error) {
      console.error('Failed to save test response to persistence:', error);
    }
  };

  // CRITICAL FIX: Enhanced platform data loading with persistence fallback
  const loadPlatformData = useCallback(async () => {
    if (!automationId) return null;

    // First try to use the platform prop
    if (platform && platform.name) {
      console.log('✅ Using platform data from props');
      return platform;
    }

    // Fallback to persistence
    console.log('🔍 Loading platform data from persistence');
    const persistedPlatforms = PlatformPersistenceManager.loadAllPlatformsData(automationId);
    
    if (persistedPlatforms.length > 0) {
      console.log('✅ Platform data loaded from persistence:', persistedPlatforms.length, 'platforms');
      // Return the first platform or find by name
      return persistedPlatforms[0];
    }

    console.warn('⚠️ No platform data available');
    return null;
  }, [platform, automationId]);

  // Load existing credentials and initialize test script
  useEffect(() => {
    if (user && automationId && platformName && platformName !== 'Unknown Platform') {
      loadExistingCredentials();
      loadPersistedTestResponse(); // Load persisted test response
    }
  }, [user, automationId, platformName]);

  // CRITICAL FIX: Enhanced existing credentials loading
  const loadExistingCredentials = async () => {
    if (!user || !automationId || !platformName) return;
    
    setIsLoading(true);
    try {
      // Load platform data first
      const platformData = await loadPlatformData();
      
      // Validate platform data
      if (platformData) {
        const validation = DataFlowValidator.validatePlatformForCredentialForm(platformData);
        if (validation.warnings.length > 0) {
          console.warn('Platform data warnings:', validation.warnings);
        }
      }

      const existingCreds = await UnifiedCredentialManager.getCredentials(
        user.id,
        automationId,
        platformName
      );

      if (existingCreds) {
        // Mask existing credentials for security
        const maskedCreds: Record<string, string> = {};
        Object.keys(existingCreds).forEach(key => {
          maskedCreds[key] = '••••••••••••••••';
        });
        setCredentials(maskedCreds);
        setExistingCredentials(true);
        toast.success(`Found existing credentials for ${platformName}`);
      } else {
        // Initialize empty credentials based on platform data
        const initialCreds: Record<string, string> = {};
        const credentialFields = platformData?.credentials || platform?.credentials || [];
        
        credentialFields.forEach((cred: any) => {
          initialCreds[cred.field] = '';
        });
        setCredentials(initialCreds);
      }

      // CRITICAL FIX: Initialize test script with platform data priority system
      updateTestScriptWithPlatformData(platformData || platform);

    } catch (error) {
      console.error('Failed to load existing credentials:', error);
      // Still initialize test script even if credentials fail to load
      updateTestScriptWithPlatformData(platform);
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL FIX: Enhanced test script update with ChatAI data priority
  const updateTestScriptWithPlatformData = (platformData: any) => {
    console.log('🔧 Updating test script with platform data for:', platformName);
    
    if (!platformData) {
      console.warn('⚠️ No platform data available for test script');
      setTestScript('// No platform data available');
      return;
    }

    // Validate platform data
    const validation = DataFlowValidator.validatePlatformForCredentialForm(platformData);
    
    // Use the enhanced test script extractor with priority system
    const baseScript = extractTestScript(platformData, credentials);
    setTestScript(baseScript);

    console.log('✅ Test script updated with priority system');
  };

  const handleInputChange = (field: string, value: string) => {
    const newCredentials = {
      ...credentials,
      [field]: value
    };
    setCredentials(newCredentials);
    // Test script will update via useEffect
  };

  // CRITICAL FIX: Update test script when credentials change
  useEffect(() => {
    if (platformName && platformName !== 'Platform' && Object.keys(credentials).length > 0) {
      updateTestScriptWithPlatformData(platform);
    }
  }, [credentials, platform, platformName]);

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleTest = async () => {
    if (!user || Object.values(credentials).every(val => !val || val === '••••••••••••••••')) {
      toast.error('Please enter your credentials before testing');
      return;
    }

    setIsTesting(true);
    setTestStatus('testing');
    setTestResponse(null);

    try {
      console.log(`🧪 Testing credentials for ${platformName} using ChatAI configuration`);
      
      // CRITICAL FIX: Prioritize ChatAI testConfig, then fall back to intelligent config
      let testConfig;
      
      if (platform.testConfig) {
        console.log('✅ Using ChatAI provided testConfig:', platform.testConfig);
        testConfig = platform.testConfig;
      } else {
        console.log('⚠️ No ChatAI testConfig found, using intelligent configuration');
        testConfig = {
          platform_name: platformName,
          base_url: generateIntelligentBaseUrl(platformName),
          test_endpoint: { 
            path: generateIntelligentEndpoint(platformName), 
            method: 'GET' 
          },
          authentication: { 
            type: 'bearer',
            location: 'header',
            parameter_name: 'Authorization',
            format: 'Bearer {api_key}'
          },
          success_indicators: { 
            status_codes: [200], 
            response_patterns: ['data', 'id', 'user', 'success'] 
          },
          error_patterns: { 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found' }
        };
      }

      console.log(`✅ Using testConfig for ${platformName}:`, testConfig);

      // Call test-credential with the configuration
      const { data: result, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platformName: platformName,
          credentials,
          testConfig,
          userId: user.id,
          unified_testing: true,
          chatai_integration: true,
          chatai_provided_config: !!platform.testConfig
        }
      });

      if (error) throw error;

      setTestResponse(result);
      const finalStatus = result.success ? 'success' : 'error';
      setTestStatus(finalStatus);
      
      // Save to localStorage for persistence
      saveTestResponseToPersistence(result, finalStatus);

      if (result.success) {
        toast.success(`✅ ${platformName} credentials verified successfully!`);
        onCredentialTested(platformName);
      } else {
        toast.error(`❌ Test failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Test failed:', error);
      const errorResponse = {
        success: false,
        message: error.message || 'Test failed',
        details: { error: error.message }
      };
      
      setTestStatus('error');
      setTestResponse(errorResponse);
      
      // Save error to localStorage for persistence
      saveTestResponseToPersistence(errorResponse, 'error');
      
      toast.error('Test failed. Please try again.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!user || Object.values(credentials).every(val => !val || val === '••••••••••••••••')) {
      toast.error('Please enter your credentials before saving');
      return;
    }

    if (testStatus !== 'success') {
      toast.error('Please test your credentials successfully before saving');
      return;
    }

    setIsSaving(true);

    try {
      const result = await UnifiedCredentialManager.saveCredentials(
        user.id,
        automationId,
        platformName,
        credentials
      );

      if (result.success) {
        toast.success(result.message);
        onCredentialSaved(platformName);
        setTimeout(onClose, 1000);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error('Failed to save credentials. Please try again.');
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

  // CRITICAL FIX: Enhanced credential field rendering with link validation
  const renderCredentialField = (cred: any, index: number) => {
    const inputType = getInputType(cred.field);
    const showPassword = showPasswords[cred.field];
    const currentValue = credentials[cred.field] || '';
    
    // CRITICAL FIX: Validate and clean the link
    const getValidLink = (link: string) => {
      if (!link || link === '#') return null;
      
      // Check if it's a valid URL
      try {
        const url = new URL(link);
        // Only allow http and https protocols
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          return link;
        }
      } catch (e) {
        console.warn('Invalid link detected:', link);
      }
      
      return null;
    };

    const validLink = getValidLink(cred.link);

    return (
      <div key={index} className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-purple-800 flex items-center gap-2">
            {cred.field}
            {existingCredentials && currentValue === '••••••••••••••••' && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            )}
          </Label>
          {/* CRITICAL FIX: Only show Get Key button for valid links */}
          {validLink && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('🔗 Opening valid link:', validLink);
                window.open(validLink, '_blank', 'noopener,noreferrer');
              }}
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-all duration-200"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Get Key
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Input
            type={inputType === 'password' && !showPassword ? 'password' : 'text'}
            placeholder={cred.placeholder}
            value={currentValue}
            onChange={(e) => handleInputChange(cred.field, e.target.value)}
            className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white/80 backdrop-blur-sm transition-all duration-200 pr-12"
            disabled={existingCredentials && currentValue === '••••••••••••••••'}
          />
          
          {inputType === 'password' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg hover:bg-purple-100"
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

        <p className="text-xs text-purple-600 bg-purple-50/50 p-2 rounded-lg">
          <span className="font-medium">Why needed:</span> {cred.why_needed}
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="text-lg font-medium text-purple-800">Loading credentials...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              {/* CRITICAL FIX: Display actual platform name from persistence */}
              <h3 className="text-xl font-bold text-purple-900">{platformName} Credentials</h3>
              <p className="text-sm text-purple-600 font-normal">
                {platform?.testConfig || platform?.test_payloads?.length ? 'ChatAI Configuration' : 'Intelligent Platform Detection'} • Real API Links
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              {platform?.testConfig || platform?.test_payloads?.length ? 'ChatAI' : 'Smart'} Integration
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 rounded-xl p-1">
            <TabsTrigger value="credentials" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4 mr-2" />
              Credentials
            </TabsTrigger>
            <TabsTrigger value="script" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Code2 className="w-4 h-4 mr-2" />
              Live Test Payload
            </TabsTrigger>
            <TabsTrigger value="response" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TestTube className="w-4 h-4 mr-2" />
              Test Response
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="mt-6">
            <Card className="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-purple-900">Configure Your {platformName} Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CRITICAL FIX: Only render actual credential fields, no hardcoded extras */}
                {(platform?.credentials || []).map((cred: any, index: number) => 
                  renderCredentialField(cred, index)
                )}

                {existingCredentials && (
                  <div className="bg-green-50/50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Credentials Found</span>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      Existing credentials are loaded and masked for security. Update any field to modify.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="script" className="mt-6">
            <Card className="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-900">
                  <Code2 className="w-5 h-5" />
                  Live Test Payload
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                    {platform?.testConfig || platform?.test_payloads?.length ? 'ChatAI Generated' : 'Intelligent Detection'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full rounded-xl border border-purple-200/50 bg-gray-900 p-4">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {testScript || '// Loading test payload from ChatAI data...'}
                  </pre>
                </ScrollArea>
                <p className="text-xs text-purple-600 mt-3">
                  🚀 {platform?.testConfig || platform?.test_payloads?.length ? 
                    'This payload was generated by ChatAI for your specific platform!' : 
                    'This payload uses intelligent platform detection with real API endpoints!'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="response" className="mt-6">
            <Card className="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-900">
                  <TestTube className="w-5 h-5" />
                  Test Response
                  {testResponse && (
                    <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700">
                      Persisted Result
                    </Badge>
                  )}
                  {testStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {testStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResponse ? (
                  <div className={`rounded-xl p-4 border ${
                    testResponse.success 
                      ? 'bg-green-50/50 border-green-200 text-green-900' 
                      : 'bg-red-50/50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {testResponse.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-semibold">
                        {testResponse.success ? 'Test Successful' : 'Test Failed'}
                      </span>
                    </div>
                    <p className="text-sm mb-3">{testResponse.message}</p>
                    {testResponse.details && (
                      <ScrollArea className="h-32 w-full rounded-lg bg-white/50 p-3">
                        <pre className="text-xs font-mono">
                          {JSON.stringify(testResponse.details, null, 2)}
                        </pre>
                      </ScrollArea>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-purple-600">
                    <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Run a test to see the response here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-purple-200/50">
          <Button
            onClick={handleTest}
            disabled={isTesting || Object.values(credentials).every(val => !val || val === '••••••••••••••••')}
            variant="outline"
            className="flex-1 rounded-xl border-purple-300 text-purple-700 hover:bg-purple-100 transition-all duration-200"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Test Your Connection
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSaving || testStatus !== 'success'}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving to Unified System...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save to Unified System
              </>
            )}
          </Button>
        </div>

        {/* Status Messages */}
        {testStatus !== 'idle' && (
          <div className="mt-4">
            {testStatus === 'success' && !isSaving && (
              <p className="text-xs text-green-700 text-center">
                ✅ Credentials verified with {platform?.testConfig || platform?.test_payloads?.length ? 'ChatAI' : 'intelligent platform'} detection! You can now save them.
              </p>
            )}
            {testStatus === 'error' && (
              <p className="text-xs text-red-700 text-center">
                ❌ Please fix the credential issues before saving.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChatAICredentialForm;
