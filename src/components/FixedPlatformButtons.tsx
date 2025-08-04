
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import ChatAICredentialForm from './ChatAICredentialForm';

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
  automationId: string;
  onCredentialChange?: () => void;
}

const FixedPlatformButtons = ({ platforms, automationId, onCredentialChange }: FixedPlatformButtonsProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  console.log('🔧 FixedPlatformButtons received platforms:', platforms);
  console.log('🧪 Automation ID:', automationId);

  const handlePlatformSetup = (platform: Platform) => {
    console.log(`🔧 Opening UNIFIED credential setup for platform: ${platform.name}`);
    setSelectedPlatform(platform);
  };

  if (!platforms || platforms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform, index) => (
          <Button
            key={index}
            onClick={() => handlePlatformSetup(platform)}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-xs px-3 py-1.5"
          >
            <Settings className="w-3 h-3 mr-1.5" />
            {platform.name}
          </Button>
        ))}
      </div>

      {selectedPlatform && (
        <ChatAICredentialForm
          platform={selectedPlatform}
          automationId={automationId}
          onCredentialSaved={(platformName: string) => {
            console.log(`✅ UNIFIED credentials saved for ${platformName}`);
            onCredentialChange?.();
            setSelectedPlatform(null);
          }}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </div>
  );
};

export default FixedPlatformButtons;
