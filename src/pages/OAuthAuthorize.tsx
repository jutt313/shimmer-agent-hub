
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, ExternalLink, Check, X, Globe, Zap, Database, Bell, Settings, Link } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface OAuthApp {
  id: string;
  app_name: string;
  app_description: string;
  app_logo_url?: string;
  homepage_url?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  developer_email: string;
  client_id: string;
  supported_events: string[];
}

interface PermissionRequest {
  id: string;
  name: string;
  description: string;
  icon: any;
  required: boolean;
}

const OAuthAuthorize = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [app, setApp] = useState<OAuthApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope');

  const permissionRequests: PermissionRequest[] = [
    {
      id: 'read_profile',
      name: 'Read your profile information',
      description: 'Access your basic profile details like name and email',
      icon: Shield,
      required: true
    },
    {
      id: 'read_automations',
      name: 'Read your automations',
      description: 'View your automation workflows and their status',
      icon: Zap,
      required: false
    },
    {
      id: 'write_automations',
      name: 'Create and modify automations',
      description: 'Create new automations and modify existing ones',
      icon: Settings,
      required: false
    },
    {
      id: 'read_data',
      name: 'Read your data',
      description: 'Access data from your connected platforms',
      icon: Database,
      required: false
    },
    {
      id: 'send_notifications',
      name: 'Send notifications',
      description: 'Send notifications to your account',
      icon: Bell,
      required: false
    },
    {
      id: 'manage_webhooks',
      name: 'Manage webhooks',
      description: 'Create and manage webhook endpoints',
      icon: Link,
      required: false
    }
  ];

  useEffect(() => {
    if (!user) {
      // Store OAuth parameters and redirect to login
      const oauthParams = new URLSearchParams(window.location.search);
      localStorage.setItem('oauth_params', oauthParams.toString());
      navigate('/auth');
      return;
    }

    if (!clientId) {
      toast({
        title: "Invalid Request",
        description: "Missing client_id parameter",
        variant: "destructive",
      });
      return;
    }

    fetchApp();
  }, [user, clientId]);

  useEffect(() => {
    // Set default permissions (required ones are always selected)
    const defaultPermissions = permissionRequests
      .filter(p => p.required)
      .map(p => p.id);
    setSelectedPermissions(defaultPermissions);
  }, []);

  const fetchApp = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_integrations')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "Application Not Found",
          description: "The requested application does not exist or is inactive",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to match our interface, handling the Json type for supported_events
      const transformedApp: OAuthApp = {
        id: data.id,
        app_name: data.app_name,
        app_description: data.app_description || '',
        app_logo_url: data.app_logo_url || undefined,
        homepage_url: data.homepage_url || undefined,
        privacy_policy_url: data.privacy_policy_url || undefined,
        terms_of_service_url: data.terms_of_service_url || undefined,
        developer_email: data.developer_email || '',
        client_id: data.client_id,
        supported_events: Array.isArray(data.supported_events) ? data.supported_events as string[] : []
      };

      setApp(transformedApp);
    } catch (error) {
      console.error('Error fetching app:', error);
      toast({
        title: "Error",
        description: "Failed to load application details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!app || !redirectUri) return;
    
    setAuthorizing(true);
    try {
      // Generate authorization code
      const authCode = `auth_${crypto.randomUUID()}`;
      
      // For now, we'll simulate storing the authorization
      // In a real implementation, you'd store this in a proper oauth_authorizations table
      console.log('Authorization granted:', {
        user_id: user?.id,
        app_id: app.id,
        client_id: clientId,
        authorization_code: authCode,
        redirect_uri: redirectUri,
        scope: selectedPermissions.join(' '),
        state: state,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

      // Redirect back to the app with the authorization code
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set('code', authCode);
      if (state) redirectUrl.searchParams.set('state', state);
      
      window.location.href = redirectUrl.toString();
    } catch (error) {
      console.error('Error authorizing app:', error);
      toast({
        title: "Authorization Failed",
        description: "Failed to authorize the application",
        variant: "destructive",
      });
    } finally {
      setAuthorizing(false);
    }
  };

  const handleDeny = () => {
    if (!redirectUri) return;
    
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set('error_description', 'The user denied the request');
    if (state) redirectUrl.searchParams.set('state', state);
    
    window.location.href = redirectUrl.toString();
  };

  const togglePermission = (permissionId: string) => {
    const permission = permissionRequests.find(p => p.id === permissionId);
    if (permission?.required) return; // Can't toggle required permissions
    
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-2xl border-0 shadow-2xl">
          <CardContent className="text-center p-8">
            <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Not Found</h2>
            <p className="text-gray-600">The requested application could not be found or is inactive.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl rounded-2xl border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            {app.app_logo_url ? (
              <img 
                src={app.app_logo_url} 
                alt={app.app_name}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-400">
              <ExternalLink className="h-6 w-6" />
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Authorize {app.app_name}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {app.app_description}
          </p>
          <div className="flex justify-center gap-4 mt-4">
            {app.homepage_url && (
              <a 
                href={app.homepage_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Visit Website
              </a>
            )}
            {app.privacy_policy_url && (
              <a 
                href={app.privacy_policy_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Privacy Policy
              </a>
            )}
            {app.terms_of_service_url && (
              <a 
                href={app.terms_of_service_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Terms of Service
              </a>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Permission Request</h4>
                <p className="text-sm text-yellow-700">
                  <strong>{app.app_name}</strong> is requesting access to your YusrAI account with the following permissions:
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Requested Permissions</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {permissionRequests.map((permission) => {
                const Icon = permission.icon;
                const isSelected = selectedPermissions.includes(permission.id);
                
                return (
                  <div 
                    key={permission.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePermission(permission.id)}
                      disabled={permission.required}
                      className="mt-0.5"
                    />
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      isSelected ? 'text-green-600' : 'text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-gray-800">{permission.name}</h5>
                        {permission.required && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {app.supported_events && app.supported_events.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 mb-2">Webhook Events</h4>
              <p className="text-sm text-blue-700 mb-3">
                This app may send webhook notifications for the following events:
              </p>
              <div className="flex flex-wrap gap-2">
                {app.supported_events.slice(0, 6).map((event: string) => (
                  <Badge key={event} variant="outline" className="text-xs bg-blue-100 border-blue-300 text-blue-700">
                    {event.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
                {app.supported_events.length > 6 && (
                  <Badge variant="outline" className="text-xs bg-gray-100 border-gray-300 text-gray-600">
                    +{app.supported_events.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleDeny}
              variant="outline"
              className="flex-1 rounded-xl border-gray-300 hover:bg-gray-50"
              disabled={authorizing}
            >
              <X className="w-4 h-4 mr-2" />
              Deny Access
            </Button>
            <Button
              onClick={handleAuthorize}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={authorizing}
            >
              {authorizing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {authorizing ? 'Authorizing...' : 'Authorize Access'}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 pt-2">
            By authorizing this application, you agree to share the selected information with <strong>{app.app_name}</strong>.
            You can revoke this access at any time from your account settings.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthAuthorize;
