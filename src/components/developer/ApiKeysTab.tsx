
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PermissionsDropdown from './PermissionsDropdown';
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2,
  Shield,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ApiKey {
  id: string;
  credential_name: string;
  api_key: string;
  credential_type: 'personal' | 'project' | 'service';
  permissions: {
    read: boolean;
    write: boolean;
    automations: boolean;
    webhooks: boolean;
    ai_agents: boolean;
    dashboard?: boolean;
    chat_ai?: boolean;
    notifications?: boolean;
    credentials?: boolean;
    diagrams?: boolean;
  };
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  project_id: string | null;
}

interface Project {
  id: string;
  project_name: string;
}

const ApiKeysTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  
  // Form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'personal' | 'project' | 'service'>('personal');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [permissions, setPermissions] = useState({
    read: true,
    write: false,
    automations: true,
    webhooks: false,
    ai_agents: false,
    dashboard: false,
    chat_ai: false,
    notifications: false,
    credentials: false,
    diagrams: false
  });

  useEffect(() => {
    if (user) {
      fetchApiKeys();
      fetchProjects();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        permissions: typeof item.permissions === 'string' 
          ? JSON.parse(item.permissions) 
          : item.permissions || {
              read: true,
              write: false,
              automations: true,
              webhooks: false,
              ai_agents: false
            }
      })) as ApiKey[];
      
      setApiKeys(transformedData);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_projects')
        .select('id, project_name')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApiKeys();
      fetchProjects();
    }
  }, [user]);

  const generateApiKey = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_yusrai_api_key');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating API key:', error);
      throw error;
    }
  };

  const createApiKey = async () => {
    try {
      const apiKey = await generateApiKey();
      
      const { error } = await supabase
        .from('api_credentials')
        .insert({
          user_id: user?.id,
          project_id: newKeyType === 'project' ? selectedProject || null : null,
          credential_name: newKeyName,
          api_key: apiKey,
          credential_type: newKeyType,
          permissions,
        });

      if (error) throw error;

      setNewlyCreatedKey(apiKey);
      toast({
        title: "Success",
        description: "API key created successfully. This is the only time you'll see the full key!",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "API key deleted successfully",
      });

      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const resetForm = () => {
    setNewKeyName('');
    setNewKeyType('personal');
    setSelectedProject('');
    setPermissions({
      read: true,
      write: false,
      automations: true,
      webhooks: false,
      ai_agents: false,
      dashboard: false,
      chat_ai: false,
      notifications: false,
      credentials: false,
      diagrams: false
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    const prefix = key.substring(0, 8);
    const suffix = key.substring(key.length - 4);
    return `${prefix}...${suffix}`;
  };

  const getCredentialTypeDescription = (type: 'personal' | 'project' | 'service') => {
    switch (type) {
      case 'personal':
        return 'Full account control - manage automations, agents, dashboard, notifications, and all account features';
      case 'project':
        return 'External application integration - specific project scope with limited features for external UI integration';
      case 'service':
        return 'Backend service integration - minimal scopes for server-to-server communication';
    }
  };

  const handlePermissionChange = (key: string, checked: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: checked }));
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800">API Key Created Successfully!</h4>
                <p className="text-sm text-green-700 mt-1">
                  This is the only time you'll see the full key. Copy it now and store it securely.
                </p>
                <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-gray-800 break-all">{newlyCreatedKey}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                      className="ml-2 text-green-600 hover:text-green-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewlyCreatedKey(null)}
                  className="mt-2 text-green-600 hover:text-green-700"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
          <p className="text-gray-600">Manage your API keys and access tokens</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Key Name</label>
                <Input
                  placeholder="My API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="mt-1 rounded-xl border-gray-300 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Select value={newKeyType} onValueChange={(value: any) => setNewKeyType(value)}>
                  <SelectTrigger className="mt-1 rounded-xl bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg rounded-xl z-50">
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {getCredentialTypeDescription(newKeyType)}
                </p>
              </div>

              {newKeyType === 'project' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="mt-1 rounded-xl bg-white border-gray-300">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg rounded-xl z-50">
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <PermissionsDropdown
                permissions={permissions}
                onPermissionChange={handlePermissionChange}
                credentialType={newKeyType}
              />

              <Button 
                onClick={createApiKey} 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
                disabled={!newKeyName.trim()}
              >
                Create API Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 rounded-3xl shadow-lg">
            <CardContent className="p-8 text-center">
              <Key className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
              <p className="text-gray-600 mb-4">Create your first API key to get started</p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                      <Key className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {apiKey.credential_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize bg-blue-50 text-blue-700 border-blue-200">
                          {apiKey.credential_type}
                        </Badge>
                        <Badge variant={apiKey.is_active ? "default" : "destructive"} className="bg-green-100 text-green-800">
                          {apiKey.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteApiKey(apiKey.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key Display */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-gray-800 break-all">
                      {visibleKeys.has(apiKey.id) ? apiKey.api_key : maskApiKey(apiKey.api_key)}
                    </code>
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="rounded-lg hover:bg-gray-200"
                      >
                        {visibleKeys.has(apiKey.id) ? 
                          <EyeOff className="h-4 w-4" /> : 
                          <Eye className="h-4 w-4" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.api_key)}
                        className="rounded-lg hover:bg-gray-200"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Type Description */}
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <strong>{apiKey.credential_type.charAt(0).toUpperCase() + apiKey.credential_type.slice(1)}:</strong> {getCredentialTypeDescription(apiKey.credential_type)}
                  </p>
                </div>

                {/* Permissions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(apiKey.permissions).map(([key, value]) => (
                      value && (
                        <Badge key={key} variant="secondary" className="capitalize bg-gray-100 text-gray-700 border border-gray-200">
                          {key.replace('_', ' ')}
                        </Badge>
                      )
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Activity className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-gray-600">Usage</p>
                    <p className="font-semibold text-gray-900">{apiKey.usage_count}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(apiKey.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Shield className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-gray-600">Last Used</p>
                    <p className="font-semibold text-gray-900">
                      {apiKey.last_used_at ? 
                        new Date(apiKey.last_used_at).toLocaleDateString() : 
                        'Never'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ApiKeysTab;
