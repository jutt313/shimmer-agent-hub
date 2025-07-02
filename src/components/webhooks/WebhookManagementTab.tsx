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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Eye,
  EyeOff,
  AlertTriangle,
  TrendingUp,
  Activity,
  Info
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
  status_code?: number;
  response_time: number;
  error?: string;
  response_body?: string;
}

const WebhookManagementTab = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<AutomationWebhook[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, WebhookTestResult>>({});
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

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
      // Generate webhook URL using the database function
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
      console.log('Testing webhook:', webhook.webhook_url);
      
      // Create test payload
      const testPayload = {
        event: 'test_webhook',
        data: {
          message: 'Test webhook from YusrAI Developer Portal',
          timestamp: new Date().toISOString(),
          automation_id: webhook.automation_id,
          test: true,
          source: 'developer_portal'
        },
        timestamp: new Date().toISOString()
      };

      const startTime = Date.now();
      
      // Use the webhook URL directly - it should be the full Supabase function URL
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test_webhook',
          'X-Webhook-Timestamp': testPayload.timestamp,
          // Don't include signature for test - let the webhook handle it
        },
        body: JSON.stringify(testPayload)
      });

      const responseTime = Date.now() - startTime;
      let responseBody = '';
      
      try {
        responseBody = await response.text();
      } catch (e) {
        responseBody = 'Failed to read response body';
      }

      console.log('Webhook test response:', {
        status: response.status,
        statusText: response.statusText,
        responseTime,
        body: responseBody
      });

      const result: WebhookTestResult = {
        success: response.ok,
        status_code: response.status,
        response_time: responseTime,
        response_body: responseBody
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        if (responseBody) {
          try {
            const jsonBody = JSON.parse(responseBody);
            if (jsonBody.error) {
              result.error = jsonBody.error;
            }
          } catch (e) {
            // Response body is not JSON, use as-is
            result.error += ` - ${responseBody}`;
          }
        }
      }

      setTestResults(prev => ({ ...prev, [webhook.id]: result }));
      
      if (result.success) {
        toast.success(`Webhook test successful! (${responseTime}ms)`);
      } else {
        toast.error(`Webhook test failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Webhook test error:', error);
      
      const result: WebhookTestResult = {
        success: false,
        response_time: 0,
        error: error.message === 'Failed to fetch' 
          ? 'Network error - Unable to reach webhook endpoint. This could be due to CORS restrictions or the service being offline.'
          : error.message || 'Unknown error occurred during webhook test'
      };
      
      setTestResults(prev => ({ ...prev, [webhook.id]: result }));
      toast.error(`Webhook test failed: ${result.error}`);
    } finally {
      setTestingWebhook(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleSecretVisibility = (webhookId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [webhookId]: !prev[webhookId]
    }));
  };

  const getStatusColor = (status_code?: number) => {
    if (!status_code) return 'text-gray-500';
    if (status_code >= 200 && status_code < 300) return 'text-green-500';
    if (status_code >= 400 && status_code < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = (status_code?: number) => {
    if (!status_code) return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    if (status_code >= 200 && status_code < 300) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const totalWebhooks = webhooks.length;
  const activeWebhooks = webhooks.filter(w => w.is_active).length;
  const totalCalls = webhooks.reduce((sum, w) => sum + w.trigger_count, 0);
  
  // Calculate success rate from actual delivery logs, not test results
  const [webhookStats, setWebhookStats] = useState({ successRate: 0, totalDeliveries: 0 });
  
  useEffect(() => {
    const calculateStats = async () => {
      if (webhooks.length === 0) return;
      
      try {
        const { data: deliveryLogs, error } = await supabase
          .from('webhook_delivery_logs')
          .select('status_code, automation_webhook_id')
          .in('automation_webhook_id', webhooks.map(w => w.id));
          
        if (error) throw error;
        
        const totalDeliveries = deliveryLogs?.length || 0;
        const successfulDeliveries = deliveryLogs?.filter(log => 
          log.status_code && log.status_code >= 200 && log.status_code < 300
        ).length || 0;
        
        const successRate = totalDeliveries > 0 ? Math.round((successfulDeliveries / totalDeliveries) * 100) : 0;
        
        setWebhookStats({ successRate, totalDeliveries });
      } catch (error) {
        console.error('Error calculating webhook stats:', error);
      }
    };
    
    calculateStats();
  }, [webhooks]);

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

      {/* Webhook Testing Info */}
      <Card className="bg-blue-50 border-blue-200 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">About Webhook Testing</p>
              <p className="text-blue-700">
                The webhook test sends a test payload to your automation's webhook endpoint. 
                If the test fails with a network error, it might be due to browser CORS restrictions. 
                Your actual webhook will work fine when called from external services.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-orange-700">{webhookStats.successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
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
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-medium text-gray-500">Webhook URL:</Label>
                            <div className="flex items-center gap-2 flex-1">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded border font-mono flex-1 truncate">
                                {webhook.webhook_url}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(webhook.webhook_url, 'Webhook URL')}
                                className="h-7 w-7 p-0 rounded-lg"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(webhook.webhook_url, '_blank')}
                                className="h-7 w-7 p-0 rounded-lg"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                           <div className="flex items-center gap-2">
                             <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                               Secret:
                               <span className="text-gray-400 hover:text-gray-600 cursor-help" title="Used to verify webhook authenticity. Include as 'X-Webhook-Signature' header when sending requests.">
                                 <AlertTriangle className="h-3 w-3" />
                               </span>
                             </Label>
                             <div className="flex items-center gap-2 flex-1">
                               <code className="text-xs bg-gray-100 px-2 py-1 rounded border font-mono flex-1">
                                 {showSecrets[webhook.id] 
                                   ? webhook.webhook_secret 
                                   : '•'.repeat(webhook.webhook_secret.length)
                                 }
                               </code>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => toggleSecretVisibility(webhook.id)}
                                 className="h-7 w-7 p-0 rounded-lg"
                               >
                                 {showSecrets[webhook.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                               </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => copyToClipboard(webhook.webhook_secret, 'Webhook Secret')}
                                 className="h-7 w-7 p-0 rounded-lg"
                               >
                                 <Copy className="h-3 w-3" />
                               </Button>
                             </div>
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
                        
                        {testResults[webhook.id] && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(testResults[webhook.id].status_code)}
                              <span className="text-sm font-medium">Test Result</span>
                              {testResults[webhook.id].status_code && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getStatusColor(testResults[webhook.id].status_code)}`}
                                >
                                  {testResults[webhook.id].status_code}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {testResults[webhook.id].response_time}ms
                              </span>
                            </div>
                            {testResults[webhook.id].error && (
                              <p className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                                {testResults[webhook.id].error}
                              </p>
                            )}
                            {testResults[webhook.id].success && testResults[webhook.id].response_body && (
                              <div className="text-xs text-green-600 bg-green-50 p-2 rounded border mt-2">
                                <p className="font-medium mb-1">Response:</p>
                                <pre className="whitespace-pre-wrap break-words">
                                  {testResults[webhook.id].response_body}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testWebhook(webhook)}
                          disabled={testingWebhook === webhook.id}
                          className="rounded-lg"
                        >
                          {testingWebhook === webhook.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
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
