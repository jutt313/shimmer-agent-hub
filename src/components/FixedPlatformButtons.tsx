
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  console.log('🚀 FixedPlatformButtons received platforms:', platforms);
  console.log('🧪 Automation ID:', automationId);

  const handlePlatformSetup = (platform: Platform) => {
    console.log(`🔧 Platform setup requested for:`, platform);
    // TODO: Will implement simple credential form here
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
      
      <div className="text-center text-gray-500 text-sm">
        Platform credential setup will be implemented with a simple approach
      </div>
    </div>
  );
};

export default FixedPlatformButtons;
