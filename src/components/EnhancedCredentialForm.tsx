
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, TestTube, Save, CheckCircle, XCircle, Loader2, ExternalLink, Code } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UniversalPlatformManager } from '@/utils/universalPlatformManager';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { toast } from 'sonner';

interface EnhancedCredentialFormProps {
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
}

const EnhancedCredentialForm = ({ 
  automationId, 
  platform, 
  onCredentialSaved 
}: EnhancedCredentialFormProps) => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [isPlaygroundMode, setIsPlaygroundMode] = useState(false);
  const [apiCallPreview, setApiCallPreview] = useState<any>(null);
  const [testResponseData, setTestResponseData] = useState<any>(null);

  useEffect(() => {
    if (user && automationId && platform.name) {
      loadExistingCredentials();
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
        setCanSave(true);
        setTestResult({ success: true, message: 'Credentials verified and saved' });
      }
    } catch (error) {
      console.error('Failed to load existing credentials:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null);
    setCanSave(false);
    setTestResponseData(null);
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

  const handleTogglePlayground = async () => {
    if (!hasAllCredentials) {
      toast.error('Please fill in all credentials first');
      return;
    }

    if (!isPlaygroundMode) {
      try {
        const preview = await UniversalPlatformManager.generateSampleCall(platform.name, credentials);
        setApiCallPreview(preview);
        setIsPlaygroundMode(true);
      } catch (error: any) {
        toast.error(`Failed to generate API preview: ${error.message}`);
      }
    } else {
      setIsPlaygroundMode(false);
    }
  };

  const handleTest = async () => {
    if (!user || !hasAllCredentials) return;

    setIsTesting(true);
    setTestResult(null);
    setTestResponseData(null);
    
    try {
      const result = await UniversalPlatformManager.testCredentials(platform.name, credentials);

      setTestResult({
        success: result.success,
        message: result.message,
        status_code: result.status_code
      });

      setTestResponseData({
        request: result.request_details,
        response: result.response_details
      });
      
      if (result.success) {
        setCanSave(true);
        toast.success('Credentials verified successfully');
      } else {
        setCanSave(false);
        toast.error(`Test failed: ${result.message}`);
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      setCanSave(false);
      toast.error(`Testing error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!user || !canSave) return;

    setIsSaving(true);
    try {
      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentials,
        user.id
      );

      if (result.success) {
        toast.success('Credentials saved successfully');
        onCredentialSaved?.();
      } else {
        toast.error(`Failed to save credentials: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Error saving credentials: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
        <span className="text-sm text-gray-600">Loading credential system...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {isPlaygroundMode ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">{platform.name} API Playground</h3>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                Live Testing
              </span>
            </div>
            
            <Button
              variant="outline"
              onClick={handleTogglePlayground}
              className="text-gray-600 hover:text-gray-800"
            >
              Back to Form
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-x">
            <div className="p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Code className="h-4 w-4 text-blue-600" />
                Request
              </h4>
              <div className="bg-gray-50 rounded border overflow-hidden">
                <div className="p-2 border-b bg-gray-100 text-gray-800 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                      {(testResponseData?.request || apiCallPreview?.request)?.method || 'GET'}
                    </span>
                    <span className="text-blue-600 font-medium truncate">
                      {(testResponseData?.request || apiCallPreview?.request)?.url}
                    </span>
                  </div>
                </div>
                <pre className="p-3 text-xs text-gray-700 font-mono overflow-auto max-h-80">
{JSON.stringify({
  headers: (testResponseData?.request || apiCallPreview?.request)?.headers || {},
  body: (testResponseData?.request || apiCallPreview?.request)?.body || null
}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Response
              </h4>
              <div className="bg-gray-50 rounded border overflow-hidden">
                <div className="p-2 border-b bg-gray-100 text-gray-800 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${
                      testResponseData?.response?.status >= 200 && testResponseData?.response?.status < 300 
                        ? 'bg-green-600' 
                        : 'bg-red-600'
                    }`}>
                      {testResponseData?.response?.status || apiCallPreview?.expected_response?.status || 'Pending'}
                    </span>
                    {testResponseData?.response?.request_time_ms && (
                      <span className="text-blue-600 font-medium">
                        {testResponseData.response.request_time_ms}ms
                      </span>
                    )}
                  </div>
                </div>
                <pre className="p-3 text-xs text-gray-700 font-mono overflow-auto max-h-80">
{JSON.stringify(
  testResponseData?.response?.data || apiCallPreview?.expected_response || { message: "Click 'Test Credentials' to see response" }, 
  null, 
  2
)}
                </pre>
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-4 border-t bg-gray-50">
            <Button
              onClick={handleTest}
              disabled={!hasAllCredentials || isTesting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Live API...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Live API
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={!canSave || isSaving || isTesting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
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
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">{platform.name} Credentials</h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                Universal Support
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePlayground}
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 border-purple-300"
              disabled={!hasAllCredentials}
            >
              <Code className="h-4 w-4 mr-2" />
              API Playground
            </Button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {platform.credentials.map((cred) => (
                <div key={cred.field} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">{cred.field}</label>
                    {cred.link && (
                      <a
                        href={cred.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Get Key
                      </a>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type={showPasswords[cred.field] ? "text" : "password"}
                      placeholder={cred.placeholder}
                      value={credentials[cred.field] || ''}
                      onChange={(e) => handleCredentialChange(cred.field, e.target.value)}
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => togglePasswordVisibility(cred.field)}
                    >
                      {showPasswords[cred.field] ? (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      ) : (
                        <Eye className="h-3 w-3 text-gray-400" />
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">{cred.why_needed}</p>
                </div>
              ))}
            </div>

            {testResult && (
              <div className={`mb-6 p-4 rounded-lg border-2 ${
                testResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">{testResult.message}</span>
                  {testResult.status_code && (
                    <span className="bg-white bg-opacity-50 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                      {testResult.status_code}
                    </span>
                  )}
                </div>

                {testResponseData && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTogglePlayground}
                      className="text-sm bg-white hover:bg-gray-50"
                    >
                      <Code className="h-3 w-3 mr-2" />
                      View Full Response
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleTest}
                disabled={!hasAllCredentials || isTesting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
                disabled={!canSave || isSaving || isTesting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
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

            <p className="text-xs text-center text-gray-500 mt-4">
              Credentials are encrypted and stored securely with universal platform support
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCredentialForm;
