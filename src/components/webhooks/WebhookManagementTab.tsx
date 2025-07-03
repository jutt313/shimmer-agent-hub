
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Webhook, 
  Plus, 
  Copy, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  TrendingUp,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface AutomationWebhook {
  id: string;
  automation_id: string;
  webhook_name: string;
  webhook_description: string;
  webhook_url: string;
  webhook_secret: string;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
  expected_events: string[];
  automation?: {
    title: string;
    status: string;
  };
}

interface Automation {
  id: string;
  title: string;
  status: string;
}

interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
  responseBody?: string;
  userMessage?: string;
}

const WebhookManagementTab = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<AutomationWebhook[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, WebhookTestResult>>({});
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Form state for creating webhooks
  const [webhookForm, setWebhookForm] = useState({
    automation_id: '',
    webhook_name: '',
    webhook_description: '',
    expected_events: [] as string[]
  });

  // Predefined event types
  const eventTypes = [
    'webhook_trigger',
    'automation_start',
    'automation_complete',
    'automation_error',
    'data_received',
    'data_processed',
    'notification_sent',
    'user_action',
    'system_event',
    'custom_event'
  ];

  useEffect(() => {
    if (user) {
      fetchWebhooks();
      fetchAutomations();
    }
  }, [user]);

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('id, title, status')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('title');

      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast.error('Failed to load automations');
    }
  };

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_webhooks')
        .select(`
          *,
          automations!inner(title, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!webhookForm.automation_id || !webhookForm.webhook_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Generate webhook URL using the updated domain generator
      const { data: urlData, error: urlError } = await supabase
        .rpc('generate_webhook_url', { automation_id: webhookForm.automation_id });

      if (urlError) throw urlError;

      const { data, error } = await supabase
        .from('automation_webhooks')
        .insert({
          automation_id: webhookForm.automation_id,
          webhook_name: webhookForm.webhook_name,
          webhook_description: webhookForm.webhook_description,
          webhook_url: urlData,
          expected_events: webhookForm.expected_events
        })
        .select(`
          *,
          automations!inner(title, status)
        `)
        .single();

      if (error) throw error;

      setWebhooks(prev => [data, ...prev]);
      setCreateDialogOpen(false);
      setWebhookForm({
        automation_id: '',
        webhook_name: '',
        webhook_description: '',
        expected_events: []
      });
      
      toast.success('Webhook created successfully');
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Failed to create webhook');
    }
  };

  const toggleWebhookStatus = async (webhookId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_webhooks')
        .update({ is_active: !isActive })
        .eq('id', webhookId);

      if (error) throw error;

      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === webhookId ? { ...webhook, is_active: !isActive } : webhook
        )
      );
      
      toast.success(`Webhook ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling webhook status:', error);
      toast.error('Failed to update webhook status');
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('automation_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
      toast.success('Webhook deleted successfully');
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  const testWebhook = async (webhook: AutomationWebhook) => {
    setTestingWebhook(webhook.id);
    
    try {
      console.log('🧪 TESTING WEBHOOK:', webhook.webhook_url);
      
      const { data, error } = await supabase.functions.invoke('test-webhook', {
        body: { 
          webhookUrl: webhook.webhook_url,
          secret: webhook.webhook_secret 
        }
      });

      if (error) {
        console.error('❌ Test webhook function error:', error);
        const result: WebhookTestResult = {
          success: false,
          error: 'Unable to connect to webhook testing service',
          responseTime: 0
        };
        setTestResults(prev => ({ ...prev, [webhook.id]: result }));
        toast.error('❌ Webhook testing service unavailable');
        return;
      }

      console.log('✅ Test webhook response:', data);

      const testResult: WebhookTestResult = {
        success: data.success,
        error: data.error,
        userMessage: data.userMessage,
        responseTime: data.responseTime || 0,
        statusCode: data.statusCode
      };

      setTestResults(prev => ({ ...prev, [webhook.id]: testResult }));
      
      if (data.success) {
        toast.success(`✅ ${data.userMessage || `Webhook test successful! (${data.responseTime || 0}ms)`}`);
      } else {
        toast.error(`❌ ${data.userMessage || data.error || 'Webhook test failed'}`);
      }
    } catch (error: any) {
      console.error('💥 Webhook test error:', error);
      
      const result: WebhookTestResult = {
        success: false,
        responseTime: 0,
        error: 'Webhook test failed unexpectedly',
        userMessage: 'Unable to test webhook. Please try again later.'
      };
      
      setTestResults(prev => ({ ...prev, [webhook.id]: result }));
      toast.error('❌ Webhook test failed unexpectedly');
    } finally {
      setTestingWebhook(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${label}`);
    });
  };

  const totalWebhooks = webhooks.length;
  const activeWebhooks = webhooks.filter(w => w.is_active).length;
  const totalCalls = webhooks.reduce((sum, w) => sum + w.trigger_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <Webhook className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Webhook Management
            </h1>
            <p className="text-gray-600">
              Create and manage webhooks for your automations
            </p>
          </div>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Create New Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="automation">Automation</Label>
                <Select value={webhookForm.automation_id} onValueChange={(value) => setWebhookForm(prev => ({ ...prev, automation_id: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select an automation" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {automations.map((automation) => (
                      <SelectItem key={automation.id} value={automation.id}>
                        {automation.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Webhook Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Payment Processor"
                  value={webhookForm.webhook_name}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, webhook_name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this webhook does..."
                  value={webhookForm.webhook_description}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, webhook_description: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Expected Events (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map((event) => (
                    <Badge
                      key={event}
                      variant={webhookForm.expected_events.includes(event) ? "default" : "outline"}
                      className={`cursor-pointer rounded-full ${
                        webhookForm.expected_events.includes(event) 
                          ? 'bg-blue-100 text-blue-700 border-blue-200' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setWebhookForm(prev => ({
                          ...prev,
                          expected_events: prev.expected_events.includes(event)
                            ? prev.expected_events.filter(e => e !== event)
                            : [...prev.expected_events, event]
                        }));
                      }}
                    >
                      {event.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createWebhook}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
                >
                  Create Webhook
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Webhooks</p>
                <p className="text-3xl font-bold text-blue-700">{totalWebhooks}</p>
              </div>
              <Webhook className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold text-green-700">{activeWebhooks}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Calls</p>
                <p className="text-3xl font-bold text-purple-700">{totalCalls}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <Card className="rounded-3xl border shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Your Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Webhooks Yet</h3>
              <p className="text-gray-600 mb-4">Create your first webhook to start receiving automation events</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id} className="border rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {webhook.webhook_name}
                          </h3>
                          <Badge 
                            variant={webhook.is_active ? "default" : "secondary"}
                            className={`rounded-full ${
                              webhook.is_active 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="rounded-full text-xs">
                            {webhook.automation?.title || 'Unknown Automation'}
                          </Badge>
                        </div>
                        
                        {webhook.webhook_description && (
                          <p className="text-gray-600 text-sm mb-3">{webhook.webhook_description}</p>
                        )}
                        
                        <div className="space-y-3">
                          {/* Webhook URL with Copy Button */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Webhook URL
                            </Label>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border">
                              <code className="text-sm font-mono flex-1 truncate text-gray-800">
                                {webhook.webhook_url}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(webhook.webhook_url, 'Webhook URL')}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:border-blue-200"
                                title="Copy webhook URL"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(webhook.webhook_url, '_blank')}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-green-50 hover:border-green-200"
                                title="Open webhook URL"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Webhook Secret */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              Security Secret
                            </Label>
                            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                              <code className="text-sm font-mono flex-1 truncate text-gray-800">
                                {webhook.webhook_secret}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(webhook.webhook_secret, 'Webhook Secret')}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-amber-100 hover:border-amber-300"
                                title="Copy webhook secret"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                              <strong>Important:</strong> Use this secret to sign your webhook payloads for security verification. 
                              Include it as 'X-Webhook-Signature' header when sending requests.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>{webhook.trigger_count} calls</span>
                          </div>
                          {webhook.last_triggered_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Last: {new Date(webhook.last_triggered_at).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Test Results Display */}
                        {testResults[webhook.id] && (
                          <div className={`mt-4 p-4 rounded-xl border ${
                            testResults[webhook.id].success 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {testResults[webhook.id].success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm font-medium">Test Result</span>
                              {testResults[webhook.id].statusCode && (
                                <Badge variant="outline" className="text-xs">
                                  HTTP {testResults[webhook.id].statusCode}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {testResults[webhook.id].responseTime}ms
                              </span>
                            </div>
                            <p className={`text-sm ${
                              testResults[webhook.id].success ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {testResults[webhook.id].userMessage || testResults[webhook.id].error || 'Test completed'}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testWebhook(webhook)}
                          disabled={testingWebhook === webhook.id}
                          className="rounded-lg bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          {testingWebhook === webhook.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          Test
                        </Button>
                        
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={() => toggleWebhookStatus(webhook.id, webhook.is_active)}
                        />
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{webhook.webhook_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteWebhook(webhook.id)}
                                className="bg-red-600 hover:bg-red-700 rounded-xl"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManagementTab;
