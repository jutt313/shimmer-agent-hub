import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handlePlatformSetup = (platformName: string) => {
    console.log(`🔧 Opening credential setup for platform: ${platformName}`);
    setSelectedPlatform(platformName);
  };

  const getStatusIcon = (platformName: string) => {
    const status = credentialStatus[platformName];
    switch (status) {
      case 'tested':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'saved':
        return <CheckCircle className="w-3 h-3 text-blue-500" />;
      default:
        return <Settings className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusColor = (platformName: string) => {
    const status = credentialStatus[platformName];
    switch (status) {
      case 'tested':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'saved':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      default:
        return 'border-gray-200 bg-white hover:bg-gray-50';
    }
  };

  if (!platforms || platforms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* PHASE 3: Convert to small simple buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {platforms.map((platform, index) => (
          <Button
            key={index}
            onClick={() => handlePlatformSetup(platform.name)}
            variant="outline"
            size="sm"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${getStatusColor(platform.name)}
              hover:shadow-md active:scale-95
            `}
          >
            {getStatusIcon(platform.name)}
            <span className="text-gray-700">{platform.name}</span>
            {credentialStatus[platform.name] === 'tested' && (
              <span className="text-xs text-green-600 ml-1">✓</span>
            )}
          </Button>
        ))}
      </div>

      {/* Enhanced credential form modal */}
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
