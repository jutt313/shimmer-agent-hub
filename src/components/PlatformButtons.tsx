
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

  // Function to refresh credential status for all platforms
  const refreshCredentialStatus = async () => {
    if (!user) return;

    console.log('🔄 Refreshing credential status for all platforms...');
    const saved = new Set<string>();

    for (const platform of platforms) {
      try {
        const credentials = await SecureCredentialManager.getCredentials(
          user.id,
          platform.name
        );
        if (credentials && Object.keys(credentials).length > 0) {
          saved.add(platform.name);
          console.log(`✅ Found saved credentials for ${platform.name}`);
        } else {
          console.log(`❌ No credentials found for ${platform.name}`);
        }
      } catch (error) {
        console.error(`Error checking credentials for ${platform.name}:`, error);
      }
    }

    console.log('🔄 Setting saved platforms:', Array.from(saved));
    setSavedPlatforms(saved);
  };

  // Initial load of credential status
  useEffect(() => {
    refreshCredentialStatus();
  }, [user, platforms]);

  const handlePlatformClick = (platform: Platform) => {
    console.log(`🔘 Opening credential form for ${platform.name}`);
    setSelectedPlatform(platform);
  };

  const handleFormClose = async () => {
    console.log('🔄 Form closed, refreshing credential status...');
    setSelectedPlatform(null);
    
    // Refresh credential status after form closes
    await refreshCredentialStatus();
  };

  const handleCredentialSaved = async (platformName: string) => {
    console.log(`✅ Credential saved for ${platformName}, updating state...`);
    
    // Immediately update state to show green button
    setSavedPlatforms(prev => {
      const updated = new Set([...prev, platformName]);
      console.log('🔄 Updated saved platforms:', Array.from(updated));
      return updated;
    });
    
    // Call the callback if provided
    if (onCredentialChange) {
      onCredentialChange();
    }
    
    // Refresh all credential statuses to ensure consistency
    setTimeout(() => refreshCredentialStatus(), 500);
  };

  const handleCredentialTested = (platformName: string) => {
    console.log(`🧪 Credentials tested for ${platformName}`);
  };

  const getButtonStyles = (platformName: string) => {
    const isSaved = savedPlatforms.has(platformName);
    console.log(`🎨 Button style for ${platformName}: ${isSaved ? 'saved (green)' : 'not saved (yellow)'}`);
    
    if (isSaved) {
      return 'bg-green-500 hover:bg-green-600 text-white border border-green-400';
    }
    return 'bg-yellow-500 hover:bg-yellow-600 text-white border border-yellow-400';
  };

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
