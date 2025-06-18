
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

  if (!platforms || platforms.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 justify-center mb-6 px-4">
        {platforms.map((platform, index) => (
          <Button
            key={index}
            onClick={() => setSelectedPlatform(platform)}
            className="rounded-2xl bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white px-5 py-2.5 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 border-0 backdrop-blur-sm transform hover:scale-105"
            style={{
              boxShadow: '0 4px 20px rgba(147, 51, 234, 0.4)'
            }}
          >
            🔗 Configure {platform.name}
          </Button>
        ))}
      </div>

      {selectedPlatform && (
        <PlatformCredentialForm
          platform={selectedPlatform}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </>
  );
};

export default PlatformButtons;
