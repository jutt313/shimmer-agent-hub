
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
  onCredentialSaved: () => void;
  onCredentialTested: () => void;
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
  const [saveAttempts, setSaveAttempts] = useState(0);

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
        console.log('🔍 Loading existing credentials for:', platform.name);
        const existingCreds = await SecureCredentialManager.getCredentials(
          user.id,
          platform.name
        );
        
        if (existingCreds) {
          console.log('✅ Found existing credentials');
          setCredentials(existingCreds);
        }
      } catch (error) {
        console.error('❌ Error loading existing credentials:', error);
      }
    };

    loadExistingCredentials();
  }, [user, platform.name]);

  const handleInputChange = (field: string, value: string) => {
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
    const requiredFields = platform.credentials.map(cred => 
      cred.field.toLowerCase().replace(/\s+/g, '_')
    );
    
    const missingFields = requiredFields.filter(field => !credentials[field]?.trim());
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in all required fields: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const ensureUserProfile = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('📝 Creating user profile for:', user.id);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null
          });

        if (insertError) {
          console.error('❌ Error creating user profile:', insertError);
          throw new Error(`Failed to create user profile: ${insertError.message}`);
        }
        
        console.log('✅ User profile created successfully');
      } else if (profileError) {
        console.error('❌ Error checking user profile:', profileError);
        throw new Error(`Profile check failed: ${profileError.message}`);
      } else {
        console.log('✅ User profile already exists');
      }
    } catch (error) {
      console.error('❌ Error in ensureUserProfile:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save credentials",
        variant: "destructive",
      });
      return;
    }

    if (!validateCredentials()) return;

    setIsLoading(true);
    setSaveAttempts(prev => prev + 1);

    try {
      console.log('💾 Saving platform credentials for:', platform.name);
      console.log('🔐 User ID:', user.id);
      console.log('📋 Credentials keys:', Object.keys(credentials));
      
      // Ensure user profile exists before saving credentials
      await ensureUserProfile();

      // Filter out empty credentials
      const filteredCredentials = Object.fromEntries(
        Object.entries(credentials).filter(([_, value]) => value.trim() !== '')
      );

      if (Object.keys(filteredCredentials).length === 0) {
        throw new Error('No valid credentials to save');
      }

      console.log('💾 Attempting to save credentials...');
      const success = await SecureCredentialManager.storeCredentials(
        user.id,
        platform.name,
        filteredCredentials
      );

      if (success) {
        console.log('✅ Credentials saved successfully');
        toast({
          title: "Success",
          description: `${platform.name} credentials saved successfully!`,
        });
        onCredentialSaved();
        onClose();
      } else {
        throw new Error('Failed to save credentials - SecureCredentialManager returned false');
      }
    } catch (error: any) {
      console.error('❌ Save error:', error);
      
      let errorMessage = 'Failed to save credentials';
      
      if (error.message?.includes('violates foreign key constraint')) {
        errorMessage = 'User profile setup required. Please try again.';
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = 'Credentials already exist. Updating existing credentials.';
      } else if (error.message?.includes('permission denied')) {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Save Failed",
        description: `${errorMessage}${saveAttempts > 1 ? ` (Attempt ${saveAttempts})` : ''}`,
        variant: "destructive",
      });

      // If it's a profile-related error and we haven't tried many times, retry
      if (saveAttempts < 3 && (
        error.message?.includes('foreign key') || 
        error.message?.includes('profile')
      )) {
        console.log('🔄 Retrying save operation...');
        setTimeout(() => handleSave(), 1000);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to test credentials",
        variant: "destructive",
      });
      return;
    }

    if (!validateCredentials()) return;

    setIsTestingCredentials(true);
    setTestStatus('testing');
    setTestMessage('Testing credentials...');

    try {
      console.log('🧪 Testing credentials for:', platform.name);
      
      // Filter out empty credentials
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
      console.log('🧪 Test result:', result);

      if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message || 'Credentials verified successfully!');
        toast({
          title: "Test Successful",
          description: result.message || 'Credentials are valid and working!',
        });
        onCredentialTested();
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
      console.error('❌ Test error:', error);
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
    if (lowerField.includes('url') || lowerField.includes('webhook')) {
      return 'url';
    }
    return 'text';
  };

  const shouldShowPasswordToggle = (field: string) => {
    return getInputType(field) === 'password';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Setup {platform.name} Credentials
            {testStatus === 'success' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {testStatus === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {platform.credentials.map((cred, index) => {
            const normalizedField = cred.field.toLowerCase().replace(/\s+/g, '_');
            const inputType = getInputType(cred.field);
            const showPassword = showPasswords[normalizedField];
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={normalizedField} className="text-sm font-medium">
                    {cred.field}
                  </Label>
                  {cred.link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(cred.link, '_blank')}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto"
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
                    placeholder={cred.placeholder}
                    value={credentials[normalizedField] || ''}
                    onChange={(e) => handleInputChange(cred.field, e.target.value)}
                    className="pr-10"
                  />
                  
                  {shouldShowPasswordToggle(cred.field) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility(cred.field)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-gray-500">{cred.why_needed}</p>
              </div>
            );
          })}

          {testStatus !== 'idle' && (
            <div className={`p-3 rounded-md text-sm ${
              testStatus === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : testStatus === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {testStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                {testStatus === 'success' && <CheckCircle className="h-4 w-4" />}
                {testStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                <span>{testMessage}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleTest}
              variant="outline"
              disabled={isTestingCredentials || isLoading}
              className="flex-1"
            >
              {isTestingCredentials ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Credentials'
              )}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isLoading || isTestingCredentials}
              className="flex-1"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformCredentialForm;
