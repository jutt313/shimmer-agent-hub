
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface ConditionNodeData {
  label: string;
  icon: string;
  condition?: any;
  explanation?: string;
}

interface ConditionNodeProps {
  data: ConditionNodeData;
  selected?: boolean;
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ data, selected }) => {
  return (
    <div 
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 min-w-[240px] max-w-[300px] bg-gradient-to-br from-orange-50 to-amber-50 ${
        selected ? 'border-orange-300 shadow-orange-100 shadow-xl scale-105' : 'border-orange-200 hover:border-orange-300'
      }`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(251, 146, 60, 0.15), 0 4px 16px rgba(251, 146, 60, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-orange-100 !border-2 !border-orange-300 !rounded-full"
      />
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-sm border border-orange-200">
          <GitBranch className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-orange-800 leading-tight mb-1">
            {data.label}
          </div>
          {data.condition?.expression && (
            <div className="text-xs text-orange-600 font-medium mb-1">
              {data.condition.expression}
            </div>
          )}
          {data.explanation && (
            <div className="text-xs text-orange-700 leading-relaxed">
              {data.explanation}
            </div>
          )}
        </div>
      </div>
      
      {/* Success branch handle - positioned higher */}
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="w-3 h-3 !bg-green-400 !border-2 !border-green-500 !rounded-full"
        style={{ top: '30%' }}
      />
      
      {/* Error branch handle - positioned lower */}
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        className="w-3 h-3 !bg-red-400 !border-2 !border-red-500 !rounded-full"
        style={{ top: '70%' }}
      />
      
      {/* Branch labels */}
      <div className="absolute -right-2 top-6 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
        Yes
      </div>
      <div className="absolute -right-2 bottom-6 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
        No
      </div>
    </div>
  );
};

export default ConditionNode;
