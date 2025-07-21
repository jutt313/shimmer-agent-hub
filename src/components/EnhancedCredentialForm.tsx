
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Code, Clock, Zap, ExternalLink, Copy } from 'lucide-react';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { EnhancedTestCredentialManager } from '@/utils/enhancedTestCredentialManager';
import { Platform, EnhancedTestResult } from '@/types/platform';

interface EnhancedCredentialFormProps {
  automationId: string;
  platform: Platform;
  onCredentialSaved: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const EnhancedCredentialForm = ({ 
  automationId, 
  platform, 
  onCredentialSaved, 
  onClose, 
  isOpen 
}: EnhancedCredentialFormProps) => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<EnhancedTestResult | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'generating' | 'ai_ready' | 'testing' | 'success' | 'error'>('idle');
  const [testPayloadConfig, setTestPayloadConfig] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && platform) {
      loadExistingCredentials();
      processTestPayloads();
    }
  }, [isOpen, platform, automationId]);

  const processTestPayloads = () => {
    console.log('🧪 Processing test payloads for platform:', platform.name);
    console.log('🧪 Available test payloads:', platform.test_payloads);
    
    if (platform.test_payloads && platform.test_payloads.length > 0) {
      const platformTestPayload = platform.test_payloads.find(
        payload => payload.platform === platform.name || 
                  payload.platform?.toLowerCase() === platform.name.toLowerCase()
      );
      
      if (platformTestPayload) {
        console.log('✅ Found test payload configuration:', platformTestPayload);
        setTestPayloadConfig(platformTestPayload);
        setTestStatus('ai_ready');
        
        // Pre-fill credentials with test data if available
        if (platformTestPayload.test_data) {
          const testCredentials: Record<string, string> = {};
          Object.entries(platformTestPayload.test_data).forEach(([key, value]) => {
            testCredentials[key] = String(value);
          });
          setCredentials(prev => ({ ...prev, ...testCredentials }));
        }
      } else {
        console.log('⚠️ No test payload found for platform:', platform.name);
        setTestStatus('idle');
      }
    } else {
      console.log('⚠️ No test payloads available for platform:', platform.name);
      setTestStatus('idle');
    }
  };

  const loadExistingCredentials = async () => {
    try {
      const existingCreds = await AutomationCredentialManager.getCredentials(
        automationId,
        platform.name,
        ''
      );
      
      if (existingCreds) {
        setCredentials(existingCreds);
      }
    } catch (error) {
      console.error('Failed to load existing credentials:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestCredentials = async () => {
    if (Object.keys(credentials).length === 0) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your credentials before testing.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestStatus('testing');
    const startTime = Date.now();

    try {
      console.log('🧪 Testing credentials with AI-enhanced system for:', platform.name);
      
      const result = await EnhancedTestCredentialManager.testCredentialsWithAI(
        platform.name,
        credentials,
        ''
      );

      const endTime = Date.now();
      const testDuration = endTime - startTime;

      console.log('🧪 Test result received:', result);

      const enhancedResult: EnhancedTestResult = {
        ...result,
        test_duration: testDuration,
        timestamp: new Date().toISOString()
      };

      setTestResult(enhancedResult);

      if (result.success) {
        setTestStatus('success');
        toast({
          title: "✅ Credentials Verified",
          description: `${platform.name} credentials are working correctly!`,
        });
      } else {
        setTestStatus('error');
        toast({
          title: "❌ Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Test failed:', error);
      setTestStatus('error');
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`,
        error_type: 'connection_error',
        test_duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Test Error",
        description: "Failed to test credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (Object.keys(credentials).length === 0) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your credentials before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentials,
        ''
      );

      if (result.success) {
        toast({
          title: "✅ Credentials Saved",
          description: `${platform.name} credentials saved successfully!`,
        });
        onCredentialSaved();
      } else {
        throw new Error(result.error || 'Failed to save credentials');
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      toast({
        title: "Save Error",
        description: error.message || "Failed to save credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(label);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStatusIndicator = () => {
    switch (testStatus) {
      case 'generating':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generating AI configuration...</span>
          </div>
        );
      case 'ai_ready':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">AI Configuration Ready</span>
          </div>
        );
      case 'testing':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Testing credentials...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Credentials Verified</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Test Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatFieldLabel = (field: string) => {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{platform.name} Credentials</h3>
              <p className="text-sm text-gray-600 font-normal">AI-Enhanced Configuration & Testing</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Status Indicator */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            {getStatusIndicator()}
            {testPayloadConfig && (
              <div className="mt-2 text-xs text-gray-600">
                AI-generated test configuration loaded with {Object.keys(testPayloadConfig.field_mapping || {}).length} field mappings
              </div>
            )}
          </div>

          {/* Test Payload Code Display - Enhanced UI */}
          {testPayloadConfig && (
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Code className="w-4 h-4 text-purple-600" />
                  AI Test Configuration for {platform.name}
                  <Badge variant="secondary" className="ml-auto">
                    AI Generated
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Config Section */}
                {testPayloadConfig.api_config && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">API Configuration</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(testPayloadConfig.api_config, null, 2), 'API Config')}
                        className="h-7 px-2 text-xs"
                      >
                        {copiedCode === 'API Config' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedCode === 'API Config' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
                      <pre>{JSON.stringify(testPayloadConfig.api_config, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Field Mapping Section */}
                {testPayloadConfig.field_mapping && Object.keys(testPayloadConfig.field_mapping).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Field Mapping</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(testPayloadConfig.field_mapping, null, 2), 'Field Mapping')}
                        className="h-7 px-2 text-xs"
                      >
                        {copiedCode === 'Field Mapping' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedCode === 'Field Mapping' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="bg-gray-900 text-blue-400 p-3 rounded-lg text-xs overflow-x-auto">
                      <pre>{JSON.stringify(testPayloadConfig.field_mapping, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Test Data Section */}
                {testPayloadConfig.test_data && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Test Data Sample</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(testPayloadConfig.test_data, null, 2), 'Test Data')}
                        className="h-7 px-2 text-xs"
                      >
                        {copiedCode === 'Test Data' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedCode === 'Test Data' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="bg-gray-900 text-yellow-400 p-3 rounded-lg text-xs overflow-x-auto">
                      <pre>{JSON.stringify(testPayloadConfig.test_data, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Full Configuration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Complete AI Configuration</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(testPayloadConfig, null, 2), 'Full Config')}
                      className="h-7 px-2 text-xs"
                    >
                      {copiedCode === 'Full Config' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedCode === 'Full Config' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-gray-900 text-white p-3 rounded-lg text-xs overflow-x-auto max-h-48">
                    <pre>{JSON.stringify(testPayloadConfig, null, 2)}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credential Input Fields */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Enter Your Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {platform.credentials.map((credField) => (
                <div key={credField.field} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={credField.field} className="text-sm font-medium">
                      {formatFieldLabel(credField.field)}
                    </Label>
                    {credField.link && (
                      <a
                        href={credField.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Get API Key <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <Input
                    id={credField.field}
                    type={credField.field.toLowerCase().includes('password') || 
                          credField.field.toLowerCase().includes('secret') || 
                          credField.field.toLowerCase().includes('token') || 
                          credField.field.toLowerCase().includes('key') ? 'password' : 'text'}
                    placeholder={credField.placeholder}
                    value={credentials[credField.field] || ''}
                    onChange={(e) => handleInputChange(credField.field, e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-600">{credField.why_needed}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Test Results Display */}
          {testResult && (
            <Card className={`border-2 ${
              testResult.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  {testResult.success ? 'Test Successful' : 'Test Failed'}
                  {testResult.test_duration && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 ml-auto">
                      <Clock className="w-3 h-3" />
                      {testResult.test_duration}ms
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-2">{testResult.message}</p>
                
                {testResult.details && (
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                    <pre className="mt-2 p-2 bg-white rounded border overflow-x-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  </details>
                )}

                {testResult.troubleshooting && testResult.troubleshooting.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Troubleshooting:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {testResult.troubleshooting.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleTestCredentials}
              disabled={isTesting || Object.keys(credentials).length === 0}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  AI Test
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isLoading || Object.keys(credentials).length === 0}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Credentials'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCredentialForm;
