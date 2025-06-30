
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Webhook, Plus } from 'lucide-react';
import { useAutomationWebhooks } from '@/hooks/useAutomationWebhooks';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import WebhookCreateModal from './WebhookCreateModal';
import WebhookCard from './WebhookCard';

interface WebhookManagementTabProps {
  automationId: string;
}

const WebhookManagementTab = ({ automationId }: WebhookManagementTabProps) => {
  const { webhooks, loading, toggleWebhookStatus, refetch } = useAutomationWebhooks(automationId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('automation_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      toast({
        title: "Webhook Deleted",
        description: "The webhook has been successfully deleted",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Loading webhooks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Webhook Management
          </h2>
          <p className="text-gray-600 mt-1">
            Create and manage external triggers for this automation
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {/* Empty State */}
      {webhooks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Webhook className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No webhooks configured
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Webhooks allow external systems to trigger this automation. Create your first webhook to get started with external integrations.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Webhook
          </Button>
        </div>
      ) : (
        /* Webhook List */
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              onToggleStatus={toggleWebhookStatus}
              onDelete={handleDeleteWebhook}
            />
          ))}
        </div>
      )}

      {/* Create Webhook Modal */}
      <WebhookCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        automationId={automationId}
        onWebhookCreated={refetch}
      />
    </div>
  );
};

export default WebhookManagementTab;
