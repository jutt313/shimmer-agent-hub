
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AutomationWebhook } from '@/hooks/useAutomationWebhooks';
import { Copy, Eye, EyeOff, Activity, AlertCircle, Clock, CheckCircle, Trash2, HelpCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WebhookCardProps {
  webhook: AutomationWebhook;
  onToggleStatus: (webhookId: string, currentStatus: boolean) => void;
  onDelete: (webhookId: string) => void;
}

const WebhookCard = ({ webhook, onToggleStatus, onDelete }: WebhookCardProps) => {
  const [showSecret, setShowSecret] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getDeliveryStatusIcon = (stats: any) => {
    if (!stats || stats.total_deliveries === 0) {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
    
    if (stats.success_rate >= 95) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (stats.success_rate >= 80) {
      return <Activity className="w-4 h-4 text-yellow-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
              {getDeliveryStatusIcon(webhook.delivery_stats)}
              {webhook.webhook_name}
            </CardTitle>
            {webhook.webhook_description && (
              <p className="text-sm text-gray-600 mt-1">{webhook.webhook_description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(webhook.is_active)}>
              {webhook.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Webhook URL - FIXED with copy button */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Webhook URL
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 ml-1 text-gray-400 inline cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>This is your unique webhook endpoint URL. Copy this URL and use it in your external service to trigger this automation. The URL is already configured to point to https://yusrai.com domain.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm font-mono break-all border">
              {webhook.webhook_url}
            </code>
            <Button
              onClick={() => copyToClipboard(webhook.webhook_url, 'Webhook URL')}
              size="sm"
              variant="outline"
              className="rounded-lg flex-shrink-0"
              title="Copy webhook URL"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Webhook Secret - FIXED with explanation */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
            Webhook Secret
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p><strong>CRITICAL FOR SECURITY:</strong> This secret is used to generate HMAC signatures for webhook payloads. Include this in your webhook requests as 'X-Webhook-Signature' header to verify authenticity. Without proper signatures, webhooks will be rejected for security.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm font-mono border">
              {showSecret ? webhook.webhook_secret : '•'.repeat(40)}
            </code>
            <Button
              onClick={() => setShowSecret(!showSecret)}
              size="sm"
              variant="outline"
              className="rounded-lg flex-shrink-0"
              title={showSecret ? "Hide secret" : "Show secret"}
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => copyToClipboard(webhook.webhook_secret, 'Webhook Secret')}
              size="sm"
              variant="outline"
              className="rounded-lg flex-shrink-0"
              title="Copy webhook secret"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ⚠️ Keep this secret secure. Use it to sign your webhook payloads for verification.
          </p>
        </div>

        {/* Statistics */}
        {webhook.delivery_stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-blue-600">
                {webhook.delivery_stats.total_deliveries}
              </div>
              <div className="text-xs text-gray-600">Total Calls</div>
            </div>
            <div className="bg-green-50 p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-green-600">
                {webhook.delivery_stats.success_rate}%
              </div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-purple-600">
                {webhook.delivery_stats.avg_response_time}ms
              </div>
              <div className="text-xs text-gray-600">Avg Response</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl text-center">
              <div className="text-lg font-bold text-orange-600">
                {webhook.trigger_count}
              </div>
              <div className="text-xs text-gray-600">Total Triggers</div>
            </div>
          </div>
        )}

        {/* Expected Events */}
        {webhook.expected_events && webhook.expected_events.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Expected Events</label>
            <div className="flex flex-wrap gap-2">
              {webhook.expected_events.map((event, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {event}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Last Triggered */}
        {webhook.last_triggered_at && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Last triggered:</span> {new Date(webhook.last_triggered_at).toLocaleString()}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <Button
            onClick={() => onToggleStatus(webhook.id, webhook.is_active)}
            size="sm"
            variant={webhook.is_active ? "outline" : "default"}
            className={webhook.is_active 
              ? "border-orange-300 text-orange-600 hover:bg-orange-50" 
              : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
            }
          >
            {webhook.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          
          <Button
            onClick={() => onDelete(webhook.id)}
            size="sm"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookCard;
