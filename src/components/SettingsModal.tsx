
import { useState } from 'react';
import { Settings, User, Bell, Bot, Key, Shield, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account, automations, and platform preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="h-[600px] overflow-hidden">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 rounded-xl">
            <TabsTrigger value="profile" className="flex items-center gap-1 text-xs">
              <User className="w-3 h-3" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-1 text-xs">
              <Bot className="w-3 h-3" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs">
              <Bell className="w-3 h-3" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="ai-agents" className="flex items-center gap-1 text-xs">
              <Bot className="w-3 h-3" />
              AI Agents
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex items-center gap-1 text-xs">
              <Key className="w-3 h-3" />
              Credentials
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-1 text-xs">
              <Shield className="w-3 h-3" />
              Privacy
            </TabsTrigger>
          </TabsList>
          
          <div className="h-[540px] overflow-y-auto mt-4">
            <TabsContent value="profile">
              <ProfileSettingsTab />
            </TabsContent>
            
            <TabsContent value="automations">
              <AutomationSettingsTab />
            </TabsContent>
            
            <TabsContent value="notifications">
              <NotificationSettingsTab />
            </TabsContent>
            
            <TabsContent value="ai-agents">
              <AIAgentSettingsTab />
            </TabsContent>
            
            <TabsContent value="credentials">
              <PlatformCredentialsTab />
            </TabsContent>
            
            <TabsContent value="privacy">
              <DataPrivacyTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
