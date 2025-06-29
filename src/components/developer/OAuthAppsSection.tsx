
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, Trash2, Plus, Settings, ExternalLink, Globe, Shield, Zap } from 'lucide-react';
import { useEnhancedDeveloperApps } from '@/hooks/useEnhancedDeveloperApps';
import { useToast } from '@/components/ui/use-toast';

const OAuthAppsSection = () => {
  const { apps, loading, createApp, deleteApp, toggleAppStatus } = useEnhancedDeveloperApps();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newApp, setNewApp] = useState({
    app_name: '',
    app_description: '',
    redirect_uris: [''],
    webhook_url: '',
    app_logo_url: '',
    privacy_policy_url: '',
    terms_of_service_url: '',
    homepage_url: '',
    developer_email: '',
    tool_description: '',
    use_cases: [''],
    supported_events: [] as string[],
    event_descriptions: {} as Record<string, string>
  });
  const { toast } = useToast();

  const predefinedEvents = [
    { id: 'automation.created', name: 'Automation Created', desc: 'When a new automation is created' },
    { id: 'automation.updated', name: 'Automation Updated', desc: 'When an automation is modified' },
    { id: 'automation.deleted', name: 'Automation Deleted', desc: 'When an automation is removed' },
    { id: 'automation.executed', name: 'Automation Executed', desc: 'When an automation runs' },
    { id: 'webhook.triggered', name: 'Webhook Triggered', desc: 'When a webhook receives data' },
    { id: 'user.login', name: 'User Login', desc: 'When a user signs in' },
    { id: 'platform.connected', name: 'Platform Connected', desc: 'When a new platform is connected' },
    { id: 'error.occurred', name: 'Error Occurred', desc: 'When an error happens in automations' },
  ];

  const handleCreateApp = async () => {
    if (!newApp.app_name || !newApp.app_description || !newApp.developer_email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const filteredRedirectUris = newApp.redirect_uris.filter(uri => uri.trim());
    const filteredUseCases = newApp.use_cases.filter(useCase => useCase.trim());

    const result = await createApp({
      ...newApp,
      redirect_uris: filteredRedirectUris,
      use_cases: filteredUseCases,
      supported_events: newApp.supported_events,
      event_descriptions: newApp.event_descriptions
    });

    if (result) {
      setNewApp({
        app_name: '',
        app_description: '',
        redirect_uris: [''],
        webhook_url: '',
        app_logo_url: '',
        privacy_policy_url: '',
        terms_of_service_url: '',
        homepage_url: '',
        developer_email: '',
        tool_description: '',
        use_cases: [''],
        supported_events: [],
        event_descriptions: {}
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

  const addUseCase = () => {
    setNewApp(prev => ({
      ...prev,
      use_cases: [...prev.use_cases, '']
    }));
  };

  const updateUseCase = (index: number, value: string) => {
    setNewApp(prev => ({
      ...prev,
      use_cases: prev.use_cases.map((useCase, i) => i === index ? value : useCase)
    }));
  };

  const removeUseCase = (index: number) => {
    setNewApp(prev => ({
      ...prev,
      use_cases: prev.use_cases.filter((_, i) => i !== index)
    }));
  };

  const toggleEvent = (eventId: string) => {
    setNewApp(prev => ({
      ...prev,
      supported_events: prev.supported_events.includes(eventId)
        ? prev.supported_events.filter(id => id !== eventId)
        : [...prev.supported_events, eventId]
    }));
  };

  const updateEventDescription = (eventId: string, description: string) => {
    setNewApp(prev => ({
      ...prev,
      event_descriptions: {
        ...prev.event_descriptions,
        [eventId]: description
      }
    }));
  };

  const copyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Credentials copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            OAuth Applications
          </h3>
          <p className="text-gray-600 mt-2">
            Create OAuth apps to let users connect their YusrAI accounts to your applications
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Create App
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Create OAuth Application</DialogTitle>
              <p className="text-center text-sm text-gray-600">
                Fill in your application details to create OAuth credentials
              </p>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    App Name *
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
                    App Description *
                  </label>
                  <Textarea
                    placeholder="Describe what your app does and how it uses YusrAI..."
                    value={newApp.app_description}
                    onChange={(e) => setNewApp(prev => ({ ...prev, app_description: e.target.value }))}
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Developer Email *
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

              {/* URLs */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">URLs & Links</h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Redirect URLs
                  </label>
                  {newApp.redirect_uris.map((uri, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="https://yourapp.com/callback"
                        value={uri}
                        onChange={(e) => updateRedirectUri(index, e.target.value)}
                        className="rounded-xl"
                      />
                      {newApp.redirect_uris.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRedirectUri(index)}
                          className="rounded-lg"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRedirectUri}
                    className="rounded-lg"
                  >
                    Add Redirect URL
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Homepage URL
                    </label>
                    <Input
                      placeholder="https://yourapp.com"
                      value={newApp.homepage_url}
                      onChange={(e) => setNewApp(prev => ({ ...prev, homepage_url: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      App Logo URL
                    </label>
                    <Input
                      placeholder="https://yourapp.com/logo.png"
                      value={newApp.app_logo_url}
                      onChange={(e) => setNewApp(prev => ({ ...prev, app_logo_url: e.target.value }))}
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
                      placeholder="https://yourapp.com/privacy"
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
                      placeholder="https://yourapp.com/terms"
                      value={newApp.terms_of_service_url}
                      onChange={(e) => setNewApp(prev => ({ ...prev, terms_of_service_url: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Webhook URL (optional)
                  </label>
                  <Input
                    placeholder="https://yourapp.com/webhooks/yusrai"
                    value={newApp.webhook_url}
                    onChange={(e) => setNewApp(prev => ({ ...prev, webhook_url: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Tool Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Tool Information</h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    What is your tool and how will you use YusrAI?
                  </label>
                  <Textarea
                    placeholder="Describe your tool, its purpose, and how it integrates with YusrAI..."
                    value={newApp.tool_description}
                    onChange={(e) => setNewApp(prev => ({ ...prev, tool_description: e.target.value }))}
                    className="rounded-xl"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Use Cases
                  </label>
                  {newApp.use_cases.map((useCase, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g., Automate customer support workflows"
                        value={useCase}
                        onChange={(e) => updateUseCase(index, e.target.value)}
                        className="rounded-xl"
                      />
                      {newApp.use_cases.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeUseCase(index)}
                          className="rounded-lg"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addUseCase}
                    className="rounded-lg"
                  >
                    Add Use Case
                  </Button>
                </div>
              </div>

              {/* Events */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Events & Webhooks</h4>
                <p className="text-sm text-gray-600">
                  Select which events your application wants to receive via webhooks
                </p>
                
                <div className="space-y-3">
                  {predefinedEvents.map((event) => (
                    <div key={event.id} className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={event.id}
                          checked={newApp.supported_events.includes(event.id)}
                          onChange={() => toggleEvent(event.id)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <label htmlFor={event.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                            {event.name}
                          </label>
                          <p className="text-xs text-gray-500">{event.desc}</p>
                        </div>
                      </div>
                      {newApp.supported_events.includes(event.id) && (
                        <Input
                          placeholder="Describe how you'll use this event..."
                          value={newApp.event_descriptions[event.id] || ''}
                          onChange={(e) => updateEventDescription(event.id, e.target.value)}
                          className="ml-6 rounded-xl text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handleCreateApp} 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl"
              >
                Create OAuth Application
              </Button>
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
            <h3 className="text-lg font-medium text-gray-600 mb-2">No OAuth apps created yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first OAuth application to let users connect their YusrAI accounts
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apps.map((app) => (
            <Card key={app.id} className="rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {app.app_logo_url ? (
                      <img 
                        src={app.app_logo_url} 
                        alt={app.app_name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                        <Globe className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{app.app_name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {app.app_description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Client ID</label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <code className="text-xs font-mono text-gray-700 flex-1 break-all">
                        {app.client_id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCredentials(app.client_id)}
                        className="hover:bg-white rounded-lg"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Client Secret</label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <code className="text-xs font-mono text-gray-700 flex-1">
                        {'*'.repeat(24)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCredentials(app.client_secret)}
                        className="hover:bg-white rounded-lg"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {app.supported_events && app.supported_events.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">Supported Events</label>
                    <div className="flex flex-wrap gap-1">
                      {app.supported_events.slice(0, 4).map((event: string) => (
                        <Badge key={event} variant="outline" className="text-xs rounded-full">
                          {event.replace('.', ' ')}
                        </Badge>
                      ))}
                      {app.supported_events.length > 4 && (
                        <Badge variant="outline" className="text-xs rounded-full">
                          +{app.supported_events.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <Badge variant={app.is_active ? "default" : "secondary"} className="rounded-full">
                      {app.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      {app.tier} plan
                    </Badge>
                  </div>
                  <div className="text-gray-500">
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
                Learn how to implement OAuth flow in our{' '}
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
