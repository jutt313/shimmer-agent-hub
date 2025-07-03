
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

interface DynamicConditionNodeData {
  label: string;
  icon: string;
  condition?: {
    expression: string;
    branches?: Array<{
      label: string;
      handle: string;
      color: string;
    }>;
    if_true?: any[];
    if_false?: any[];
  };
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
  
  // Get branches from data.branches or data.condition.branches, with fallback
  const branches = data.branches || data.condition?.branches || [
    { label: 'True', handle: 'true', color: '#10b981' },
    { label: 'False', handle: 'false', color: '#ef4444' }
  ];

  console.log('🔀 DynamicConditionNode rendering:', {
    hasBranches: branches.length,
    hasCondition: !!data.condition,
    branchCount: branches.length
  });

  const handleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div 
      onClick={handleExpansion}
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer hover:shadow-xl ${
        selected ? 'border-orange-300 shadow-orange-100 shadow-xl scale-105' : 'border-orange-200 hover:border-orange-300'
      } ${expanded ? 'min-w-[380px]' : 'min-w-[280px]'} max-w-[450px]`}
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
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-sm border border-orange-200">
          <GitBranch className="w-6 h-6 text-orange-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-orange-800 leading-tight">
              {data.label}
            </div>
            <div className="flex items-center space-x-1">
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-orange-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-orange-600" />
              )}
            </div>
          </div>
          
          {/* Condition Expression */}
          {data.condition?.expression && (
            <div className="text-xs text-orange-700 font-medium mb-2 p-2 bg-orange-100 rounded border border-orange-200">
              <span className="font-semibold">Condition:</span> {data.condition.expression}
            </div>
          )}
          
          {/* Branch Count */}
          <div className="text-xs text-orange-600 font-medium mb-2">
            {branches.length} possible outcomes
          </div>
          
          {/* Expanded Details */}
          {expanded && (
            <div className="space-y-3 mt-3">
              {/* Branch Details */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-orange-800">Branch Details:</div>
                {branches.map((branch, index) => (
                  <div 
                    key={branch.handle}
                    className="flex items-center space-x-2 text-xs p-2 bg-white rounded border border-orange-200"
                  >
                    <div 
                      className="w-3 h-3 rounded-full border-2"
                      style={{ 
                        backgroundColor: branch.color,
                        borderColor: branch.color
                      }}
                    />
                    <ArrowRight className="w-3 h-3 text-orange-600" />
                    <span className="font-medium" style={{ color: branch.color }}>
                      {branch.label}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Condition Logic */}
              {data.condition && (
                <div className="text-xs text-orange-700 bg-white px-3 py-2 rounded border border-orange-200">
                  <span className="font-medium text-orange-800">Logic:</span>
                  <div className="mt-1 space-y-1">
                    {data.condition.if_true && (
                      <div>• True path: {data.condition.if_true.length} steps</div>
                    )}
                    {data.condition.if_false && (
                      <div>• False path: {data.condition.if_false.length} steps</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Explanation */}
              {data.explanation && (
                <div className="text-xs text-orange-700 leading-relaxed p-3 bg-white rounded border border-orange-200">
                  <span className="font-medium text-orange-800">Description:</span>
                  <div className="mt-1">{data.explanation}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic output handles based on actual conditions */}
      {branches.map((branch, index) => {
        const totalBranches = branches.length;
        const spacing = Math.min(60 / totalBranches, 20);
        const startY = totalBranches === 1 ? 50 : 25;
        const yPosition = startY + (index * spacing);
        
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
              className="absolute text-xs font-medium px-2 py-1 rounded-full border shadow-sm bg-white pointer-events-none"
              style={{ 
                right: '-8px',
                top: `calc(${yPosition}% - 10px)`,
                color: branch.color,
                borderColor: branch.color + '40',
                fontSize: '10px',
                minWidth: 'fit-content',
                whiteSpace: 'nowrap',
                zIndex: 10,
                transform: 'translateX(100%)'
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
