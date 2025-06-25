
import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface ConditionNodeData {
  label: string;
  icon: string;
  condition?: any;
}

interface ConditionNodeProps {
  data: ConditionNodeData;
  selected?: boolean;
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white border-2 transition-all duration-200 min-w-[200px] ${selected ? 'border-orange-300' : 'border-orange-200'}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-orange-400"
      />
      
      <div className="flex items-center space-x-3">
        <span className="text-xl flex-shrink-0">{data.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{data.label}</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3 h-3 !bg-white !border-2 !border-green-400"
        style={{ top: '30%' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="w-3 h-3 !bg-white !border-2 !border-red-400"
        style={{ top: '70%' }}
      />
    </div>
  );
};

export default ConditionNode;
