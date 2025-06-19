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

  return (
    <>
      <div className="w-full px-4 mb-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {platforms.map((platform, index) => (
              <Button
                key={`${platform.name}-${index}`}
                onClick={() => {
                  setSelectedPlatform(platform);
                }}
                className="rounded-xl bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2 text-xs font-medium shadow-md hover:shadow-lg transition-all duration-300 border-0 backdrop-blur-sm transform hover:scale-105"
                style={{
                  boxShadow: '0 2px 15px rgba(147, 51, 234, 0.3)'
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
            setSelectedPlatform(null);
          }}
        />
      )}
    </>
  );
};

export default PlatformButtons;
