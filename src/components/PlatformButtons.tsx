
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PlatformCredentialForm from "./PlatformCredentialForm";

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
  credentialStatus?: { [key: string]: 'saved' | 'tested' | 'unsaved' };
  onCredentialStatusChange?: (platformName: string, status: 'saved' | 'tested' | 'unsaved') => void;
}

const PlatformButtons = ({ 
  platforms, 
  credentialStatus = {},
  onCredentialStatusChange 
}: PlatformButtonsProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  // Don't render anything if no platforms
  if (!platforms || platforms.length === 0) {
    return null;
  }

  const getButtonColor = (platformName: string) => {
    const status = credentialStatus[platformName] || 'unsaved';
    switch (status) {
      case 'saved':
      case 'tested':
        return 'bg-gradient-to-r from-green-400/90 to-emerald-500/90 hover:from-green-500 hover:to-emerald-600 border-green-300';
      case 'unsaved':
      default:
        return 'bg-gradient-to-r from-red-400/90 to-rose-500/90 hover:from-red-500 hover:to-rose-600 border-red-300';
    }
  };

  const handleCredentialSaved = (platformName: string) => {
    onCredentialStatusChange?.(platformName, 'saved');
  };

  const handleCredentialTested = (platformName: string) => {
    onCredentialStatusChange?.(platformName, 'tested');
  };

  return (
    <>
      <div className="w-full px-4 mb-3">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-6 gap-2 justify-center">
            {platforms.map((platform, index) => (
              <Button
                key={`${platform.name}-${index}`}
                onClick={() => {
                  setSelectedPlatform(platform);
                }}
                className={`rounded-xl text-white px-3 py-2 text-xs font-medium shadow-md hover:shadow-lg transition-all duration-300 border-0 backdrop-blur-sm transform hover:scale-105 ${getButtonColor(platform.name)}`}
                style={{
                  boxShadow: '0 2px 15px rgba(147, 51, 234, 0.3)'
                }}
              >
                {platform.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {selectedPlatform && (
        <PlatformCredentialForm
          platform={selectedPlatform}
          onClose={() => {
            setSelectedPlatform(null);
          }}
          onCredentialSaved={() => handleCredentialSaved(selectedPlatform.name)}
          onCredentialTested={() => handleCredentialTested(selectedPlatform.name)}
        />
      )}
    </>
  );
};

export default PlatformButtons;
