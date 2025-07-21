
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, AlertCircle, Code, Clock, Zap, ExternalLink } from 'lucide-react';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { EnhancedTestCredentialManager } from '@/utils/enhancedTestCredentialManager';

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
  const [testResult, setTestResult] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'generating' | 'ai_ready' | 'testing' | 'success' | 'error'>('idle');
  const [testPayloadConfig, setTestPayloadConfig] = useState<any>(null);

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

      setTestResult({
        ...result,
        test_duration: testDuration,
        timestamp: new Date().toISOString()
      });

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
        error_type: 'connection_error'
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Test Payload Code Display */}
          {testPayloadConfig && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">AI Test Configuration</span>
              </div>
              <pre className="text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(testPayloadConfig, null, 2)}
              </pre>
            </div>
          )}

          {/* Credential Input Fields */}
          <div className="space-y-4">
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
          </div>

          {/* Test Results Display */}
          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {testResult.success ? 'Test Successful' : 'Test Failed'}
                </span>
                {testResult.test_duration && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 ml-auto">
                    <Clock className="w-3 h-3" />
                    {testResult.test_duration}ms
                  </div>
                )}
              </div>
              
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
            </div>
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
