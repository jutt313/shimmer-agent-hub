
import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface ActionNodeData {
  label: string;
  icon: string;
  platform?: string;
  action?: any;
}

interface ActionNodeProps {
  data: ActionNodeData;
  selected?: boolean;
}

const ActionNode: React.FC<ActionNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white border-2 transition-all duration-200 min-w-[200px] ${selected ? 'border-purple-300' : 'border-purple-200'}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-purple-400"
      />
      
      <div className="flex items-center space-x-3">
        <span className="text-xl flex-shrink-0">{data.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{data.label}</div>
          {data.platform && (
            <div className="text-xs opacity-90 truncate">{data.platform}</div>
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
