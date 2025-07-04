
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Webhook } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { globalWebhookManager } from '@/utils/webhookService';

interface WebhookCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  automationId: string;
  onWebhookCreated: () => void;
}

const commonEvents = [
  'order.created',
  'order.updated',
  'order.paid',
  'order.cancelled',
  'customer.created',
  'customer.updated',
  'user.signup',
  'user.login',
  'payment.succeeded',
  'payment.failed',
  'subscription.created',
  'subscription.cancelled',
  'product.created',
  'product.updated',
  'invoice.created',
  'invoice.paid',
  'data.updated',
  'form.submitted'
];

const WebhookCreateModal = ({ isOpen, onClose, automationId, onWebhookCreated }: WebhookCreateModalProps) => {
  const [webhookName, setWebhookName] = useState('');
  const [webhookDescription, setWebhookDescription] = useState('');
  const [expectedEvents, setExpectedEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [customEvent, setCustomEvent] = useState('');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const handleAddEvent = (event: string) => {
    if (event && !expectedEvents.includes(event)) {
      setExpectedEvents([...expectedEvents, event]);
      setSelectedEvent('');
      setCustomEvent('');
    }
  };

  const handleRemoveEvent = (eventToRemove: string) => {
    setExpectedEvents(expectedEvents.filter(event => event !== eventToRemove));
  };

  const handleCreateWebhook = async () => {
    if (!webhookName.trim()) {
      toast({
        title: "Validation Error",
        description: "Webhook name is required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Generate webhook URL and secret
      const webhookUrl = globalWebhookManager.generateWebhookUrl(automationId);
      const webhookSecret = crypto.randomUUID();

      // Save to database
      const { data, error } = await supabase
        .from('automation_webhooks')
        .insert({
          automation_id: automationId,
          webhook_name: webhookName.trim(),
          webhook_description: webhookDescription.trim() || null,
          webhook_url: webhookUrl,
          webhook_secret: webhookSecret,
          expected_events: expectedEvents,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Webhook Created",
        description: `"${webhookName}" has been created successfully`,
      });

      // Reset form
      setWebhookName('');
      setWebhookDescription('');
      setExpectedEvents([]);
      setSelectedEvent('');
      setCustomEvent('');
      
      onWebhookCreated();
      onClose();

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Webhook className="w-4 h-4 text-white" />
            </div>
            Create New Webhook
          </DialogTitle>
          <DialogDescription>
            Create a new webhook endpoint to trigger this automation from external systems.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="webhook-name">Webhook Name *</Label>
            <Input
              id="webhook-name"
              placeholder="e.g., Shopify Order Created"
              value={webhookName}
              onChange={(e) => setWebhookName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="webhook-description">Description</Label>
            <Textarea
              id="webhook-description"
              placeholder="Optional description of what this webhook does..."
              value={webhookDescription}
              onChange={(e) => setWebhookDescription(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label>Expected Events</Label>
            <div className="mt-1 space-y-2">
              <div className="flex gap-2">
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select an event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonEvents.map((event) => (
                      <SelectItem key={event} value={event}>
                        {event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  onClick={() => handleAddEvent(selectedEvent)}
                  variant="outline"
                  size="sm"
                  className="px-3"
                  disabled={!selectedEvent}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Or enter custom event..."
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={() => handleAddEvent(customEvent)}
                  variant="outline"
                  size="sm"
                  className="px-3"
                  disabled={!customEvent.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {expectedEvents.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {expectedEvents.map((event) => (
                    <Badge key={event} variant="secondary" className="text-xs">
                      {event}
                      <button
                        onClick={() => handleRemoveEvent(event)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Optional: Specify event types you plan to send to this webhook for documentation purposes.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateWebhook} 
            disabled={creating || !webhookName.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            {creating ? 'Creating...' : 'Create Webhook'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookCreateModal;
