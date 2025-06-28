
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from "@/components/ui/badge";
import { Zap } from 'lucide-react';

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
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ data }) => {
  const { label, trigger, description } = data;
  
  return (
    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 shadow-lg min-w-[200px] max-w-[250px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 text-sm">
            {label || 'Trigger'}
          </h3>
          <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
            Start
          </Badge>
        </div>
      </div>

      {/* Trigger Details */}
      {trigger && (
        <div className="space-y-2 mb-3">
          {trigger.type && (
            <div className="text-xs text-red-700">
              <span className="font-medium">Type:</span> {trigger.type}
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
            <div className="text-xs text-red-700">
              <span className="font-medium">Schedule:</span> {trigger.schedule}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {description}
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-red-500 border-2 border-white shadow-sm"
      />
    </div>
  );
};

export default memo(TriggerNode);
