import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import ModernCredentialForm from './ModernCredentialForm';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
  test_payloads?: any[];
}

interface FixedPlatformButtonsProps {
  platforms: Platform[];
  automationId: string;
  onCredentialChange?: () => void;
}

const FixedPlatformButtons = ({ platforms, automationId, onCredentialChange }: FixedPlatformButtonsProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<{ [key: string]: 'saved' | 'tested' | 'missing' }>({});
  const { user } = useAuth();
  const { toast } = useToast();

  console.log('🔧 FixedPlatformButtons received platforms:', platforms);

  const handleCredentialSave = async (platformName: string, credentials: any) => {
    try {
      console.log(`💾 Saving credentials for ${platformName}:`, credentials);
      
      // Use the correct table: automation_platform_credentials (not platform_credentials)
      const { error } = await supabase
        .from('automation_platform_credentials')
        .upsert({
          user_id: user?.id,
          platform_name: platformName,
          credentials: JSON.stringify(credentials), // credentials field expects string in this table
          automation_id: automationId,
          credential_type: 'api_key',
          is_active: true,
          is_tested: false
        });

      if (error) throw error;

      setCredentialStatus(prev => ({
        ...prev,
        [platformName]: 'saved'
      }));

      toast({
        title: "✅ Credentials Saved",
        description: `${platformName} credentials saved successfully`,
      });

      onCredentialChange?.();
    } catch (error: any) {
      console.error('❌ Error saving credentials:', error);
      toast({
        title: "❌ Save Failed",
        description: `Failed to save ${platformName} credentials`,
        variant: "destructive",
      });
    }
  };

  const handleCredentialTest = async (platformName: string, credentials: any) => {
    try {
      console.log(`🧪 Testing credentials for ${platformName}`);
      
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platform: platformName,
          credentials: credentials
        }
      });

      if (error) throw error;

      if (data.success) {
        setCredentialStatus(prev => ({
          ...prev,
          [platformName]: 'tested'
        }));
        
        toast({
          title: "✅ Test Successful",
          description: `${platformName} credentials are working correctly`,
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: data.message || `${platformName} credentials test failed`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Error testing credentials:', error);
      toast({
        title: "❌ Test Error",
        description: `Failed to test ${platformName} credentials`,
        variant: "destructive",
      });
    }
  };

  // ENHANCED: Platform setup button click handler
  const handlePlatformSetup = (platformName: string) => {
    console.log(`🔧 Opening credential setup for platform: ${platformName}`);
    setSelectedPlatform(platformName);
  };

  const getStatusIcon = (platformName: string) => {
    const status = credentialStatus[platformName];
    switch (status) {
      case 'tested':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (platformName: string) => {
    const status = credentialStatus[platformName];
    switch (status) {
      case 'tested':
        return 'Tested & Working';
      case 'saved':
        return 'Saved';
      default:
        return 'Setup Required';
    }
  };

  const getStatusColor = (platformName: string) => {
    const status = credentialStatus[platformName];
    switch (status) {
      case 'tested':
        return 'bg-green-100 text-green-800';
      case 'saved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!platforms || platforms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* IMPLEMENTATION: Small credential buttons as requested */}
      <div className="flex flex-wrap gap-3 justify-center">
        {platforms.map((platform, index) => (
          <Button
            key={index}
            onClick={() => handlePlatformSetup(platform.name)}
            variant="outline"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            style={{ 
              boxShadow: '0 0 10px rgba(147, 197, 253, 0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">{platform.name}</span>
            <div className="flex items-center">
              {getStatusIcon(platform.name)}
            </div>
          </Button>
        ))}
      </div>

      {/* Status indicator */}
      {platforms.length > 0 && (
        <div className="text-center">
          <Badge 
            variant="outline" 
            className="bg-white/10 border-white/20 text-white/80 text-xs backdrop-blur-sm"
          >
            Click to configure credentials for each platform
          </Badge>
        </div>
      )}

      {/* ENHANCED: Comprehensive credential form modal with glow effects */}
      {selectedPlatform && (
        <ModernCredentialForm
          automationId={automationId}
          platform={{
            name: selectedPlatform,
            credentials: platforms.find(p => p.name === selectedPlatform)?.credentials || []
          }}
          onCredentialSaved={onCredentialChange}
          onClose={() => setSelectedPlatform(null)}
          isOpen={true}
        />
      )}
    </div>
  );
};

export default FixedPlatformButtons;
