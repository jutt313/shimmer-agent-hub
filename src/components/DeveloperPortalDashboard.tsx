
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Code2, Settings, Webhook, Key, Plus, Eye, EyeOff } from "lucide-react";
import { useEnhancedDeveloperApps } from "@/hooks/useEnhancedDeveloperApps";
import CreateDeveloperAppModal from "./CreateDeveloperAppModal";
import DeveloperAppCard from "./DeveloperAppCard";

interface DeveloperPortalDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeveloperPortalDashboard = ({ isOpen, onClose }: DeveloperPortalDashboardProps) => {
  const { apps, loading, createApp, updateApp, deleteApp, toggleAppStatus } = useEnhancedDeveloperApps();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!isOpen) return null;

  const hasApps = apps.length > 0;

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Developer Portal</h2>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Beta
            </Badge>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="apps" className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Apps ({apps.length})
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-2">
                <Webhook className="w-4 h-4" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="docs" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Docs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {!hasApps ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Code2 className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Welcome to Developer Portal</h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Create your first OAuth application to start building with YusrAI APIs. 
                      Get access to automation triggers, user data, and real-time events.
                    </p>
                    <Button onClick={() => setShowCreateModal(true)} className="rounded-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First App
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Apps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{apps.length}</div>
                      <p className="text-sm text-gray-500">
                        {apps.filter(app => app.is_active).length} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Environment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge variant={apps.some(app => app.environment === 'production') ? 'default' : 'secondary'}>
                          {apps.some(app => app.environment === 'production') ? 'Production' : 'Test'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Rate Limit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">1000</div>
                      <p className="text-sm text-gray-500">requests/hour</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {hasApps && (
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                  <Button onClick={() => setShowCreateModal(true)} className="rounded-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    New App
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="apps" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Your Applications</h3>
                <Button onClick={() => setShowCreateModal(true)} className="rounded-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create App
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading your applications...</div>
              ) : apps.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Code2 className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No applications yet</p>
                    <Button onClick={() => setShowCreateModal(true)} variant="outline" className="rounded-lg">
                      Create your first app
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {apps.map((app) => (
                    <DeveloperAppCard
                      key={app.id}
                      app={app}
                      onUpdate={updateApp}
                      onDelete={deleteApp}
                      onToggleStatus={toggleAppStatus}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Configure webhooks to receive real-time notifications about user events.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>user.automation.created</span>
                      <Badge variant="outline">Available</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>user.automation.executed</span>
                      <Badge variant="outline">Available</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>user.auth.login</span>
                      <Badge variant="outline">Available</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Base URL</h4>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api
                    </code>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Authentication</h4>
                    <p className="text-gray-600 text-sm mb-2">
                      Include your OAuth token in the Authorization header:
                    </p>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm block">
                      Authorization: Bearer YOUR_ACCESS_TOKEN
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Available Endpoints</h4>
                    <div className="space-y-2">
                      <div className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">GET</Badge>
                          <code className="text-sm">/user/profile</code>
                        </div>
                        <p className="text-sm text-gray-600">Get user profile information</p>
                      </div>
                      <div className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">GET</Badge>
                          <code className="text-sm">/automations</code>
                        </div>
                        <p className="text-sm text-gray-600">List user's automations</p>
                      </div>
                      <div className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">POST</Badge>
                          <code className="text-sm">/automations</code>
                        </div>
                        <p className="text-sm text-gray-600">Create new automation</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showCreateModal && (
        <CreateDeveloperAppModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={createApp}
        />
      )}
    </div>
  );
};

export default DeveloperPortalDashboard;
