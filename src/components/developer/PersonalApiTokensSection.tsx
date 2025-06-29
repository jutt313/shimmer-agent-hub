
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, Trash2, Plus, Key, Eye, EyeOff, Shield, ExternalLink, BarChart3 } from 'lucide-react';
import { useEnhancedApiTokens } from '@/hooks/useEnhancedApiTokens';
import { useToast } from '@/components/ui/use-toast';

const PersonalApiTokensSection = () => {
  const { tokens, loading, createToken, deleteToken, toggleToken } = useEnhancedApiTokens();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showToken, setShowToken] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [newToken, setNewToken] = useState({
    token_name: '',
    token_description: '',
    connection_purpose: '',
    permissions: {
      read: true,
      write: false,
      webhook: false,
      notifications: false,
      full_control: false,
      platform_connections: false,
    }
  });
  const { toast } = useToast();

  const handleCreateToken = async () => {
    if (!newToken.token_name || !newToken.connection_purpose) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const result = await createToken(newToken);
    if (result) {
      setGeneratedToken(result);
      setNewToken({
        token_name: '',
        token_description: '',
        connection_purpose: '',
        permissions: {
          read: true,
          write: false,
          webhook: false,
          notifications: false,
          full_control: false,
          platform_connections: false,
        }
      });
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Copied!",
      description: "API token copied to clipboard",
    });
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setNewToken(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked
      }
    }));
  };

  const getPermissionBadges = (permissions: any) => {
    const activePerm = Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    
    return activePerm.map(perm => (
      <Badge key={perm} variant="outline" className="text-xs rounded-full">
        {perm.replace('_', ' ')}
      </Badge>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Personal API Tokens
          </h3>
          <p className="text-gray-600 mt-2">
            Generate tokens to access your YusrAI account from external applications
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Create Token
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Create Personal API Token</DialogTitle>
            </DialogHeader>
            {generatedToken ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <h4 className="font-medium text-green-800 mb-2">Token Created Successfully!</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Copy this token now - you won't be able to see it again.
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-white border rounded-lg">
                    <code className="flex-1 text-sm font-mono break-all">{generatedToken}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToken(generatedToken)}
                      className="hover:bg-gray-100 rounded-lg"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setGeneratedToken(null);
                    setShowCreateDialog(false);
                  }}
                  className="w-full rounded-xl"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Token Name *
                  </label>
                  <Input
                    placeholder="e.g., My Mobile App"
                    value={newToken.token_name}
                    onChange={(e) => setNewToken(prev => ({ ...prev, token_name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="What will this token be used for?"
                    value={newToken.token_description}
                    onChange={(e) => setNewToken(prev => ({ ...prev, token_description: e.target.value }))}
                    className="rounded-xl"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Connection Purpose *
                  </label>
                  <Input
                    placeholder="e.g., Mobile app integration"
                    value={newToken.connection_purpose}
                    onChange={(e) => setNewToken(prev => ({ ...prev, connection_purpose: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Permissions
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: 'read', label: 'Read Access', desc: 'View automations and data' },
                      { key: 'write', label: 'Write Access', desc: 'Create and modify automations' },
                      { key: 'webhook', label: 'Webhook Management', desc: 'Manage webhook endpoints' },
                      { key: 'notifications', label: 'Notifications', desc: 'Send and manage notifications' },
                      { key: 'platform_connections', label: 'Platform Connections', desc: 'Manage platform integrations' },
                      { key: 'full_control', label: 'Full Account Control', desc: 'Complete account access' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-start space-x-3">
                        <Checkbox
                          id={key}
                          checked={newToken.permissions[key as keyof typeof newToken.permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(key, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor={key} className="text-sm font-medium text-gray-700 cursor-pointer">
                            {label}
                          </label>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateToken} 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl"
                >
                  Generate Token
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading API tokens...</div>
      ) : tokens.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No API tokens created yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first personal API token to access your YusrAI account programmatically
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tokens.map((token) => (
            <Card key={token.id} className="rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                      <Key className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{token.token_name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {token.token_description || token.connection_purpose}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={token.is_active}
                      onCheckedChange={() => toggleToken(token.id, token.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteToken(token.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {getPermissionBadges(token.permissions)}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-mono text-gray-700">
                        {showToken === token.id ? `ysr_${'*'.repeat(32)}` : `ysr_${'*'.repeat(32)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <BarChart3 className="h-4 w-4" />
                        <span>{token.usage_count} uses</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant={token.is_active ? "default" : "secondary"} className="rounded-full">
                      {token.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <div className="text-gray-500">
                      {token.last_used_at 
                        ? `Last used ${new Date(token.last_used_at).toLocaleDateString()}`
                        : 'Never used'
                      }
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
                Learn how to use your API tokens in our{' '}
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
