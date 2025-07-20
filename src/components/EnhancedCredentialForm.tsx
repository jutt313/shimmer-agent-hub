
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle, Loader2, Bot, Settings, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { EnhancedTestCredentialManager } from '@/utils/enhancedTestCredentialManager';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';

interface EnhancedCredentialFormProps {
  platform: {
    name: string;
    fields: Array<{
      name: string;
      type: string;
      label: string;
      placeholder?: string;
      required?: boolean;
    }>;
  };
  automationId: string;
  onCredentialSaved?: () => void;
}

const EnhancedCredentialForm: React.FC<EnhancedCredentialFormProps> = ({
  platform,
  automationId,
  onCredentialSaved
}) => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiConfigStatus, setAiConfigStatus] = useState<'generating' | 'ready' | 'error' | null>(null);
  const [aiConfigDetails, setAiConfigDetails] = useState<any>(null);

  useEffect(() => {
    // Initialize credentials object
    const initialCredentials: Record<string, string> = {};
    platform.fields.forEach(field => {
      initialCredentials[field.name] = '';
    });
    setCredentials(initialCredentials);

    // FIXED: Load AI configuration status and details
    loadAIConfiguration();
  }, [platform.name]);

  const loadAIConfiguration = async () => {
    try {
      setAiConfigStatus('generating');
      console.log('🤖 FIXED: Loading AI configuration for platform:', platform.name);
      
      // Check if platform has AI support
      const isSupported = await AutomationCredentialManager.isPlatformSupported(platform.name);
      
      if (isSupported) {
        const capabilities = await AutomationCredentialManager.getPlatformCapabilities(platform.name);
        setAiConfigDetails(capabilities);
        setAiConfigStatus('ready');
        console.log('✅ FIXED: AI configuration loaded successfully');
      } else {
        setAiConfigStatus('error');
        console.log('⚠️ FIXED: Platform not supported by AI configuration');
      }
    } catch (error) {
      console.error('❌ FIXED: Error loading AI configuration:', error);
      setAiConfigStatus('error');
    }
  };

  const handleCredentialChange = (fieldName: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [fieldName]: value
    }));
    // Clear test results when credentials change
    setTestResult(null);
  };

  const handleTestCredentials = async () => {
    try {
      setIsTestingCredentials(true);
      setTestResult(null);
      
      console.log('🧪 FIXED: Enhanced credential testing with AI configuration');
      
      // FIXED: Use enhanced test manager with AI
      const result = await EnhancedTestCredentialManager.testCredentialsWithAI(
        platform.name,
        credentials,
        'current-user-id' // This should come from auth context
      );
      
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "✅ Credentials Verified",
          description: `${platform.name} credentials are working correctly!`,
        });
      } else {
        toast({
          title: "❌ Credential Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('FIXED: Error testing credentials:', error);
      setTestResult({
        success: false,
        message: `Testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error_type: 'test_error'
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      setIsSaving(true);
      
      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentials,
        'current-user-id' // This should come from auth context
      );
      
      if (result.success) {
        toast({
          title: "✅ Credentials Saved",
          description: `${platform.name} credentials saved successfully!`,
        });
        onCredentialSaved?.();
      } else {
        toast({
          title: "❌ Save Failed",
          description: result.error || 'Failed to save credentials',
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('FIXED: Error saving credentials:', error);
      toast({
        title: "❌ Save Error",
        description: 'An error occurred while saving credentials',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canTest = Object.values(credentials).some(value => value.trim() !== '');
  const canSave = testResult?.success === true;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {platform.name} Credentials
          </CardTitle>
          
          {/* FIXED: AI Configuration Status Display */}
          <div className="flex items-center gap-2">
            {aiConfigStatus === 'generating' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                AI Configuring...
              </Badge>
            )}
            {aiConfigStatus === 'ready' && (
              <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                <Bot className="w-3 h-3" />
                AI Ready
              </Badge>
            )}
            {aiConfigStatus === 'error' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Config Error
              </Badge>
            )}
          </div>
        </div>
        
        {/* FIXED: AI Configuration Details */}
        {aiConfigDetails && (
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertDescription>
              AI-powered testing enabled for {platform.name}. 
              {aiConfigDetails.test_endpoints ? ` ${aiConfigDetails.test_endpoints.length} test endpoints available.` : ''}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Credential Input Fields */}
        <div className="space-y-4">
          {platform.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={field.name}
                type={field.type === 'password' ? 'password' : 'text'}
                placeholder={field.placeholder}
                value={credentials[field.name] || ''}
                onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Test Credentials Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Test Credentials</h3>
            <Button
              onClick={handleTestCredentials}
              disabled={!canTest || isTestingCredentials}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isTestingCredentials ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          {/* FIXED: Enhanced Test Results Display */}
          {testResult && (
            <Alert className={testResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <AlertDescription className="font-medium">
                    {testResult.message}
                  </AlertDescription>
                  
                  {/* FIXED: Display AI-powered test details */}
                  {testResult.details && (
                    <div className="text-xs space-y-1 mt-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">
                          Status: {testResult.details.status}
                        </Badge>
                        {testResult.details.ai_generated_config && (
                          <Badge variant="outline" size="sm" className="bg-blue-50">
                            <Bot className="w-3 h-3 mr-1" />
                            AI Config
                          </Badge>
                        )}
                      </div>
                      {testResult.details.endpoint_tested && (
                        <p className="text-gray-600">
                          Endpoint: {testResult.details.endpoint_tested}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* FIXED: Display troubleshooting steps */}
                  {testResult.troubleshooting && testResult.troubleshooting.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Troubleshooting:</p>
                      <ul className="text-xs space-y-1">
                        {testResult.troubleshooting.map((step: string, index: number) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Save Credentials */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {canSave ? 'Credentials verified and ready to save' : 'Test credentials first before saving'}
          </p>
          <Button
            onClick={handleSaveCredentials}
            disabled={!canSave || isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Credentials'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedCredentialForm;
