
import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface AIAgentNodeData {
  label: string;
  icon: string;
  agent?: any;
}

interface AIAgentNodeProps {
  data: AIAgentNodeData;
  selected?: boolean;
}

const AIAgentNode: React.FC<AIAgentNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 transition-all duration-200 min-w-[200px] ${selected ? 'border-green-300' : 'border-green-200'}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-green-400"
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
        className="w-3 h-3 !bg-white !border-2 !border-green-400"
      />
    </div>
  );
};

export default AIAgentNode;
