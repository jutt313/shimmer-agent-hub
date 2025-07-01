
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Code2, Key, Plus, Copy, Trash2, Settings, Eye, EyeOff, Zap, Globe, Shield } from "lucide-react";
import { useApiCredentials } from "@/hooks/useApiCredentials";
import { useToast } from "@/hooks/use-toast";

interface UnifiedDeveloperPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedDeveloperPortal = ({ isOpen, onClose }: UnifiedDeveloperPortalProps) => {
  const { credentials, loading, createCredential, updateCredential, deleteCredential, toggleCredential } = useApiCredentials();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
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

  if (!isOpen) return null;

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

  const addOrigin = () => {
    setNewCredential(prev => ({
      ...prev,
      allowed_origins: [...prev.allowed_origins, '']
    }));
  };

  const removeOrigin = (index: number) => {
    setNewCredential(prev => ({
      ...prev,
      allowed_origins: prev.allowed_origins.filter((_, i) => i !== index)
    }));
  };

  const updateOrigin = (index: number, value: string) => {
    setNewCredential(prev => ({
      ...prev,
      allowed_origins: prev.allowed_origins.map((origin, i) => i === index ? value : origin)
    }));
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-6xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6" />
            <h2 className="text-xl font-semibold">YusrAI Developer Portal</h2>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              yusrai.com
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
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="credentials" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Keys ({credentials.length})
              </TabsTrigger>
              <TabsTrigger value="testing" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Testing
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="docs" className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Documentation
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total API Keys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{credentials.length}</div>
                    <p className="text-sm text-gray-500">
                      {credentials.filter(c => c.is_active).length} active
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Rate Limit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">1000</div>
                    <p className="text-sm text-gray-500">requests/hour</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {credentials.reduce((sum, c) => sum + c.usage_count, 0)}
                    </div>
                    <p className="text-sm text-gray-500">API calls made</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Welcome to YusrAI Developer Portal</h3>
                      <p className="text-gray-600 mt-1">
                        Create API credentials to access YusrAI services. Support for Personal, Developer, and Service credentials.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="credentials" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">API Credentials</h3>
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Credential
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New API Credential</DialogTitle>
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
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            setGeneratedKey(null);
                            setShowCreateModal(false);
                          }}
                          className="w-full bg-gradient-to-r from-purple-500 to-blue-500"
                        >
                          Done
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="credential_name">Credential Name *</Label>
                            <Input
                              id="credential_name"
                              value={newCredential.credential_name}
                              onChange={(e) => setNewCredential(prev => ({ ...prev, credential_name: e.target.value }))}
                              placeholder="My API Key"
                            />
                          </div>
                          <div>
                            <Label htmlFor="credential_type">Type *</Label>
                            <Select value={newCredential.credential_type} onValueChange={(value: any) => 
                              setNewCredential(prev => ({ ...prev, credential_type: value }))
                            }>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="personal">Personal - For your own use</SelectItem>
                                <SelectItem value="developer">Developer - For app development</SelectItem>
                                <SelectItem value="service">Service - For server-to-server</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="credential_description">Description</Label>
                          <Textarea
                            id="credential_description"
                            value={newCredential.credential_description}
                            onChange={(e) => setNewCredential(prev => ({ ...prev, credential_description: e.target.value }))}
                            placeholder="What will this credential be used for?"
                            rows={2}
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

                        <div>
                          <Label>Allowed Origins (Optional)</Label>
                          {newCredential.allowed_origins.map((origin, index) => (
                            <div key={index} className="flex gap-2 mt-2">
                              <Input
                                value={origin}
                                onChange={(e) => updateOrigin(index, e.target.value)}
                                placeholder="https://yourapp.com"
                              />
                              {newCredential.allowed_origins.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeOrigin(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addOrigin}
                            className="mt-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Origin
                          </Button>
                        </div>

                        <div>
                          <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
                          <Input
                            id="webhook_url"
                            value={newCredential.webhook_url}
                            onChange={(e) => setNewCredential(prev => ({ ...prev, webhook_url: e.target.value }))}
                            placeholder="https://yourapp.com/webhook"
                          />
                        </div>

                        <Button 
                          onClick={handleCreateCredential}
                          className="w-full bg-gradient-to-r from-purple-500 to-blue-500"
                        >
                          Create Credential
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading credentials...</div>
              ) : credentials.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Key className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No API credentials yet</p>
                    <Button onClick={() => setShowCreateModal(true)} variant="outline">
                      Create your first credential
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {credentials.map((credential) => (
                    <Card key={credential.id} className="hover:shadow-lg transition-shadow">
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
                              className="text-red-500 hover:text-red-700"
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
                              >
                                {showSecrets[credential.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(credential.api_key, 'API Key')}
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
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Test your API credentials with our interactive testing tool.
                  </p>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      API Testing functionality will be available soon. Use your credentials with the endpoints below.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Configure webhooks to receive real-time notifications from YusrAI.
                  </p>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">
                      Webhook management will be available soon. You can set webhook URLs when creating credentials.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="docs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Base URL</h4>
                    <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                      https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api
                    </code>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Authentication</h4>
                    <p className="text-gray-600 text-sm mb-2">
                      Include your API key in the Authorization header:
                    </p>
                    <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                      Authorization: Bearer YOUR_API_KEY
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Available Services</h4>
                    <div className="space-y-2">
                      <div className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">POST</Badge>
                          <code className="text-sm">/chat-ai</code>
                        </div>
                        <p className="text-sm text-gray-600">AI Chat Service</p>
                      </div>
                      <div className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">POST</Badge>
                          <code className="text-sm">/create-notification</code>
                        </div>
                        <p className="text-sm text-gray-600">Create Notifications</p>
                      </div>
                      <div className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">POST</Badge>
                          <code className="text-sm">/diagram-generator</code>
                        </div>
                        <p className="text-sm text-gray-600">Generate Diagrams</p>
                      </div>
                      <div className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">POST</Badge>
                          <code className="text-sm">/error-analyzer</code>
                        </div>
                        <p className="text-sm text-gray-600">Analyze Errors</p>
                      </div>
                      <div className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">POST</Badge>
                          <code className="text-sm">/knowledge-ai-chat</code>
                        </div>
                        <p className="text-sm text-gray-600">Knowledge-based AI Chat</p>
                      </div>
                      <div className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">POST</Badge>
                          <code className="text-sm">/test-credential</code>
                        </div>
                        <p className="text-sm text-gray-600">Test Platform Credentials</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDeveloperPortal;
