
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
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {platforms.map((platform, index) => (
          <Button
            key={index}
            onClick={() => setSelectedPlatform(platform)}
            className="rounded-2xl bg-gradient-to-r from-purple-500/80 to-indigo-500/80 hover:from-purple-600/90 hover:to-indigo-600/90 text-white px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-all duration-300 border-0 backdrop-blur-sm"
            style={{
              boxShadow: '0 0 15px rgba(147, 51, 234, 0.3)'
            }}
          >
            {platform.name}
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
