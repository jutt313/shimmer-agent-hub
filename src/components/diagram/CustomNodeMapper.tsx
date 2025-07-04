
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Settings, 
  GitBranch, 
  Bot, 
  Clock, 
  Repeat, 
  RefreshCw, 
  Shield, 
  Zap, 
  Play,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformIconConfig } from '@/utils/platformIcons';

interface NodeData {
  label: string;
  icon?: string;
  platform?: string;
  action?: any;
  condition?: any;
  agent?: any;
  delay?: any;
  loop?: any;
  retry?: any;
  fallback?: any;
  trigger?: any;
  stepType?: string;
  explanation?: string;
  isRecommended?: boolean;
  branches?: Array<{
    label: string;
    handle: string;
    color: string;
    stepsKey?: string;
  }>;
  onAdd?: () => void;
  onDismiss?: () => void;
  stepDetails?: {
    integration?: string;
    method?: string;
    endpoint?: string;
    parameters?: any;
  };
}

interface CustomNodeMapperProps {
  id: string;
  type: string;
  data: NodeData;
  selected?: boolean;
}

const CustomNodeMapper: React.FC<CustomNodeMapperProps> = ({ id, type, data, selected }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Condition Node Component
  const ConditionNodeComponent = () => {
    const branches = data.branches || [
      { label: 'Yes', handle: 'true', color: '#10b981' },
      { label: 'No', handle: 'false', color: '#ef4444' }
    ];

    return (
      <div 
        className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 min-w-[240px] max-w-[300px] bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer ${
          selected ? 'border-orange-300 shadow-orange-100 shadow-xl scale-105' : 'border-orange-200 hover:border-orange-300'
        }`}
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
            {data.condition?.expression && (
              <div className="text-xs text-orange-600 font-medium mb-1">
                {data.condition.expression}
              </div>
            )}
            {expanded && data.explanation && (
              <div className="text-xs text-orange-700 leading-relaxed mt-2 p-2 bg-white rounded border border-orange-200">
                {data.explanation}
              </div>
            )}
          </div>
        </div>
        
        {/* Dynamic branch handles */}
        {branches.map((branch, index) => {
          const totalBranches = branches.length;
          const topPosition = totalBranches === 1 ? 50 : 20 + (index * (60 / (totalBranches - 1 || 1)));
          
          return (
            <React.Fragment key={branch.handle}>
              <Handle
                type="source"
                position={Position.Right}
                id={branch.handle}
                className="w-3 h-3 !rounded-full !border-2"
                style={{ 
                  top: `${topPosition}%`,
                  backgroundColor: `${branch.color}40`,
                  borderColor: branch.color
                }}
              />
              <div 
                className="absolute -right-2 text-xs font-medium px-2 py-1 rounded-full border"
                style={{ 
                  top: `${topPosition - 10}%`,
                  backgroundColor: `${branch.color}10`,
                  borderColor: `${branch.color}30`,
                  color: branch.color
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

  // AI Agent Node Component
  const AIAgentNodeComponent = () => {
    const isRecommended = data.isRecommended;

    return (
      <div 
        className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
          isRecommended 
            ? 'bg-gradient-to-br from-emerald-50/60 to-teal-50/60 border-emerald-200/60' 
            : 'bg-gradient-to-br from-emerald-50 to-teal-50'
        } ${
          selected ? 'border-emerald-300 shadow-emerald-100 shadow-xl scale-105' : 
          isRecommended ? 'border-emerald-200/60 hover:border-emerald-300/60' : 'border-emerald-200 hover:border-emerald-300'
        } ${expanded ? 'min-w-[320px]' : 'min-w-[240px]'} max-w-[400px]`}
        onClick={handleExpansion}
        style={{ opacity: isRecommended ? 0.85 : 1 }}
      >
        {isRecommended && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                data.onAdd?.();
              }}
              className="h-6 w-6 p-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-md"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                data.onDismiss?.();
              }}
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
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-emerald-800 leading-tight mb-1">
                {data.label}
              </div>
              {expanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-emerald-600" />}
            </div>
            
            {isRecommended && (
              <div className="text-xs text-emerald-600 font-medium mb-1 px-2 py-1 bg-emerald-100 rounded border border-emerald-200 inline-block">
                Recommended Agent
              </div>
            )}
            
            {expanded && data.agent?.agent_id && (
              <div className="text-xs text-emerald-600 font-medium mb-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                ID: {data.agent.agent_id}
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-xs text-emerald-700 leading-relaxed p-2 bg-white rounded border border-emerald-200">
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

  // Platform Node Component
  const PlatformNodeComponent = () => {
    const platform = data.platform || data.action?.integration || data.stepDetails?.integration || '';
    const method = data.action?.method || data.stepDetails?.method || '';
    const iconConfig = getPlatformIconConfig(platform, method);
    const IconComponent = iconConfig.icon || Settings;

    return (
      <div 
        onClick={handleExpansion}
        className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 bg-white/95 backdrop-blur-sm cursor-pointer hover:shadow-xl ${
          selected ? 'border-blue-300 shadow-blue-100 shadow-xl scale-105' : 'border-blue-200 hover:border-blue-300'
        } ${expanded ? 'min-w-[380px]' : 'min-w-[280px]'} max-w-[450px]`}
        style={{
          borderColor: `${iconConfig.color}50`,
          boxShadow: selected 
            ? `0 8px 32px ${iconConfig.color}15, 0 4px 16px ${iconConfig.color}10` 
            : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-blue-100 !border-2 !border-blue-300 !rounded-full"
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
                  <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                  {expanded && <ExternalLink className="w-3 h-3" />}
                </div>
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-xs text-slate-600 leading-relaxed p-3 bg-blue-50 rounded border border-blue-200 mt-2">
                <span className="font-medium text-blue-800">Description:</span>
                <div className="mt-1">{data.explanation}</div>
              </div>
            )}
          </div>
        </div>
        
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-blue-100 !border-2 !border-blue-300 !rounded-full"
        />
      </div>
    );
  };

  // Generic Node Component for other types
  const GenericNodeComponent = (nodeType: string, icon: React.ElementType, colorTheme: string) => {
    return (
      <div 
        onClick={handleExpansion}
        className={`relative px-5 py-4 shadow-lg rounded-2xl border-2 transition-all duration-300 bg-white/95 backdrop-blur-sm cursor-pointer hover:shadow-xl min-w-[240px] max-w-[320px] ${
          selected ? `border-${colorTheme}-300 shadow-${colorTheme}-100 shadow-xl scale-105` : `border-${colorTheme}-200 hover:border-${colorTheme}-300`
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 !bg-${colorTheme}-100 !border-2 !border-${colorTheme}-300 !rounded-full`}
        />
        
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-${colorTheme}-100 to-${colorTheme}-200 flex items-center justify-center shadow-sm border border-${colorTheme}-200`}>
            {React.createElement(icon, { className: `w-5 h-5 text-${colorTheme}-600` })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className={`text-sm font-semibold text-${colorTheme}-800 leading-tight mb-1`}>
                {data.label}
              </div>
              {expanded ? <ChevronUp className={`w-4 h-4 text-${colorTheme}-600`} /> : <ChevronDown className={`w-4 h-4 text-${colorTheme}-600`} />}
            </div>
            
            {expanded && data.explanation && (
              <div className={`text-xs text-${colorTheme}-700 leading-relaxed p-2 bg-white rounded border border-${colorTheme}-200 mt-2`}>
                {data.explanation}
              </div>
            )}
          </div>
        </div>
        
        <Handle
          type="source"
          position={Position.Right}
          className={`w-3 h-3 !bg-${colorTheme}-100 !border-2 !border-${colorTheme}-300 !rounded-full`}
        />
      </div>
    );
  };

  // Main switch statement to determine which component to render
  switch (type) {
    case 'conditionNode':
      return <ConditionNodeComponent />;
    
    case 'aiAgentNode':
      return <AIAgentNodeComponent />;
    
    case 'platformNode':
    case 'platformTriggerNode':
      return <PlatformNodeComponent />;
    
    case 'delayNode':
      return GenericNodeComponent('delay', Clock, 'slate');
    
    case 'loopNode':
      return GenericNodeComponent('loop', Repeat, 'purple');
    
    case 'retryNode':
      return GenericNodeComponent('retry', RefreshCw, 'amber');
    
    case 'fallbackNode':
      return GenericNodeComponent('fallback', Shield, 'indigo');
    
    case 'triggerNode':
      return GenericNodeComponent('trigger', Play, 'red');
    
    case 'actionNode':
    default:
      return GenericNodeComponent('action', Settings, 'gray');
  }
};

export default CustomNodeMapper;
