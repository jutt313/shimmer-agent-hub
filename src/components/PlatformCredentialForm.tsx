
import { useState } from "react";
import { X, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
}

const PlatformCredentialForm = ({ platform, onClose }: PlatformCredentialFormProps) => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // Simulate API test - replace with actual testing logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Success",
        description: `${platform.name} credentials tested successfully!`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to verify credentials. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      // Save credentials logic here
      console.log('Saving credentials for', platform.name, credentials);
      toast({
        title: "Saved",
        description: `${platform.name} credentials saved successfully!`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

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
                  {cred.field.replace(/_/g, ' ')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-purple-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-medium mb-1">Why needed:</p>
                        <p className="text-sm mb-3">{cred.why_needed}</p>
                        <p className="font-medium mb-1">Get it here:</p>
                        <a 
                          href={cred.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {cred.link}
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
                  placeholder={cred.placeholder}
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
              disabled={Object.keys(credentials).length === 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              style={{ boxShadow: '0 0 20px rgba(79, 70, 229, 0.3)' }}
            >
              Save Credentials
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformCredentialForm;
