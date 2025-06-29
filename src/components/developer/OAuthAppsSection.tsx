import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useEnhancedDeveloperApps } from '@/hooks/useEnhancedDeveloperApps';
import { Globe, Plus, Settings, Copy, Eye, EyeOff, Trash2, Image, Link, TestTube, Zap } from 'lucide-react';

const OAuthAppsSection = () => {
  const { apps, loading, createApp, updateApp, deleteApp, toggleAppStatus, switchEnvironment } = useEnhancedDeveloperApps();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
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
    environment: 'test' as 'test' | 'production'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.app_name.trim()) {
      toast({
        title: "Error",
        description: "App name is required",
        variant: "destructive",
      });
      return;
    }

    const appData = {
      ...formData,
      redirect_uris: formData.redirect_uris.filter(uri => uri.trim()),
      use_cases: formData.use_cases.filter(uc => uc.trim()),
      webhook_url: formData.webhook_url || undefined,
      app_logo_url: formData.app_logo_url || undefined,
      privacy_policy_url: formData.privacy_policy_url || undefined,
      terms_of_service_url: formData.terms_of_service_url || undefined,
      homepage_url: formData.homepage_url || undefined,
      developer_email: formData.developer_email || undefined,
      tool_description: formData.tool_description || undefined,
    };

    const result = await createApp(appData);
    if (result) {
      setIsCreateDialogOpen(false);
      setFormData({
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
        environment: 'test'
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const toggleSecretVisibility = (appId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  const addRedirectUri = () => {
    setFormData(prev => ({
      ...prev,
      redirect_uris: [...prev.redirect_uris, '']
    }));
  };

  const updateRedirectUri = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.map((uri, i) => i === index ? value : uri)
    }));
  };

  const removeRedirectUri = (index: number) => {
    setFormData(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            OAuth Applications
          </h3>
          <p className="text-gray-600 mt-1">
            Create OAuth apps for third-party integrations with YusrAI
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Create OAuth App
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Create New OAuth Application
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Environment Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl border border-blue-200">
                <Label className="text-sm font-medium text-blue-800">Environment</Label>
                <Select 
                  value={formData.environment} 
                  onValueChange={(value: 'test' | 'production') => 
                    setFormData(prev => ({ ...prev, environment: value }))
                  }
                >
                  <SelectTrigger className="mt-2 bg-white border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-orange-500" />
                        Test Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="production">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        Production Mode
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600 mt-1">
                  {formData.environment === 'test' 
                    ? 'Perfect for development and testing your integration'
                    : 'Live environment for production applications'
                  }
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="app_name">Application Name *</Label>
                  <Input
                    id="app_name"
                    value={formData.app_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, app_name: e.target.value }))}
                    placeholder="My Awesome App"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="developer_email">Developer Email</Label>
                  <Input
                    id="developer_email"
                    type="email"
                    value={formData.developer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, developer_email: e.target.value }))}
                    placeholder="developer@example.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="app_description">Application Description</Label>
                <Textarea
                  id="app_description"
                  value={formData.app_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, app_description: e.target.value }))}
                  placeholder="Describe what your application does..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* App Logo */}
              <div>
                <Label htmlFor="app_logo_url">App Logo URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="app_logo_url"
                    value={formData.app_logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, app_logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm">
                    <Image className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload an image or provide a URL to your app logo (PNG, JPG, or SVG)
                </p>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homepage_url">Homepage URL</Label>
                  <Input
                    id="homepage_url"
                    value={formData.homepage_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, homepage_url: e.target.value }))}
                    placeholder="https://myapp.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://myapp.com/webhooks"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
                  <Input
                    id="privacy_policy_url"
                    value={formData.privacy_policy_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, privacy_policy_url: e.target.value }))}
                    placeholder="https://myapp.com/privacy"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="terms_of_service_url">Terms of Service URL</Label>
                  <Input
                    id="terms_of_service_url"
                    value={formData.terms_of_service_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms_of_service_url: e.target.value }))}
                    placeholder="https://myapp.com/terms"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Redirect URIs */}
              <div>
                <Label>Redirect URIs *</Label>
                <div className="space-y-2 mt-1">
                  {formData.redirect_uris.map((uri, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={uri}
                        onChange={(e) => updateRedirectUri(index, e.target.value)}
                        placeholder="https://myapp.com/auth/callback"
                        className="flex-1"
                      />
                      {formData.redirect_uris.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRedirectUri(index)}
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
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Redirect URI
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  Create Application
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {apps.length === 0 ? (
        <Card className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50/30 border-dashed border-2 border-gray-300">
          <CardContent>
            <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No OAuth Applications</h3>
            <p className="text-gray-500 mb-6">
              Create your first OAuth application to enable third-party integrations with YusrAI
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First App
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {apps.map((app) => (
            <Card key={app.id} className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {app.app_logo_url ? (
                      <img 
                        src={app.app_logo_url} 
                        alt={app.app_name}
                        className="w-12 h-12 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                        <Globe className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl">{app.app_name}</CardTitle>
                        <Badge 
                          variant={app.environment === 'production' ? 'default' : 'secondary'}
                          className={app.environment === 'production' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                          }
                        >
                          {app.environment === 'production' ? (
                            <>
                              <Zap className="w-3 h-3 mr-1" />
                              Production
                            </>
                          ) : (
                            <>
                              <TestTube className="w-3 h-3 mr-1" />
                              Test
                            </>
                          )}
                        </Badge>
                        <Badge variant={app.is_active ? 'default' : 'secondary'}>
                          {app.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-gray-600">
                        {app.app_description || 'No description provided'}
                      </p>
                      {app.homepage_url && (
                        <a 
                          href={app.homepage_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                        >
                          <Link className="w-3 h-3" />
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={app.environment}
                      onValueChange={(value: 'test' | 'production') => switchEnvironment(app.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                    <Switch
                      checked={app.is_active}
                      onCheckedChange={() => toggleAppStatus(app.id, app.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteApp(app.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Credentials */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 p-4 rounded-xl border">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {app.environment === 'production' ? 'Production' : 'Test'} Credentials
                  </h4>
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Client ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1 font-mono">
                          {app.environment === 'production' ? app.client_id : (app.test_client_id || app.client_id)}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(
                            app.environment === 'production' ? app.client_id : (app.test_client_id || app.client_id), 
                            'Client ID'
                          )}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Client Secret</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1 font-mono">
                          {showSecrets[app.id] 
                            ? (app.environment === 'production' ? app.client_secret : (app.test_client_secret || app.client_secret))
                            : '••••••••••••••••••••••••••••••••'
                          }
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSecretVisibility(app.id)}
                        >
                          {showSecrets[app.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(
                            app.environment === 'production' ? app.client_secret : (app.test_client_secret || app.client_secret), 
                            'Client Secret'
                          )}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authorization URL */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">OAuth Authorization URL</h4>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-3 py-2 rounded text-sm flex-1 font-mono text-green-700 border border-green-300">
                      {window.location.origin}/oauth/authorize?client_id={app.environment === 'production' ? app.client_id : (app.test_client_id || app.client_id)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        `${window.location.origin}/oauth/authorize?client_id=${app.environment === 'production' ? app.client_id : (app.test_client_id || app.client_id)}`,
                        'Authorization URL'
                      )}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Redirect URIs */}
                {app.redirect_uris && app.redirect_uris.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Authorized Redirect URIs</Label>
                    <div className="mt-2 space-y-1">
                      {app.redirect_uris.map((uri, index) => (
                        <code key={index} className="block bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                          {uri}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Created: {new Date(app.created_at).toLocaleDateString()} • 
                  Rate limit: {app.rate_limit_per_hour}/hour • 
                  Tier: {app.tier}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OAuthAppsSection;
