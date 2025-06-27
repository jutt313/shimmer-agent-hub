
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { RotateCw } from 'lucide-react';

interface RetryNodeData {
  label: string;
  retry?: any;
  explanation?: string;
}

interface RetryNodeProps {
  data: RetryNodeData;
  selected?: boolean;
}

const RetryNode: React.FC<RetryNodeProps> = ({ data, selected }) => {
  return (
    <div 
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 min-w-[240px] max-w-[300px] bg-gradient-to-br from-amber-50 to-yellow-50 ${
        selected ? 'border-amber-300 shadow-amber-100 shadow-xl scale-105' : 'border-amber-200 hover:border-amber-300'
      }`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(245, 158, 11, 0.15), 0 4px 16px rgba(245, 158, 11, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-amber-100 !border-2 !border-amber-300 !rounded-full"
      />
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center shadow-sm border border-amber-200">
          <RotateCw className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-amber-800 leading-tight mb-1">
            {data.label}
          </div>
          {data.retry?.max_attempts && (
            <div className="text-xs text-amber-600 font-medium mb-1">
              Max attempts: {data.retry.max_attempts}
            </div>
          )}
          {data.explanation && (
            <div className="text-xs text-amber-700 leading-relaxed">
              {data.explanation}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-amber-100 !border-2 !border-amber-300 !rounded-full"
      />
    </div>
  );
};

export default RetryNode;
