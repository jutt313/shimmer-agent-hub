
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
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

  // FIXED: Enhanced platform setup button click handler
  const handlePlatformSetup = (platformName: string) => {
    console.log(`🔧 Opening credential setup for platform: ${platformName}`);
    setSelectedPlatform(platformName);
  };

  if (!platforms || platforms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* SURGICAL REPLACEMENT: Small minimal buttons instead of large cards */}
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform, index) => (
          <Button
            key={index}
            onClick={() => handlePlatformSetup(platform.name)}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-xs px-3 py-1.5"
          >
            <Settings className="w-3 h-3 mr-1.5" />
            {platform.name}
          </Button>
        ))}
      </div>

      {/* FIXED: Enhanced credential form modal with correct props */}
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
