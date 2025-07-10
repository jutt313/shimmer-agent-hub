
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, CheckCircle, AlertTriangle, Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SecureCredentialManager } from '@/utils/secureCredentials';
import { AutomationBlueprint } from '@/types/automation';
import AutomationExecuteButton from './AutomationExecuteButton';

interface AutomationExecutionPanelProps {
  automationId: string;
  blueprint: AutomationBlueprint;
  title: string;
}

const AutomationExecutionPanel = ({ 
  automationId, 
  blueprint, 
  title 
}: AutomationExecutionPanelProps) => {
  const { user } = useAuth();
  const [credentialStatus, setCredentialStatus] = useState<{
    [platform: string]: boolean;
  }>({});
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(true);
  const [requiredPlatforms, setRequiredPlatforms] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !blueprint) return;

    const extractPlatforms = () => {
      const platforms = new Set<string>();
      
      // Extract platforms from blueprint steps
      if (blueprint.steps) {
        blueprint.steps.forEach(step => {
          if (step.action?.integration && step.action.integration !== 'system') {
            platforms.add(step.action.integration);
          }
        });
      }

      return Array.from(platforms);
    };

    const checkCredentials = async () => {
      setIsCheckingCredentials(true);
      const platforms = extractPlatforms();
      setRequiredPlatforms(platforms);
      
      const status: { [platform: string]: boolean } = {};
      
      for (const platform of platforms) {
        try {
          const credentials = await SecureCredentialManager.getCredentials(
            user.id,
            platform
          );
          status[platform] = credentials && Object.keys(credentials).length > 0;
        } catch (error) {
          console.error(`Error checking credentials for ${platform}:`, error);
          status[platform] = false;
        }
      }
      
      setCredentialStatus(status);
      setIsCheckingCredentials(false);
    };

    checkCredentials();
  }, [user, blueprint]);

  const allCredentialsReady = requiredPlatforms.length > 0 && 
    requiredPlatforms.every(platform => credentialStatus[platform]);

  const missingCredentials = requiredPlatforms.filter(
    platform => !credentialStatus[platform]
  );

  if (isCheckingCredentials) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-purple-600 mr-2" />
        <span className="text-sm text-gray-600">Checking credentials...</span>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 p-4 shadow-lg">
      {/* Credential Status */}
      <div className="mb-4">
        <h3 className="font-semibold text-purple-700 flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4" />
          Platform Status
        </h3>
        
        {requiredPlatforms.length === 0 ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-100 p-2 rounded-lg text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>No external credentials required</span>
          </div>
        ) : (
          <div className="grid gap-2">
            {requiredPlatforms.map(platform => (
              <div 
                key={platform}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  credentialStatus[platform]
                    ? 'text-green-700 bg-green-100 border border-green-200'
                    : 'text-red-700 bg-red-100 border border-red-200'
                }`}
              >
                {credentialStatus[platform] ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="font-medium">{platform}</span>
                <span className="text-xs opacity-75">
                  {credentialStatus[platform] ? 'Ready ✓' : 'Missing credentials'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Button */}
      <div className="border-t border-purple-200/50 pt-4">
        {allCredentialsReady || requiredPlatforms.length === 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-xl border border-green-200 text-sm">
              <CheckCircle className="h-4 w-4" />
              <div>
                <div className="font-semibold">Ready for Execution</div>
                <div className="text-xs opacity-75">
                  All required credentials are configured
                </div>
              </div>
            </div>
            
            <Button
              className="w-full h-12 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 hover:from-purple-600 hover:via-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => {
                // Execute automation logic would go here
                console.log('Executing automation:', automationId);
              }}
            >
              <Play className="h-5 w-5 mr-2" />
              Execute Your Automation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-3 rounded-xl border border-amber-200 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <div>
                <div className="font-semibold">Credentials Required</div>
                <div className="text-xs opacity-75">
                  Configure credentials for: {missingCredentials.join(', ')}
                </div>
              </div>
            </div>
            
            <Button 
              disabled
              className="w-full h-12 bg-gray-400 text-gray-600 cursor-not-allowed rounded-xl font-semibold text-base"
            >
              <Play className="h-5 w-5 mr-2" />
              Configure Credentials First
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationExecutionPanel;
