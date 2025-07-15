
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, TestTube, Save, CheckCircle, XCircle, Loader2, ExternalLink, Code, Play, Info } from 'lucide-react';
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
  
  // PLAYGROUND MODE STATES - FIXED UI
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

  const handleTogglePlayground = async () => {
    if (!hasAllCredentials) {
      toast.error('Please fill in all credentials first');
      return;
    }

    if (!isPlaygroundMode) {
      try {
        console.log('🔍 Generating API preview for playground...');
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
      console.log(`🧪 Testing ${platform.name} credentials with Universal Platform Manager`);
      
      const result = await UniversalPlatformManager.testCredentials(platform.name, credentials);

      setTestResult({
        success: result.success,
        message: result.message,
        status_code: result.response_details?.status || 200
      });

      setTestResponseData({
        request: result.response_details?.request || null,
        response: result.response_details?.response || null
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
    <div className="w-full mx-auto space-y-6">
      {isPlaygroundMode ? (
        /* PLAYGROUND MODE - LIGHT BACKGROUND, ACTUALLY WIDE */
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg" style={{ minWidth: '90vw', maxWidth: '95vw' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900">{platform.name} API Playground</h3>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                ⚡ Live Testing Mode
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleTogglePlayground}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-300"
            >
              ← Back to Form
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* REQUEST PANEL - LIGHT THEME */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-600" />
                API Request
              </h4>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ minHeight: '400px' }}>
                <div className="p-3 border-b bg-gray-100 text-gray-800 font-mono text-sm">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                      {(testResponseData?.request || apiCallPreview?.request)?.method || 'GET'}
                    </span>
                    <span className="text-blue-600 font-medium">
                      {(testResponseData?.request || apiCallPreview?.request)?.url}
                    </span>
                  </div>
                </div>
                <pre className="p-4 text-sm text-gray-700 font-mono overflow-auto" style={{ height: '350px' }}>
{JSON.stringify({
  headers: (testResponseData?.request || apiCallPreview?.request)?.headers || {},
  body: (testResponseData?.request || apiCallPreview?.request)?.body || null
}, null, 2)}
                </pre>
              </div>
            </div>

            {/* RESPONSE PANEL - LIGHT THEME */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                API Response
              </h4>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ minHeight: '400px' }}>
                <div className="p-3 border-b bg-gray-100 text-gray-800 font-mono text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                      testResponseData?.response?.status >= 200 && testResponseData?.response?.status < 300 
                        ? 'bg-green-600' 
                        : 'bg-red-600'
                    }`}>
                      Status: {testResponseData?.response?.status || apiCallPreview?.expected_response?.status || 'Waiting...'}
                    </span>
                    {testResponseData?.response?.request_time_ms && (
                      <span className="text-blue-600 font-medium">
                        {testResponseData.response.request_time_ms}ms
                      </span>
                    )}
                  </div>
                </div>
                <pre className="p-4 text-sm text-gray-700 font-mono overflow-auto" style={{ height: '350px' }}>
{JSON.stringify(
  testResponseData?.response?.data || apiCallPreview?.expected_response || { message: "Click 'Test Credentials' to see live response" }, 
  null, 
  2
)}
                </pre>
              </div>
            </div>
          </div>

          {/* PLAYGROUND ACTIONS */}
          <div className="flex gap-4 mt-8">
            <Button
              onClick={handleTest}
              disabled={!hasAllCredentials || isTesting}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-4 text-lg font-semibold"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Testing Live API...
                </>
              ) : (
                <>
                  <TestTube className="w-5 h-5 mr-2" />
                  Test Live API
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={!canSave || isSaving || isTesting}
              className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 py-4 text-lg font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save & Continue
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* NORMAL FORM MODE - ACTUALLY WIDER */
        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-12 border border-purple-200 shadow-lg" style={{ minWidth: '85vw', maxWidth: '90vw' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h3 className="text-3xl font-bold text-gray-900">{platform.name} Credentials</h3>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                🌐 Universal Support
              </div>
            </div>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleTogglePlayground}
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 border-purple-300 px-8 py-4 text-lg"
              disabled={!hasAllCredentials}
            >
              <Code className="h-6 w-6 mr-3" />
              Open API Playground
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-10">
            {platform.credentials.map((cred) => (
              <div key={cred.field} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-semibold text-gray-800">{cred.field}</label>
                  {cred.link && (
                    <a
                      href={cred.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
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
                    className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 pr-14 py-6 text-lg font-mono bg-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-purple-100"
                    onClick={() => togglePasswordVisibility(cred.field)}
                  >
                    {showPasswords[cred.field] ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </div>

                <p className="text-sm text-gray-600 bg-white/50 p-3 rounded-lg border-l-4 border-purple-300">{cred.why_needed}</p>
              </div>
            ))}
          </div>

          {testResult && (
            <div className={`mb-8 p-8 rounded-xl border-2 ${
              testResult.success 
                ? 'bg-green-50 border-green-300 text-green-800' 
                : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              <div className="flex items-center gap-4 mb-6">
                {testResult.success ? (
                  <CheckCircle className="h-8 w-8" />
                ) : (
                  <XCircle className="h-8 w-8" />
                )}
                <span className="font-semibold text-xl">{testResult.message}</span>
                {testResult.status_code && (
                  <span className="bg-white/50 text-gray-800 px-3 py-2 rounded-full text-sm font-mono">
                    Status: {testResult.status_code}
                  </span>
                )}
              </div>

              {testResponseData && (
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleTogglePlayground}
                    className="text-lg px-6 py-3 bg-white hover:bg-gray-50"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    View Full API Response in Playground
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-6 mt-10">
            <Button
              onClick={handleTest}
              disabled={!hasAllCredentials || isTesting}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-6 text-xl font-semibold"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Testing with Universal AI...
                </>
              ) : (
                <>
                  <TestTube className="w-6 h-6 mr-3" />
                  Test Credentials
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={!canSave || isSaving || isTesting}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 py-6 text-xl font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6 mr-3" />
                  Save Credentials
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-center text-gray-500 mt-8">
            🔒 Credentials are encrypted and stored securely • 🤖 Universal AI-powered platform support
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedCredentialForm;
