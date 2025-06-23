
import { useState, useEffect } from 'react';
import { Key, Trash2, Edit, Plus, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface PlatformCredential {
  id: string;
  platform_name: string;
  credential_type: string;
  is_active: boolean;
  created_at: string;
  credentials: string;
}

const PlatformCredentialsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCredentials();
  }, [user]);

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast({
        title: "Error",
        description: "Failed to load platform credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('platform_credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setCredentials(prev => prev.filter(c => c.id !== credentialId));
      toast({
        title: "Success",
        description: "Platform credential deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast({
        title: "Error",
        description: "Failed to delete credential",
        variant: "destructive",
      });
    }
  };

  const toggleCredentialVisibility = (credentialId: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const maskCredential = (credential: string) => {
    if (credential.length <= 8) return '••••••••';
    return credential.substring(0, 4) + '••••••••' + credential.substring(credential.length - 4);
  };

  const getPlatformIcon = (platformName: string) => {
    // You could add specific icons for different platforms here
    return <Key className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-green-600" />
            Platform Credentials ({credentials.length})
          </CardTitle>
          <CardDescription>
            Manage your saved platform credentials and API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading credentials...</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No platform credentials saved yet</p>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  toast({
                    title: "Add Credentials",
                    description: "Credential management feature coming soon",
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Platform Credential
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    toast({
                      title: "Add Credentials",
                      description: "Credential management feature coming soon",
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Credential
                </Button>
              </div>
              
              <div className="grid gap-4">
                {credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl text-white">
                        {getPlatformIcon(credential.platform_name)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{credential.platform_name}</h4>
                        <p className="text-sm text-gray-600">{credential.credential_type}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {showCredentials[credential.id] 
                              ? credential.credentials 
                              : maskCredential(credential.credentials)
                            }
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCredentialVisibility(credential.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showCredentials[credential.id] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={credential.is_active ? "default" : "secondary"}>
                            {credential.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            Added: {new Date(credential.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Edit Credential",
                            description: "Edit functionality coming soon",
                          });
                        }}
                        className="rounded-xl"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCredential(credential.id)}
                        className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformCredentialsTab;
