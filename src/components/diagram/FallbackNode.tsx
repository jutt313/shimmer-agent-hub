
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Shield } from 'lucide-react';

interface FallbackNodeData {
  label: string;
  fallback?: any;
  explanation?: string;
}

interface FallbackNodeProps {
  data: FallbackNodeData;
  selected?: boolean;
}

const FallbackNode: React.FC<FallbackNodeProps> = ({ data, selected }) => {
  return (
    <div 
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 min-w-[240px] max-w-[300px] bg-gradient-to-br from-indigo-50 to-blue-50 ${
        selected ? 'border-indigo-300 shadow-indigo-100 shadow-xl scale-105' : 'border-indigo-200 hover:border-indigo-300'
      }`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(99, 102, 241, 0.15), 0 4px 16px rgba(99, 102, 241, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-indigo-100 !border-2 !border-indigo-300 !rounded-full"
      />
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shadow-sm border border-indigo-200">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-indigo-800 leading-tight mb-1">
            {data.label}
          </div>
          <div className="text-xs text-indigo-600 font-medium mb-1">
            Primary with backup
          </div>
          {data.explanation && (
            <div className="text-xs text-indigo-700 leading-relaxed">
              {data.explanation}
            </div>
          )}
        </div>
      </div>
      
      {/* Primary path handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="w-3 h-3 !bg-green-400 !border-2 !border-green-500 !rounded-full"
        style={{ top: '30%' }}
      />
      
      {/* Fallback path handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        className="w-3 h-3 !bg-orange-400 !border-2 !border-orange-500 !rounded-full"
        style={{ top: '70%' }}
      />
      
      {/* Path labels */}
      <div className="absolute -right-3 top-6 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
        Primary
      </div>
      <div className="absolute -right-3 bottom-6 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
        Backup
      </div>
    </div>
  );
};

export default FallbackNode;
