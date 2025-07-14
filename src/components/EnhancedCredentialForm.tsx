
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, TestTube, Save, CheckCircle, XCircle, Loader2, ExternalLink, Code, Play, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UniversalPlatformManager } from '@/utils/universalPlatformManager';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  
  // Enhanced preview states
  const [showApiPreview, setShowApiPreview] = useState(false);
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
        setTestResult({ success: true, message: 'Credentials are saved and verified' });
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

  const handleShowApiPreview = async () => {
    if (!hasAllCredentials) {
      toast.error('Please fill in all credentials first');
      return;
    }

    try {
      console.log('🔍 Generating API preview...');
      const preview = await UniversalPlatformManager.generateSampleCall(platform.name, credentials);
      setApiCallPreview(preview);
      setShowApiPreview(true);
    } catch (error: any) {
      toast.error(`Failed to generate API preview: ${error.message}`);
    }
  };

  const handleTest = async () => {
    if (!user || !hasAllCredentials) return;

    setIsTesting(true);
    setTestResult(null);
    setTestResponseData(null);
    
    try {
      console.log(`🧪 Testing ${platform.name} credentials with Universal Platform Manager`);
      
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
        toast.success(`✅ ${platform.name} credentials verified!`);
      } else {
        setCanSave(false);
        toast.error(`❌ Test failed: ${result.message}`);
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      setCanSave(false);
      toast.error(`💥 Testing error: ${error.message}`);
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
        toast.success(`✅ ${platform.name} credentials saved successfully!`);
        onCredentialSaved?.();
      } else {
        toast.error(`❌ Failed to save credentials: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`💥 Error saving credentials: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-600">Loading universal credential system...</span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-8 border border-purple-200 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-gray-900">{platform.name} Credentials</h3>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Universal Support
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleShowApiPreview}
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 border-purple-300"
              disabled={!hasAllCredentials}
            >
              <Code className="h-5 w-5 mr-2" />
              API Call Preview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {platform.credentials.map((cred) => (
            <div key={cred.field} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">{cred.field}</label>
                {cred.link && (
                  <a
                    href={cred.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-purple-600 hover:text-purple-800 font-medium"
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
                  className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 pr-10 py-4 text-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-purple-100"
                  onClick={() => togglePasswordVisibility(cred.field)}
                >
                  {showPasswords[cred.field] ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-600 italic">{cred.why_needed}</p>
            </div>
          ))}
        </div>

        {testResult && (
          <div className={`mb-6 p-6 rounded-xl border-2 ${
            testResult.success 
              ? 'bg-green-50 border-green-300 text-green-800' 
              : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {testResult.success ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
              <span className="font-semibold text-lg">{testResult.message}</span>
              {testResult.status_code && (
                <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm">
                  Status: {testResult.status_code}
                </span>
              )}
            </div>

            {testResponseData && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiPreview(true)}
                  className="text-sm"
                >
                  <Play className="h-4 w-4 mr-1" />
                  View API Call & Response Details
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <Button
            onClick={handleTest}
            disabled={!hasAllCredentials || isTesting}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-4 text-lg font-semibold"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Testing with Universal AI...
              </>
            ) : (
              <>
                <TestTube className="w-5 h-5 mr-2" />
                Test Credentials
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving || isTesting}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 py-4 text-lg font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Credentials
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-6">
          🔒 Credentials are encrypted and stored securely • 🤖 Universal AI-powered platform support
        </p>
      </div>

      {/* Enhanced API Preview Modal */}
      <Dialog open={showApiPreview} onOpenChange={setShowApiPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Code className="h-6 w-6" />
              API Call & Response Preview - {platform.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {apiCallPreview && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Task Description
                </h4>
                <p className="text-blue-700">{apiCallPreview.task_description}</p>
                {apiCallPreview.universal_support && (
                  <div className="mt-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      ✨ AI-Generated Universal Support
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Section */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  API Request
                </h4>
                <div className="bg-gray-50 rounded-lg border">
                  <div className="p-3 border-b bg-gray-100 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">
                        {(testResponseData?.request || apiCallPreview?.request)?.method || 'POST'}
                      </span>
                      <span className="font-mono text-sm text-gray-600">
                        {(testResponseData?.request || apiCallPreview?.request)?.url}
                      </span>
                    </div>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto font-mono">
{JSON.stringify({
  headers: (testResponseData?.request || apiCallPreview?.request)?.headers || {},
  body: (testResponseData?.request || apiCallPreview?.request)?.body || null
}, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Response Section */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  API Response
                </h4>
                <div className="bg-gray-50 rounded-lg border">
                  <div className="p-3 border-b bg-gray-100 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-bold ${
                        testResponseData?.response?.status >= 200 && testResponseData?.response?.status < 300 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        Status: {testResponseData?.response?.status || apiCallPreview?.expected_response?.status || 'Expected'}
                      </span>
                      {testResponseData?.response?.request_time_ms && (
                        <span className="text-xs text-gray-600">
                          ({testResponseData.response.request_time_ms}ms)
                        </span>
                      )}
                    </div>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto font-mono">
{JSON.stringify(
  testResponseData?.response?.data || apiCallPreview?.expected_response || { message: "Response will appear here after testing" }, 
  null, 
  2
)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">✅ What This Tests & Validates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-700 text-sm">
                <ul className="space-y-1">
                  <li>• Credential format and validity</li>
                  <li>• API endpoint accessibility</li>
                  <li>• Authentication method compatibility</li>
                </ul>
                <ul className="space-y-1">
                  <li>• Platform-specific response handling</li>
                  <li>• Rate limiting and permissions</li>
                  <li>• Real-time API connectivity</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedCredentialForm;
