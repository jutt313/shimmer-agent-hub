import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ChatAICredentialForm from './ChatAICredentialForm';
import { PlatformPersistenceManager } from '@/utils/platformPersistenceManager';
import { DataFlowValidator } from '@/utils/dataFlowValidator';
import { toast } from 'sonner';

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

  // Validate platform data on mount
  useEffect(() => {
    if (platforms && platforms.length > 0) {
      platforms.forEach((platform, index) => {
        const validation = DataFlowValidator.validatePlatformForCredentialForm(platform);
        if (validation.warnings.length > 0) {
          console.warn(`Platform ${platform.name || index} validation warnings:`, validation.warnings);
        }
      });
    }
  }, [platforms]);

  const handlePlatformSetup = (platform: Platform) => {
    console.log(`🔧 Opening ChatAI credential setup for platform:`, platform.name);
    console.log(`🔧 Platform includes ChatAI testConfig:`, !!platform.testConfig);
    console.log(`🔧 Platform includes test_payloads:`, platform.test_payloads?.length || 0);
    
    // Validate platform before opening form
    const validation = DataFlowValidator.validatePlatformForCredentialForm(platform);
    if (!validation.isValid) {
      console.error('Platform validation failed:', validation.issues);
      toast.error('Platform configuration is invalid. Please try again.');
      return;
    }

    // Save platform data to persistence before opening form
    if (automationId && platform.name) {
      PlatformPersistenceManager.savePlatformData(automationId, platform.name, platform);
    }

    setSelectedPlatform(platform);
  };

  if (!platforms || platforms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform, index) => {
          const platformName = platform.name || `Platform ${index + 1}`;
          const hasChatAIData = !!(platform.testConfig || (platform.test_payloads && platform.test_payloads.length > 0));
          
          return (
            <Button
              key={index}
              onClick={() => handlePlatformSetup(platform)}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs px-4 py-2 relative"
            >
              <Settings className="w-3 h-3 mr-1.5" />
              {platformName}
              {hasChatAIData && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
              )}
            </Button>
          );
        })}
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
