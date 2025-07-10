
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { SecureCredentialManager } from '@/utils/secureCredentials';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface PlatformCredentialFormProps {
  platform: Platform;
  onClose: () => void;
  onCredentialSaved: (platformName: string) => void;
  onCredentialTested: (platformName: string) => void;
}

const PlatformCredentialForm = ({ 
  platform, 
  onClose, 
  onCredentialSaved, 
  onCredentialTested 
}: PlatformCredentialFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [existingCredentials, setExistingCredentials] = useState<Record<string, string> | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Initialize credentials object
  useEffect(() => {
    const initialCredentials: Record<string, string> = {};
    platform.credentials.forEach(cred => {
      const normalizedField = cred.field.toLowerCase().replace(/\s+/g, '_');
      initialCredentials[normalizedField] = '';
    });
    setCredentials(initialCredentials);
  }, [platform]);

  // Load existing credentials
  useEffect(() => {
    if (!user) return;

    const loadExistingCredentials = async () => {
      try {
        const existingCreds = await SecureCredentialManager.getCredentials(
          user.id,
          platform.name
        );
        
        if (existingCreds && Object.keys(existingCreds).length > 0) {
          setExistingCredentials(existingCreds);
          setIsReadOnly(true);
          setTestStatus('success');
          setTestMessage('Credentials are saved and verified');
          
          // Show masked versions for display
          const maskedCreds: Record<string, string> = {};
          Object.keys(existingCreds).forEach(key => {
            maskedCreds[key] = '••••••••••••••••';
          });
          setCredentials(maskedCreds);
        }
      } catch (error) {
        console.error('Error loading existing credentials:', error);
      }
    };

    loadExistingCredentials();
  }, [user, platform.name]);

  const handleInputChange = (field: string, value: string) => {
    if (isReadOnly) return; // Prevent editing if read-only
    
    const normalizedField = field.toLowerCase().replace(/\s+/g, '_');
    setCredentials(prev => ({
      ...prev,
      [normalizedField]: value
    }));
  };

  const togglePasswordVisibility = (field: string) => {
    const normalizedField = field.toLowerCase().replace(/\s+/g, '_');
    setShowPasswords(prev => ({
      ...prev,
      [normalizedField]: !prev[normalizedField]
    }));
  };

  const validateCredentials = () => {
    if (isReadOnly) return true; // Skip validation for read-only
    
    const requiredFields = platform.credentials.map(cred => 
      cred.field.toLowerCase().replace(/\s+/g, '_')
    );
    
    const missingFields = requiredFields.filter(field => !credentials[field]?.trim());
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in all required fields`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleTest = async () => {
    if (!user || !validateCredentials() || isReadOnly) return;

    setIsTestingCredentials(true);
    setTestStatus('testing');
    setTestMessage('Testing credentials...');

    try {
      const filteredCredentials = Object.fromEntries(
        Object.entries(credentials).filter(([_, value]) => value.trim() !== '')
      );

      const response = await supabase.functions.invoke('test-credential', {
        body: {
          platform_name: platform.name,
          credentials: filteredCredentials,
          user_id: user.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Test request failed');
      }

      const result = response.data;

      if (result.success) {
        setTestStatus('success');
        setTestMessage('Credentials verified successfully!');
        toast({
          title: "Test Successful",
          description: 'Credentials are valid and working!',
        });
        onCredentialTested(platform.name);
      } else {
        setTestStatus('error');
        setTestMessage(result.error || 'Credential test failed');
        toast({
          title: "Test Failed",
          description: result.error || 'Invalid credentials or connection failed',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(error.message || 'Test failed');
      toast({
        title: "Test Error",
        description: error.message || 'Failed to test credentials',
        variant: "destructive",
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const handleSave = async () => {
    if (!user || !validateCredentials() || isReadOnly) return;

    setIsLoading(true);

    try {
      const filteredCredentials = Object.fromEntries(
        Object.entries(credentials).filter(([_, value]) => value.trim() !== '')
      );

      const success = await SecureCredentialManager.storeCredentials(
        user.id,
        platform.name,
        filteredCredentials
      );

      if (success) {
        // Don't reload the page, just update the state
        setIsReadOnly(true);
        setExistingCredentials(filteredCredentials);
        
        toast({
          title: "Success",
          description: `${platform.name} credentials saved successfully!`,
        });
        
        // Call the callback without reloading
        onCredentialSaved(platform.name);
        
        // Close the modal after a short delay
        setTimeout(() => onClose(), 500);
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || 'Failed to save credentials',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInputType = (field: string) => {
    const lowerField = field.toLowerCase();
    if (lowerField.includes('password') || 
        lowerField.includes('secret') || 
        lowerField.includes('key') ||
        lowerField.includes('token')) {
      return 'password';
    }
    if (lowerField.includes('email')) {
      return 'email';
    }
    return 'text';
  };

  const shouldShowPasswordToggle = (field: string) => {
    return getInputType(field) === 'password' && !isReadOnly;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-purple-800">
            {isReadOnly ? `${platform.name} Credentials (Saved)` : `Setup ${platform.name} Credentials`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {platform.credentials.map((cred, index) => {
            const normalizedField = cred.field.toLowerCase().replace(/\s+/g, '_');
            const inputType = getInputType(cred.field);
            const showPassword = showPasswords[normalizedField];
            const currentValue = credentials[normalizedField] || '';
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={normalizedField} className="text-sm font-medium text-purple-700">
                    {cred.field}
                  </Label>
                  {cred.link && !isReadOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(cred.link, '_blank')}
                      className="text-purple-600 hover:text-purple-700 p-1 h-auto"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get Key
                    </Button>
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    id={normalizedField}
                    type={inputType === 'password' && !showPassword ? 'password' : 'text'}
                    placeholder={isReadOnly ? 'Saved and verified' : cred.placeholder}
                    value={currentValue}
                    onChange={(e) => handleInputChange(cred.field, e.target.value)}
                    className={`border-purple-300 focus:border-purple-500 focus:ring-purple-200 ${
                      isReadOnly ? 'bg-green-50 border-green-300 text-green-800' : ''
                    }`}
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                  
                  {shouldShowPasswordToggle(cred.field) && (
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
                
                {!isReadOnly && (
                  <p className="text-xs text-purple-600">{cred.why_needed}</p>
                )}
              </div>
            );
          })}

          {testStatus !== 'idle' && (
            <div className={`p-3 rounded-lg text-sm ${
              testStatus === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : testStatus === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {testStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                {testStatus === 'success' && <CheckCircle className="h-4 w-4" />}
                {testStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                <span>{testMessage}</span>
              </div>
            </div>
          )}

          {isReadOnly ? (
            <div className="flex justify-center pt-4">
              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Credentials Saved
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={isTestingCredentials || isLoading}
                className="flex-1 border-purple-400 text-purple-700 hover:bg-purple-100"
              >
                {isTestingCredentials ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tested ✓
                  </>
                ) : (
                  'Test Credentials'
                )}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isLoading || isTestingCredentials || testStatus !== 'success'}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Credentials'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformCredentialForm;
