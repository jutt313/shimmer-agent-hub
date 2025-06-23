
import { useState } from 'react';
import { Settings, User, Bell, Bot, Key, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AutomationSettingsTab from './settings/AutomationSettingsTab';
import ProfileSettingsTab from './settings/ProfileSettingsTab';
import NotificationSettingsTab from './settings/NotificationSettingsTab';
import AIAgentSettingsTab from './settings/AIAgentSettingsTab';
import PlatformCredentialsTab from './settings/PlatformCredentialsTab';
import DataPrivacyTab from './settings/DataPrivacyTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-white/98 backdrop-blur-md border-0 shadow-2xl rounded-3xl flex flex-col">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <Settings className="w-6 h-6 text-green-600" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account, automations, and platform preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-6 bg-green-50 rounded-xl border border-green-100 flex-shrink-0">
            <TabsTrigger value="profile" className="flex items-center gap-1 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <User className="w-3 h-3" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-1 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Bot className="w-3 h-3" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Bell className="w-3 h-3" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="ai-agents" className="flex items-center gap-1 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Bot className="w-3 h-3" />
              AI Agents
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex items-center gap-1 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Key className="w-3 h-3" />
              Credentials
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-1 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Shield className="w-3 h-3" />
              Privacy
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 min-h-0 mt-4">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <div className="p-4">
                <TabsContent value="profile" className="mt-0 h-full">
                  <ProfileSettingsTab />
                </TabsContent>
                
                <TabsContent value="automations" className="mt-0 h-full">
                  <AutomationSettingsTab />
                </TabsContent>
                
                <TabsContent value="notifications" className="mt-0 h-full">
                  <NotificationSettingsTab />
                </TabsContent>
                
                <TabsContent value="ai-agents" className="mt-0 h-full">
                  <AIAgentSettingsTab />
                </TabsContent>
                
                <TabsContent value="credentials" className="mt-0 h-full">
                  <PlatformCredentialsTab />
                </TabsContent>
                
                <TabsContent value="privacy" className="mt-0 h-full">
                  <DataPrivacyTab />
                </TabsContent>
              </div>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
