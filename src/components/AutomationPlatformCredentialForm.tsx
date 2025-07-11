
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { Loader2 } from 'lucide-react';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface PlatformCredentialField {
  field: string;
  placeholder: string;
  link: string;
  why_needed: string;
}

interface AutomationPlatformCredentialFormProps {
  automationId: string;
  platform: Platform;
  onCredentialSaved: () => void;
}

const AutomationPlatformCredentialForm = ({ automationId, platform, onCredentialSaved }: AutomationPlatformCredentialFormProps) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [platformFields, setPlatformFields] = useState<PlatformCredentialField[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const initializeFields = async () => {
      try {
        // Use the platform.credentials directly since we have them
        setPlatformFields(platform.credentials);
        // Initialize credentials state with empty strings for each field
        const initialCredentials: Record<string, string> = {};
        platform.credentials.forEach(field => {
          initialCredentials[field.field] = '';
        });
        setCredentials(initialCredentials);
      } catch (error) {
        console.error('Error initializing credential fields:', error);
        toast({
          title: "Error",
          description: "Failed to load credential fields",
          variant: "destructive",
        });
      }
    };

    initializeFields();
  }, [platform, toast]);

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCredentials = async () => {
    if (!user?.id) return;

    try {
      // Correct parameter order: automationId, platformName, credentials, userId
      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentials,
        user.id
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Credentials saved successfully!",
        });
        onCredentialSaved();
      } else {
        throw new Error(result.error || 'Failed to save credentials');
      }
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save credentials",
        variant: "destructive",
      });
    }
  };

  // Import notification triggers
  const { notifyCredentialTest, notifySystemError } = require('@/utils/globalNotificationTriggers');

  const handleTestCredentials = async () => {
    if (!user?.id) return;
    
    setTesting(true);
    try {
      const result = await AutomationCredentialManager.testCredentials(
        user.id,
        automationId,
        platform.name,
        credentials
      );

      if (result.success) {
        setTestResult({ success: true, message: result.message || 'Credentials are working correctly!' });
        notifyCredentialTest(platform.name, true);
        toast({
          title: "Test Successful",
          description: "Your credentials are working correctly!",
        });
      } else {
        setTestResult({ success: false, message: result.message || 'Credential test failed' });
        notifyCredentialTest(platform.name, false, result.message);
        toast({
          title: "Test Failed",
          description: result.message || 'Please check your credentials',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Credential test error:', error);
      const errorMessage = error.message || 'Failed to test credentials';
      setTestResult({ success: false, message: errorMessage });
      notifyCredentialTest(platform.name, false, errorMessage);
      notifySystemError('Credential test failed', { platform: platform.name, error: errorMessage });
      toast({
        title: "Test Error",
        description: "Check notifications for detailed error information",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {platform.name} Credentials
          </h3>
          <p className="text-sm text-muted-foreground">
            Enter your {platform.name} credentials to connect your account.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {platformFields.map((field) => (
            <div key={field.field} className="grid gap-2">
              <Label htmlFor={field.field}>{field.field}</Label>
              <Input
                id={field.field}
                type="text"
                placeholder={field.placeholder}
                value={credentials[field.field] || ''}
                onChange={(e) => handleInputChange(field.field, e.target.value)}
              />
              {field.link && (
                <a href={field.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                  Where to find this?
                </a>
              )}
              {field.why_needed && (
                <p className="text-sm text-muted-foreground">
                  Why needed: {field.why_needed}
                </p>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" onClick={handleTestCredentials} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Credentials"
            )}
          </Button>
          <Button type="button" onClick={handleSaveCredentials}>
            Save Credentials
          </Button>
        </CardFooter>
      </Card>

      {testResult && (
        <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {testResult.message}
        </div>
      )}
    </div>
  );
};

export default AutomationPlatformCredentialForm;
