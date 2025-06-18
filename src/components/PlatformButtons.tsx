
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
}

const PlatformButtons = ({ platforms }: PlatformButtonsProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  // Don't render anything if no platforms
  if (!platforms || platforms.length === 0) {
    return null;
  }

  console.log('PlatformButtons rendering with platforms:', platforms);

  return (
    <>
      <div className="w-full px-4 mb-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Required Platform Credentials
            </h3>
            <p className="text-sm text-gray-600">
              Click a platform below to configure your credentials
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {platforms.map((platform, index) => (
              <Button
                key={`${platform.name}-${index}`}
                onClick={() => {
                  console.log('Platform button clicked:', platform.name);
                  setSelectedPlatform(platform);
                }}
                className="rounded-2xl bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white px-6 py-3 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 border-0 backdrop-blur-sm transform hover:scale-105"
                style={{
                  boxShadow: '0 4px 20px rgba(147, 51, 234, 0.4)'
                }}
              >
                Configure {platform.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {selectedPlatform && (
        <PlatformCredentialForm
          platform={selectedPlatform}
          onClose={() => {
            console.log('Closing platform form');
            setSelectedPlatform(null);
          }}
        />
      )}
    </>
  );
};

export default PlatformButtons;
