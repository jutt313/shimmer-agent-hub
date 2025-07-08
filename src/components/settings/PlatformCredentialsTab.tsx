
import { useState, useEffect } from 'react';
import { Key, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  automation_title?: string;
}

const PlatformCredentialsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutomationCredentials();
  }, [user]);

  const fetchAutomationCredentials = async () => {
    try {
      // Fetch credentials that are used in automations
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('platform_credentials')
        .select(`
          id,
          platform_name,
          credential_type,
          is_active,
          created_at
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (credentialsError) throw credentialsError;

      // Fetch automations to see which ones use these platforms
      const { data: automationsData, error: automationsError } = await supabase
        .from('automations')
        .select('id, title, platforms_config')
        .eq('user_id', user?.id);

      if (automationsError) throw automationsError;

      // Map credentials to their automations
      const credentialsWithAutomations = credentialsData?.map(credential => {
        const connectedAutomation = automationsData?.find(automation => {
          const platformsConfig = automation.platforms_config as any;
          return platformsConfig?.some?.((platform: any) => 
            platform.name === credential.platform_name
          );
        });

        return {
          ...credential,
          automation_title: connectedAutomation?.title || 'Connected Automation'
        };
      }) || [];

      setCredentials(credentialsWithAutomations);
    } catch (error) {
      console.error('Error fetching automation credentials:', error);
      toast({
        title: "Error",
        description: "Failed to load platform credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platformName: string) => {
    return <Key className="w-5 h-5" />;
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Connected Platform Credentials ({credentials.length})
          </CardTitle>
          <CardDescription>
            Platform credentials currently connected to your automations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading connected platforms...</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No platform credentials connected yet</p>
              <p className="text-sm text-gray-500">
                Platform credentials will appear here once you create automations that use them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
                      {getPlatformIcon(credential.platform_name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{credential.platform_name}</h4>
                        {getStatusIcon(credential.is_active)}
                      </div>
                      <p className="text-sm text-gray-600">{credential.credential_type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Used in: {credential.automation_title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={credential.is_active ? "default" : "secondary"} className="text-xs">
                          {credential.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          Connected: {new Date(credential.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-medium text-green-600">Connected</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Key className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-orange-900 mb-1">Manual Credential Management</h4>
              <p className="text-sm text-orange-700 mb-2">
                Advanced platform credential management with manual add, edit, and test features
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-medium">
                  🚀 Coming Soon
                </span>
                <span className="text-xs text-orange-600">
                  Beta launch focused on automation-connected credentials
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">Secure Credential Storage</h4>
              <p className="text-sm text-blue-700">
                All platform credentials are encrypted and securely stored. They are automatically 
                connected when you configure platforms in your automations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformCredentialsTab;
