
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
    // Clear test result when credentials change
    setTestResult(null);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentials,
        user.id
      );

      if (result.success) {
        toast.success(`✅ ${platform.name} credentials saved successfully`);
        onCredentialSaved?.();
      } else {
        toast.error(`❌ Failed to save ${platform.name} credentials: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`💥 Error saving credentials: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!user) return;

    // Save credentials first if they haven't been saved
    await handleSave();

    setIsTesting(true);
    try {
      const result = await AutomationCredentialManager.testCredentials(
        automationId,
        platform.name,
        user.id
      );

      setTestResult(result);
      
      if (result.success) {
        toast.success(`✅ ${platform.name} credentials tested successfully`);
      } else {
        toast.error(`❌ ${platform.name} credential test failed: ${result.message}`);
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      toast.error(`💥 Error testing credentials: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (!isLoaded) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading credentials...
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAllCredentials = platform.credentials.every(cred => 
    credentials[cred.field] && credentials[cred.field].trim() !== ''
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{platform.name} Credentials</CardTitle>
            <CardDescription>
              Configure {platform.name} credentials for this automation only
            </CardDescription>
          </div>
          {testResult && (
            <Badge variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Tested</>
              ) : (
                <><XCircle className="w-3 h-3 mr-1" /> Failed</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {platform.credentials.map((cred) => (
          <div key={cred.field} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{cred.field}</label>
              {cred.link && (
                <a
                  href={cred.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Get {cred.field} →
                </a>
              )}
            </div>

            <div className="relative">
              <Input
                type={showPasswords[cred.field] ? "text" : "password"}
                placeholder={cred.placeholder}
                value={credentials[cred.field] || ''}
                onChange={(e) => handleCredentialChange(cred.field, e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => togglePasswordVisibility(cred.field)}
              >
                {showPasswords[cred.field] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {cred.why_needed && (
              <p className="text-xs text-gray-600">{cred.why_needed}</p>
            )}
          </div>
        ))}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasAllCredentials || isSaving}
            className="flex-1"
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

          <Button
            onClick={handleTest}
            disabled={!hasAllCredentials || isTesting || isSaving}
            variant="outline"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Test
              </>
            )}
          </Button>
        </div>

        {testResult && !testResult.success && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{testResult.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomationPlatformCredentialForm;
