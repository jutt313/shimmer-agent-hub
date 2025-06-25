
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FaRedoAlt } from 'react-icons/fa';

interface LoopNodeData {
  label: string;
  icon?: string;
  loop?: any;
}

interface LoopNodeProps {
  data: LoopNodeData;
  selected?: boolean;
}

const LoopNode: React.FC<LoopNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl text-white border-2 transition-all duration-200 min-w-[220px] max-w-[280px] ${
      selected ? 'border-purple-300 shadow-purple-200' : 'border-purple-200'
    }`}
    style={{
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    }}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-purple-400"
      />
      
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <FaRedoAlt className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{data.label}</div>
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

export default LoopNode;
