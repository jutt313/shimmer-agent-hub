
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FaClock } from 'react-icons/fa';

interface DelayNodeData {
  label: string;
  icon?: string;
  delay?: any;
}

interface DelayNodeProps {
  data: DelayNodeData;
  selected?: boolean;
}

const DelayNode: React.FC<DelayNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl text-white border-2 transition-all duration-200 min-w-[220px] max-w-[280px] ${
      selected ? 'border-gray-300 shadow-gray-200' : 'border-gray-200'
    }`}
    style={{
      background: 'linear-gradient(135deg, #6b7280, #4b5563)',
    }}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
      />
      
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <FaClock className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{data.label}</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
      />
    </div>
  );
};

export default DelayNode;
