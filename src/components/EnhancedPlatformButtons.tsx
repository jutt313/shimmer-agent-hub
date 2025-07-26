/**
 * ENHANCED PLATFORM BUTTONS - Small buttons outside chat card
 * Connected to headquarters data and credential testing system
 */

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { SimpleCredentialManager } from '@/utils/simpleCredentialManager';
import SimpleCredentialForm from './SimpleCredentialForm';
import { automationDataHub } from '@/utils/automationDataHub';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface EnhancedPlatformButtonsProps {
  platforms: Platform[];
  automationId: string;
  userId: string;
  onCredentialChange?: () => void;
}

const EnhancedPlatformButtons: React.FC<EnhancedPlatformButtonsProps> = ({
  platforms,
  automationId,
  userId,
  onCredentialChange
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<{ [key: string]: 'missing' | 'saved' | 'tested' }>({});

  console.log('🔘 Enhanced Platform Buttons rendering:', { platformsCount: platforms.length, platforms });

  useEffect(() => {
    checkCredentialStatus();
  }, [platforms, automationId]);

  const checkCredentialStatus = async () => {
    if (!platforms.length) return;

    const statusMap: { [key: string]: 'missing' | 'saved' | 'tested' } = {};
    
    for (const platform of platforms) {
      try {
        // Create a simple status check for each platform
        const credentials = await SimpleCredentialManager.getCredentials(automationId, platform.name, userId);
        const status: 'missing' | 'saved' | 'tested' = credentials ? 'saved' : 'missing';
        statusMap[platform.name] = status;
      } catch (error) {
        console.error(`Failed to check status for ${platform.name}:`, error);
        statusMap[platform.name] = 'missing';
      }
    }
    
    setCredentialStatus(statusMap);
    console.log('📊 Credential status updated:', statusMap);
  };

  const handleCredentialSaved = async () => {
    await checkCredentialStatus();
    
    // Update headquarters about execution readiness
    const allTested = Object.values(credentialStatus).every(status => status === 'tested');
    await automationDataHub.updateExecutionReadiness(automationId, userId, allTested);
    
    if (onCredentialChange) {
      onCredentialChange();
    }
    
    setSelectedPlatform(null);
  };

  const getButtonVariant = (platform: Platform) => {
    const status = credentialStatus[platform.name] || 'missing';
    switch (status) {
      case 'tested': return 'default';
      case 'saved': return 'secondary';
      case 'missing': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (platform: Platform) => {
    const status = credentialStatus[platform.name] || 'missing';
    switch (status) {
      case 'tested': return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'saved': return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'missing': return <AlertCircle className="w-3 h-3 text-red-600" />;
      default: return null;
    }
  };

  const getStatusText = (platform: Platform) => {
    const status = credentialStatus[platform.name] || 'missing';
    switch (status) {
      case 'tested': return 'Ready';
      case 'saved': return 'Saved';
      case 'missing': return 'Setup';
      default: return 'Unknown';
    }
  };

  if (!platforms.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Platform Credential Buttons - Small and clean */}
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform, index) => (
          <Button
            key={index}
            variant={getButtonVariant(platform)}
            size="sm"
            className="h-8 px-3 text-xs font-medium"
            onClick={() => setSelectedPlatform(platform)}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon(platform)}
              <span>{platform.name}</span>
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {getStatusText(platform)}
              </Badge>
            </div>
          </Button>
        ))}
      </div>

      {/* Credential Form Modal/Overlay */}
      {selectedPlatform && (
        <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Configure {selectedPlatform.name}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPlatform(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          
          <SimpleCredentialForm
            platform={selectedPlatform}
            automationId={automationId}
            onCredentialSaved={handleCredentialSaved}
          />
        </div>
      )}

      {/* Status Summary */}
      <div className="text-xs text-gray-500 text-center">
        {platforms.length} platform{platforms.length !== 1 ? 's' : ''} • 
        {Object.values(credentialStatus).filter(s => s === 'tested').length} tested • 
        {Object.values(credentialStatus).filter(s => s === 'missing').length} pending setup
      </div>
    </div>
  );
};

export default EnhancedPlatformButtons;