
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Copy, ExternalLink, Settings, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { EnhancedDeveloperApp } from "@/hooks/useEnhancedDeveloperApps";

interface DeveloperAppCardProps {
  app: EnhancedDeveloperApp;
  onUpdate: (appId: string, updates: Partial<EnhancedDeveloperApp>) => Promise<any>;
  onDelete: (appId: string) => Promise<void>;
  onToggleStatus: (appId: string, isActive: boolean) => Promise<void>;
}

const DeveloperAppCard = ({ app, onUpdate, onDelete, onToggleStatus }: DeveloperAppCardProps) => {
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      await onToggleStatus(app.id, app.is_active);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      await onDelete(app.id);
    }
  };

  const getEnvironmentBadge = () => {
    return app.environment === 'production' ? (
      <Badge variant="default">Production</Badge>
    ) : (
      <Badge variant="secondary">Test</Badge>
    );
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              {app.app_name}
              {getEnvironmentBadge()}
            </CardTitle>
            {app.app_description && (
              <p className="text-sm text-gray-600">{app.app_description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={app.is_active}
              onCheckedChange={handleToggleStatus}
              disabled={loading}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Client Credentials */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Client Credentials</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="font-mono text-xs">
                Client ID: {showSecrets ? app.client_id : '••••••••' + app.client_id.slice(-4)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(app.client_id, 'Client ID')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="font-mono text-xs">
                Secret: {showSecrets ? app.client_secret : '••••••••••••••••'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(app.client_secret, 'Client Secret')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Redirect URIs */}
        {app.redirect_uris && app.redirect_uris.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Redirect URIs</h4>
            <div className="space-y-1">
              {app.redirect_uris.map((uri, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                  <span className="font-mono truncate">{uri}</span>
                  {uri.startsWith('http') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(uri, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Webhook URL */}
        {app.webhook_url && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Webhook URL</h4>
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
              <span className="font-mono truncate">{app.webhook_url}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(app.webhook_url!, 'Webhook URL')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Permissions */}
        {app.supported_events && Object.keys(app.supported_events).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Permissions</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(app.supported_events).map(([key, value]) => (
                value && (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key.replace('_', ' ')}
                  </Badge>
                )
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
          <span>Rate Limit: {app.rate_limit_per_hour}/hour</span>
          <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeveloperAppCard;
