
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, TestTube, Save, CheckCircle, XCircle, Loader2, ExternalLink, Code, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PlatformCredentialFormProps {
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

const AutomationPlatformCredentialForm = ({ 
  automationId, 
  platform, 
  onCredentialSaved 
}: PlatformCredentialFormProps) => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [jsonCallPreview, setJsonCallPreview] = useState<any>(null);

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
    setJsonCallPreview(null);
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

  const generateJsonCallPreview = () => {
    const sampleTasks = {
      'OpenAI': {
        task: 'Generate a summary',
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.api_key || '[API_KEY]'}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Generate a summary of the provided text.' }
          ],
          max_tokens: 150
        }
      },
      'Typeform': {
        task: 'Retrieve form responses',
        url: 'https://api.typeform.com/forms',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.personal_access_token || '[TOKEN]'}`,
          'Content-Type': 'application/json'
        },
        body: null
      },
      'Google Sheets': {
        task: 'Read spreadsheet data',
        url: 'https://sheets.googleapis.com/v4/spreadsheets/[SPREADSHEET_ID]/values/Sheet1!A1:Z1000',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.access_token || '[ACCESS_TOKEN]'}`,
          'Content-Type': 'application/json'
        },
        body: null
      }
    };

    const defaultTask = {
      task: `Perform ${platform.name} API operation`,
      url: `https://api.${platform.name.toLowerCase()}.com/v1/test`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Object.values(credentials)[0] || '[TOKEN]'}`,
        'Content-Type': 'application/json'
      },
      body: null
    };

    return sampleTasks[platform.name as keyof typeof sampleTasks] || defaultTask;
  };

  const handleShowJsonPreview = () => {
    const preview = generateJsonCallPreview();
    setJsonCallPreview(preview);
    setShowJsonPreview(true);
  };

  const handleTest = async () => {
    if (!user || !hasAllCredentials) return;

    setIsTesting(true);
    setTestResult(null);
    
    try {
      console.log(`🧪 Testing ${platform.name} credentials with real API calls`);
      
      const result = await AutomationCredentialManager.testCredentials(
        user.id,
        automationId,
        platform.name,
        credentials
      );

      setTestResult(result);
      
      if (result.success) {
        setCanSave(true);
        toast.success(`✅ ${platform.name} credentials verified successfully!`);
      } else {
        setCanSave(false);
        toast.error(`❌ Credential test failed: ${result.message}`);
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
        <span className="ml-2 text-gray-600">Loading credential system...</span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-8 border border-purple-200 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-gray-900">{platform.name} Credentials</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowJsonPreview}
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
              disabled={!hasAllCredentials}
            >
              <Code className="h-4 w-4 mr-1" />
              JSON Preview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {platform.credentials.map((cred) => (
            <div key={cred.field} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{cred.field}</label>
                {cred.link && (
                  <a
                    href={cred.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-purple-600 hover:text-purple-800"
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
                  className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 pr-10 py-3"
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

              <p className="text-xs text-gray-600">{cred.why_needed}</p>
            </div>
          ))}
        </div>

        {testResult && (
          <div className={`mt-6 p-4 rounded-xl border ${
            testResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <Button
            onClick={handleTest}
            disabled={!hasAllCredentials || isTesting}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Testing Credentials...
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
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 py-3"
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

        <p className="text-xs text-center text-gray-500 mt-4">
          🔒 Credentials are encrypted and stored securely for this automation only
        </p>
      </div>

      {/* JSON Preview Modal */}
      <Dialog open={showJsonPreview} onOpenChange={setShowJsonPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Call Preview - {platform.name}
            </DialogTitle>
          </DialogHeader>
          
          {jsonCallPreview && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Task Description</h4>
                <p className="text-blue-700">{jsonCallPreview.task}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Request Details</h4>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p><span className="font-medium">Method:</span> {jsonCallPreview.method}</p>
                    <p><span className="font-medium">URL:</span> {jsonCallPreview.url}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Headers</h4>
                  <pre className="bg-gray-50 p-3 rounded border text-sm overflow-x-auto">
{JSON.stringify(jsonCallPreview.headers, null, 2)}
                  </pre>
                </div>

                {jsonCallPreview.body && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Request Body</h4>
                    <pre className="bg-gray-50 p-3 rounded border text-sm overflow-x-auto">
{JSON.stringify(jsonCallPreview.body, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">✅ What This Tests</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Credential validity and format</li>
                    <li>• API endpoint accessibility</li>
                    <li>• Authentication method compatibility</li>
                    <li>• Platform-specific response handling</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutomationPlatformCredentialForm;
