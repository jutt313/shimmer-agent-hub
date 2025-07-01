
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Settings,
  Shield,
  Calendar,
  Activity
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
  
  // Form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'personal' | 'project' | 'service'>('personal');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [permissions, setPermissions] = useState({
    read: true,
    write: false,
    automations: true,
    webhooks: false,
    ai_agents: false
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
      setApiKeys(data || []);
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

      toast({
        title: "Success",
        description: "API key created successfully",
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
      ai_agents: false
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    const prefix = key.substring(0, 4);
    const suffix = key.substring(key.length - 4);
    return `${prefix}...${suffix}`;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
          <p className="text-gray-600">Manage your API keys and access tokens</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
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
                  className="mt-1 rounded-xl"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Select value={newKeyType} onValueChange={(value: any) => setNewKeyType(value)}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newKeyType === 'project' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Permissions</label>
                <div className="space-y-2">
                  {Object.entries(permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => 
                          setPermissions(prev => ({ ...prev, [key]: !!checked }))
                        }
                      />
                      <label htmlFor={key} className="text-sm capitalize">
                        {key.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

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
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
            <CardContent className="p-8 text-center">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
            <Card key={apiKey.id} className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Key className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {apiKey.credential_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {apiKey.credential_type}
                        </Badge>
                        <Badge variant={apiKey.is_active ? "default" : "destructive"}>
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
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-gray-800">
                      {visibleKeys.has(apiKey.id) ? apiKey.api_key : maskApiKey(apiKey.api_key)}
                    </code>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="rounded-lg"
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
                        className="rounded-lg"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(apiKey.permissions).map(([key, value]) => (
                      value && (
                        <Badge key={key} variant="secondary" className="capitalize">
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
