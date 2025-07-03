
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getPlatformIconConfig } from '@/utils/platformIcons';
import { ChevronDown, ChevronUp, Settings, Zap, ExternalLink } from 'lucide-react';

interface ActionNodeData {
  label: string;
  icon?: string;
  platform?: string;
  action?: any;
  stepType?: string;
  explanation?: string;
  stepDetails?: {
    integration?: string;
    method?: string;
    endpoint?: string;
    parameters?: any;
  };
}

interface ActionNodeProps {
  data: ActionNodeData;
  selected?: boolean;
}

const ActionNode: React.FC<ActionNodeProps> = ({ data, selected }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Get platform info from action or stepDetails
  const platform = data.platform || data.action?.integration || data.stepDetails?.integration || '';
  const method = data.action?.method || data.stepDetails?.method || '';
  
  console.log('🎯 ActionNode rendering:', {
    platform,
    method,
    hasAction: !!data.action,
    hasStepDetails: !!data.stepDetails
  });
  
  const iconConfig = getPlatformIconConfig(platform, method);
  const IconComponent = iconConfig.icon || (data.stepType === 'ai_agent_call' ? Zap : Settings);

  const handleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const getPlatformDisplayName = (platform: string) => {
    if (!platform) return '';
    
    // Clean up platform names for display
    const cleanPlatform = platform.toLowerCase().replace(/[_-]/g, ' ');
    return cleanPlatform.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getMethodDisplayName = (method: string) => {
    if (!method) return '';
    
    // Clean up method names for display
    const cleanMethod = method.toLowerCase().replace(/[_-]/g, ' ');
    return cleanMethod.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div 
      onClick={handleExpansion}
      className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 bg-white/95 backdrop-blur-sm cursor-pointer hover:shadow-xl ${
        selected ? 'border-blue-300 shadow-blue-100 shadow-xl scale-105' : 'border-slate-200 hover:border-slate-300'
      } ${expanded ? 'min-w-[380px]' : 'min-w-[280px]'} max-w-[450px]`}
      style={{
        boxShadow: selected 
          ? '0 8px 32px rgba(59, 130, 246, 0.15), 0 4px 16px rgba(59, 130, 246, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-slate-100 !border-2 !border-slate-300 !rounded-full"
      />
      
      <div className="flex items-start space-x-3">
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border"
          style={{ 
            backgroundColor: `${iconConfig.color}15`,
            borderColor: `${iconConfig.color}30`
          }}
        >
          <IconComponent 
            className="w-6 h-6" 
            style={{ color: iconConfig.color }} 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {data.label}
            </div>
            <div className="flex items-center space-x-1">
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              )}
            </div>
          </div>
          
          {/* Platform Badge */}
          {platform && (
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="text-xs font-medium px-3 py-1 rounded-full border inline-flex items-center space-x-1"
                style={{ 
                  backgroundColor: `${iconConfig.color}10`,
                  borderColor: `${iconConfig.color}30`,
                  color: iconConfig.color
                }}
              >
                <span>{getPlatformDisplayName(platform)}</span>
                {expanded && <ExternalLink className="w-3 h-3" />}
              </div>
            </div>
          )}
          
          {/* Method Badge */}
          {method && (
            <div className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block mb-2">
              <span className="font-medium">Action:</span> {getMethodDisplayName(method)}
            </div>
          )}
          
          {/* Expanded Details */}
          {expanded && (
            <div className="space-y-3 mt-3">
              {/* Endpoint Information */}
              {(data.action?.endpoint || data.stepDetails?.endpoint) && (
                <div className="text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <span className="font-medium text-slate-800">Endpoint:</span>
                  <div className="mt-1 font-mono text-xs break-all">
                    {data.action?.endpoint || data.stepDetails?.endpoint}
                  </div>
                </div>
              )}
              
              {/* Parameters */}
              {(data.action?.parameters || data.stepDetails?.parameters) && (
                <div className="text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <span className="font-medium text-slate-800">Parameters:</span>
                  <div className="mt-1 font-mono text-xs max-h-20 overflow-y-auto">
                    {JSON.stringify(data.action?.parameters || data.stepDetails?.parameters, null, 2)}
                  </div>
                </div>
              )}
              
              {/* Step Type */}
              {data.stepType && (
                <div className="text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <span className="font-medium text-slate-800">Step Type:</span> {data.stepType}
                </div>
              )}
              
              {/* Explanation */}
              {data.explanation && (
                <div className="text-xs text-slate-600 leading-relaxed p-3 bg-blue-50 rounded border border-blue-200">
                  <span className="font-medium text-blue-800">Description:</span>
                  <div className="mt-1">{data.explanation}</div>
                </div>
              )}
              
              {/* Action Details */}
              {data.action && Object.keys(data.action).length > 0 && (
                <div className="text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <span className="font-medium text-slate-800">Full Action Config:</span>
                  <div className="mt-1 font-mono text-xs max-h-32 overflow-y-auto">
                    {JSON.stringify(data.action, null, 2)}
                  </div>
                </div>
              )}
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

export default ActionNode;
