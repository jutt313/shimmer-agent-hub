
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
      <DialogContent className="max-w-5xl max-h-[85vh] bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 backdrop-blur-xl border border-green-200/50 shadow-2xl rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-transparent to-blue-100/20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <DialogHeader className="pb-6 border-b border-green-200/30">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              Settings
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Manage your account, automations, and platform preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="profile" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-green-200/50 shadow-lg mx-6 mt-6">
                <TabsTrigger 
                  value="profile" 
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <User className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="automations" 
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <Bot className="w-4 h-4" />
                  Automations
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-agents" 
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <Bot className="w-4 h-4" />
                  AI Agents
                </TabsTrigger>
                <TabsTrigger 
                  value="credentials" 
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <Key className="w-4 h-4" />
                  Credentials
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all duration-300"
                >
                  <Shield className="w-4 h-4" />
                  Privacy
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden px-6 pb-6">
                <div className="h-full overflow-y-auto mt-6 pr-2">
                  <div className="space-y-6">
                    <TabsContent value="profile" className="mt-0">
                      <ProfileSettingsTab />
                    </TabsContent>
                    
                    <TabsContent value="automations" className="mt-0">
                      <AutomationSettingsTab />
                    </TabsContent>
                    
                    <TabsContent value="notifications" className="mt-0">
                      <NotificationSettingsTab />
                    </TabsContent>
                    
                    <TabsContent value="ai-agents" className="mt-0">
                      <AIAgentSettingsTab />
                    </TabsContent>
                    
                    <TabsContent value="credentials" className="mt-0">
                      <PlatformCredentialsTab />
                    </TabsContent>
                    
                    <TabsContent value="privacy" className="mt-0">
                      <DataPrivacyTab />
                    </TabsContent>
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
