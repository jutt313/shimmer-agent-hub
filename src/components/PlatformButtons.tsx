
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import PlatformCredentialForm from './PlatformCredentialForm';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
  test_payloads?: Array<{
    platform: string;
    test_data: any;
    field_mapping: Record<string, string>;
    api_config: any;
  }>;
}

interface PlatformButtonsProps {
  platforms: Platform[];
  onCredentialChange?: () => void;
}

const PlatformButtons = ({ platforms, onCredentialChange }: PlatformButtonsProps) => {
  const { user } = useAuth();
  const { id: automationId } = useParams<{ id: string }>();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<Record<string, {
    configured: boolean;
    tested: boolean;
    status: string;
  }>>({});

  useEffect(() => {
    if (user && automationId && platforms.length > 0) {
      checkCredentialStatus();
    }
  }, [user, automationId, platforms]);

  const checkCredentialStatus = async () => {
    if (!user || !automationId) return;

    console.log('🔍 Checking credential status for platforms:', platforms.map(p => p.name));

    const status: Record<string, { configured: boolean; tested: boolean; status: string }> = {};

    for (const platform of platforms) {
      try {
        const credentials = await AutomationCredentialManager.getAllCredentials(automationId, user.id);
        const platformCred = credentials.find(c => c.platform_name.toLowerCase() === platform.name.toLowerCase());

        if (platformCred) {
          status[platform.name] = {
            configured: true,
            tested: platformCred.is_tested,
            status: platformCred.test_status || 'untested'
          };
          console.log(`✅ ${platform.name} credentials found: tested=${platformCred.is_tested}`);
        } else {
          status[platform.name] = {
            configured: false,
            tested: false,
            status: 'not_configured'
          };
          console.log(`❌ ${platform.name} credentials not found`);
        }
      } catch (error) {
        console.error(`Error checking status for ${platform.name}:`, error);
        status[platform.name] = {
          configured: false,
          tested: false,
          status: 'error'
        };
      }
    }

    setCredentialStatus(status);
    console.log('📊 Final credential status:', status);
  };

  const handleCredentialSaved = (platformName: string) => {
    console.log('💾 Credential saved, refreshing status...');
    checkCredentialStatus();
    onCredentialChange?.();
    setSelectedPlatform(null);
  };

  const handleCredentialTested = (platformName: string) => {
    console.log('🧪 Credential tested for:', platformName);
    checkCredentialStatus();
  };

  const getButtonStyle = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    
    if (!status || !status.configured) {
      return "bg-red-500 hover:bg-red-600 text-white";
    }
    
    if (status.tested && status.status === 'success') {
      return "bg-green-500 hover:bg-green-600 text-white";
    }
    
    return "bg-yellow-500 hover:bg-yellow-600 text-white";
  };

  const getStatusText = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    
    if (!status || !status.configured) {
      return "Setup Required";
    }
    
    if (status.tested && status.status === 'success') {
      return "✅ Tested";
    }
    
    return "⚠️ Saved";
  };

  const getStatusIcon = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    
    if (!status || !status.configured) {
      return "🔴";
    }
    
    if (status.tested && status.status === 'success') {
      return "✅";
    }
    
    return "⚠️";
  };

  if (!platforms || platforms.length === 0) {
    console.log('⚠️ No platforms provided to PlatformButtons');
    return null;
  }

  console.log('🎯 Rendering PlatformButtons with platforms:', platforms.map(p => p.name));
  console.log('🧪 Platform test payloads:', platforms.map(p => ({ name: p.name, hasTestPayloads: !!p.test_payloads })));

  return (
    <>
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">Platform Credentials</h3>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            Pre-Generated Configs
          </span>
        </div>
        
        {/* Compact pill-style buttons */}
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const statusIcon = getStatusIcon(platform);
            const statusText = getStatusText(platform);
            
            return (
              <button
                key={platform.name}
                onClick={() => {
                  console.log(`🔧 Opening credential form for ${platform.name}`);
                  console.log('🧪 Platform test payloads:', platform.test_payloads);
                  setSelectedPlatform(platform);
                }}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-all duration-200 hover:scale-105 hover:shadow-md
                  ${getButtonStyle(platform)}
                `}
              >
                <span>{platform.name}</span>
                <span className="text-xs">{statusIcon}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
          <p className="text-xs text-gray-700 leading-relaxed">
            <strong>🚀 Pre-Generated Testing:</strong> Each platform uses ChatAI-generated configurations that are passed directly to the form - no additional API calls needed!
          </p>
        </div>
      </div>

      {selectedPlatform && (
        <PlatformCredentialForm
          platform={selectedPlatform}
          onCredentialSaved={handleCredentialSaved}
          onCredentialTested={handleCredentialTested}
          onClose={() => {
            console.log('❌ Closing credential form');
            setSelectedPlatform(null);
          }}
        />
      )}
    </>
  );
};

export default PlatformButtons;
