
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Webhook, Key, Globe, Play } from 'lucide-react';
import WebhooksSection from '@/components/developer/WebhooksSection';
import PersonalApiTokensSection from '@/components/developer/PersonalApiTokensSection';
import OAuthAppsSection from '@/components/developer/OAuthAppsSection';
import APITestingConsole from '@/components/developer/APITestingConsole';

const DeveloperAPITab = () => {
  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            YusrAI Developer Portal
          </h2>
        </div>
        <p className="text-gray-600">
          Build powerful integrations with the YusrAI platform using our APIs, webhooks, OAuth system, and real-time connections
        </p>
      </div>

      {/* Content - Full height with proper scrolling */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="console" className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
              <TabsTrigger 
                value="console" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                <Play className="w-4 h-4 mr-2" />
                API Console
              </TabsTrigger>
              <TabsTrigger 
                value="webhooks" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                <Webhook className="w-4 h-4 mr-2" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger 
                value="tokens"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                <Key className="w-4 h-4 mr-2" />
                Personal API
              </TabsTrigger>
              <TabsTrigger 
                value="oauth"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
              >
                <Globe className="w-4 h-4 mr-2" />
                OAuth Apps
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <TabsContent value="console" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-y-auto p-6 pt-4">
                <APITestingConsole />
              </div>
            </TabsContent>
            <TabsContent value="webhooks" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-y-auto p-6 pt-4">
                <WebhooksSection />
              </div>
            </TabsContent>
            <TabsContent value="tokens" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-y-auto p-6 pt-4">
                <PersonalApiTokensSection />
              </div>
            </TabsContent>
            <TabsContent value="oauth" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-y-auto p-6 pt-4">
                <OAuthAppsSection />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default DeveloperAPITab;
