
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Webhook, Plus, Copy, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const WebhooksSection = () => {
  const [webhooks] = useState([]);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Webhooks
          </h3>
          <p className="text-gray-600 mt-2">
            Configure webhooks to receive real-time notifications from YusrAI
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Webhooks</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first webhook to receive real-time notifications
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Webhook cards would go here */}
        </div>
      )}

      <Card className="border border-purple-200 bg-purple-50/30 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-purple-600" />
            <div>
              <h4 className="font-medium text-purple-900">Webhook Documentation</h4>
              <p className="text-sm text-purple-700">
                Learn how to configure webhooks in our{' '}
                <a 
                  href="https://docs.yusrai.com/webhooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-purple-800"
                >
                  webhook documentation
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhooksSection;
