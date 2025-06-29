
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, Trash2, Plus, Webhook, ExternalLink, Activity } from 'lucide-react';
import { useWebhookEvents } from '@/hooks/useWebhookEvents';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WebhooksSection = () => {
  const { webhookEvents, loading, createWebhookEvent, toggleWebhookStatus, deleteWebhookEvent } = useWebhookEvents();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [automations, setAutomations] = useState<any[]>([]);
  const [newWebhook, setNewWebhook] = useState({
    automation_id: '',
    event_type: '',
    event_description: ''
  });
  const { toast } = useToast();

  const handleCreateWebhook = async () => {
    if (!newWebhook.automation_id || !newWebhook.event_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const result = await createWebhookEvent(newWebhook);
    if (result) {
      setNewWebhook({ automation_id: '', event_type: '', event_description: '' });
      setShowCreateDialog(false);
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
  };

  // Fetch automations when dialog opens
  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('id, title')
        .eq('status', 'active');
      
      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Automation Webhooks
          </h3>
          <p className="text-gray-600 mt-2">
            Create webhooks to trigger your automations from external services
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={fetchAutomations}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Create New Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Automation *
                </label>
                <Select value={newWebhook.automation_id} onValueChange={(value) => 
                  setNewWebhook(prev => ({ ...prev, automation_id: value }))
                }>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose an automation" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {automations.map(automation => (
                      <SelectItem key={automation.id} value={automation.id}>
                        {automation.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Event Type *
                </label>
                <Input
                  placeholder="e.g., payment_completed, user_registered"
                  value={newWebhook.event_type}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, event_type: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Textarea
                  placeholder="Describe what this webhook is used for..."
                  value={newWebhook.event_description}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, event_description: e.target.value }))}
                  className="rounded-xl"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleCreateWebhook} 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl"
              >
                Create Webhook
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading webhooks...</div>
      ) : webhookEvents.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No webhooks created yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first webhook to start receiving external triggers for your automations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhookEvents.map((webhook) => (
            <Card key={webhook.id} className="rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                      <Webhook className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{webhook.event_type}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {webhook.event_description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() => toggleWebhookStatus(webhook.id, webhook.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWebhookEvent(webhook.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <code className="text-sm font-mono text-gray-700 break-all">
                      {webhook.webhook_url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyWebhookUrl(webhook.webhook_url)}
                      className="ml-2 hover:bg-white rounded-lg"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <Badge variant={webhook.is_active ? "default" : "secondary"} className="rounded-full">
                        {webhook.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Activity className="h-4 w-4" />
                        <span>{webhook.trigger_count} triggers</span>
                      </div>
                    </div>
                    <div className="text-gray-500">
                      Created {new Date(webhook.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border border-blue-200 bg-blue-50/30 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">Need help with webhooks?</h4>
              <p className="text-sm text-blue-700">
                Check our{' '}
                <a 
                  href="https://docs.yusrai.com/webhooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  webhook documentation
                </a>
                {' '}for implementation examples and best practices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhooksSection;
