
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SecureCredentialManager } from '@/utils/secureCredentials';
import { AutomationBlueprint } from '@/types/automation';

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

  if (isCheckingCredentials) {
    return null; // Don't show anything while checking
  }

  // Only show if credentials are ready or no platforms required
  if (!allCredentialsReady && requiredPlatforms.length > 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        className="h-8 px-4 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 hover:from-purple-600 hover:via-blue-600 hover:to-green-600 text-white rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => {
          console.log('Executing automation:', automationId);
        }}
      >
        <Play className="h-3 w-3 mr-1" />
        Execute Automation
      </Button>
    </div>
  );
};

export default AutomationExecutionPanel;
