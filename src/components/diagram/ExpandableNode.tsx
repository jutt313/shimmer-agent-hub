
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronUp, Info, Settings, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExpandableNodeData {
  label: string;
  platform?: string;
  explanation?: string;
  stepType?: string;
  expandedData?: any;
  branchContext?: {
    type: string;
    label: string;
    position: number;
    total: number;
  };
  clickToExpand?: boolean;
}

interface ExpandableNodeProps {
  data: ExpandableNodeData;
  selected?: boolean;
}

const ExpandableNode: React.FC<ExpandableNodeProps> = ({ data, selected }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.clickToExpand) {
      setExpanded(!expanded);
    }
  };

  const getNodeColor = () => {
    if (data.branchContext) {
      return data.branchContext.type === 'csv' 
        ? 'from-green-50 to-emerald-50 border-green-200' 
        : 'from-blue-50 to-cyan-50 border-blue-200';
    }
    
    switch (data.stepType) {
      case 'condition': return 'from-orange-50 to-amber-50 border-orange-200';
      case 'ai_agent_call': return 'from-emerald-50 to-teal-50 border-emerald-200';
      case 'retry': return 'from-amber-50 to-yellow-50 border-amber-200';
      case 'notification': return 'from-purple-50 to-violet-50 border-purple-200';
      default: return 'from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (data.stepType) {
      case 'condition': return <Settings className="w-4 h-4" />;
      case 'ai_agent_call': return <Zap className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div 
      className={`relative shadow-lg rounded-xl border-2 transition-all duration-300 bg-gradient-to-br cursor-pointer ${getNodeColor()} ${
        selected ? 'shadow-xl scale-105' : 'hover:shadow-md'
      } ${expanded ? 'min-w-[320px]' : 'min-w-[240px]'} max-w-[400px]`}
      onClick={handleToggleExpanded}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-gray-300 !rounded-full"
      />
      
      {/* Branch Context Badge */}
      {data.branchContext && (
        <div className="absolute -top-2 -left-2">
          <Badge 
            variant="outline" 
            className={`text-xs font-medium ${
              data.branchContext.type === 'csv' 
                ? 'bg-green-100 text-green-700 border-green-300' 
                : 'bg-blue-100 text-blue-700 border-blue-300'
            }`}
          >
            {data.branchContext.type.toUpperCase()} {data.branchContext.position}/{data.branchContext.total}
          </Badge>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800 leading-tight mb-1">
                {data.label}
              </div>
              {data.platform && (
                <Badge variant="outline" className="text-xs mb-1">
                  {data.platform}
                </Badge>
              )}
              {!expanded && data.explanation && (
                <div className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {data.explanation}
                </div>
              )}
            </div>
          </div>
          
          {data.clickToExpand && (
            <div className="flex-shrink-0 ml-2">
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
          )}
        </div>
        
        {/* Expanded Content */}
        {expanded && data.expandedData && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="space-y-3">
              {data.expandedData.service && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Service</div>
                  <div className="text-xs text-gray-600">{data.expandedData.service}</div>
                </div>
              )}
              
              {data.expandedData.operation && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Operation</div>
                  <div className="text-xs text-gray-600">{data.expandedData.operation}</div>
                </div>
              )}
              
              {data.expandedData.branches && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Branches</div>
                  <div className="flex flex-wrap gap-1">
                    {data.expandedData.branches.map((branch: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {branch}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {data.expandedData.capabilities && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {data.expandedData.capabilities.map((cap: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {data.expandedData.maxAttempts && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Max Attempts</div>
                  <div className="text-xs text-gray-600">{data.expandedData.maxAttempts}</div>
                </div>
              )}
              
              {data.explanation && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Details</div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {data.explanation}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-white !border-2 !border-gray-300 !rounded-full"
      />
      
      {/* Conditional handles for branching nodes */}
      {data.stepType === 'condition' && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-3 h-3 !bg-green-400 !border-2 !border-green-500 !rounded-full"
            style={{ top: '35%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="w-3 h-3 !bg-blue-400 !border-2 !border-blue-500 !rounded-full"
            style={{ top: '65%' }}
          />
        </>
      )}
    </div>
  );
};

export default ExpandableNode;
