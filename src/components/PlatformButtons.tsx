
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import PlatformCredentialForm from './PlatformCredentialForm';
import { SecureCredentialManager } from '@/utils/secureCredentials';
import { useAuth } from '@/contexts/AuthContext';
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
    // Only allow clicking if not saved, or if saved but user wants to edit
    setSelectedPlatform(platform);
  };

  const handleFormClose = () => {
    setSelectedPlatform(null);
  };

  const handleCredentialSaved = (platformName: string) => {
    setSavedPlatforms(prev => new Set([...prev, platformName]));
    setTestedPlatforms(prev => new Set([...prev, platformName]));
    onCredentialChange?.();
  };

  const handleCredentialTested = (platformName: string) => {
    setTestedPlatforms(prev => new Set([...prev, platformName]));
  };

  const getButtonStatus = (platformName: string) => {
    if (savedPlatforms.has(platformName)) return 'saved';
    if (testedPlatforms.has(platformName)) return 'tested';
    return 'unsaved';
  };

  const getButtonStyles = (status: string) => {
    switch (status) {
      case 'saved':
        return 'bg-green-500 hover:bg-green-600 text-white border border-green-400';
      case 'tested':
        return 'bg-blue-500 hover:bg-blue-600 text-white border border-blue-400';
      case 'unsaved':
      default:
        return 'bg-yellow-500 hover:bg-yellow-600 text-white border border-yellow-400';
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 p-4">
        {platforms.map((platform) => {
          const status = getButtonStatus(platform.name);
          const iconConfig = getPlatformIconConfig(platform.name);
          const IconComponent = iconConfig.icon;
          
          return (
            <Button
              key={platform.name}
              onClick={() => handlePlatformClick(platform)}
              className={`
                h-8 px-3 rounded-full text-xs font-medium 
                transition-all duration-200 flex items-center gap-1
                ${getButtonStyles(status)}
              `}
            >
              <IconComponent className="h-3 w-3" />
              <span>{platform.name}</span>
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
