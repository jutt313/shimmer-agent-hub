
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Eye, EyeOff, ExternalLink, Zap, Code2, CheckCircle, AlertCircle, Settings, TestTube } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedCredentialManager } from '@/utils/unifiedCredentialManager';

interface Platform {
  name: string;
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
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [testScript, setTestScript] = useState<string>('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [existingCredentials, setExistingCredentials] = useState<boolean>(false);

  // Load existing credentials and initialize form
  useEffect(() => {
    if (user && automationId && platform.name) {
      loadExistingCredentials();
      generateInitialScript();
    }
  }, [user, automationId, platform.name]);

  // Generate test script when credentials change
  useEffect(() => {
    if (Object.keys(credentials).length > 0) {
      generateLiveScript();
    }
  }, [credentials]);

  const loadExistingCredentials = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const existingCreds = await UnifiedCredentialManager.getCredentials(
        user.id,
        automationId,
        platform.name
      );

      if (existingCreds) {
        // Mask existing credentials for security
        const maskedCreds: Record<string, string> = {};
        Object.keys(existingCreds).forEach(key => {
          maskedCreds[key] = '••••••••••••••••';
        });
        setCredentials(maskedCreds);
        setExistingCredentials(true);
        toast.success(`Found existing credentials for ${platform.name}`);
      } else {
        // Initialize empty credentials
        const initialCreds: Record<string, string> = {};
        platform.credentials.forEach(cred => {
          initialCreds[cred.field] = '';
        });
        setCredentials(initialCreds);
      }
    } catch (error) {
      console.error('Failed to load existing credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInitialScript = async () => {
    setIsGeneratingScript(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate a test script for ${platform.name} platform credentials`,
          requestType: 'credential_test_script',
          platformName: platform.name,
          credentialFields: platform.credentials.map(c => c.field)
        }
      });

      if (error) throw error;

      setTestScript(data.response || `# ${platform.name} Test Script\n\n// Test script will be generated based on your credentials`);
    } catch (error) {
      console.error('Failed to generate initial script:', error);
      setTestScript(`# ${platform.name} Test Script\n\n// Enter your credentials to see live test script`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateLiveScript = async () => {
    if (existingCredentials || Object.values(credentials).every(val => !val || val === '••••••••••••••••')) return;

    setIsGeneratingScript(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate live test script for ${platform.name} with these credential fields: ${Object.keys(credentials).join(', ')}`,
          requestType: 'live_credential_script',
          platformName: platform.name,
          credentialFields: Object.keys(credentials),
          hasValues: Object.values(credentials).some(val => val && val !== '')
        }
      });

      if (error) throw error;

      setTestScript(data.response || testScript);
    } catch (error) {
      console.error('Failed to generate live script:', error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
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

  const handleTest = async () => {
    if (!user || Object.values(credentials).every(val => !val || val === '••••••••••••••••')) {
      toast.error('Please enter your credentials before testing');
      return;
    }

    setIsTesting(true);
    setTestStatus('testing');
    setTestResponse(null);

    try {
      const result = await UnifiedCredentialManager.testCredentials(
        user.id,
        automationId,
        platform.name,
        credentials
      );

      setTestResponse(result);
      setTestStatus(result.success ? 'success' : 'error');

      if (result.success) {
        toast.success(`✅ ${platform.name} credentials verified successfully!`);
        onCredentialTested(platform.name);
      } else {
        toast.error(`❌ Test failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Test failed:', error);
      setTestStatus('error');
      setTestResponse({
        success: false,
        message: error.message || 'Test failed',
        details: { error: error.message }
      });
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

    setSaving(true);

    try {
      const result = await UnifiedCredentialManager.saveCredentials(
        user.id,
        automationId,
        platform.name,
        credentials
      );

      if (result.success) {
        toast.success(result.message);
        onCredentialSaved(platform.name);
        setTimeout(onClose, 1000);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error('Failed to save credentials. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInputType = (field: string) => {
    const lowerField = field.toLowerCase();
    return lowerField.includes('password') || 
           lowerField.includes('secret') || 
           lowerField.includes('key') ||
           lowerField.includes('token') ? 'password' : 'text';
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
              <h3 className="text-xl font-bold text-purple-900">{platform.name} Credentials</h3>
              <p className="text-sm text-purple-600 font-normal">Chat AI Powered • Unified System</p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              Live Integration
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
              Live Script
            </TabsTrigger>
            <TabsTrigger value="response" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TestTube className="w-4 h-4 mr-2" />
              Test Response
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="mt-6">
            <Card className="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-purple-900">Configure Your {platform.name} Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {platform.credentials.map((cred, index) => {
                  const inputType = getInputType(cred.field);
                  const showPassword = showPasswords[cred.field];
                  const currentValue = credentials[cred.field] || '';
                  
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
                        {cred.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(cred.link, '_blank')}
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
                })}

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
                  Live Test Script
                  {isGeneratingScript && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                    Chat AI Generated
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full rounded-xl border border-purple-200/50 bg-gray-900 p-4">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {testScript}
                  </pre>
                </ScrollArea>
                <p className="text-xs text-purple-600 mt-3">
                  🚀 This script is generated in real-time by Chat AI as you enter credentials
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
                Testing with Chat AI...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Test Credentials
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
                ✅ Credentials verified! You can now save them to the unified system.
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
