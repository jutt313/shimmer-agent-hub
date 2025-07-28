
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle, Clock, Settings } from "lucide-react";
import { SimpleCredentialManager } from '@/utils/simpleCredentialManager';
import { useAuth } from "@/contexts/AuthContext";
import SimpleCredentialForm from './SimpleCredentialForm';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
  test_payloads?: any[];
}

interface FixedPlatformButtonsProps {
  platforms: Platform[];
  automationId?: string;
  onCredentialChange?: () => void;
}

const FixedPlatformButtons: React.FC<FixedPlatformButtonsProps> = ({
  platforms,
  automationId,
  onCredentialChange
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<Record<string, 'saved' | 'tested' | 'missing'>>({});
  const { user } = useAuth();

  console.log('🔧 FixedPlatformButtons rendered with:', {
    platformsCount: platforms.length,
    platforms: platforms.map(p => ({ 
      name: p.name, 
      credentialsCount: p.credentials.length,
      firstCredentialField: p.credentials[0]?.field || 'none'
    })),
    automationId
  });

  useEffect(() => {
    if (platforms.length > 0) {
      checkCredentialStatus();
    }
  }, [platforms, automationId]);

  const checkCredentialStatus = async () => {
    if (!automationId || !user?.id) return;
    
    try {
      const platformNames = platforms.map(p => p.name);
      const statusResult = await SimpleCredentialManager.getCredentialStatus(
        automationId, 
        platformNames, 
        user.id
      );
      
      console.log('✅ Credential status result:', statusResult);
      setCredentialStatus(statusResult);
    } catch (error) {
      console.error('❌ Error checking credential status:', error);
      const fallbackStatus: Record<string, 'saved' | 'tested' | 'missing'> = {};
      platforms.forEach(platform => {
        fallbackStatus[platform.name] = 'missing';
      });
      setCredentialStatus(fallbackStatus);
    }
  };

  const handleCredentialSaved = () => {
    console.log('💾 Credential saved, updating status...');
    checkCredentialStatus();
    onCredentialChange?.();
  };

  const handlePlatformClick = (platform: Platform) => {
    console.log('🔧 Platform button clicked:', platform.name);
    console.log('🔧 Platform credentials:', platform.credentials);
    setSelectedPlatform(platform);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlatform(null);
  };

  const getStatusIcon = (platform: Platform) => {
    const status = credentialStatus[platform.name] || 'missing';
    switch (status) {
      case 'tested':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'saved':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (platform: Platform) => {
    const status = credentialStatus[platform.name] || 'missing';
    switch (status) {
      case 'tested':
        return 'Tested';
      case 'saved':
        return 'Saved';
      default:
        return 'Setup';
    }
  };

  if (platforms.length === 0) {
    console.log('⚠️ No platforms to display');
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-900">Platform Credentials</h3>
        <Badge variant="outline" className="text-xs">
          {platforms.length} platform{platforms.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform, index) => (
          <Button
            key={`${platform.name}-${index}`}
            onClick={() => handlePlatformClick(platform)}
            size="sm"
            variant="outline"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium
              transition-all duration-200 hover:scale-105 hover:shadow-sm
              ${credentialStatus[platform.name] === 'tested' 
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                : credentialStatus[platform.name] === 'saved'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }
            `}
          >
            {getStatusIcon(platform)}
            <span>{getStatusText(platform)} {platform.name}</span>
          </Button>
        ))}
      </div>
      
      <div className="text-xs text-gray-500">
        Click on a platform to configure its credentials
      </div>

      {/* Modal for credential form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <Settings className="w-5 h-5" />
              Configure {selectedPlatform?.name} Credentials
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlatform && automationId && (
            <SimpleCredentialForm
              automationId={automationId}
              platform={selectedPlatform}
              onCredentialSaved={() => {
                handleCredentialSaved();
                handleCloseModal();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FixedPlatformButtons;
