
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIAgentNodeData {
  label: string;
  icon: string;
  agent?: any;
  explanation?: string;
  isRecommended?: boolean;
  onAdd?: () => void;
  onDismiss?: () => void;
}

interface AIAgentNodeProps {
  data: AIAgentNodeData;
  selected?: boolean;
}

const AIAgentNode: React.FC<AIAgentNodeProps> = ({ data, selected }) => {
  const isRecommended = data.isRecommended;
  
  return (
    <div 
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 min-w-[240px] max-w-[300px] ${
        isRecommended 
          ? 'bg-gradient-to-br from-emerald-50/60 to-teal-50/60 border-emerald-200/60' 
          : 'bg-gradient-to-br from-emerald-50 to-teal-50'
      } ${
        selected ? 'border-emerald-300 shadow-emerald-100 shadow-xl scale-105' : 
        isRecommended ? 'border-emerald-200/60 hover:border-emerald-300/60' : 'border-emerald-200 hover:border-emerald-300'
      }`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(16, 185, 129, 0.15), 0 4px 16px rgba(16, 185, 129, 0.1)' 
          : isRecommended
            ? '0 4px 16px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)'
            : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        opacity: isRecommended ? 0.85 : 1
      }}
    >
      {/* Recommended agent overlay buttons */}
      {isRecommended && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          <Button
            size="sm"
            onClick={data.onAdd}
            className="h-6 w-6 p-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-md"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={data.onDismiss}
            className="h-6 w-6 p-0 bg-white hover:bg-gray-50 text-gray-500 border-gray-300 rounded-full shadow-md"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-emerald-100 !border-2 !border-emerald-300 !rounded-full"
      />
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-sm border border-emerald-200">
          <Bot className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-emerald-800 leading-tight mb-1">
            {data.label}
          </div>
          {isRecommended && (
            <div className="text-xs text-emerald-600 font-medium mb-1">
              Recommended Agent
            </div>
          )}
          {data.agent?.agent_id && (
            <div className="text-xs text-emerald-600 font-medium mb-1">
              ID: {data.agent.agent_id}
            </div>
          )}
          {data.explanation && (
            <div className="text-xs text-emerald-700 leading-relaxed">
              {data.explanation}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-emerald-100 !border-2 !border-emerald-300 !rounded-full"
      />
    </div>
  );
};

export default AIAgentNode;
