
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiKeysTab from "../developer/ApiKeysTab";
import ProjectsTab from "../developer/ProjectsTab";
import UsageTab from "../developer/UsageTab";
import BillingTab from "../developer/BillingTab";
import LimitsTab from "../developer/LimitsTab";
import { Key, FolderOpen, BarChart3, CreditCard, Shield } from "lucide-react";

const DeveloperTab = () => {
  const [activeTab, setActiveTab] = useState("api-keys");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Developer Portal</h2>
        <p className="text-gray-600">Manage your API keys, projects, and usage analytics</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/50 rounded-2xl p-1">
          <TabsTrigger 
            value="api-keys" 
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger 
            value="projects" 
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <FolderOpen className="w-4 h-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger 
            value="usage" 
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger 
            value="limits" 
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Shield className="w-4 h-4" />
            Limits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <ProjectsTab />
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <UsageTab />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <BillingTab />
        </TabsContent>

        <TabsContent value="limits" className="mt-6">
          <LimitsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperTab;
