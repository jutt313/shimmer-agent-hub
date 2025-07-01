
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Copy, Trash2, Plus, Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useApiCredentials } from '@/hooks/useApiCredentials';
import { useToast } from '@/components/ui/use-toast';

const PersonalApiTokensSection = () => {
  const { credentials, loading, createCredential, deleteCredential, toggleCredential } = useApiCredentials();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const [newCredential, setNewCredential] = useState({
    credential_name: '',
    credential_description: '',
    credential_type: 'personal' as 'personal' | 'developer' | 'service',
    permissions: {
      read: true,
      write: false,
      webhook: false,
      notifications: false,
      automations: false,
      platform_connections: false,
    },
    rate_limit_per_hour: 1000,
    allowed_origins: [''],
    webhook_url: ''
  });

  const handleCreateCredential = async () => {
    if (!newCredential.credential_name) {
      toast({
        title: "Error",
        description: "Please provide a credential name",
        variant: "destructive",
      });
      return;
    }

    const cleanedData = {
      ...newCredential,
      allowed_origins: newCredential.allowed_origins.filter(origin => origin.trim()),
      webhook_url: newCredential.webhook_url.trim() || undefined
    };

    const result = await createCredential(cleanedData);
    if (result) {
      setGeneratedKey(result.apiKey);
      setNewCredential({
        credential_name: '',
        credential_description: '',
        credential_type: 'personal',
        permissions: {
          read: true,
          write: false,
          webhook: false,
          notifications: false,
          automations: false,
          platform_connections: false,
        },
        rate_limit_per_hour: 1000,
        allowed_origins: [''],
        webhook_url: ''
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

  const toggleSecretVisibility = (credentialId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (window.confirm('Are you sure you want to delete this API credential? This action cannot be undone.')) {
      await deleteCredential(credentialId);
    }
  };

  const getCredentialTypeColor = (type: string) => {
    switch (type) {
      case 'personal': return 'bg-blue-100 text-blue-800';
      case 'developer': return 'bg-purple-100 text-purple-800';
      case 'service': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const personalCredentials = credentials.filter(cred => cred.credential_type === 'personal');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Personal API Keys
          </h3>
          <p className="text-gray-600 mt-2">
            Create personal API keys to access YusrAI services for your own applications
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Create Personal Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Create Personal API Key</DialogTitle>
            </DialogHeader>
            
            {generatedKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">API Key Created Successfully!</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Copy this API key now - you won't be able to see it again.
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-white border rounded-lg">
                    <code className="flex-1 text-sm font-mono break-all">{generatedKey}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedKey, 'API Key')}
                      className="rounded-lg"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setGeneratedKey(null);
                    setShowCreateDialog(false);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="credential_name">Key Name *</Label>
                    <Input
                      id="credential_name"
                      value={newCredential.credential_name}
                      onChange={(e) => setNewCredential(prev => ({ ...prev, credential_name: e.target.value }))}
                      placeholder="My Personal Key"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate_limit">Rate Limit (per hour)</Label>
                    <Input
                      id="rate_limit"
                      type="number"
                      value={newCredential.rate_limit_per_hour}
                      onChange={(e) => setNewCredential(prev => ({ ...prev, rate_limit_per_hour: parseInt(e.target.value) || 1000 }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="credential_description">Description</Label>
                  <Textarea
                    id="credential_description"
                    value={newCredential.credential_description}
                    onChange={(e) => setNewCredential(prev => ({ ...prev, credential_description: e.target.value }))}
                    placeholder="What will this key be used for?"
                    rows={2}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {Object.entries(newCredential.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => 
                            setNewCredential(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, [key]: !!checked }
                            }))
                          }
                        />
                        <Label htmlFor={key} className="text-sm capitalize">
                          {key.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleCreateCredential}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl"
                >
                  Create Personal Key
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading personal API keys...</div>
      ) : personalCredentials.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Personal API Keys</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first personal API key to access YusrAI services
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {personalCredentials.map((credential) => (
            <Card key={credential.id} className="hover:shadow-lg transition-shadow rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                      <Key className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{credential.credential_name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {credential.credential_description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getCredentialTypeColor(credential.credential_type)}>
                          {credential.credential_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={credential.is_active}
                      onCheckedChange={() => toggleCredential(credential.id, credential.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCredential(credential.id)}
                      className="text-red-500 hover:text-red-700 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {showSecrets[credential.id] ? credential.api_key : `${credential.api_key.slice(0, 12)}...`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSecretVisibility(credential.id)}
                        className="rounded-lg"
                      >
                        {showSecrets[credential.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(credential.api_key, 'API Key')}
                        className="rounded-lg"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <Badge variant={credential.is_active ? "default" : "secondary"}>
                        {credential.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-gray-500">
                        {credential.usage_count} calls
                      </span>
                      <span className="text-gray-500">
                        {credential.rate_limit_per_hour}/hour limit
                      </span>
                    </div>
                    <div className="text-gray-500">
                      Created {new Date(credential.created_at).toLocaleDateString()}
                    </div>
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
              <h4 className="font-medium text-blue-900">API Documentation</h4>
              <p className="text-sm text-blue-700">
                Learn how to use personal API keys in our{' '}
                <a 
                  href="https://docs.yusrai.com/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  API documentation
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

export default PersonalApiTokensSection;
