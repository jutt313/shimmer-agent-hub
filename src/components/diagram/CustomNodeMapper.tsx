
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
  ExternalLink,
  AlertTriangle
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

  // TRIGGER / PLATFORM TRIGGER NODE - Starting point of automation
  const TriggerNodeComponent = () => {
    const platform = data.platform || data.trigger?.integration || data.stepDetails?.integration || '';
    const iconConfig = getPlatformIconConfig(platform, 'trigger');
    const IconComponent = iconConfig.icon || Play;

    return (
      <div 
        onClick={handleExpansion}
        className={`relative px-6 py-5 shadow-xl rounded-3xl border-3 transition-all duration-300 bg-gradient-to-br from-red-50 to-orange-50 cursor-pointer hover:shadow-2xl ${
          selected ? 'border-red-400 shadow-red-200 shadow-2xl scale-105' : 'border-red-300 hover:border-red-400'
        } min-w-[320px] max-w-[400px]`}
      >
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-red-200 !border-3 !border-red-400 !rounded-full"
        />
        
        <div className="flex items-start space-x-4">
          <div 
            className="flex-shrink-0 w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg border-2"
            style={{ 
              backgroundColor: `${iconConfig.color}20`,
              borderColor: `${iconConfig.color}40`
            }}
          >
            <IconComponent 
              className="w-7 h-7" 
              style={{ color: iconConfig.color }} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-red-800 leading-tight">
                TRIGGER
              </div>
              <div className="flex items-center space-x-1">
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-red-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            
            <div className="text-sm font-semibold text-red-700 mb-1">
              {data.label}
            </div>

            {platform && (
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="text-sm font-medium px-3 py-1 rounded-full border inline-flex items-center space-x-2"
                  style={{ 
                    backgroundColor: `${iconConfig.color}15`,
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
              <div className="text-sm text-red-700 leading-relaxed p-3 bg-red-100 rounded-lg border border-red-200 mt-3">
                <span className="font-semibold text-red-800">Trigger Details:</span>
                <div className="mt-1">{data.explanation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ACTION / PLATFORM NODE - Specific actions performed
  const ActionNodeComponent = () => {
    const platform = data.platform || data.action?.integration || data.stepDetails?.integration || '';
    const method = data.action?.method || data.stepDetails?.method || '';
    const iconConfig = getPlatformIconConfig(platform, method);
    const IconComponent = iconConfig.icon || Settings;

    return (
      <div 
        onClick={handleExpansion}
        className={`relative px-6 py-5 shadow-xl rounded-3xl border-3 transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 cursor-pointer hover:shadow-2xl ${
          selected ? 'border-blue-400 shadow-blue-200 shadow-2xl scale-105' : 'border-blue-300 hover:border-blue-400'
        } min-w-[320px] max-w-[450px]`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-blue-200 !border-3 !border-blue-400 !rounded-full"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-blue-200 !border-3 !border-blue-400 !rounded-full"
        />
        
        <div className="flex items-start space-x-4">
          <div 
            className="flex-shrink-0 w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg border-2"
            style={{ 
              backgroundColor: `${iconConfig.color}20`,
              borderColor: `${iconConfig.color}40`
            }}
          >
            <IconComponent 
              className="w-7 h-7" 
              style={{ color: iconConfig.color }} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-blue-800 leading-tight">
                ACTION
              </div>
              <div className="flex items-center space-x-1">
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
            
            <div className="text-sm font-semibold text-blue-700 mb-1">
              {data.label}
            </div>

            {platform && (
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="text-sm font-medium px-3 py-1 rounded-full border inline-flex items-center space-x-2"
                  style={{ 
                    backgroundColor: `${iconConfig.color}15`,
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
              <div className="text-sm text-blue-700 leading-relaxed p-3 bg-blue-100 rounded-lg border border-blue-200 mt-3">
                <span className="font-semibold text-blue-800">Action Details:</span>
                <div className="mt-1">{data.explanation}</div>
                {method && (
                  <div className="mt-2 text-xs text-blue-600">
                    <span className="font-medium">Method:</span> {method}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // CONDITION NODE - Decision point with multiple branches
  const ConditionNodeComponent = () => {
    const branches = data.branches || [
      { label: 'Yes', handle: 'true', color: '#10b981' },
      { label: 'No', handle: 'false', color: '#ef4444' }
    ];

    return (
      <div 
        className={`relative px-6 py-5 shadow-xl rounded-3xl border-3 transition-all duration-300 bg-gradient-to-br from-orange-50 to-yellow-50 cursor-pointer hover:shadow-2xl ${
          selected ? 'border-orange-400 shadow-orange-200 shadow-2xl scale-105' : 'border-orange-300 hover:border-orange-400'
        } min-w-[320px] max-w-[400px]`}
        onClick={handleExpansion}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-orange-200 !border-3 !border-orange-400 !rounded-full"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-3xl bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center shadow-lg border-2 border-orange-200">
            <GitBranch className="w-7 h-7 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-orange-800 leading-tight">
                CONDITION
              </div>
              {expanded ? <ChevronUp className="w-5 h-5 text-orange-600" /> : <ChevronDown className="w-5 h-5 text-orange-600" />}
            </div>
            
            <div className="text-sm font-semibold text-orange-700 mb-1">
              {data.label}
            </div>

            {data.condition?.expression && (
              <div className="text-sm text-orange-600 font-medium mb-2 p-2 bg-orange-100 rounded-lg border border-orange-200">
                {data.condition.expression}
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-sm text-orange-700 leading-relaxed p-3 bg-orange-100 rounded-lg border border-orange-200 mt-3">
                <span className="font-semibold text-orange-800">Condition Logic:</span>
                <div className="mt-1">{data.explanation}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Multiple outgoing paths for branches */}
        {branches.map((branch, index) => {
          const totalBranches = branches.length;
          const topPosition = totalBranches === 1 ? 50 : 20 + (index * (60 / (totalBranches - 1 || 1)));
          
          return (
            <React.Fragment key={branch.handle}>
              <Handle
                type="source"
                position={Position.Right}
                id={branch.handle}
                className="w-4 h-4 !rounded-full !border-3"
                style={{ 
                  top: `${topPosition}%`,
                  backgroundColor: `${branch.color}40`,
                  borderColor: branch.color
                }}
              />
              <div 
                className="absolute text-sm font-bold px-3 py-1 rounded-full border-2 shadow-md"
                style={{ 
                  top: `${topPosition - 12}%`,
                  right: '-45px',
                  backgroundColor: `${branch.color}20`,
                  borderColor: `${branch.color}50`,
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

  // LOOP NODE - Repetitive section
  const LoopNodeComponent = () => {
    return (
      <div 
        onClick={handleExpansion}
        className={`relative px-6 py-5 shadow-xl rounded-3xl border-3 transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-50 cursor-pointer hover:shadow-2xl ${
          selected ? 'border-purple-400 shadow-purple-200 shadow-2xl scale-105' : 'border-purple-300 hover:border-purple-400'
        } min-w-[320px] max-w-[400px]`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-purple-200 !border-3 !border-purple-400 !rounded-full"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-purple-200 !border-3 !border-purple-400 !rounded-full"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-3xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center shadow-lg border-2 border-purple-200">
            <Repeat className="w-7 h-7 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-purple-800 leading-tight">
                LOOP
              </div>
              {expanded ? <ChevronUp className="w-5 h-5 text-purple-600" /> : <ChevronDown className="w-5 h-5 text-purple-600" />}
            </div>
            
            <div className="text-sm font-semibold text-purple-700 mb-1">
              {data.label}
            </div>

            {data.loop?.array_source && (
              <div className="text-sm text-purple-600 font-medium mb-2 p-2 bg-purple-100 rounded-lg border border-purple-200">
                Iterating: {data.loop.array_source}
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-sm text-purple-700 leading-relaxed p-3 bg-purple-100 rounded-lg border border-purple-200 mt-3">
                <span className="font-semibold text-purple-800">Loop Details:</span>
                <div className="mt-1">{data.explanation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // RETRY NODE - Re-attempt logic
  const RetryNodeComponent = () => {
    const maxAttempts = data.retry?.max_attempts || 3;

    return (
      <div 
        onClick={handleExpansion}
        className={`relative px-6 py-5 shadow-xl rounded-3xl border-3 transition-all duration-300 bg-gradient-to-br from-amber-50 to-yellow-50 cursor-pointer hover:shadow-2xl ${
          selected ? 'border-amber-400 shadow-amber-200 shadow-2xl scale-105' : 'border-amber-300 hover:border-amber-400'
        } min-w-[320px] max-w-[400px]`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-amber-200 !border-3 !border-amber-400 !rounded-full"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-amber-200 !border-3 !border-amber-400 !rounded-full"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-3xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center shadow-lg border-2 border-amber-200 relative">
            <RefreshCw className="w-7 h-7 text-amber-600" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {maxAttempts}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-amber-800 leading-tight">
                RETRY
              </div>
              {expanded ? <ChevronUp className="w-5 h-5 text-amber-600" /> : <ChevronDown className="w-5 h-5 text-amber-600" />}
            </div>
            
            <div className="text-sm font-semibold text-amber-700 mb-1">
              {data.label}
            </div>

            <div className="text-sm text-amber-600 font-medium mb-2 p-2 bg-amber-100 rounded-lg border border-amber-200">
              Max Attempts: {maxAttempts}
            </div>
            
            {expanded && data.explanation && (
              <div className="text-sm text-amber-700 leading-relaxed p-3 bg-amber-100 rounded-lg border border-amber-200 mt-3">
                <span className="font-semibold text-amber-800">Retry Configuration:</span>
                <div className="mt-1">{data.explanation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // FALLBACK NODE - Alternative path
  const FallbackNodeComponent = () => {
    return (
      <div 
        onClick={handleExpansion}
        className={`relative px-6 py-5 shadow-xl rounded-3xl border-3 transition-all duration-300 bg-gradient-to-br from-indigo-50 to-blue-50 cursor-pointer hover:shadow-2xl ${
          selected ? 'border-indigo-400 shadow-indigo-200 shadow-2xl scale-105' : 'border-indigo-300 hover:border-indigo-400'
        } min-w-[320px] max-w-[400px]`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-indigo-200 !border-3 !border-indigo-400 !rounded-full"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-3xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shadow-lg border-2 border-indigo-200">
            <Shield className="w-7 h-7 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-indigo-800 leading-tight">
                FALLBACK
              </div>
              {expanded ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-indigo-600" />}
            </div>
            
            <div className="text-sm font-semibold text-indigo-700 mb-1">
              {data.label}
            </div>
            
            {expanded && data.explanation && (
              <div className="text-sm text-indigo-700 leading-relaxed p-3 bg-indigo-100 rounded-lg border border-indigo-200 mt-3">
                <span className="font-semibold text-indigo-800">Fallback Strategy:</span>
                <div className="mt-1">{data.explanation}</div>
              </div>
            )}
          </div>
        </div>

        {/* Two outgoing paths: Primary and Fallback */}
        <Handle
          type="source"
          position={Position.Right}
          id="primary"
          className="w-4 h-4 !rounded-full !border-3"
          style={{ 
            top: '35%',
            backgroundColor: '#10b98140',
            borderColor: '#10b981'
          }}
        />
        <div 
          className="absolute text-sm font-bold px-3 py-1 rounded-full border-2 shadow-md"
          style={{ 
            top: '25%',
            right: '-55px',
            backgroundColor: '#10b98120',
            borderColor: '#10b98150',
            color: '#10b981'
          }}
        >
          Primary
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id="fallback"
          className="w-4 h-4 !rounded-full !border-3"
          style={{ 
            top: '65%',
            backgroundColor: '#ef444440',
            borderColor: '#ef4444'
          }}
        />
        <div 
          className="absolute text-sm font-bold px-3 py-1 rounded-full border-2 shadow-md"
          style={{ 
            top: '55%',
            right: '-55px',
            backgroundColor: '#ef444420',
            borderColor: '#ef444450',
            color: '#ef4444'
          }}
        >
          Fallback
        </div>
      </div>
    );
  };

  // AI AGENT NODE - AI interaction
  const AIAgentNodeComponent = () => {
    const isRecommended = data.isRecommended;

    return (
      <div 
        className={`relative px-6 py-5 shadow-xl rounded-3xl border-3 transition-all duration-300 cursor-pointer ${
          isRecommended 
            ? 'bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border-emerald-200/70' 
            : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
        } hover:shadow-2xl ${
          selected ? 'shadow-emerald-200 shadow-2xl scale-105' : 'hover:border-emerald-400'
        } min-w-[320px] max-w-[450px]`}
        onClick={handleExpansion}
        style={{ opacity: isRecommended ? 0.85 : 1 }}
      >
        {isRecommended && (
          <div className="absolute -top-3 -right-3 flex gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                data.onAdd?.();
              }}
              className="h-8 w-8 p-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                data.onDismiss?.();
              }}
              className="h-8 w-8 p-0 bg-white hover:bg-gray-50 text-gray-500 border-gray-300 rounded-full shadow-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-emerald-200 !border-3 !border-emerald-400 !rounded-full"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-emerald-200 !border-3 !border-emerald-400 !rounded-full"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-lg border-2 border-emerald-200">
            <Bot className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-emerald-800 leading-tight">
                AI AGENT
              </div>
              {expanded ? <ChevronUp className="w-5 h-5 text-emerald-600" /> : <ChevronDown className="w-5 h-5 text-emerald-600" />}
            </div>
            
            <div className="text-sm font-semibold text-emerald-700 mb-1">
              {data.label}
            </div>
            
            {isRecommended && (
              <div className="text-sm text-emerald-600 font-bold mb-2 px-3 py-1 bg-emerald-200 rounded-lg border border-emerald-300 inline-block">
                RECOMMENDED
              </div>
            )}
            
            {expanded && data.agent?.agent_id && (
              <div className="text-sm text-emerald-600 font-medium mb-2 p-2 bg-emerald-100 rounded-lg border border-emerald-200">
                Agent ID: {data.agent.agent_id}
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-sm text-emerald-700 leading-relaxed p-3 bg-emerald-100 rounded-lg border border-emerald-200 mt-3">
                <span className="font-semibold text-emerald-800">Agent Purpose:</span>
                <div className="mt-1">{data.explanation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // DELAY NODE - Time delays
  const DelayNodeComponent = () => {
    const delaySeconds = data.delay?.duration_seconds || 0;
    const delayDisplay = delaySeconds >= 60 ? `${Math.floor(delaySeconds / 60)}m ${delaySeconds % 60}s` : `${delaySeconds}s`;

    return (
      <div 
        onClick={handleExpansion}
        className={`relative px-6 py-5 shadow-xl rounded-3xl border-3 transition-all duration-300 bg-gradient-to-br from-slate-50 to-gray-50 cursor-pointer hover:shadow-2xl ${
          selected ? 'border-slate-400 shadow-slate-200 shadow-2xl scale-105' : 'border-slate-300 hover:border-slate-400'
        } min-w-[320px] max-w-[400px]`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-slate-200 !border-3 !border-slate-400 !rounded-full"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-slate-200 !border-3 !border-slate-400 !rounded-full"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-3xl bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center shadow-lg border-2 border-slate-200">
            <Clock className="w-7 h-7 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-slate-800 leading-tight">
                DELAY
              </div>
              {expanded ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
            </div>
            
            <div className="text-sm font-semibold text-slate-700 mb-1">
              {data.label}
            </div>

            <div className="text-sm text-slate-600 font-medium mb-2 p-2 bg-slate-100 rounded-lg border border-slate-200">
              Duration: {delayDisplay}
            </div>
            
            {expanded && data.explanation && (
              <div className="text-sm text-slate-700 leading-relaxed p-3 bg-slate-100 rounded-lg border border-slate-200 mt-3">
                <span className="font-semibold text-slate-800">Delay Details:</span>
                <div className="mt-1">{data.explanation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main switch statement to determine which component to render
  switch (type) {
    case 'triggerNode':
    case 'platformTriggerNode':
      return <TriggerNodeComponent />;
    
    case 'actionNode':
    case 'platformNode':
      return <ActionNodeComponent />;
    
    case 'conditionNode':
    case 'dynamicConditionNode':
      return <ConditionNodeComponent />;
    
    case 'loopNode':
      return <LoopNodeComponent />;
    
    case 'retryNode':
      return <RetryNodeComponent />;
    
    case 'fallbackNode':
      return <FallbackNodeComponent />;
    
    case 'aiAgentNode':
      return <AIAgentNodeComponent />;
    
    case 'delayNode':
      return <DelayNodeComponent />;
    
    default:
      return <ActionNodeComponent />;
  }
};

export default CustomNodeMapper;
