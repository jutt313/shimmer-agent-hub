
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

interface DelayNodeData {
  label: string;
  icon?: string;
  delay?: any;
  explanation?: string;
}

interface DelayNodeProps {
  data: DelayNodeData;
  selected?: boolean;
}

const DelayNode: React.FC<DelayNodeProps> = ({ data, selected }) => {
  return (
    <div 
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 min-w-[240px] max-w-[300px] bg-gradient-to-br from-slate-50 to-gray-50 ${
        selected ? 'border-slate-300 shadow-slate-100 shadow-xl scale-105' : 'border-slate-200 hover:border-slate-300'
      }`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(100, 116, 139, 0.15), 0 4px 16px rgba(100, 116, 139, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-slate-100 !border-2 !border-slate-300 !rounded-full"
      />
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center shadow-sm border border-slate-200">
          <Clock className="w-5 h-5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 leading-tight mb-1">
            {data.label}
          </div>
          {data.delay?.duration_seconds && (
            <div className="text-xs text-slate-600 font-medium mb-1">
              Duration: {data.delay.duration_seconds}s
            </div>
          )}
          {data.explanation && (
            <div className="text-xs text-slate-700 leading-relaxed">
              {data.explanation}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-slate-100 !border-2 !border-slate-300 !rounded-full"
      />
    </div>
  );
};

export default DelayNode;
