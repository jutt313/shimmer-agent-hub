
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
      
      const { error } = await supabase
        .from('platform_credentials')
        .upsert({
          user_id: user?.id,
          platform_name: platformName,
          credentials: credentials,
          automation_id: automationId
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform, index) => (
          <Card key={index} className="border-0 shadow-lg bg-white/90 backdrop-blur-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-gray-800">
                  {platform.name}
                </CardTitle>
                {getStatusIcon(platform.name)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(platform.name)} border-0 text-xs`}
              >
                {getStatusText(platform.name)}
              </Badge>
              
              <div className="text-sm text-gray-600">
                <div className="font-medium mb-1">Required credentials:</div>
                {platform.credentials.map((cred, credIndex) => (
                  <div key={credIndex} className="text-xs mb-1">
                    • {cred.field}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePlatformSetup(platform.name)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  style={{ boxShadow: '0 0 15px rgba(92, 142, 246, 0.3)' }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Setup
                </Button>
                
                {platform.credentials.length > 0 && platform.credentials[0].link && platform.credentials[0].link !== '#' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(platform.credentials[0].link, '_blank')}
                    className="rounded-xl border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FIXED: Enhanced credential form modal with proper popup functionality */}
      {selectedPlatform && (
        <ModernCredentialForm
          platformName={selectedPlatform}
          credentials={platforms.find(p => p.name === selectedPlatform)?.credentials || []}
          onSave={(credentials) => handleCredentialSave(selectedPlatform, credentials)}
          onTest={(credentials) => handleCredentialTest(selectedPlatform, credentials)}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </div>
  );
};

export default FixedPlatformButtons;
