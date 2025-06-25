
import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface LoopNodeData {
  label: string;
  icon: string;
  loop?: any;
}

interface LoopNodeProps {
  data: LoopNodeData;
  selected?: boolean;
}

const LoopNode: React.FC<LoopNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-2 transition-all duration-200 min-w-[200px] ${selected ? 'border-indigo-300' : 'border-indigo-200'}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-indigo-400"
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
        className="w-3 h-3 !bg-white !border-2 !border-indigo-400"
      />
    </div>
  );
};

export default LoopNode;
