
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, ChevronDown, ChevronUp } from 'lucide-react';

interface DynamicConditionNodeData {
  label: string;
  icon: string;
  condition?: any;
  explanation?: string;
  branches?: Array<{
    label: string;
    handle: string;
    color: string;
  }>;
}

interface DynamicConditionNodeProps {
  data: DynamicConditionNodeData;
  selected?: boolean;
}

const DynamicConditionNode: React.FC<DynamicConditionNodeProps> = ({ data, selected }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Dynamic branch colors
  const branchColors = [
    '#10b981', // emerald
    '#f59e0b', // amber  
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
  ];

  const branches = data.branches || [
    { label: 'True', handle: 'success', color: '#10b981' },
    { label: 'False', handle: 'error', color: '#ef4444' }
  ];

  const handleExpansion = () => {
    setExpanded(!expanded);
  };

  return (
    <div 
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer ${
        selected ? 'border-orange-300 shadow-orange-100 shadow-xl scale-105' : 'border-orange-200 hover:border-orange-300'
      } ${expanded ? 'min-w-[320px]' : 'min-w-[240px]'} max-w-[400px]`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(251, 146, 60, 0.15), 0 4px 16px rgba(251, 146, 60, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
      onClick={handleExpansion}
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
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-orange-800 leading-tight mb-1">
              {data.label}
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-orange-600" /> : <ChevronDown className="w-4 h-4 text-orange-600" />}
          </div>
          
          {expanded && data.condition?.expression && (
            <div className="text-xs text-orange-600 font-medium mb-2 p-2 bg-orange-100 rounded border border-orange-200">
              Expression: {data.condition.expression}
            </div>
          )}
          
          {expanded && data.explanation && (
            <div className="text-xs text-orange-700 leading-relaxed mb-2 p-2 bg-white rounded border border-orange-200">
              {data.explanation}
            </div>
          )}
          
          {expanded && (
            <div className="text-xs text-orange-600 font-medium">
              {branches.length} possible outcomes
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic output handles */}
      {branches.map((branch, index) => {
        const totalBranches = branches.length;
        const verticalSpacing = Math.max(60 / totalBranches, 15);
        const startY = totalBranches === 1 ? 50 : 20;
        const yPosition = startY + (index * verticalSpacing);
        
        return (
          <React.Fragment key={branch.handle}>
            <Handle
              type="source"
              position={Position.Right}
              id={branch.handle}
              className="w-3 h-3 !border-2 !rounded-full"
              style={{ 
                top: `${yPosition}%`,
                backgroundColor: branch.color,
                borderColor: branch.color
              }}
            />
            
            {/* Branch label */}
            <div 
              className="absolute text-xs font-medium px-2 py-1 rounded-full border shadow-sm bg-white"
              style={{ 
                right: '-8px',
                top: `calc(${yPosition}% - 12px)`,
                color: branch.color,
                borderColor: branch.color + '40',
                fontSize: '10px',
                minWidth: 'fit-content',
                whiteSpace: 'nowrap'
              }}
            >
              {branch.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default DynamicConditionNode;
