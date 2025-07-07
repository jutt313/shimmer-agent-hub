import { useState } from "react";
import { X, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlatformCredentialFormProps {
  platform: {
    name: string;
    credentials: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  };
  onClose: () => void;
  onCredentialSaved?: () => void;
  onCredentialTested?: () => void;
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
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // BULLETPROOF platform validation
  const validatePlatformData = (platformData: any): boolean => {
    try {
      return (
        platformData &&
        typeof platformData === 'object' &&
        typeof platformData.name === 'string' &&
        platformData.name.trim().length > 0 &&
        Array.isArray(platformData.credentials) &&
        platformData.credentials.length > 0
      );
    } catch (error) {
      console.error('Error validating platform data:', error);
      return false;
    }
  };

  // BULLETPROOF credential validation
  const validateCredentialData = (cred: any): boolean => {
    try {
      return (
        cred &&
        typeof cred === 'object' &&
        typeof cred.field === 'string' &&
        cred.field.trim().length > 0
      );
    } catch (error) {
      console.error('Error validating credential data:', error);
      return false;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTest = async () => {
    if (!credentials || Object.keys(credentials).length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields before testing.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      console.log('🧪 Testing platform credentials:', platform.name);
      
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          type: 'platform',
          platform_name: platform.name,
          credential_fields: credentials
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Test Successful",
          description: data.user_message,
        });
        onCredentialTested?.();
      } else {
        toast({
          title: "❌ Test Failed",
          description: data.user_message,
          variant: "destructive",
        });
        console.error('Test technical details:', data.technical_details);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to test credentials. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!credentials || Object.keys(credentials).length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save credentials.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      console.log('💾 Saving platform credentials for:', platform.name);

      // Check if credentials already exist for this platform and user
      const { data: existingCreds } = await supabase
        .from('platform_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform_name', platform.name)
        .single();

      const credentialData = {
        user_id: user.id,
        platform_name: platform.name,
        credential_type: 'api',
        credentials: JSON.stringify(credentials),
        is_active: true
      };

      let result;
      if (existingCreds) {
        // Update existing credentials
        result = await supabase
          .from('platform_credentials')
          .update(credentialData)
          .eq('id', existingCreds.id)
          .select()
          .single();
      } else {
        // Insert new credentials
        result = await supabase
          .from('platform_credentials')
          .insert(credentialData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "✅ Saved Successfully",
        description: `${platform.name} credentials have been saved securely.`,
      });
      
      onCredentialSaved?.();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: `Failed to save ${platform.name} credentials: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Safe field processing
  const safeProcessField = (field: string): string => {
    try {
      if (!field || typeof field !== 'string') return 'credential';
      return field.replace(/_/g, ' ').toLowerCase();
    } catch (error) {
      console.error('Error processing field:', error);
      return 'credential';
    }
  };

  // Safe placeholder processing
  const safeProcessPlaceholder = (placeholder: any): string => {
    try {
      if (!placeholder || typeof placeholder !== 'string') return 'Enter value...';
      return placeholder;
    } catch (error) {
      console.error('Error processing placeholder:', error);
      return 'Enter value...';
    }
  };

  // Safe link processing
  const safeProcessLink = (link: any): string => {
    try {
      if (!link || typeof link !== 'string') return '#';
      return link;
    } catch (error) {
      console.error('Error processing link:', error);
      return '#';
    }
  };

  // Safe why_needed processing
  const safeProcessWhyNeeded = (whyNeeded: any): string => {
    try {
      if (!whyNeeded || typeof whyNeeded !== 'string') return 'Required for platform integration';
      return whyNeeded;
    } catch (error) {
      console.error('Error processing why_needed:', error);
      return 'Required for platform integration';
    }
  };

  // Early validation - if platform data is invalid, show error
  if (!platform || !platform.name || !Array.isArray(platform.credentials)) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 w-full max-w-md shadow-2xl border-0 relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 rounded-full hover:bg-gray-100/50"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Invalid Platform Data</h2>
            <p className="text-gray-600 mb-6">
              The platform configuration is incomplete or corrupted. Please try generating the automation again.
            </p>
            <Button onClick={onClose} className="w-full rounded-xl">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPasswordField = (field: string) => {
    const passwordFields = ['password', 'secret', 'token', 'key'];
    return passwordFields.some(pf => field.toLowerCase().includes(pf));
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white/80 backdrop-blur-md rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 relative"
        style={{
          boxShadow: '0 0 60px rgba(147, 51, 234, 0.3), 0 0 120px rgba(79, 70, 229, 0.2)'
        }}
      >
        {/* Close button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 rounded-full hover:bg-gray-100/50"
        >
          <X className="w-5 h-5" />
        </Button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Configure {platform.name}
        </h2>
        <p className="text-gray-600 mb-6">
          Enter your {platform.name} credentials to connect this platform to your automation.
        </p>

        <div className="space-y-6">
          {platform.credentials.map((cred, index) => (
            <div key={index}>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor={cred.field} className="text-gray-700 font-medium capitalize">
                  {safeProcessField(cred.field)}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-purple-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-medium mb-1">Why needed:</p>
                        <p className="text-sm mb-3">{safeProcessWhyNeeded(cred.why_needed)}</p>
                        <p className="font-medium mb-1">Get it here:</p>
                        <a 
                          href={safeProcessLink(cred.link)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {safeProcessLink(cred.link)}
                        </a>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="relative">
                <Input
                  id={cred.field}
                  type={isPasswordField(cred.field) && !showPassword[cred.field] ? "password" : "text"}
                  value={credentials[cred.field] || ""}
                  onChange={(e) => handleInputChange(cred.field, e.target.value)}
                  placeholder={safeProcessPlaceholder(cred.placeholder)}
                  className="rounded-xl border-0 bg-white/60 shadow-md focus:shadow-lg transition-shadow pr-10"
                  style={{ boxShadow: '0 0 15px rgba(147, 51, 234, 0.1)' }}
                />
                
                {isPasswordField(cred.field) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => togglePasswordVisibility(cred.field)}
                  >
                    {showPassword[cred.field] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleTest}
              disabled={testing || Object.keys(credentials).length === 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              style={{ boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)' }}
            >
              {testing ? "Testing..." : "Test Connection"}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={saving || Object.keys(credentials).length === 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              style={{ boxShadow: '0 0 20px rgba(79, 70, 229, 0.3)' }}
            >
              {saving ? "Saving..." : "Save Credentials"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformCredentialForm;
