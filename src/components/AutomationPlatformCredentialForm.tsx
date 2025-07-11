import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, TestTube, Save, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { toast } from 'sonner';

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
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canSave, setCanSave] = useState(false);

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
        setCanSave(true); // If credentials exist, they were already tested
        setTestResult({ success: true, message: 'Credentials already tested and saved' });
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
    // Reset test result and save ability when credentials change
    setTestResult(null);
    setCanSave(false);
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

  const handleTest = async () => {
    if (!user || !hasAllCredentials) return;

    setIsTesting(true);
    setTestResult(null);
    
    try {
      console.log(`🧪 Testing credentials for ${platform.name}...`);
      
      const result = await AutomationCredentialManager.testCredentials(
        user.id,
        automationId,
        platform.name,
        credentials
      );

      setTestResult(result);
      
      if (result.success) {
        setCanSave(true);
        toast.success(`✅ ${platform.name} credentials tested successfully!`);
      } else {
        setCanSave(false);
        toast.error(`❌ Test failed: ${result.message}`);
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      setCanSave(false);
      toast.error(`💥 Error testing credentials: ${error.message}`);
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
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
      <div className="space-y-4">
        {platform.credentials.map((cred) => (
          <div key={cred.field} className="space-y-2">
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
                className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 pr-10"
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

        {testResult && (
          <div className={`p-3 rounded-xl border ${
            testResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleTest}
            disabled={!hasAllCredentials || isTesting}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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

        <p className="text-xs text-center text-gray-500 pt-2">
          Test your credentials first, then save them securely
        </p>
      </div>
    </div>
  );
};

export default AutomationPlatformCredentialForm;
