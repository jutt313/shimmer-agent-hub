import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, Eye, EyeOff, Plus, Trash2, Settings, Webhook, Key, Code2, ExternalLink } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeveloperIntegration {
  id: string;
  app_name: string;
  app_description: string | null;
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  webhook_url: string | null;
  is_active: boolean;
  tier: string;
  rate_limit_per_hour: number;
  created_at: string;
}

interface UserApiToken {
  id: string;
  token_name: string;
  token_type: string;
  permissions: any;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface AutomationWebhook {
  id: string;
  automation_id: string;
  webhook_url: string;
  webhook_secret: string;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
  automations: {
    title: string;
    description: string | null;
  };
}

const DeveloperAPITab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [developerApps, setDeveloperApps] = useState<DeveloperIntegration[]>([]);
  const [userTokens, setUserTokens] = useState<UserApiToken[]>([]);
  const [automationWebhooks, setAutomationWebhooks] = useState<AutomationWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenPermissions, setNewTokenPermissions] = useState({
    read: true,
    write: false,
    webhook: false
  });
  const [newAppData, setNewAppData] = useState({
    app_name: '',
    app_description: '',
    redirect_uris: [''],
    webhook_url: ''
  });
  const [showNewAppForm, setShowNewAppForm] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch developer integrations
      const { data: apps, error: appsError } = await supabase
        .from('developer_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setDeveloperApps(apps || []);

      // Fetch user API tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('user_api_tokens')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (tokensError) throw tokensError;
      setUserTokens(tokens || []);

      // Fetch automation webhooks
      const { data: webhooks, error: webhooksError } = await supabase
        .from('automation_webhooks')
        .select(`
          *,
          automations!inner(title, description, user_id)
        `)
        .eq('automations.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (webhooksError) throw webhooksError;
      setAutomationWebhooks(webhooks || []);

    } catch (error: any) {
      console.error('Error fetching API data:', error);
      toast({
        title: "Error",
        description: "Failed to load API data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDeveloperApp = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_integrations')
        .insert({
          user_id: user?.id,
          app_name: newAppData.app_name,
          app_description: newAppData.app_description,
          redirect_uris: newAppData.redirect_uris.filter(uri => uri.trim()),
          webhook_url: newAppData.webhook_url || null
        })
        .select()
        .single();

      if (error) throw error;

      setDeveloperApps(prev => [data, ...prev]);
      setShowNewAppForm(false);
      setNewAppData({
        app_name: '',
        app_description: '',
        redirect_uris: [''],
        webhook_url: ''
      });

      toast({
        title: "Success",
        description: "Developer application created successfully",
      });
    } catch (error: any) {
      console.error('Error creating developer app:', error);
      toast({
        title: "Error",
        description: "Failed to create developer application",
        variant: "destructive",
      });
    }
  };

  const createUserToken = async () => {
    try {
      // Generate token
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('generate_api_token');

      if (tokenError) throw tokenError;

      const token = tokenResult;
      const tokenHash = await hashToken(token);

      // Store token
      const { data, error } = await supabase
        .from('user_api_tokens')
        .insert({
          user_id: user?.id,
          token_name: newTokenName,
          token_hash: tokenHash,
          permissions: newTokenPermissions
        })
        .select()
        .single();

      if (error) throw error;

      setUserTokens(prev => [data, ...prev]);
      setGeneratedToken(token);
      setNewTokenName('');
      setNewTokenPermissions({ read: true, write: false, webhook: false });

      toast({
        title: "Success",
        description: "API token created successfully. Make sure to copy it now!",
      });
    } catch (error: any) {
      console.error('Error creating token:', error);
      toast({
        title: "Error",
        description: "Failed to create API token",
        variant: "destructive",
      });
    }
  };

  const hashToken = async (token: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${type} copied to clipboard`,
    });
  };

  const toggleAppStatus = async (appId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('developer_integrations')
        .update({ is_active: !isActive })
        .eq('id', appId);

      if (error) throw error;

      setDeveloperApps(prev => 
        prev.map(app => 
          app.id === appId ? { ...app, is_active: !isActive } : app
        )
      );

      toast({
        title: "Success",
        description: `Application ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error: any) {
      console.error('Error toggling app status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('user_api_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;

      setUserTokens(prev => prev.filter(token => token.id !== tokenId));

      toast({
        title: "Success",
        description: "API token deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting token:', error);
      toast({
        title: "Error",
        description: "Failed to delete API token",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading API data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            YusrAI API Documentation
          </CardTitle>
          <CardDescription>
            Learn how to integrate YusrAI with your applications using our REST API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Base URL</h4>
              <code className="text-sm bg-white px-2 py-1 rounded border">
                https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api
              </code>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Authentication</h4>
              <p className="text-sm text-gray-600 mb-2">Include your API token in the Authorization header:</p>
              <code className="text-sm bg-white px-2 py-1 rounded border">
                Authorization: Bearer your_api_token_here
              </code>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="font-medium text-blue-800">Available Endpoints</h5>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>GET /automations</li>
                  <li>POST /automations</li>
                  <li>GET /automations/{'{id}'}</li>
                  <li>PUT /automations/{'{id}'}</li>
                  <li>DELETE /automations/{'{id}'}</li>
                  <li>POST /execute/{'{id}'}</li>
                </ul>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <h5 className="font-medium text-green-800">Webhook Support</h5>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>Real-time automation events</li>
                  <li>Secure webhook validation</li>
                  <li>Retry mechanism included</li>
                  <li>Delivery status tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal API Tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Personal API Tokens
          </CardTitle>
          <CardDescription>
            Create tokens to access your YusrAI data from external applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Create new token */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-4">Create New Token</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tokenName">Token Name</Label>
                  <Input
                    id="tokenName"
                    placeholder="My API Token"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newTokenPermissions.read}
                        onCheckedChange={(checked) => 
                          setNewTokenPermissions(prev => ({ ...prev, read: checked }))
                        }
                      />
                      <Label>Read Access</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newTokenPermissions.write}
                        onCheckedChange={(checked) => 
                          setNewTokenPermissions(prev => ({ ...prev, write: checked }))
                        }
                      />
                      <Label>Write Access</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newTokenPermissions.webhook}
                        onCheckedChange={(checked) => 
                          setNewTokenPermissions(prev => ({ ...prev, webhook: checked }))
                        }
                      />
                      <Label>Webhook Access</Label>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={createUserToken} 
                className="mt-4"
                disabled={!newTokenName.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Token
              </Button>

              {generatedToken && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-yellow-800">Your new API token:</p>
                      <code className="text-sm bg-white px-2 py-1 rounded border mt-1 inline-block">
                        {generatedToken}
                      </code>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(generatedToken, 'API Token')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    ⚠️ Make sure to copy this token now. You won't be able to see it again!
                  </p>
                </div>
              )}
            </div>

            {/* Existing tokens */}
            <div className="space-y-3">
              {userTokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{token.token_name}</h5>
                      <Badge variant={token.is_active ? "default" : "secondary"}>
                        {token.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{token.token_type}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Permissions: {Object.entries(token.permissions)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => key)
                        .join(', ')
                      }
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(token.created_at).toLocaleDateString()}
                      {token.last_used_at && (
                        <span className="ml-4">
                          Last used: {new Date(token.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteToken(token.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Developer Applications
          </CardTitle>
          <CardDescription>
            Create OAuth applications to let other users connect their YusrAI accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!showNewAppForm ? (
              <Button onClick={() => setShowNewAppForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Application
              </Button>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-4">Create New Application</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      placeholder="My Awesome App"
                      value={newAppData.app_name}
                      onChange={(e) => setNewAppData(prev => ({ ...prev, app_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="appDescription">Description</Label>
                    <Textarea
                      id="appDescription"
                      placeholder="What does your application do?"
                      value={newAppData.app_description}
                      onChange={(e) => setNewAppData(prev => ({ ...prev, app_description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Redirect URIs</Label>
                    {newAppData.redirect_uris.map((uri, index) => (
                      <div key={index} className="flex gap-2 mt-2">
                        <Input
                          placeholder="https://yourapp.com/callback"
                          value={uri}
                          onChange={(e) => {
                            const newUris = [...newAppData.redirect_uris];
                            newUris[index] = e.target.value;
                            setNewAppData(prev => ({ ...prev, redirect_uris: newUris }));
                          }}
                        />
                        {index === newAppData.redirect_uris.length - 1 && (
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => setNewAppData(prev => ({ 
                              ...prev, 
                              redirect_uris: [...prev.redirect_uris, ''] 
                            }))}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://yourapp.com/webhooks"
                      value={newAppData.webhook_url}
                      onChange={(e) => setNewAppData(prev => ({ ...prev, webhook_url: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={createDeveloperApp}
                      disabled={!newAppData.app_name.trim() || !newAppData.redirect_uris.some(uri => uri.trim())}
                    >
                      Create Application
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewAppForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing applications */}
            <div className="space-y-4">
              {developerApps.map((app) => (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{app.app_name}</h5>
                        <Badge variant={app.is_active ? "default" : "secondary"}>
                          {app.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{app.tier}</Badge>
                      </div>
                      {app.app_description && (
                        <p className="text-sm text-gray-600 mb-3">{app.app_description}</p>
                      )}
                      
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs font-medium">Client ID</Label>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {showSecrets[app.id] ? app.client_id : '••••••••••••••••'}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowSecrets(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                            >
                              {showSecrets[app.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(app.client_id, 'Client ID')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium">Client Secret</Label>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {showSecrets[`${app.id}_secret`] ? app.client_secret : '••••••••••••••••'}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowSecrets(prev => ({ ...prev, [`${app.id}_secret`]: !prev[`${app.id}_secret`] }))}
                            >
                              {showSecrets[`${app.id}_secret`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(app.client_secret, 'Client Secret')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-medium">Authorization URL</Label>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/oauth-authorize?client_id={app.client_id}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(
                                `https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/oauth-authorize?client_id=${app.client_id}`,
                                'Authorization URL'
                              )}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-3">
                        Rate limit: {app.rate_limit_per_hour}/hour • 
                        Created: {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={app.is_active}
                        onCheckedChange={() => toggleAppStatus(app.id, app.is_active)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Automation Webhooks
          </CardTitle>
          <CardDescription>
            Webhook URLs for your automations to receive real-time notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automationWebhooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No webhooks configured yet.</p>
                <p className="text-sm">Create webhooks from your automation settings or via API.</p>
              </div>
            ) : (
              automationWebhooks.map((webhook) => (
                <div key={webhook.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{webhook.automations.title}</h5>
                        <Badge variant={webhook.is_active ? "default" : "secondary"}>
                          {webhook.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs font-medium">Webhook URL</Label>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                              {webhook.webhook_url}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(webhook.webhook_url, 'Webhook URL')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium">Webhook Secret</Label>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {showSecrets[`webhook_${webhook.id}`] ? webhook.webhook_secret : '••••••••••••••••'}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowSecrets(prev => ({ ...prev, [`webhook_${webhook.id}`]: !prev[`webhook_${webhook.id}`] }))}
                            >
                              {showSecrets[`webhook_${webhook.id}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(webhook.webhook_secret, 'Webhook Secret')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-3">
                        Triggered {webhook.trigger_count} times
                        {webhook.last_triggered_at && (
                          <span className="ml-4">
                            Last: {new Date(webhook.last_triggered_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperAPITab;
