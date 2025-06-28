
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Webhook, Calendar } from 'lucide-react';

interface TriggerNodeProps {
  data: {
    label?: string;
    trigger?: {
      type?: string;
      platform?: string;
      event?: string;
      webhook_url?: string;
      schedule?: string;
    };
    description?: string;
  };
  selected?: boolean;
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ data, selected }) => {
  const { label, trigger, description } = data;
  
  const getTriggerIcon = () => {
    switch (trigger?.type?.toLowerCase()) {
      case 'webhook':
        return <Webhook className="w-4 h-4 text-white" />;
      case 'schedule':
      case 'cron':
        return <Clock className="w-4 h-4 text-white" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-white" />;
      default:
        return <Zap className="w-4 h-4 text-white" />;
    }
  };

  const getTriggerColor = () => {
    switch (trigger?.type?.toLowerCase()) {
      case 'webhook':
        return 'from-orange-500 to-red-500';
      case 'schedule':
      case 'cron':
        return 'from-blue-500 to-purple-500';
      case 'event':
        return 'from-green-500 to-blue-500';
      default:
        return 'from-red-500 to-pink-500';
    }
  };
  
  return (
    <div className={`
      bg-gradient-to-br from-red-50 to-orange-50 
      border-2 ${selected ? 'border-red-400 shadow-lg' : 'border-red-200'} 
      rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 
      min-w-[220px] max-w-[280px] cursor-grab active:cursor-grabbing
      ${selected ? 'ring-2 ring-red-300 ring-opacity-50' : ''}
    `}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${getTriggerColor()} rounded-lg flex items-center justify-center shadow-md`}>
          {getTriggerIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-red-800 text-sm truncate">
            {label || 'Trigger'}
          </h3>
          <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300 mt-1">
            ⚡ Start Point
          </Badge>
        </div>
      </div>

      {/* Trigger Details */}
      {trigger && (
        <div className="space-y-2 mb-3">
          {trigger.type && (
            <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
              <span className="font-medium">Type:</span> <span className="capitalize">{trigger.type}</span>
            </div>
          )}
          {trigger.platform && (
            <div className="text-xs text-red-700">
              <span className="font-medium">Platform:</span> {trigger.platform}
            </div>
          )}
          {trigger.event && (
            <div className="text-xs text-red-700">
              <span className="font-medium">Event:</span> {trigger.event}
            </div>
          )}
          {trigger.schedule && (
            <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
              <span className="font-medium">Schedule:</span> {trigger.schedule}
            </div>
          )}
          {trigger.webhook_url && (
            <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200 truncate">
              <span className="font-medium">Webhook:</span> {trigger.webhook_url.substring(0, 30)}...
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 line-clamp-2">
          {description}
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 bg-red-500 border-2 border-white shadow-sm hover:bg-red-600 transition-colors"
        style={{ right: -6 }}
      />
    </div>
  );
};

export default memo(TriggerNode);
