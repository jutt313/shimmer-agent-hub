import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, Settings } from "lucide-react";
import { SimpleCredentialManager } from '@/utils/simpleCredentialManager';
import { useAuth } from "@/contexts/AuthContext";
import SimpleCredentialForm from './SimpleCredentialForm';

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
  automationId?: string;
  onCredentialChange?: () => void;
}

const FixedPlatformButtons: React.FC<FixedPlatformButtonsProps> = ({
  platforms,
  automationId,
  onCredentialChange
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<Record<string, 'saved' | 'tested' | 'missing'>>({});
  const { user } = useAuth();

  console.log('🔧 FixedPlatformButtons rendered with:', {
    platformsCount: platforms.length,
    platforms: platforms.map(p => ({ name: p.name, credentialsCount: p.credentials.length })),
    automationId
  });

  useEffect(() => {
    checkCredentialStatus();
  }, [platforms, automationId]);

  const checkCredentialStatus = async () => {
    if (!automationId || !user?.id) return;
    
    try {
      // Get all platform names
      const platformNames = platforms.map(p => p.name);
      
      // Call the getCredentialStatus method with correct parameters
      const statusResult = await SimpleCredentialManager.getCredentialStatus(
        automationId, 
        platformNames, 
        user.id
      );
      
      console.log('✅ Credential status result:', statusResult);
      setCredentialStatus(statusResult);
    } catch (error) {
      console.error('❌ Error checking credential status:', error);
      // Set all platforms to missing if error occurs
      const fallbackStatus: Record<string, 'saved' | 'tested' | 'missing'> = {};
      platforms.forEach(platform => {
        fallbackStatus[platform.name] = 'missing';
      });
      setCredentialStatus(fallbackStatus);
    }
  };

  const handleCredentialSaved = () => {
    checkCredentialStatus();
    onCredentialChange?.();
  };

  const getButtonStyle = (platform: Platform) => {
    const status = credentialStatus[platform.name] || 'missing';
    switch (status) {
      case 'tested':
        return 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300';
      case 'saved':
        return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300';
      default:
        return 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300';
    }
  };

  const getStatusIcon = (platform: Platform) => {
    const status = credentialStatus[platform.name] || 'missing';
    switch (status) {
      case 'tested':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'saved':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (platform: Platform) => {
    const status = credentialStatus[platform.name] || 'missing';
    switch (status) {
      case 'tested':
        return 'Tested & Ready';
      case 'saved':
        return 'Saved, Test Needed';
      default:
        return 'Setup Required';
    }
  };

  if (platforms.length === 0) {
    console.log('⚠️ No platforms to display');
    return null;
  }

  if (selectedPlatform) {
    return (
      <div className="space-y-4">
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Settings className="w-5 h-5" />
              Configure {selectedPlatform.name} Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleCredentialForm
              automationId={automationId}
              platform={selectedPlatform}
              onCredentialSaved={handleCredentialSaved}
            />
            <div className="mt-4">
              <Button
                onClick={() => setSelectedPlatform(null)}
                variant="outline"
                className="w-full"
              >
                Back to Platforms
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-700 text-lg">Platform Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {platforms.map((platform, index) => (
              <Button
                key={`${platform.name}-${index}`}
                onClick={() => setSelectedPlatform(platform)}
                variant="outline"
                className={`w-full h-auto p-4 ${getButtonStyle(platform)}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(platform)}
                    <div className="text-left">
                      <div className="font-semibold">{platform.name}</div>
                      <div className="text-xs opacity-75">
                        {platform.credentials.length} credential{platform.credentials.length !== 1 ? 's' : ''} required
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(platform)}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
            <p className="text-sm text-blue-800">
              <strong>🔒 Secure Setup:</strong> Your credentials are encrypted and stored securely. 
              Click each platform to configure required API keys and authentication details.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedPlatformButtons;