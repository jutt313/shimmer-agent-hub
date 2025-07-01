
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Copy, Trash2, Plus, Webhook, ExternalLink, Activity, Zap, Globe } from 'lucide-react';
import { useWebhookEvents } from '@/hooks/useWebhookEvents';
import { useToast } from '@/components/ui/use-toast';

const WebhooksSection = () => {
  const { webhookEvents, automations, eventTypes, loading, createWebhookEvent, toggleWebhookStatus, deleteWebhookEvent } = useWebhookEvents();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create New Webhook
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Automation *
                </label>
                <Select value={newWebhook.automation_id} onValueChange={(value) => 
                  setNewWebhook(prev => ({ ...prev, automation_id: value }))
                }>
                  <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Choose an automation" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-xl">
                    {automations.map(automation => (
                      <SelectItem key={automation.id} value={automation.id} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${automation.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          {automation.title}
                          <Badge variant={automation.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {automation.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Event Type *
                </label>
                <Select value={newWebhook.event_type} onValueChange={(value) => 
                  setNewWebhook(prev => ({ ...prev, event_type: value }))
                }>
                  <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-xl">
                    {eventTypes.map(eventType => (
                      <SelectItem key={eventType} value={eventType} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-blue-500" />
                          {eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Textarea
                  placeholder="Describe what this webhook is used for..."
                  value={newWebhook.event_description}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, event_description: e.target.value }))}
                  className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleCreateWebhook} 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Create Webhook
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading webhooks...</p>
        </div>
      ) : webhookEvents.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 rounded-2xl bg-gradient-to-br from-blue-50/50 to-purple-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4">
              <Webhook className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No webhooks created yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first webhook to start receiving external triggers for your automations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhookEvents.map((webhook) => (
            <Card key={webhook.id} className="rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                      <Webhook className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">{webhook.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {webhook.event_description || 'No description provided'}
                      </p>
                      {webhook.automation && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {webhook.automation.title}
                          </Badge>
                        </div>
                      )}
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
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl border border-gray-100">
                    <code className="text-sm font-mono text-gray-700 break-all flex-1 mr-2">
                      {webhook.webhook_url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyWebhookUrl(webhook.webhook_url)}
                      className="hover:bg-white rounded-lg flex-shrink-0"
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

      <Card className="border border-blue-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
              <ExternalLink className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Need help with webhooks?</h4>
              <p className="text-sm text-blue-700">
                Check our{' '}
                <a 
                  href="https://docs.yusrai.com/webhooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800 font-medium"
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
