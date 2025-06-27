
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { RotateCcw } from 'lucide-react';

interface LoopNodeData {
  label: string;
  icon?: string;
  loop?: any;
  explanation?: string;
}

interface LoopNodeProps {
  data: LoopNodeData;
  selected?: boolean;
}

const LoopNode: React.FC<LoopNodeProps> = ({ data, selected }) => {
  return (
    <div 
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 min-w-[240px] max-w-[300px] bg-gradient-to-br from-purple-50 to-violet-50 ${
        selected ? 'border-purple-300 shadow-purple-100 shadow-xl scale-105' : 'border-purple-200 hover:border-purple-300'
      }`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(147, 51, 234, 0.15), 0 4px 16px rgba(147, 51, 234, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-100 !border-2 !border-purple-300 !rounded-full"
      />
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center shadow-sm border border-purple-200">
          <RotateCcw className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-purple-800 leading-tight mb-1">
            {data.label}
          </div>
          {data.loop?.array_source && (
            <div className="text-xs text-purple-600 font-medium mb-1">
              Iterate: {data.loop.array_source}
            </div>
          )}
          {data.explanation && (
            <div className="text-xs text-purple-700 leading-relaxed">
              {data.explanation}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-purple-100 !border-2 !border-purple-300 !rounded-full"
      />
    </div>
  );
};

export default LoopNode;
