
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FaQuestionCircle } from 'react-icons/fa';

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
    <div className={`px-4 py-3 shadow-lg rounded-xl text-white border-2 transition-all duration-200 min-w-[220px] max-w-[280px] ${
      selected ? 'border-orange-300 shadow-orange-200' : 'border-orange-200'
    }`}
    style={{
      background: 'linear-gradient(135deg, #f97316, #ea580c)',
    }}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-orange-400"
      />
      
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <FaQuestionCircle className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{data.label}</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3 h-3 !bg-green-400 !border-2 !border-green-600"
        style={{ top: '30%' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="w-3 h-3 !bg-red-400 !border-2 !border-red-600"
        style={{ top: '70%' }}
      />
    </div>
  );
};

export default ConditionNode;
