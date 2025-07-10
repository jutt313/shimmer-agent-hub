
import React, { useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);

  // Memoized function to check credential status
  const checkCredentialStatus = useCallback(async (platformName: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const credentials = await SecureCredentialManager.getCredentials(user.id, platformName);
      return credentials && Object.keys(credentials).length > 0;
    } catch (error) {
      console.error(`Error checking credentials for ${platformName}:`, error);
      return false;
    }
  }, [user]);

  // Function to refresh credential status for all platforms
  const refreshCredentialStatus = useCallback(async () => {
    if (!user || platforms.length === 0) {
      setIsLoading(false);
      return;
    }

    console.log('🔄 Refreshing credential status for all platforms...');
    setIsLoading(true);
    
    const statusChecks = await Promise.all(
      platforms.map(async (platform) => ({
        name: platform.name,
        hasCredentials: await checkCredentialStatus(platform.name)
      }))
    );

    const newSavedPlatforms = new Set<string>();
    statusChecks.forEach(({ name, hasCredentials }) => {
      if (hasCredentials) {
        newSavedPlatforms.add(name);
        console.log(`✅ Credentials confirmed for ${name}`);
      } else {
        console.log(`❌ No credentials for ${name}`);
      }
    });

    setSavedPlatforms(newSavedPlatforms);
    setIsLoading(false);
    console.log('🔄 Credential status refresh complete:', Array.from(newSavedPlatforms));
  }, [user, platforms, checkCredentialStatus]);

  // Initial load and refresh on platform changes
  useEffect(() => {
    refreshCredentialStatus();
  }, [refreshCredentialStatus]);

  const handlePlatformClick = (platform: Platform) => {
    console.log(`🔘 Opening credential form for ${platform.name}`);
    setSelectedPlatform(platform);
  };

  const handleFormClose = async () => {
    console.log('🔄 Form closed, refreshing credential status...');
    setSelectedPlatform(null);
    
    // Always refresh after form closes
    await refreshCredentialStatus();
  };

  const handleCredentialSaved = async (platformName: string) => {
    console.log(`✅ Credential saved for ${platformName}`);
    
    // Immediately update local state
    setSavedPlatforms(prev => {
      const updated = new Set([...prev, platformName]);
      console.log('🔄 Updated saved platforms:', Array.from(updated));
      return updated;
    });
    
    // Call the callback if provided
    if (onCredentialChange) {
      onCredentialChange();
    }
  };

  const handleCredentialTested = (platformName: string) => {
    console.log(`🧪 Credentials tested for ${platformName}`);
  };

  const getButtonStyles = (platformName: string) => {
    if (isLoading) {
      return 'bg-gray-400 hover:bg-gray-500 text-white border border-gray-300';
    }
    
    const isSaved = savedPlatforms.has(platformName);
    console.log(`🎨 Button style for ${platformName}: ${isSaved ? 'saved (green)' : 'not saved (yellow)'}`);
    
    if (isSaved) {
      return 'bg-green-500 hover:bg-green-600 text-white border border-green-400';
    }
    return 'bg-yellow-500 hover:bg-yellow-600 text-white border border-yellow-400';
  };

  if (platforms.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 p-4">
        {platforms.map((platform) => {
          const iconConfig = getPlatformIconConfig(platform.name);
          const IconComponent = iconConfig.icon;
          
          return (
            <Button
              key={platform.name}
              onClick={() => handlePlatformClick(platform)}
              disabled={isLoading}
              className={`
                h-8 px-3 rounded-full text-xs font-medium 
                transition-all duration-200 flex items-center gap-1
                ${getButtonStyles(platform.name)}
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
