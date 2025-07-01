
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileTab from "./ProfileTab";
import AutomationsTab from "./AutomationsTab";
import PlatformCredentialsTab from "./PlatformCredentialsTab";
import DeveloperAPITab from "./DeveloperAPITab";
import PrivacyTab from "./PrivacyTab";
import { User, Bot, Key, Code, Shield } from "lucide-react";

const SettingsTabs = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="developer" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Developer & API
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          <AutomationsTab />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <PlatformCredentialsTab />
        </TabsContent>

        <TabsContent value="developer" className="space-y-6">
          <DeveloperAPITab />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTabs;
