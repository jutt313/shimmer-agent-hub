
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PermissionsDropdown from './PermissionsDropdown';
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiCredential {
  id: string;
  credential_name: string;
  credential_type: 'personal' | 'project' | 'service';
  api_key: string;
  permissions: any;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  rate_limit_per_hour: number;
}

const ApiKeysTab = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCredential, setNewCredential] = useState({
    name: '',
    type: 'personal' as 'personal' | 'project' | 'service',
    permissions: {
      read: true,
      write: false,
      automations: true,
      webhooks: false,
      ai_agents: false,
      dashboard: false,
      chat_ai: false,
      notifications: false,
      credentials: false,
      diagrams: false,
    }
  });
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (user) {
      fetchCredentials();
    }
  }, [user]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast.error('Failed to fetch API credentials');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newCredential.name.trim()) {
      toast.error('Please enter a credential name');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('generate_unified_api_key', {
        key_type: newCredential.type
      });

      if (error) throw error;

      const apiKey = data;
      
      const { error: insertError } = await supabase
        .from('api_credentials')
        .insert({
          user_id: user?.id,
          credential_name: newCredential.name,
          credential_type: newCredential.type,
          api_key: apiKey,
          permissions: newCredential.permissions,
          is_active: true,
          rate_limit_per_hour: newCredential.type === 'service' ? 2000 : 
                               newCredential.type === 'project' ? 500 : 1000
        });

      if (insertError) throw insertError;

      setCreatedApiKey(apiKey);
      await fetchCredentials();
      toast.success('API key created successfully!');
      
      // Reset form
      setNewCredential({
        name: '',
        type: 'personal',
        permissions: {
          read: true,
          write: false,
          automations: true,
          webhooks: false,
          ai_agents: false,
          dashboard: false,
          chat_ai: false,
          notifications: false,
          credentials: false,
          diagrams: false,
        }
      });

    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const toggleApiKeyVisibility = (credentialId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const deleteCredential = async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchCredentials();
      toast.success('API credential deleted successfully');
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast.error('Failed to delete API credential');
    }
  };

  const handlePermissionChange = (key: string, checked: boolean) => {
    setNewCredential(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: checked
      }
    }));
  };

  const getCredentialTypeInfo = (type: string) => {
    switch (type) {
      case 'personal':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Full account control - perfect for personal automation and testing'
        };
      case 'project':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Project-scoped access - ideal for client applications and external integrations'
        };
      case 'service':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          description: 'Backend service integration - minimal permissions for production services'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Unknown credential type'
        };
    }
  };

  const maskApiKey = (apiKey: string) => {
    if (apiKey.length <= 12) return apiKey;
    return `${apiKey.substring(0, 8)}${'*'.repeat(32)}${apiKey.substring(apiKey.length - 4)}`;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading API credentials...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
          <p className="text-gray-600">Manage your API credentials and access tokens</p>
        </div>
        
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* API Key Cards */}
      {credentials.length === 0 ? (
        <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 rounded-3xl shadow-lg">
          <CardContent className="p-12 text-center">
            <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No API Keys Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first API key to start integrating with YusrAI API
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {credentials.map((credential) => {
            const typeInfo = getCredentialTypeInfo(credential.credential_type);
            const isVisible = showApiKey[credential.id];
            
            return (
              <Card key={credential.id} className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                        <Key className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {credential.credential_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs font-medium ${typeInfo.color}`}>
                            {credential.credential_type.toUpperCase()}
                          </Badge>
                          {credential.is_active ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              <span className="text-xs text-orange-600">Inactive</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCredential(credential.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Description */}
                  <p className="text-sm text-gray-600">{typeInfo.description}</p>
                  
                  {/* API Key Display */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">API Key</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-sm">
                        {isVisible ? credential.api_key : maskApiKey(credential.api_key)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleApiKeyVisibility(credential.id)}
                        className="rounded-xl"
                      >
                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(credential.api_key, 'API Key')}
                        className="rounded-xl"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Usage</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{credential.usage_count.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Total Requests</p>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Key className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Rate Limit</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{credential.rate_limit_per_hour.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Requests/Hour</p>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 rounded-xl">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">Last Used</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {credential.last_used_at 
                          ? new Date(credential.last_used_at).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                      <p className="text-xs text-gray-600">
                        {credential.last_used_at 
                          ? new Date(credential.last_used_at).toLocaleTimeString()
                          : 'Not used yet'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(credential.permissions).map(([key, value]) => (
                        value && (
                          <Badge key={key} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {key.replace('_', ' ')}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create API Key Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Create New API Key</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">API Key Name</label>
                <Input
                  placeholder="e.g., My Project API Key"
                  value={newCredential.name}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-xl border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Credential Type</label>
                <div className="grid grid-cols-1 gap-3">
                  {(['personal', 'project', 'service'] as const).map((type) => {
                    const info = getCredentialTypeInfo(type);
                    return (
                      <div
                        key={type}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          newCredential.type === type 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setNewCredential(prev => ({ ...prev, type }))}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs font-medium ${info.color}`}>
                                {type.toUpperCase()}
                              </Badge>
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                newCredential.type === type 
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300'
                              }`}>
                                {newCredential.type === type && (
                                  <CheckCircle className="w-full h-full text-white" />
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <PermissionsDropdown
                permissions={newCredential.permissions}
                onPermissionChange={handlePermissionChange}
                credentialType={newCredential.type}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={createApiKey}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Created API Key Modal */}
      <Dialog open={!!createdApiKey} onOpenChange={() => setCreatedApiKey(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              API Key Created Successfully!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Important Security Notice</span>
              </div>
              <p className="text-sm text-yellow-700">
                This is the only time you'll see this API key. Copy it now and store it securely. 
                You won't be able to view it again.
              </p>
            </div>

            {createdApiKey && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your New API Key</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-200 font-mono text-sm break-all">
                    {createdApiKey}
                  </div>
                  <Button
                    onClick={() => copyToClipboard(createdApiKey, 'API Key')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm text-gray-600">
              <h4 className="font-semibold text-gray-900">Next Steps:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Test your API key in the API Playground</li>
                <li>• Add it to your application's environment variables</li>
                <li>• Check the documentation for integration examples</li>
                <li>• Monitor usage in the Developer Portal</li>
              </ul>
            </div>

            <Button
              onClick={() => setCreatedApiKey(null)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
            >
              I've Saved My API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeysTab;
