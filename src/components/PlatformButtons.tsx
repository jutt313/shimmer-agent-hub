
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import ModernCredentialForm from './ModernCredentialForm';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';

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

  const handleCredentialSaved = () => {
    console.log('💾 Credential saved, refreshing status...');
    checkCredentialStatus();
    onCredentialChange?.();
    setSelectedPlatform(null);
  };

  const getButtonStyle = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    
    if (!status || !status.configured) {
      return "bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600 shadow-lg";
    }
    
    if (status.tested && status.status === 'success') {
      return "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg";
    }
    
    return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg";
  };

  const getStatusText = (platform: Platform) => {
    const status = credentialStatus[platform.name];
    
    if (!status || !status.configured) {
      return "Not Configured";
    }
    
    if (status.tested && status.status === 'success') {
      return "✅ Tested";
    }
    
    return "⚠️ Saved";
  };

  if (!platforms || platforms.length === 0) {
    console.log('⚠️ No platforms provided to PlatformButtons');
    return null;
  }

  console.log('🎯 Rendering PlatformButtons with platforms:', platforms.map(p => p.name));

  return (
    <>
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Platform Credentials</h3>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
            Automation-Specific
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((platform) => {
            const statusInfo = getStatusText(platform);
            return (
              <button
                key={platform.name}
                onClick={() => {
                  console.log(`🔧 Opening credential form for ${platform.name}`);
                  setSelectedPlatform(platform);
                }}
                className={`
                  p-4 text-left rounded-xl font-medium
                  transition-all duration-200 hover:scale-105 hover:shadow-xl
                  ${getButtonStyle(platform)}
                `}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{platform.name}</span>
                  <span className="text-xs opacity-90 mt-1">{statusInfo}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
          <p className="text-xs text-gray-700 leading-relaxed">
            <strong>🔒 Secure & Isolated:</strong> These credentials are encrypted and stored only for this automation. 
            They won't be shared with other automations or users.
          </p>
        </div>
      </div>

      {selectedPlatform && automationId && (
        <ModernCredentialForm
          automationId={automationId}
          platform={selectedPlatform}
          onCredentialSaved={handleCredentialSaved}
          onClose={() => {
            console.log('❌ Closing credential form');
            setSelectedPlatform(null);
          }}
          isOpen={!!selectedPlatform}
        />
      )}
    </>
  );
};

export default PlatformButtons;
