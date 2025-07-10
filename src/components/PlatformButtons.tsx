
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import PlatformCredentialForm from './PlatformCredentialForm';
import { SecureCredentialManager } from '@/utils/secureCredentials';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Settings, Lock } from 'lucide-react';
import { getPlatformIconConfig } from '@/utils/platformIcons';

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
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [savedPlatforms, setSavedPlatforms] = useState<Set<string>>(new Set());
  const [testedPlatforms, setTestedPlatforms] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const checkSavedCredentials = async () => {
      const saved = new Set<string>();
      const tested = new Set<string>();

      for (const platform of platforms) {
        try {
          const credentials = await SecureCredentialManager.getCredentials(
            user.id,
            platform.name
          );
          if (credentials && Object.keys(credentials).length > 0) {
            saved.add(platform.name);
            // Assume if credentials are saved, they were tested
            tested.add(platform.name);
          }
        } catch (error) {
          console.error(`Error checking credentials for ${platform.name}:`, error);
        }
      }

      setSavedPlatforms(saved);
      setTestedPlatforms(tested);
    };

    checkSavedCredentials();
  }, [user, platforms]);

  const handlePlatformClick = (platform: Platform) => {
    setSelectedPlatform(platform);
  };

  const handleFormClose = () => {
    setSelectedPlatform(null);
  };

  const handleCredentialSaved = () => {
    if (selectedPlatform) {
      setSavedPlatforms(prev => new Set([...prev, selectedPlatform.name]));
      setTestedPlatforms(prev => new Set([...prev, selectedPlatform.name]));
      onCredentialChange?.();
    }
  };

  const handleCredentialTested = () => {
    if (selectedPlatform) {
      setTestedPlatforms(prev => new Set([...prev, selectedPlatform.name]));
    }
  };

  const getButtonStatus = (platformName: string) => {
    if (savedPlatforms.has(platformName)) return 'saved';
    if (testedPlatforms.has(platformName)) return 'tested';
    return 'unsaved';
  };

  const getButtonStyles = (status: string) => {
    switch (status) {
      case 'saved':
        return 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-200/50 transform hover:scale-105';
      case 'tested':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-2 border-blue-400 shadow-lg shadow-blue-200/50 transform hover:scale-105';
      case 'unsaved':
      default:
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white border-2 border-amber-300 shadow-lg shadow-amber-200/50 transform hover:scale-105';
    }
  };

  const getButtonIcon = (status: string) => {
    switch (status) {
      case 'saved':
        return <Lock className="h-4 w-4" />;
      case 'tested':
        return <CheckCircle className="h-4 w-4" />;
      case 'unsaved':
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'saved':
        return 'Secured';
      case 'tested':
        return 'Tested';
      case 'unsaved':
      default:
        return 'Setup';
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
        {platforms.map((platform) => {
          const status = getButtonStatus(platform.name);
          const iconConfig = getPlatformIconConfig(platform.name);
          const IconComponent = iconConfig.icon;
          
          return (
            <Button
              key={platform.name}
              onClick={() => handlePlatformClick(platform)}
              className={`
                h-auto min-h-[80px] p-4 rounded-xl font-bold text-sm 
                transition-all duration-300 flex flex-col items-center gap-2
                ${getButtonStyles(status)}
              `}
            >
              <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                {getButtonIcon(status)}
              </div>
              <div className="text-center">
                <div className="font-bold">{platform.name}</div>
                <div className="text-xs opacity-90">{getStatusText(status)}</div>
              </div>
            </Button>
          );
        })}
      </div>

      {selectedPlatform && (
        <PlatformCredentialForm
          platform={selectedPlatform}
          onClose={handleFormClose}
          onCredentialSaved={handleCredentialSaved}
          onCredentialTested={handleCredentialTested}
        />
      )}
    </>
  );
};

export default PlatformButtons;
