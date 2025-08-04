
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const [testConfig, setTestConfig] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  console.log('🔧 ModernCredentialForm opened for platform:', platform.name);

  const generateTestConfiguration = async (platformName: string): Promise<any> => {
    try {
      console.log('🤖 REQUESTING: Test configuration for platform:', platformName);
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate test configuration for ${platformName} platform`,
          userId: user?.id,
          context: 'test_config_generation',
          requestType: 'test_config_generation',
          platformName: platformName,
          generateOnlyTestConfig: true
        }
      });

      if (error) {
        throw error;
      }

      console.log('📥 RECEIVED: Raw ChatAI response:', data);

      // SIMPLIFIED PARSING: Use ChatAI response directly
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

      // SIMPLE VALIDATION: Ensure we have basic test config structure
      if (!testConfig.platform_name && !testConfig.base_url && !testConfig.test_endpoint) {
        console.error('❌ INCOMPLETE: Test config missing required fields:', testConfig);
        throw new Error('Incomplete test configuration received');
      }

      console.log('✅ FINAL: Valid test configuration generated:', testConfig);
      setTestConfig(testConfig);
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
      const generatedConfig = await generateTestConfiguration(platform.name);

      // Test using the AI-generated configuration
      const result = await AutomationCredentialManager.testCredentials(
        user?.id!,
        automationId,
        platform.name,
        credentials,
        { testConfig: generatedConfig }
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
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Setup {platform.name} Credentials</h3>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">×</Button>
        </div>

        <div className="space-y-6">
          {/* AI-Generated Test Configuration Display */}
          {testConfig && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">AI Generated Test Configuration</h4>
              <div className="bg-white rounded-lg p-3 text-xs font-mono text-gray-700 overflow-auto max-h-32">
                <pre>{JSON.stringify(testConfig, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Dynamic Input Fields based on Platform Credentials */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <p className="text-xs text-gray-600">{cred.why_needed}</p>
                {cred.link && (
                  <a href={cred.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors">
                    Get your {cred.field}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Test Results Display */}
          {testResults && (
            <div className={`p-4 rounded-xl ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm font-medium ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResults.success ? '✅ Test Successful' : '❌ Test Failed'}
              </p>
              <p className={`text-sm mt-1 ${testResults.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResults.message}
              </p>
              {testResults.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">View Details</summary>
                  <pre className="text-xs mt-2 p-2 bg-white rounded-lg overflow-auto max-h-32 text-gray-700">
                    {JSON.stringify(testResults.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button 
              onClick={handleTest} 
              disabled={isLoading} 
              variant="outline" 
              className="flex-1 rounded-xl border-blue-300 text-blue-700 hover:bg-blue-50 transition-all duration-200"
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !testResults?.success} 
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
            >
              {isLoading ? 'Saving...' : 'Save Credentials'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernCredentialForm;
