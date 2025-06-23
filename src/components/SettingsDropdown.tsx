
import { useState } from 'react';
import { Settings, User, Bot, Shield, ChevronDown, Upload, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileTab from './settings/ProfileTab';
import AutomationsTab from './settings/AutomationsTab';
import PrivacyTab from './settings/PrivacyTab';

const SettingsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="relative rounded-xl border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[600px] h-[500px] overflow-hidden bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-2xl p-0"
        align="end"
        style={{
          boxShadow: '0 0 50px rgba(59, 130, 246, 0.3), 0 0 100px rgba(147, 51, 234, 0.2)'
        }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
        
        <div className="relative z-10 h-full">
          <div className="p-6 border-b border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Settings
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="h-[calc(100%-80px)] overflow-hidden">
            <Tabs defaultValue="profile" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-blue-50/50 rounded-none border-b border-blue-200/50">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="automations"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Automations
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="profile" className="h-full overflow-y-auto custom-scrollbar">
                  <ProfileTab />
                </TabsContent>
                <TabsContent value="automations" className="h-full overflow-y-auto custom-scrollbar">
                  <AutomationsTab />
                </TabsContent>
                <TabsContent value="privacy" className="h-full overflow-y-auto custom-scrollbar">
                  <PrivacyTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsDropdown;
