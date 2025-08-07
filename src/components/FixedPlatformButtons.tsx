
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ChatAICredentialForm from './ChatAICredentialForm';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
  testConfig?: any;
  test_payloads?: any[];
  chatai_data?: any;
}

interface FixedPlatformButtonsProps {
  platforms: Platform[];
  automationId: string;
  onCredentialChange?: () => void;
}

const FixedPlatformButtons = ({ platforms, automationId, onCredentialChange }: FixedPlatformButtonsProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const { user } = useAuth();

  console.log('🚀 FixedPlatformButtons using COMPLETE platform objects with ChatAI data:', platforms);
  console.log('🧪 Automation ID:', automationId);

  const handlePlatformSetup = (platform: Platform) => {
    console.log(`🔧 Opening ChatAI credential setup for platform:`, platform);
    console.log(`🔧 Platform includes ChatAI testConfig:`, !!platform.testConfig);
    console.log(`🔧 Platform includes test_payloads:`, platform.test_payloads?.length || 0);
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
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs px-4 py-2"
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
            console.log(`✅ ChatAI credentials saved for ${platformName}`);
            onCredentialChange?.();
            setSelectedPlatform(null);
          }}
          onCredentialTested={(platformName: string) => {
            console.log(`🧪 ChatAI credential tested successfully for ${platformName}`);
          }}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </div>
  );
};

export default FixedPlatformButtons;
