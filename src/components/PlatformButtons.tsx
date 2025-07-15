
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import ModernCredentialForm from './ModernCredentialForm';
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
    setSelectedPlatform(null);
  };

  const getButtonStyle = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    
    if (!status || !status.configured) {
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600";
    }
    
    if (status.tested && status.status === 'success') {
      return "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600";
    }
    
    return "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600";
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
            <button
              key={platform.name}
              onClick={() => setSelectedPlatform(platform)}
              className={`
                px-4 py-2 text-sm font-medium rounded-full
                transition-all duration-200 hover:scale-105 hover:shadow-md
                ${getButtonStyle(platform)}
              `}
            >
              {platform.name}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-600 mt-2">
          Configure credentials for this automation only. These credentials will not be shared with other automations.
        </p>
      </div>

      {selectedPlatform && automationId && (
        <ModernCredentialForm
          automationId={automationId}
          platform={selectedPlatform}
          onCredentialSaved={handleCredentialSaved}
          onClose={() => setSelectedPlatform(null)}
          isOpen={!!selectedPlatform}
        />
      )}
    </>
  );
};

export default PlatformButtons;
