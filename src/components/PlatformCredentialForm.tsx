import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Eye, EyeOff, Lock, Edit3 } from 'lucide-react';
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
  const [isEditMode, setIsEditMode] = useState(false);

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
        setIsEditMode(false);
        toast({
          title: "Success",
          description: `${platform.name} credentials saved successfully!`,
        });
        onCredentialSaved();
        setTimeout(() => onClose(), 1500);
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

  const isMultiLineField = (field: string, value: string) => {
    const lowerField = field.toLowerCase();
    return (
      lowerField.includes('token') || 
      lowerField.includes('key') || 
      lowerField.includes('secret') ||
      value.length > 50
    );
  };

  const isReadOnlyMode = hasBeenSaved && !isEditMode;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-300/30 shadow-2xl shadow-purple-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Setup {platform.name} Credentials
            {testStatus === 'success' && (
              <CheckCircle className="h-6 w-6 text-emerald-500 animate-pulse" />
            )}
            {testStatus === 'error' && (
              <AlertCircle className="h-6 w-6 text-red-500" />
            )}
            {hasBeenSaved && (
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                  Saved & Secured
                </span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {platform.credentials.map((cred, index) => {
            const normalizedField = cred.field.toLowerCase().replace(/\s+/g, '_');
            const inputType = getInputType(cred.field);
            const showPassword = showPasswords[normalizedField];
            const currentValue = credentials[normalizedField] || '';
            const isMultiLine = isMultiLineField(cred.field, currentValue);
            
            return (
              <div key={index} className="space-y-4 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-purple-200/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <Label htmlFor={normalizedField} className="text-base font-semibold text-purple-800">
                    {cred.field}
                    {isReadOnlyMode && (
                      <Lock className="inline h-4 w-4 ml-2 text-emerald-600" />
                    )}
                  </Label>
                  {cred.link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(cred.link, '_blank')}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 p-2 h-auto rounded-lg transition-all"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Get Key
                    </Button>
                  )}
                </div>
                
                <div className="relative">
                  {isMultiLine ? (
                    <Textarea
                      id={normalizedField}
                      placeholder={cred.placeholder}
                      value={currentValue}
                      onChange={(e) => handleInputChange(cred.field, e.target.value)}
                      readOnly={isReadOnlyMode}
                      className={`min-h-[120px] resize-y rounded-xl border-2 transition-all duration-300 ${
                        isReadOnlyMode 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 cursor-not-allowed' 
                          : 'border-purple-300/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 hover:border-purple-400 bg-white/80'
                      }`}
                      rows={4}
                    />
                  ) : (
                    <Input
                      id={normalizedField}
                      type={inputType === 'password' && !showPassword ? 'password' : 'text'}
                      placeholder={cred.placeholder}
                      value={currentValue}
                      onChange={(e) => handleInputChange(cred.field, e.target.value)}
                      readOnly={isReadOnlyMode}
                      className={`h-12 rounded-xl border-2 transition-all duration-300 ${
                        isReadOnlyMode 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 cursor-not-allowed' 
                          : 'border-purple-300/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 hover:border-purple-400 bg-white/80'
                      }`}
                    />
                  )}
                  
                  {shouldShowPasswordToggle(cred.field) && !isReadOnlyMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-purple-100 rounded-lg"
                      onClick={() => togglePasswordVisibility(cred.field)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-purple-600" />
                      )}
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-purple-600/80 leading-relaxed">{cred.why_needed}</p>
              </div>
            );
          })}

          {testStatus !== 'idle' && (
            <div className={`p-6 rounded-xl text-sm transition-all duration-500 transform ${
              testStatus === 'success' 
                ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-2 border-emerald-300 shadow-lg shadow-emerald-200/50 scale-105' 
                : testStatus === 'error'
                  ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-2 border-red-300 shadow-lg shadow-red-200/50'
                  : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-2 border-blue-300 shadow-lg shadow-blue-200/50'
            }`}>
              <div className="flex items-center gap-3">
                {testStatus === 'testing' && <Loader2 className="h-5 w-5 animate-spin" />}
                {testStatus === 'success' && <CheckCircle className="h-5 w-5 animate-bounce" />}
                {testStatus === 'error' && <AlertCircle className="h-5 w-5" />}
                <span className="font-semibold text-base">{testMessage}</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-8">
            {isReadOnlyMode ? (
              <Button
                onClick={() => setIsEditMode(true)}
                className="flex-1 h-14 rounded-xl font-bold text-base bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Edit3 className="h-5 w-5 mr-2" />
                Edit Credentials
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleTest}
                  variant="outline"
                  disabled={isTestingCredentials || isLoading}
                  className={`flex-1 h-14 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105 ${
                    testStatus === 'success' 
                      ? 'border-2 border-emerald-500 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-lg shadow-emerald-200/50' 
                      : testStatus === 'error'
                        ? 'border-2 border-red-500 bg-red-100 text-red-700 hover:bg-red-200'
                        : 'border-2 border-purple-400 hover:border-purple-500 hover:bg-purple-100 hover:shadow-lg hover:shadow-purple-200/50 bg-white text-purple-700'
                  }`}
                >
                  {isTestingCredentials ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : testStatus === 'success' ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Tested ✓
                    </>
                  ) : (
                    'Test Credentials'
                  )}
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={isLoading || isTestingCredentials || testStatus !== 'success'}
                  className={`flex-1 h-14 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105 ${
                    hasBeenSaved 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-200/50' 
                      : testStatus === 'success'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-300/50'
                        : 'opacity-50 cursor-not-allowed bg-gray-400'
                  } text-white`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : hasBeenSaved ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Saved ✓
                    </>
                  ) : testStatus === 'success' ? (
                    'Save Credentials'
                  ) : (
                    'Test First to Save'
                  )}
                </Button>
              </>
            )}
          </div>
          
          {testStatus !== 'success' && !isReadOnlyMode && (
            <p className="text-sm text-purple-600/70 text-center pt-3 font-medium">
              💡 Test your credentials first to ensure they work before saving
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformCredentialForm;
