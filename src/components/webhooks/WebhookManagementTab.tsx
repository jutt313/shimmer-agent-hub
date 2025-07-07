import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { generateYusraiWebhookUrl, generateWebhookSecret } from '@/utils/webhookUrlGenerator';
import WebhookTestDemo from './WebhookTestDemo';
import ComingSoonBanner from './ComingSoonBanner';

interface WebhookManagementTabProps {
  automationId: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  is_active: boolean;
  created_at: string;
  last_triggered_at?: string;
  trigger_count: number;
  description?: string;
}

interface WebhookAnalytics {
  total_triggers: number;
  successful_triggers: number;
  failed_triggers: number;
  last_24h_triggers: number;
  avg_response_time: number;
}

const WebhookManagementTab: React.FC<WebhookManagementTabProps> = ({ automationId }) => {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [analytics, setAnalytics] = useState<WebhookAnalytics | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  
  // Form state
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookDescription, setNewWebhookDescription] = useState('');

  useEffect(() => {
    fetchWebhooks();
    fetchAnalytics();
  }, [automationId]);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_webhooks')
        .select('*')
        .eq('automation_id', automationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: "Error",
        description: "Failed to load webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_analytics')
        .select('*')
        .eq('automation_id', automationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching webhook analytics:', error);
    }
  };

  const createWebhook = async () => {
    if (!newWebhookName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a webhook name",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const webhookUrl = generateYusraiWebhookUrl(automationId);
      const webhookSecret = generateWebhookSecret();

      const { data, error } = await supabase
        .from('automation_webhooks')
        .insert({
          automation_id: automationId,
          name: newWebhookName.trim(),
          description: newWebhookDescription.trim() || null,
          url: webhookUrl,
          secret: webhookSecret,
          is_active: true,
          trigger_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => [data, ...prev]);
      setNewWebhookName('');
      setNewWebhookDescription('');
      setShowCreateForm(false);

      toast({
        title: "Webhook Created",
        description: `Webhook "${data.name}" has been created successfully`,
      });
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create webhook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteWebhook = async (webhookId: string, webhookName: string) => {
    try {
      const { error } = await supabase
        .from('automation_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      toast({
        title: "Webhook Deleted",
        description: `Webhook "${webhookName}" has been deleted`,
      });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete webhook. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleWebhookStatus = async (webhookId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_webhooks')
        .update({ is_active: !currentStatus })
        .eq('id', webhookId);

      if (error) throw error;

      setWebhooks(prev => prev.map(w => 
        w.id === webhookId ? { ...w, is_active: !currentStatus } : w
      ));

      toast({
        title: "Status Updated",
        description: `Webhook ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating webhook status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update webhook status",
        variant: "destructive",
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

  const toggleSecretVisibility = (webhookId: string) => {
    setVisibleSecrets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(webhookId)) {
        newSet.delete(webhookId);
      } else {
        newSet.add(webhookId);
      }
      return newSet;
    });
  };

  const maskSecret = (secret: string) => {
    return secret.substring(0, 8) + '•'.repeat(secret.length - 8);
  };

  return (
    <div className="space-y-6">
      {/* Coming Soon Banner - Always shown at top */}
      <ComingSoonBanner />
      
      {/* Rest of webhook content - kept for development but hidden in production */}
      <div className="opacity-30 pointer-events-none">
        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Triggers</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.total_triggers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.total_triggers > 0 
                        ? Math.round((analytics.successful_triggers / analytics.total_triggers) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Response</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.avg_response_time}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last 24h</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.last_24h_triggers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Webhook Test Demo */}
        <div className="mb-6">
          <WebhookTestDemo />
        </div>

        {/* Webhook Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Webhook Endpoints
              </CardTitle>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Webhook
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Create Webhook Form */}
            {showCreateForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-4">Create New Webhook</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-name">Webhook Name</Label>
                    <Input
                      id="webhook-name"
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                      placeholder="e.g., Order Processing Webhook"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-description">Description (Optional)</Label>
                    <Textarea
                      id="webhook-description"
                      value={newWebhookDescription}
                      onChange={(e) => setNewWebhookDescription(e.target.value)}
                      placeholder="Describe what this webhook does..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={createWebhook}
                      disabled={creating}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      {creating ? 'Creating...' : 'Create Webhook'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Webhooks List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading webhooks...</p>
              </div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Webhooks Yet</h3>
                <p className="text-gray-600 mb-4">Create your first webhook to start receiving automation triggers.</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Webhook
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{webhook.name}</h3>
                          <Badge variant={webhook.is_active ? "default" : "secondary"}>
                            {webhook.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {webhook.description && (
                          <p className="text-gray-600 text-sm mb-2">{webhook.description}</p>
                        )}
                        <div className="text-sm text-gray-500">
                          Created: {new Date(webhook.created_at).toLocaleDateString()}
                          {webhook.last_triggered_at && (
                            <span className="ml-4">
                              Last triggered: {new Date(webhook.last_triggered_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleWebhookStatus(webhook.id, webhook.is_active)}
                        >
                          {webhook.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteWebhook(webhook.id, webhook.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Webhook URL */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Webhook URL</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={webhook.url}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(webhook.url, 'Webhook URL')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Webhook Secret */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Webhook Secret</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={visibleSecrets.has(webhook.id) ? webhook.secret : maskSecret(webhook.secret)}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleSecretVisibility(webhook.id)}
                          >
                            {visibleSecrets.has(webhook.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(webhook.secret, 'Webhook Secret')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Webhook Stats */}
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">
                            {webhook.trigger_count} triggers
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">Secured</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-600">Real-time</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebhookManagementTab;
