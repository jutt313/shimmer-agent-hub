import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SimpleCredentialManager } from '@/utils/simpleCredentialManager';
import SimpleCredentialForm from './SimpleCredentialForm';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface SimplePlatformButtonsProps {
  platforms: Platform[];
  automationId: string;
  onCredentialChange?: () => void;
}

const SimplePlatformButtons = ({ 
  platforms, 
  automationId, 
  onCredentialChange 
}: SimplePlatformButtonsProps) => {
  const { user } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<Record<string, 'saved' | 'missing'>>({});

  useEffect(() => {
    if (user && automationId && platforms.length > 0) {
      checkCredentialStatus();
    }
  }, [user, automationId, platforms]);

  const checkCredentialStatus = async () => {
    if (!user) return;

    try {
      const platformNames = platforms.map(p => p.name);
      const status = await SimpleCredentialManager.getCredentialStatus(
        automationId,
        platformNames,
        user.id
      );
      setCredentialStatus(status);
    } catch (error) {
      console.error('Failed to check credential status:', error);
    }
  };

  const handleCredentialSaved = () => {
    checkCredentialStatus();
    onCredentialChange?.();
    setSelectedPlatform(null);
  };

  const getButtonStyle = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    
    switch (status) {
      case 'saved':
        return 'border-green-300 bg-green-50 hover:bg-green-100 text-green-800';
      case 'missing':
        return 'border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-800';
      default:
        return 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    
    switch (status) {
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    
    switch (status) {
      case 'saved':
        return 'Configured';
      case 'missing':
        return 'Setup Required';
      default:
        return 'Configure';
    }
  };

  if (selectedPlatform) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setSelectedPlatform(null)}
          className="mb-4"
        >
          ← Back to Platform List
        </Button>
        
        <SimpleCredentialForm
          automationId={automationId}
          platform={selectedPlatform}
          onCredentialSaved={handleCredentialSaved}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Platform Credentials</h3>
        <p className="text-sm text-muted-foreground">
          Configure your API credentials for each platform used in this automation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <Card 
            key={platform.name}
            className={`cursor-pointer transition-colors ${getButtonStyle(platform)}`}
            onClick={() => setSelectedPlatform(platform)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(platform)}
                  <div>
                    <h4 className="font-medium">{platform.name}</h4>
                    <p className="text-xs opacity-75">
                      {getStatusText(platform)}
                    </p>
                  </div>
                </div>
                <Settings className="h-4 w-4 opacity-50" />
              </div>
              
              <div className="mt-3 text-xs opacity-75">
                {platform.credentials.length} credential{platform.credentials.length !== 1 ? 's' : ''} required
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Simple & Secure</p>
              <p>
                Credentials are encrypted and stored securely. They'll be tested automatically when your automation runs.
                No complex API testing required - just save your credentials and you're ready to go.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimplePlatformButtons;