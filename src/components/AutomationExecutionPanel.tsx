
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
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking Execution Readiness...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-purple-800">
          <Play className="h-6 w-6" />
          Automation Execution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credential Status */}
        <div className="space-y-4">
          <h3 className="font-semibold text-purple-700 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Platform Credentials Status
          </h3>
          
          {requiredPlatforms.length === 0 ? (
            <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>No external credentials required</span>
            </div>
          ) : (
            <div className="grid gap-2">
              {requiredPlatforms.map(platform => (
                <div 
                  key={platform}
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    credentialStatus[platform]
                      ? 'text-green-700 bg-green-100 border border-green-200'
                      : 'text-red-700 bg-red-100 border border-red-200'
                  }`}
                >
                  {credentialStatus[platform] ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span className="font-medium">{platform}</span>
                  <span className="text-sm opacity-75">
                    {credentialStatus[platform] ? 'Ready ✓' : 'Missing credentials'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution Button */}
        <div className="pt-4 border-t border-purple-200">
          {allCredentialsReady || requiredPlatforms.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700 bg-green-100 p-4 rounded-xl border border-green-200">
                <CheckCircle className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Ready for Execution</div>
                  <div className="text-sm opacity-75">
                    All required credentials are configured and tested
                  </div>
                </div>
              </div>
              
              <AutomationExecuteButton
                automationId={automationId}
                blueprint={blueprint}
                disabled={false}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-4 rounded-xl border border-amber-200">
                <AlertTriangle className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Credentials Required</div>
                  <div className="text-sm opacity-75">
                    Configure credentials for: {missingCredentials.join(', ')}
                  </div>
                </div>
              </div>
              
              <Button 
                disabled
                className="w-full h-14 bg-gray-400 text-gray-600 cursor-not-allowed rounded-xl"
              >
                <Play className="h-5 w-5 mr-2" />
                Configure Credentials First
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationExecutionPanel;
