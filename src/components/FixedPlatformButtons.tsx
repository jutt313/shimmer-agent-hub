
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
      const platformNames = platforms.map(p => p.name);
      const statusResult = await SimpleCredentialManager.getCredentialStatus(
        automationId, 
        platformNames, 
        user.id
      );
      
      console.log('✅ Credential status result:', statusResult);
      setCredentialStatus(statusResult);
    } catch (error) {
      console.error('❌ Error checking credential status:', error);
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
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform, index) => (
        <Button
          key={`${platform.name}-${index}`}
          onClick={() => setSelectedPlatform(platform)}
          size="sm"
          className="rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0 px-4 py-2"
        >
          {getStatusIcon(platform)}
          Setup {platform.name}
        </Button>
      ))}
    </div>
  );
};

export default FixedPlatformButtons;
