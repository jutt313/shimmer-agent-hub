
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Settings, Database, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import EnhancedPlatformCredentialForm from './EnhancedPlatformCredentialForm';
import { chatAIConnectionService } from '@/services/chatAIConnectionService';

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
  const [enhancedPlatforms, setEnhancedPlatforms] = useState<Platform[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { user } = useAuth();

  console.log('🚀 ENHANCED FixedPlatformButtons received platforms:', platforms?.length);
  console.log('🔧 Automation ID:', automationId);

  // Enhance platforms with AI-generated test configurations
  useEffect(() => {
    const enhancePlatformsWithAI = async () => {
      if (!platforms || platforms.length === 0) return;
      
      setIsEnhancing(true);
      console.log('🤖 ENHANCING platforms with AI-generated test configurations...');
      
      try {
        const enhancedPlatformsList = await Promise.all(
          platforms.map(async (platform) => {
            // If platform already has test_payloads, use them
            if (platform.test_payloads && platform.test_payloads.length > 0) {
              console.log(`✅ Platform ${platform.name} already has test configurations`);
              return platform;
            }
            
            try {
              // Generate AI test configuration for this platform
              const testConfig = await chatAIConnectionService.generateTestConfig(platform.name);
              
              if (testConfig) {
                console.log(`🤖 Generated AI test config for ${platform.name}:`, testConfig);
                return {
                  ...platform,
                  test_payloads: [{
                    platform: platform.name,
                    test_data: testConfig.test_data || {},
                    field_mapping: testConfig.field_mappings || {},
                    api_config: testConfig
                  }]
                };
              }
            } catch (error) {
              console.warn(`⚠️ Failed to generate AI config for ${platform.name}:`, error);
            }
            
            // Return original platform if AI enhancement fails
            return platform;
          })
        );
        
        setEnhancedPlatforms(enhancedPlatformsList);
        console.log(`✅ Enhanced ${enhancedPlatformsList.length} platforms with AI configurations`);
      } catch (error) {
        console.error('❌ Error enhancing platforms with AI:', error);
        setEnhancedPlatforms(platforms);
      } finally {
        setIsEnhancing(false);
      }
    };

    enhancePlatformsWithAI();
  }, [platforms]);

  const handlePlatformSetup = (platformName: string) => {
    console.log(`🚀 ENHANCED: Opening credential setup for platform: ${platformName}`);
    setSelectedPlatform(platformName);
  };

  const getSelectedPlatformData = () => {
    return enhancedPlatforms.find(p => p.name === selectedPlatform);
  };

  if (!platforms || platforms.length === 0) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <p className="text-yellow-800 text-sm">⚠️ No platforms detected. Please generate an automation blueprint first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-bold text-purple-800">🚀 Enhanced Platform Credentials</h3>
          {isEnhancing && <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full">🤖 AI Enhancing...</span>}
        </div>
        
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform, index) => (
            <Button
              key={index}
              onClick={() => handlePlatformSetup(platform.name)}
              size="lg"
              disabled={isEnhancing}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 px-6 py-3"
            >
              {isEnhancing ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  {platform.name}
                </>
              )}
            </Button>
          ))}
        </div>
        
        <p className="text-sm text-purple-600 mt-3">
          🤖 Enhanced with AI-generated test configurations and live script previews
        </p>
      </div>

      {selectedPlatform && getSelectedPlatformData() && (
        <EnhancedPlatformCredentialForm
          platform={getSelectedPlatformData()!}
          automationId={automationId}
          onCredentialSaved={(platformName: string) => {
            console.log(`✅ ENHANCED: Credentials saved for ${platformName}`);
            onCredentialChange?.();
            setSelectedPlatform(null);
          }}
          onCredentialTested={(platformName: string) => {
            console.log(`🧪 ENHANCED: Credential tested successfully for ${platformName}`);
          }}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </div>
  );
};

export default FixedPlatformButtons;
