
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { CheckCircle, AlertCircle, Settings, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import AutomationPlatformCredentialForm from './AutomationPlatformCredentialForm';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface PlatformButtonsProps {
  platforms: Platform[];
  onCredentialChange?: () => void;
}

const PlatformButtons = ({ platforms, onCredentialChange }: PlatformButtonsProps) => {
  const { user } = useAuth();
  const { id: automationId } = useParams<{ id: string }>();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<Record<string, {
    configured: boolean;
    tested: boolean;
    status: string;
  }>>({});

  useEffect(() => {
    if (user && automationId && platforms.length > 0) {
      checkCredentialStatus();
    }
  }, [user, automationId, platforms]);

  const checkCredentialStatus = async () => {
    if (!user || !automationId) return;

    const status: Record<string, { configured: boolean; tested: boolean; status: string }> = {};

    for (const platform of platforms) {
      try {
        const credentials = await AutomationCredentialManager.getAllCredentials(automationId, user.id);
        const platformCred = credentials.find(c => c.platform_name.toLowerCase() === platform.name.toLowerCase());

        if (platformCred) {
          status[platform.name] = {
            configured: true,
            tested: platformCred.is_tested,
            status: platformCred.test_status || 'untested'
          };
        } else {
          status[platform.name] = {
            configured: false,
            tested: false,
            status: 'not_configured'
          };
        }
      } catch (error) {
        console.error(`Error checking status for ${platform.name}:`, error);
        status[platform.name] = {
          configured: false,
          tested: false,
          status: 'error'
        };
      }
    }

    setCredentialStatus(status);
  };

  const handleCredentialSaved = () => {
    checkCredentialStatus();
    onCredentialChange?.();
  };

  const getStatusBadge = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    if (!status) return null;

    if (!status.configured) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Configured
        </Badge>
      );
    }

    if (!status.tested) {
      return (
        <Badge variant="secondary" className="ml-2">
          <Settings className="w-3 h-3 mr-1" />
          Untested
        </Badge>
      );
    }

    if (status.status === 'success') {
      return (
        <Badge variant="default" className="ml-2 bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ready
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="ml-2">
        <X className="w-3 h-3 mr-1" />
        Failed
      </Badge>
    );
  };

  if (!platforms || platforms.length === 0) return null;

  return (
    <>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-purple-600" />
          <h3 className="font-medium text-gray-900">Platform Credentials</h3>
          <span className="text-xs text-gray-500">
            (Automation-specific)
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <Button
              key={platform.name}
              onClick={() => setSelectedPlatform(platform)}
              variant="outline"
              className="rounded-xl border-2 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 flex items-center"
            >
              <span className="capitalize">{platform.name}</span>
              {getStatusBadge(platform)}
            </Button>
          ))}
        </div>

        <p className="text-xs text-gray-600 mt-2">
          Configure credentials for this automation only. These credentials will not be shared with other automations.
        </p>
      </div>

      <Dialog open={!!selectedPlatform} onOpenChange={() => setSelectedPlatform(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {selectedPlatform?.name} Credentials</DialogTitle>
            <DialogDescription>
              These credentials will be used only for this automation and kept separate from other automations.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlatform && automationId && (
            <AutomationPlatformCredentialForm
              automationId={automationId}
              platform={selectedPlatform}
              onCredentialSaved={handleCredentialSaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlatformButtons;
