
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Webhook, 
  Copy, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AutomationWebhook } from '@/hooks/useAutomationWebhooks';

interface WebhookCardProps {
  webhook: AutomationWebhook;
  onToggleStatus: (webhookId: string, currentStatus: boolean) => void;
  onDelete: (webhookId: string) => void;
}

const WebhookCard = ({ webhook, onToggleStatus, onDelete }: WebhookCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const formatLastTriggered = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString() + ' at ' + new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDeliveryStatusColor = (successRate: number) => {
    if (successRate >= 95) return 'text-green-600';
    if (successRate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm rounded-xl">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="hover:bg-blue-50/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Webhook className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{webhook.webhook_name || 'Untitled Webhook'}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(webhook.is_active)}`}>
                      {webhook.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {webhook.trigger_count} triggers
                    </span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhook.is_active}
                  onCheckedChange={() => onToggleStatus(webhook.id, webhook.is_active)}
                  onClick={(e) => e.stopPropagation()}
                />
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="border-t border-blue-100 bg-blue-50/30 pt-6">
            <div className="space-y-6">
              {/* Webhook URL */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  Webhook URL
                </h4>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
                  <code className="flex-1 text-sm text-gray-700 font-mono break-all">
                    {webhook.webhook_url}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhook.webhook_url, 'Webhook URL')}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Webhook Secret */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  Webhook Secret
                </h4>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-purple-200">
                  <code className="flex-1 text-sm text-gray-700 font-mono">
                    {showSecret ? webhook.webhook_secret : '••••••••••••••••••••••••••••••••'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecret(!showSecret)}
                    className="flex-shrink-0"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhook.webhook_secret, 'Webhook Secret')}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use this secret to validate webhook signatures for security
                </p>
              </div>

              {/* Expected Events */}
              {webhook.expected_events && webhook.expected_events.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Expected Events</h4>
                  <div className="flex gap-2 flex-wrap">
                    {webhook.expected_events.map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Statistics */}
              {webhook.delivery_stats && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    Delivery Statistics (Last 30 days)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {webhook.delivery_stats.total_deliveries}
                      </div>
                      <div className="text-xs text-gray-600">Total Deliveries</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-blue-200">
                      <div className={`text-2xl font-bold ${getDeliveryStatusColor(webhook.delivery_stats.success_rate)}`}>
                        {webhook.delivery_stats.success_rate}%
                      </div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {webhook.delivery_stats.successful_deliveries}
                      </div>
                      <div className="text-xs text-gray-600">Successful</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">
                        {webhook.delivery_stats.failed_deliveries}
                      </div>
                      <div className="text-xs text-gray-600">Failed</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Deliveries */}
              {webhook.recent_deliveries && webhook.recent_deliveries.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Recent Deliveries
                  </h4>
                  <div className="space-y-2">
                    {webhook.recent_deliveries.slice(0, 5).map((delivery, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          {delivery.delivered_at ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <div>
                            <div className="text-sm font-medium">
                              {delivery.delivered_at ? 'Delivered' : 'Failed'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(delivery.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Status: {delivery.status_code || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Attempt #{delivery.delivery_attempts}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Webhook Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Last Triggered</h4>
                <p className="text-sm text-blue-700">
                  {formatLastTriggered(webhook.last_triggered_at)}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Created: {new Date(webhook.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-blue-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* TODO: Implement edit functionality */}}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(webhook.id)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default WebhookCard;
