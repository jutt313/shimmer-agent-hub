
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getPlatformIconConfig } from '@/utils/platformIcons';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface PlatformTriggerNodeData {
  label: string;
  platform?: string;
  trigger?: {
    type?: string;
    event?: string;
    schedule?: string;
    webhook_url?: string;
  };
  explanation?: string;
  icon?: string;
}

interface PlatformTriggerNodeProps {
  data: PlatformTriggerNodeData;
  selected?: boolean;
}

const PlatformTriggerNode: React.FC<PlatformTriggerNodeProps> = ({ data, selected }) => {
  const [expanded, setExpanded] = useState(false);
  
  const iconConfig = getPlatformIconConfig(data.platform || '', '');
  const IconComponent = iconConfig.icon || Zap;

  const handleExpansion = () => {
    setExpanded(!expanded);
  };

  return (
    <div 
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 cursor-pointer ${
        selected ? 'border-blue-300 shadow-blue-100 shadow-xl scale-105' : 'border-blue-200 hover:border-blue-300'
      } ${expanded ? 'min-w-[320px]' : 'min-w-[240px]'} max-w-[400px]`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(59, 130, 246, 0.15), 0 4px 16px rgba(59, 130, 246, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
      onClick={handleExpansion}
    >
      <div className="flex items-start space-x-3">
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border"
          style={{ 
            backgroundColor: `${iconConfig.color}20`,
            borderColor: `${iconConfig.color}40`
          }}
        >
          <IconComponent 
            className="w-5 h-5" 
            style={{ color: iconConfig.color }} 
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-blue-800 leading-tight mb-1">
              {data.label}
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
          </div>
          
          <div className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200 inline-block mb-2">
            ⚡ Automation Trigger
          </div>
          
          {expanded && data.trigger && (
            <div className="space-y-2 mb-2">
              {data.trigger.type && (
                <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  <span className="font-medium">Type:</span> {data.trigger.type}
                </div>
              )}
              {data.trigger.event && (
                <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  <span className="font-medium">Event:</span> {data.trigger.event}
                </div>
              )}
              {data.trigger.schedule && (
                <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  <span className="font-medium">Schedule:</span> {data.trigger.schedule}
                </div>
              )}
            </div>
          )}
          
          {expanded && data.explanation && (
            <div className="text-xs text-blue-700 leading-relaxed p-2 bg-white rounded border border-blue-200">
              {data.explanation}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-100 !border-2 !border-blue-300 !rounded-full"
      />
    </div>
  );
};

export default PlatformTriggerNode;
