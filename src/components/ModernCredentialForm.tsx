import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
  test_payloads?: any[];
}

interface ModernCredentialFormProps {
  automationId: string;
  platform: Platform;
  onCredentialSaved?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const ModernCredentialForm = ({ automationId, platform, onCredentialSaved, onClose, isOpen }: ModernCredentialFormProps) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  console.log('🔧 ModernCredentialForm opened for platform:', platform.name);

  const generateTestConfiguration = async (platformName: string): Promise<any> => {
    try {
      console.log('🤖 REQUESTING: Test configuration for platform:', platformName);
      
      // CRITICAL FIX: Send correct request type to ChatAI
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate test configuration for ${platformName} platform`,
          userId: user?.id,
          context: 'test_config_generation',
          requestType: 'test_config_generation', // CRITICAL: This tells ChatAI to switch modes
          platformName: platformName,
          generateOnlyTestConfig: true // Additional flag for safety
        }
      });

      if (error) {
        throw error;
      }

      console.log('📥 RECEIVED: Raw ChatAI response:', data);

      // IMPROVED PARSING: Handle both simple config and complex response
      let testConfig;
      if (typeof data.response === 'string') {
        try {
          testConfig = JSON.parse(data.response);
          console.log('✅ PARSED: Test config successfully:', testConfig);
        } catch (parseError) {
          console.error('❌ PARSE ERROR: Could not parse ChatAI response:', parseError);
          throw new Error('Invalid test configuration format from AI');
        }
      } else {
        testConfig = data.response;
      }

      // VALIDATION: Ensure we got a test config, not an automation blueprint
      if (testConfig.summary || testConfig.steps || testConfig.execution_blueprint) {
        console.warn('⚠️ WARNING: Received automation blueprint instead of test config');
        // Extract test config from blueprint if present
        if (testConfig.test_payloads && testConfig.test_payloads[platformName]) {
          const payload = testConfig.test_payloads[platformName];
          testConfig = {
            platform_name: platformName,
            base_url: payload.endpoint.split('/')[0] + '//' + payload.endpoint.split('/')[2],
            test_endpoint: {
              method: payload.method,
              path: '/' + payload.endpoint.split('/').slice(3).join('/'),
              headers: payload.headers || { "Content-Type": "application/json" },
              query_params: {}
            },
            authentication: {
              type: payload.headers?.Authorization?.includes('Bearer') ? 'bearer' : 'token',
              location: 'header',
              parameter_name: 'Authorization',
              format: payload.headers?.Authorization || 'Bearer {api_key}'
            },
            field_mappings: { "api_key": "api_key" },
            success_indicators: {
              status_codes: [200],
              response_patterns: payload.expected_response ? Object.keys(payload.expected_response) : ["success"]
            },
            error_patterns: {
              "401": "Invalid credentials",
              "403": "Access denied"
            },
            ai_generated: true,
            extracted_from_blueprint: true
          };
          console.log('🔄 EXTRACTED: Test config from blueprint:', testConfig);
        } else {
          throw new Error('No test configuration available for this platform');
        }
      }

      // FINAL VALIDATION: Ensure required fields
      if (!testConfig.platform_name || !testConfig.base_url || !testConfig.test_endpoint) {
        console.error('❌ INCOMPLETE: Test config missing required fields:', testConfig);
        throw new Error('Incomplete test configuration received');
      }

      console.log('✅ FINAL: Valid test configuration generated:', testConfig);
      return testConfig;

    } catch (error: any) {
      console.error('💥 ERROR: Test configuration generation failed:', error);
      throw error;
    }
  };

  const handleTest = async () => {
    try {
      setIsLoading(true);
      console.log('🧪 TESTING: Starting credential test for', platform.name);

      // Generate test configuration using ChatAI
      const testConfig = await generateTestConfiguration(platform.name);

      // Test using the AI-generated configuration
      const result = await AutomationCredentialManager.testCredentials(
        user?.id!,
        automationId,
        platform.name,
        credentials,
        { testConfig }
      );

      setTestResults(result);
      console.log('🧪 TEST RESULT:', result);

      if (result.success) {
        toast({
          title: "✅ Test Successful",
          description: `${platform.name} credentials are working correctly`,
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: result.message || `${platform.name} credentials test failed`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('💥 TEST ERROR:', error);
      setTestResults({
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message }
      });
      
      toast({
        title: "❌ Test Error",
        description: `Failed to test ${platform.name} credentials: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      console.log('💾 SAVING: Credentials for', platform.name);

      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentials,
        user?.id!
      );

      if (result.success) {
        toast({
          title: "✅ Credentials Saved",
          description: `${platform.name} credentials saved successfully`,
        });
        
        onCredentialSaved?.();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to save credentials');
      }

    } catch (error: any) {
      console.error('💥 SAVE ERROR:', error);
      toast({
        title: "❌ Save Failed",
        description: `Failed to save ${platform.name} credentials: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Setup {platform.name} Credentials</h3>
          <Button onClick={onClose} variant="ghost" size="sm">×</Button>
        </div>

        <div className="space-y-4">
          {platform.credentials?.map((cred, index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {cred.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <input
                type={cred.field.includes('secret') || cred.field.includes('token') || cred.field.includes('key') ? 'password' : 'text'}
                value={credentials[cred.field] || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [cred.field]: e.target.value
                }))}
                placeholder={cred.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">{cred.why_needed}</p>
              {cred.link && (
                <a href={cred.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                  Get your {cred.field}
                </a>
              )}
            </div>
          ))}

          {testResults && (
            <div className={`p-3 rounded-md ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResults.message}
              </p>
              {testResults.details && (
                <pre className="text-xs mt-2 overflow-auto max-h-32">
                  {JSON.stringify(testResults.details, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleTest} disabled={isLoading} variant="outline" className="flex-1">
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !testResults?.success} className="flex-1">
              {isLoading ? 'Saving...' : 'Save Credentials'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernCredentialForm;
