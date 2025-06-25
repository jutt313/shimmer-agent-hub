
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FaRobot } from 'react-icons/fa';

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
    <div className={`px-4 py-3 shadow-lg rounded-xl text-white border-2 transition-all duration-200 min-w-[220px] max-w-[280px] ${
      selected ? 'border-green-300 shadow-green-200' : 'border-green-200'
    }`}
    style={{
      background: 'linear-gradient(135deg, #10b981, #059669)',
    }}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-green-400"
      />
      
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <FaRobot className="w-5 h-5 text-green-600" />
        </div>
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
