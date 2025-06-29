
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, Trash2, Plus, Globe, Shield, ExternalLink, Settings, Eye, EyeOff } from 'lucide-react';
import { useEnhancedDeveloperApps } from '@/hooks/useEnhancedDeveloperApps';
import { useToast } from '@/components/ui/use-toast';
import ImageUpload from '@/components/ui/image-upload';
import PermissionsDropdown from './PermissionsDropdown';

const OAuthAppsSection = () => {
  const { apps, loading, createApp, updateApp, deleteApp, toggleAppStatus, switchEnvironment } = useEnhancedDeveloperApps();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecrets, setShowSecrets] = useState<string | null>(null);
  const [newApp, setNewApp] = useState({
    app_name: '',
    app_description: '',
    redirect_uris: [''],
    webhook_url: '',
    app_logo_url: '',
    homepage_url: '',
    privacy_policy_url: '',
    terms_of_service_url: '',
    developer_email: '',
    tool_description: '',
    use_cases: [] as string[],
    supported_events: {} as any,
    event_descriptions: {} as any,
    environment: 'test' as 'test' | 'production'
  });
  const { toast } = useToast();

  const availableEvents = [
    { key: 'automation.created', label: 'Automation Created', description: 'Triggered when a new automation is created' },
    { key: 'automation.updated', label: 'Automation Updated', description: 'Triggered when an automation is modified' },
    { key: 'automation.deleted', label: 'Automation Deleted', description: 'Triggered when an automation is removed' },
    { key: 'automation.started', label: 'Automation Started', description: 'Triggered when an automation begins execution' },
    { key: 'automation.completed', label: 'Automation Completed', description: 'Triggered when an automation finishes successfully' },
    { key: 'automation.failed', label: 'Automation Failed', description: 'Triggered when an automation encounters an error' },
    { key: 'user.profile_updated', label: 'Profile Updated', description: 'Triggered when user profile information changes' },
    { key: 'platform.connected', label: 'Platform Connected', description: 'Triggered when a new platform is connected' },
    { key: 'platform.disconnected', label: 'Platform Disconnected', description: 'Triggered when a platform is disconnected' }
  ];

  const handleCreateApp = async () => {
    if (!newApp.app_name || !newApp.app_description || newApp.redirect_uris.filter(uri => uri.trim()).length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including at least one redirect URI",
        variant: "destructive",
      });
      return;
    }

    const result = await createApp(newApp);
    if (result) {
      setNewApp({
        app_name: '',
        app_description: '',
        redirect_uris: [''],
        webhook_url: '',
        app_logo_url: '',
        homepage_url: '',
        privacy_policy_url: '',
        terms_of_service_url: '',
        developer_email: '',
        tool_description: '',
        use_cases: [],
        supported_events: {},
        event_descriptions: {},
        environment: 'test'
      });
      setShowCreateDialog(false);
    }
  };

  const addRedirectUri = () => {
    setNewApp(prev => ({
      ...prev,
      redirect_uris: [...prev.redirect_uris, '']
    }));
  };

  const updateRedirectUri = (index: number, value: string) => {
    setNewApp(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.map((uri, i) => i === index ? value : uri)
    }));
  };

  const removeRedirectUri = (index: number) => {
    setNewApp(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleEventPermissionChange = (eventKey: string, checked: boolean) => {
    setNewApp(prev => ({
      ...prev,
      supported_events: {
        ...prev.supported_events,
        [eventKey]: checked
      },
      event_descriptions: {
        ...prev.event_descriptions,
        [eventKey]: availableEvents.find(e => e.key === eventKey)?.description || ''
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            OAuth Applications
          </h3>
          <p className="text-gray-600 mt-2">
            Create OAuth applications to enable third-party integrations with YusrAI
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First App
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Create OAuth Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Application Name *
                  </label>
                  <Input
                    placeholder="My Awesome App"
                    value={newApp.app_name}
                    onChange={(e) => setNewApp(prev => ({ ...prev, app_name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Developer Email
                  </label>
                  <Input
                    type="email"
                    placeholder="developer@example.com"
                    value={newApp.developer_email}
                    onChange={(e) => setNewApp(prev => ({ ...prev, developer_email: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Application Description *
                </label>
                <Textarea
                  placeholder="Describe what your application does and how it will use YusrAI"
                  value={newApp.app_description}
                  onChange={(e) => setNewApp(prev => ({ ...prev, app_description: e.target.value }))}
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  App Logo
                </label>
                <ImageUpload
                  value={newApp.app_logo_url}
                  onChange={(url) => setNewApp(prev => ({ ...prev, app_logo_url: url }))}
                  placeholder="Upload Logo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload an image or provide a URL to your app logo (PNG, JPG, or SVG)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Homepage URL
                  </label>
                  <Input
                    placeholder="https://myapp.com"
                    value={newApp.homepage_url}
                    onChange={(e) => setNewApp(prev => ({ ...prev, homepage_url: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Webhook URL
                  </label>
                  <Input
                    placeholder="https://myapp.com/webhooks"
                    value={newApp.webhook_url}
                    onChange={(e) => setNewApp(prev => ({ ...prev, webhook_url: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Privacy Policy URL
                  </label>
                  <Input
                    placeholder="https://myapp.com/privacy"
                    value={newApp.privacy_policy_url}
                    onChange={(e) => setNewApp(prev => ({ ...prev, privacy_policy_url: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Terms of Service URL
                  </label>
                  <Input
                    placeholder="https://myapp.com/terms"
                    value={newApp.terms_of_service_url}
                    onChange={(e) => setNewApp(prev => ({ ...prev, terms_of_service_url: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Redirect URIs *
                </label>
                {newApp.redirect_uris.map((uri, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="https://myapp.com/auth/callback"
                      value={uri}
                      onChange={(e) => updateRedirectUri(index, e.target.value)}
                      className="rounded-xl"
                    />
                    {newApp.redirect_uris.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRedirectUri(index)}
                        className="rounded-xl"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRedirectUri}
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Redirect URI
                </Button>
              </div>

              <PermissionsDropdown
                permissions={newApp.supported_events}
                onPermissionChange={handleEventPermissionChange}
                availablePermissions={availableEvents}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateApp}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl"
                >
                  Create Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading OAuth applications...</div>
      ) : apps.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No OAuth Applications</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first OAuth application to enable third-party integrations with YusrAI
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {apps.map((app) => (
            <Card key={app.id} className="rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {app.app_logo_url ? (
                      <img 
                        src={app.app_logo_url} 
                        alt={app.app_name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
                        <Globe className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{app.app_name}</CardTitle>
                        <Badge 
                          variant={app.environment === 'production' ? 'default' : 'secondary'}
                          className="rounded-full"
                        >
                          {app.environment}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{app.app_description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => switchEnvironment(app.id, app.environment === 'test' ? 'production' : 'test')}
                      className="rounded-lg"
                    >
                      Switch to {app.environment === 'test' ? 'Production' : 'Test'}
                    </Button>
                    <Switch
                      checked={app.is_active}
                      onCheckedChange={() => toggleAppStatus(app.id, app.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApp(app.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Client ID</label>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mt-1">
                        <code className="text-sm font-mono flex-1 truncate">
                          {app.environment === 'test' ? app.test_client_id : app.client_id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            app.environment === 'test' ? app.test_client_id || '' : app.client_id, 
                            'Client ID'
                          )}
                          className="rounded-lg"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Client Secret</label>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mt-1">
                        <code className="text-sm font-mono flex-1 truncate">
                          {showSecrets === app.id 
                            ? (app.environment === 'test' ? app.test_client_secret : app.client_secret)
                            : '••••••••••••••••••••••••••••••••'
                          }
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSecrets(showSecrets === app.id ? null : app.id)}
                          className="rounded-lg"
                        >
                          {showSecrets === app.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            app.environment === 'test' ? app.test_client_secret || '' : app.client_secret, 
                            'Client Secret'
                          )}
                          className="rounded-lg"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Redirect URIs</label>
                      <div className="mt-1 space-y-1">
                        {app.redirect_uris.map((uri, index) => (
                          <div key={index} className="text-sm font-mono p-2 bg-gray-50 rounded-lg truncate">
                            {uri}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {app.supported_events && Object.keys(app.supported_events).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Supported Events</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(app.supported_events)
                        .filter(([_, enabled]) => enabled)
                        .map(([event]) => (
                          <Badge key={event} variant="outline" className="text-xs rounded-full">
                            {event.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Badge variant={app.is_active ? "default" : "secondary"} className="rounded-full">
                    {app.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    Created {new Date(app.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border border-blue-200 bg-blue-50/30 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">OAuth Documentation</h4>
              <p className="text-sm text-blue-700">
                Learn how to implement OAuth 2.0 with YusrAI in our{' '}
                <a 
                  href="https://docs.yusrai.com/oauth" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  OAuth documentation
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthAppsSection;
