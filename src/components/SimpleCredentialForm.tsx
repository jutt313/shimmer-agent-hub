import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Save, Check, ExternalLink, Key, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SimpleCredentialFormProps {
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

const SimpleCredentialForm = ({ 
  automationId, 
  platform, 
  onCredentialSaved 
}: SimpleCredentialFormProps) => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && automationId && platform.name) {
      loadExistingCredentials();
    }
  }, [user, automationId, platform.name]);

  const loadExistingCredentials = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('credentials, platform_name')
        .eq('automation_id', automationId)
        .eq('platform_name', platform.name)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const existingCreds = JSON.parse(data[0].credentials);
        setCredentials(existingCreds);
        setSavedCredentials(new Set(Object.keys(existingCreds)));
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
    
    // Remove from saved set when changed
    setSavedCredentials(prev => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateCredential = (field: string, value: string): { isValid: boolean; message?: string } => {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'Required field' };
    }

    const lowerField = field.toLowerCase();
    const trimmedValue = value.trim();

    // Basic format validation for common credential types
    if (lowerField.includes('api_key') || lowerField.includes('token')) {
      if (trimmedValue.length < 10) {
        return { isValid: false, message: 'API key seems too short' };
      }
    }

    if (lowerField.includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        return { isValid: false, message: 'Invalid email format' };
      }
    }

    if (lowerField.includes('url')) {
      try {
        new URL(trimmedValue);
      } catch {
        return { isValid: false, message: 'Invalid URL format' };
      }
    }

    return { isValid: true };
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate all credentials
    const validationErrors: string[] = [];
    for (const cred of platform.credentials) {
      const validation = validateCredential(cred.field, credentials[cred.field] || '');
      if (!validation.isValid) {
        validationErrors.push(`${cred.field}: ${validation.message}`);
      }
    }

    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors:\n' + validationErrors.join('\n'));
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .upsert({
          automation_id: automationId,
          platform_name: platform.name,
          user_id: user.id,
          credentials: JSON.stringify(credentials),
          is_active: true,
          is_tested: false, // Simple system doesn't test
          credential_type: 'api_key'
        }, {
          onConflict: 'automation_id,platform_name,user_id'
        });

      if (error) throw error;

      toast.success(`✅ ${platform.name} credentials saved successfully!`);
      setSavedCredentials(new Set(Object.keys(credentials)));
      onCredentialSaved?.();
    } catch (error: any) {
      toast.error(`❌ Failed to save credentials: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getInputType = (field: string) => {
    const lowerField = field.toLowerCase();
    return lowerField.includes('password') || 
           lowerField.includes('secret') || 
           lowerField.includes('key') ||
           lowerField.includes('token') ? 'password' : 'text';
  };

  if (!isLoaded) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading credentials...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAllCredentials = platform.credentials.every(cred => 
    credentials[cred.field] && credentials[cred.field].trim() !== ''
  );

  const hasAnyUnsavedChanges = platform.credentials.some(cred => 
    credentials[cred.field] && !savedCredentials.has(cred.field)
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          Configure {platform.name} Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {platform.credentials.map((cred, index) => {
            const inputType = getInputType(cred.field);
            const showPassword = showPasswords[cred.field];
            const currentValue = credentials[cred.field] || '';
            const validation = validateCredential(cred.field, currentValue);
            const isSaved = savedCredentials.has(cred.field) && currentValue;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    {cred.field}
                    {isSaved && <Check className="h-4 w-4 text-green-500" />}
                  </Label>
                  
                  {cred.link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(cred.link, '_blank')}
                      className="text-primary hover:text-primary/80 h-8 px-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get Key
                    </Button>
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    type={inputType === 'password' && !showPassword ? 'password' : 'text'}
                    placeholder={cred.placeholder}
                    value={currentValue}
                    onChange={(e) => handleCredentialChange(cred.field, e.target.value)}
                    className={`pr-10 ${
                      currentValue && !validation.isValid ? 'border-red-300 focus:border-red-500' :
                      isSaved ? 'border-green-300' : ''
                    }`}
                  />
                  
                  {inputType === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => togglePasswordVisibility(cred.field)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>

                {currentValue && !validation.isValid && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    {validation.message}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {cred.why_needed}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasAllCredentials || isSaving || !hasAnyUnsavedChanges}
            className="w-full"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Credentials
              </>
            )}
          </Button>
          
          {!hasAnyUnsavedChanges && hasAllCredentials && (
            <p className="text-xs text-green-600 text-center mt-2">
              All credentials are saved and ready to use
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Credentials are securely encrypted and stored</p>
          <p>• They will be tested when your automation runs</p>
          <p>• You can update them anytime from automation settings</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleCredentialForm;