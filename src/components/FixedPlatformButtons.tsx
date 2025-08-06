
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
  test_payloads?: any[];
}

interface FixedPlatformButtonsProps {
  platforms: Platform[];
  automationId: string;
  onCredentialChange?: () => void;
}

const FixedPlatformButtons = ({ platforms, automationId, onCredentialChange }: FixedPlatformButtonsProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const { user } = useAuth();

  console.log('🚀 FixedPlatformButtons using NEW UNIFIED ChatAI form for platforms:', platforms);
  console.log('🧪 Automation ID:', automationId);

  const handlePlatformSetup = (platformName: string) => {
    console.log(`🔧 Opening NEW UNIFIED ChatAI credential setup for platform: ${platformName}`);
    setSelectedPlatform(platformName);
  };

  const handleCredentialsSubmit = (credentials: Record<string, string>) => {
    console.log('🔐 Credentials submitted:', Object.keys(credentials));
    // Handle credential submission logic here if needed
    // This is the required prop that was missing
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
            onClick={() => handlePlatformSetup(platform.name)}
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
          platform={{
            name: selectedPlatform,
            credentials: platforms.find(p => p.name === selectedPlatform)?.credentials || []
          }}
          onCredentialsSubmit={handleCredentialsSubmit}
          automationId={automationId}
          onCredentialSaved={(platformName: string) => {
            console.log(`✅ NEW UNIFIED credentials saved for ${platformName}`);
            onCredentialChange?.();
            setSelectedPlatform(null);
          }}
          onCredentialTested={(platformName: string) => {
            console.log(`🧪 NEW UNIFIED credential tested successfully for ${platformName}`);
          }}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </div>
  );
};

export default FixedPlatformButtons;
