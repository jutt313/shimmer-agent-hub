
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getPlatformIconConfig } from '@/utils/platformIcons';

interface ActionNodeData {
  label: string;
  icon: string;
  platform?: string;
  action?: any;
  stepType?: string;
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
      className={`px-4 py-3 shadow-lg rounded-xl text-white border-2 transition-all duration-200 min-w-[220px] max-w-[280px] ${
        selected ? 'border-purple-300 shadow-purple-200' : 'border-purple-200'
      }`}
      style={{
        background: `linear-gradient(135deg, ${iconConfig.color}15, ${iconConfig.color}25)`,
        borderColor: selected ? iconConfig.color : `${iconConfig.color}50`
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-purple-400"
      />
      
      <div className="flex items-center space-x-3">
        <div 
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: iconConfig.bgColor }}
        >
          <IconComponent 
            className="w-5 h-5" 
            style={{ color: iconConfig.color }} 
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate text-gray-800">
            {data.label}
          </div>
          {data.platform && (
            <div className="text-xs opacity-70 truncate text-gray-600">
              {data.platform}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-white !border-2 !border-purple-400"
      />
    </div>
  );
};

export default ActionNode;
