
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, Trash2, Plus, Settings, ExternalLink, Globe, Shield, Zap, Upload, Image } from 'lucide-react';
import { useEnhancedDeveloperApps } from '@/hooks/useEnhancedDeveloperApps';
import { useToast } from '@/components/ui/use-toast';

const OAuthAppsSection = () => {
  const { apps, loading, createApp, deleteApp, toggleAppStatus } = useEnhancedDeveloperApps();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setNewApp(prev => ({ ...prev, app_logo_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

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
      setImageFile(null);
      setImagePreview('');
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
          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            OAuth Applications
          </h3>
          <p className="text-gray-600 mt-2">
            Create OAuth apps to let users connect their YusrAI accounts to your applications
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Create App
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Create OAuth Application
              </DialogTitle>
              <p className="text-center text-sm text-gray-600">
                Fill in your application details to create OAuth credentials
              </p>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Basic Information
                </h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    App Name *
                  </label>
                  <Input
                    placeholder="My Awesome App"
                    value={newApp.app_name}
                    onChange={(e) => setNewApp(prev => ({ ...prev, app_name: e.target.value }))}
                    className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
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
                    className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
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
                    className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                {/* App Logo Section */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    App Logo
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="https://yourapp.com/logo.png"
                          value={newApp.app_logo_url}
                          onChange={(e) => setNewApp(prev => ({ ...prev, app_logo_url: e.target.value }))}
                          className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      <div className="text-gray-500 text-sm">OR</div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 rounded-xl hover:from-green-200 hover:to-blue-200 transition-all duration-200"
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                        </label>
                      </div>
                    </div>
                    {(imagePreview || newApp.app_logo_url) && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Logo preview" className="w-full h-full object-cover" />
                          ) : newApp.app_logo_url ? (
                            <img src={newApp.app_logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Logo Preview</p>
                          <p className="text-xs text-gray-500">This will be shown to users during OAuth flow</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* URLs */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  URLs & Links
                </h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Redirect URLs
                  </label>
                  {newApp.redirect_uris.map((uri, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="https://yourapp.com/callback"
                        value={uri}
                        onChange={(e) => {
                          const newUris = [...newApp.redirect_uris];
                          newUris[index] = e.target.value;
                          setNewApp(prev => ({ ...prev, redirect_uris: newUris }));
                        }}
                        className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                      {newApp.redirect_uris.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newUris = newApp.redirect_uris.filter((_, i) => i !== index);
                            setNewApp(prev => ({ ...prev, redirect_uris: newUris }));
                          }}
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
                    onClick={() => setNewApp(prev => ({ ...prev, redirect_uris: [...prev.redirect_uris, ''] }))}
                    className="rounded-lg border-green-300 text-green-600 hover:bg-green-50"
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
                      className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Webhook URL
                    </label>
                    <Input
                      placeholder="https://yourapp.com/webhooks/yusrai"
                      value={newApp.webhook_url}
                      onChange={(e) => setNewApp(prev => ({ ...prev, webhook_url: e.target.value }))}
                      className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
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
                      className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
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
                      className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tool Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Tool Information
                </h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    What is your tool and how will you use YusrAI?
                  </label>
                  <Textarea
                    placeholder="Describe your tool, its purpose, and how it integrates with YusrAI..."
                    value={newApp.tool_description}
                    onChange={(e) => setNewApp(prev => ({ ...prev, tool_description: e.target.value }))}
                    className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
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
                        onChange={(e) => {
                          const newUseCases = [...newApp.use_cases];
                          newUseCases[index] = e.target.value;
                          setNewApp(prev => ({ ...prev, use_cases: newUseCases }));
                        }}
                        className="rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                      {newApp.use_cases.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newUseCases = newApp.use_cases.filter((_, i) => i !== index);
                            setNewApp(prev => ({ ...prev, use_cases: newUseCases }));
                          }}
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
                    onClick={() => setNewApp(prev => ({ ...prev, use_cases: [...prev.use_cases, ''] }))}
                    className="rounded-lg border-green-300 text-green-600 hover:bg-green-50"
                  >
                    Add Use Case
                  </Button>
                </div>
              </div>

              {/* Events */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Events & Webhooks
                </h4>
                <p className="text-sm text-gray-600">
                  Select which events your application wants to receive via webhooks
                </p>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {predefinedEvents.map((event) => (
                    <div key={event.id} className="space-y-2 p-3 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={event.id}
                          checked={newApp.supported_events.includes(event.id)}
                          onChange={() => {
                            const isSelected = newApp.supported_events.includes(event.id);
                            setNewApp(prev => ({
                              ...prev,
                              supported_events: isSelected
                                ? prev.supported_events.filter(id => id !== event.id)
                                : [...prev.supported_events, event.id]
                            }));
                          }}
                          className="rounded text-green-600 focus:ring-green-500"
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
                          onChange={(e) => setNewApp(prev => ({
                            ...prev,
                            event_descriptions: {
                              ...prev.event_descriptions,
                              [event.id]: e.target.value
                            }
                          }))}
                          className="ml-6 rounded-xl text-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handleCreateApp} 
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Create OAuth Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading OAuth applications...</p>
        </div>
      ) : apps.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 rounded-2xl bg-gradient-to-br from-green-50/50 to-blue-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mb-4">
              <Globe className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No OAuth apps created yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first OAuth application to let users connect their YusrAI accounts
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apps.map((app) => (
            <Card key={app.id} className="rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {app.app_logo_url ? (
                      <img 
                        src={app.app_logo_url} 
                        alt={app.app_name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl">
                        <Globe className="h-6 w-6 text-green-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg text-gray-800">{app.app_name}</CardTitle>
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
                    <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-gray-50 to-green-50/50 rounded-lg border border-gray-100">
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
                    <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-gray-50 to-green-50/50 rounded-lg border border-gray-100">
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
                        <Badge key={event} variant="outline" className="text-xs rounded-full bg-green-50 border-green-200 text-green-700">
                          {event.replace('.', ' ')}
                        </Badge>
                      ))}
                      {app.supported_events.length > 4 && (
                        <Badge variant="outline" className="text-xs rounded-full bg-gray-100 border-gray-300 text-gray-600">
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
                    <Badge variant="outline" className="rounded-full bg-blue-50 border-blue-200 text-blue-700">
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

      <Card className="border border-green-200 bg-gradient-to-r from-green-50/50 to-blue-50/50 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
              <ExternalLink className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-900">OAuth Documentation</h4>
              <p className="text-sm text-green-700">
                Learn how to implement OAuth flow in our{' '}
                <a 
                  href="https://docs.yusrai.com/oauth" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-green-800 font-medium"
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
