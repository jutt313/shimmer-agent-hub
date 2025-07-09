
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
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

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

  // Removed ensureUserProfile - no longer needed since foreign key constraint is removed

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
        setHasBeenSaved(true);
        toast({
          title: "Success",
          description: `${platform.name} credentials saved successfully!`,
        });
        onCredentialSaved();
        setTimeout(() => onClose(), 1500); // Delay close to show success state
      } else {
        throw new Error('Failed to save credentials - SecureCredentialManager returned false');
      }
    } catch (error: any) {
      console.error('❌ Save error:', error);
      
      let errorMessage = 'Failed to save credentials';
      
      if (error.message?.includes('permission denied')) {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-background/95 border border-primary/20 shadow-2xl shadow-primary/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Setup {platform.name} Credentials
            {testStatus === 'success' && (
              <CheckCircle className="h-5 w-5 text-green-500 animate-pulse" />
            )}
            {testStatus === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {hasBeenSaved && (
              <div className="text-sm text-green-600 font-normal">✓ Saved</div>
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
                    className="pr-10 rounded-xl border-2 border-muted-foreground/20 focus:border-primary/60 focus:ring-4 focus:ring-primary/20 transition-all duration-300 hover:border-primary/40 bg-background/50 backdrop-blur-sm"
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
            <div className={`p-4 rounded-xl text-sm transition-all duration-300 ${
              testStatus === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200 shadow-lg shadow-green-200/50' 
                : testStatus === 'error'
                  ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-200 shadow-lg shadow-red-200/50'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-2 border-blue-200 shadow-lg shadow-blue-200/50'
            }`}>
              <div className="flex items-center gap-2">
                {testStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                {testStatus === 'success' && <CheckCircle className="h-4 w-4 animate-bounce" />}
                {testStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                <span className="font-medium">{testMessage}</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button
              onClick={handleTest}
              variant="outline"
              disabled={isTestingCredentials || isLoading}
              className={`flex-1 rounded-xl h-12 font-medium transition-all duration-300 ${
                testStatus === 'success' 
                  ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100 shadow-lg shadow-green-200/50' 
                  : testStatus === 'error'
                    ? 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border-primary/60 hover:border-primary hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20'
              }`}
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
              className={`flex-1 rounded-xl h-12 font-medium transition-all duration-300 ${
                hasBeenSaved 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-200/50' 
                  : testStatus === 'success'
                    ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg shadow-primary/30'
                    : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : hasBeenSaved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Saved ✓
                </>
              ) : testStatus === 'success' ? (
                'Save Credentials'
              ) : (
                'Test First to Save'
              )}
            </Button>
          </div>
          
          {testStatus !== 'success' && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              💡 Test your credentials first to ensure they work before saving
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformCredentialForm;
