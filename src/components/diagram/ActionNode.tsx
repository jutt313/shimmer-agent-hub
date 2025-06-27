
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getPlatformIconConfig } from '@/utils/platformIcons';

interface ActionNodeData {
  label: string;
  icon?: string;
  platform?: string;
  action?: any;
  stepType?: string;
  explanation?: string;
}

interface ActionNodeProps {
  data: ActionNodeData;
  selected?: boolean;
}

const ActionNode: React.FC<ActionNodeProps> = ({ data, selected }) => {
  const iconConfig = getPlatformIconConfig(data.platform || '', data.action?.method);
  const IconComponent = iconConfig.icon;

  return (
    <div 
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 min-w-[240px] max-w-[300px] bg-white/95 backdrop-blur-sm ${
        selected ? 'border-blue-300 shadow-blue-100 shadow-xl scale-105' : 'border-slate-200 hover:border-slate-300'
      }`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(59, 130, 246, 0.15), 0 4px 16px rgba(59, 130, 246, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-slate-100 !border-2 !border-slate-300 !rounded-full"
      />
      
      <div className="flex items-start space-x-3">
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ 
            backgroundColor: `${iconConfig.color}15`,
            border: `1px solid ${iconConfig.color}30`
          }}
        >
          {IconComponent && (
            <IconComponent 
              className="w-5 h-5" 
              style={{ color: iconConfig.color }} 
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 leading-tight mb-1">
            {data.label}
          </div>
          {data.platform && (
            <div className="text-xs text-slate-500 font-medium mb-1">
              {data.platform}
            </div>
          )}
          {data.explanation && (
            <div className="text-xs text-slate-600 leading-relaxed">
              {data.explanation}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-slate-100 !border-2 !border-slate-300 !rounded-full"
      />
    </div>
  );
};

export default ActionNode;
