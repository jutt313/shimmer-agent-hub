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

  // Clean base node styling with rounded corners
  const baseNodeClasses = `
    relative px-6 py-5 shadow-xl rounded-3xl border-2 transition-all duration-300 
    cursor-pointer hover:shadow-2xl backdrop-blur-sm min-w-[320px] max-w-[400px]
    bg-white
    ${selected ? 'scale-105 shadow-2xl border-purple-400' : 'hover:scale-102 border-gray-200 hover:border-purple-300'}
  `;

  // TRIGGER NODE - Clean design without emojis
  const TriggerNodeComponent = () => {
    const platform = data.platform || data.trigger?.integration || data.stepDetails?.integration || '';
    const iconConfig = getPlatformIconConfig(platform, 'trigger');
    const IconComponent = iconConfig.icon || Play;

    return (
      <div 
        onClick={handleExpansion}
        className={`${baseNodeClasses} border-red-300 hover:border-red-400 ${
          selected ? 'border-red-400 shadow-red-200' : ''
        }`}
      >
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-white !border-2 !border-red-400 !rounded-full shadow-lg"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shadow-lg border-2 border-red-200">
            <IconComponent className="w-7 h-7 text-red-600" />
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
                <div className="text-sm font-medium px-3 py-1 rounded-full border bg-red-50 border-red-200 text-red-700 inline-flex items-center space-x-2">
                  <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                  {expanded && <ExternalLink className="w-3 h-3" />}
                </div>
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-sm text-red-700 leading-relaxed p-3 bg-red-50 rounded-2xl border border-red-200 mt-3">
                <span className="font-semibold text-red-800">Trigger Details:</span>
                <div className="mt-1">{data.explanation}</div>
                
                {data.trigger && (
                  <div className="mt-2 text-xs text-red-600 space-y-1">
                    <div><span className="font-medium">Type:</span> {data.trigger.type}</div>
                    {data.trigger.cron_expression && (
                      <div><span className="font-medium">Schedule:</span> {data.trigger.cron_expression}</div>
                    )}
                    {data.trigger.webhook_endpoint && (
                      <div><span className="font-medium">Webhook:</span> {data.trigger.webhook_endpoint}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ACTION NODE - Clean design without emojis
  const ActionNodeComponent = () => {
    const platform = data.platform || data.action?.integration || data.stepDetails?.integration || '';
    const method = data.action?.method || data.stepDetails?.method || '';
    const iconConfig = getPlatformIconConfig(platform, method);
    const IconComponent = iconConfig.icon || Settings;

    return (
      <div 
        onClick={handleExpansion}
        className={`${baseNodeClasses} border-blue-300 hover:border-blue-400 ${
          selected ? 'border-blue-400 shadow-blue-200' : ''
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-white !border-2 !border-blue-400 !rounded-full shadow-lg"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-white !border-2 !border-blue-400 !rounded-full shadow-lg"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shadow-lg border-2 border-blue-200">
            <IconComponent className="w-7 h-7 text-blue-600" />
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
                <div className="text-sm font-medium px-3 py-1 rounded-full border bg-blue-50 border-blue-200 text-blue-700 inline-flex items-center space-x-2">
                  <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                  {expanded && <ExternalLink className="w-3 h-3" />}
                </div>
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-sm text-blue-700 leading-relaxed p-3 bg-blue-50 rounded-2xl border border-blue-200 mt-3">
                <span className="font-semibold text-blue-800">Action Details:</span>
                <div className="mt-1">{data.explanation}</div>
                
                {data.action && (
                  <div className="mt-2 text-xs text-blue-600 space-y-1">
                    {method && <div><span className="font-medium">Method:</span> {method}</div>}
                    {data.action.parameters && (
                      <div>
                        <span className="font-medium">Parameters:</span>
                        <pre className="mt-1 p-2 bg-blue-50 rounded text-xs overflow-x-auto backdrop-blur-sm">
                          {JSON.stringify(data.action.parameters, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // CONDITION NODE - Clean design with single color branches
  const ConditionNodeComponent = () => {
    const branches = data.branches || [
      { label: 'True', handle: 'true', color: '#8b5cf6' },
      { label: 'False', handle: 'false', color: '#8b5cf6' }
    ];

    return (
      <div 
        className={`${baseNodeClasses} border-orange-300 hover:border-orange-400 ${
          selected ? 'border-orange-400 shadow-orange-200' : ''
        }`}
        onClick={handleExpansion}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-white !border-2 !border-orange-400 !rounded-full shadow-lg"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shadow-lg border-2 border-orange-200">
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
              <div className="text-sm text-orange-600 font-medium mb-2 p-2 bg-orange-50 rounded-2xl border border-orange-200">
                {data.condition.expression}
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-sm text-orange-700 leading-relaxed p-3 bg-orange-50 rounded-2xl border border-orange-200 mt-3">
                <span className="font-semibold text-orange-800">Condition Logic:</span>
                <div className="mt-1">{data.explanation}</div>
                
                {data.condition && (
                  <div className="mt-2 text-xs text-orange-600 space-y-1">
                    <div><span className="font-medium">Expression:</span> {data.condition.expression}</div>
                    <div><span className="font-medium">Branches:</span> {branches.length} paths</div>
                    {data.condition.if_true && (
                      <div><span className="font-medium">True Path:</span> {data.condition.if_true.length} steps</div>
                    )}
                    {data.condition.if_false && (
                      <div><span className="font-medium">False Path:</span> {data.condition.if_false.length} steps</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Single color branches with rounded styling */}
        {branches.map((branch, index) => {
          const totalBranches = branches.length;
          const topPosition = totalBranches === 1 ? 50 : 20 + (index * (60 / (totalBranches - 1 || 1)));
          
          return (
            <React.Fragment key={branch.handle}>
              <Handle
                type="source"
                position={Position.Right}
                id={branch.handle}
                className="w-4 h-4 !rounded-full !border-2 shadow-lg !bg-white"
                style={{ 
                  top: `${topPosition}%`,
                  borderColor: '#8b5cf6'
                }}
              />
              <div 
                className="absolute text-sm font-bold px-3 py-1 rounded-full border-2 shadow-lg bg-white"
                style={{ 
                  top: `${topPosition - 12}%`,
                  right: '-60px',
                  borderColor: '#8b5cf6',
                  color: '#8b5cf6'
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

  // AI AGENT NODE - Clean design without emojis
  const AIAgentNodeComponent = () => {
    const isRecommended = data.isRecommended;

    return (
      <div 
        className={`${baseNodeClasses} border-emerald-300 hover:border-emerald-400 ${
          selected ? 'border-emerald-400 shadow-emerald-200' : ''
        } ${isRecommended ? 'animate-pulse' : ''}`}
        onClick={handleExpansion}
      >
        {isRecommended && (
          <div className="absolute -top-3 -right-3 flex gap-2">
            <div className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
              RECOMMENDED
            </div>
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
          className="w-4 h-4 !bg-white !border-2 !border-emerald-400 !rounded-full shadow-lg"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-white !border-2 !border-emerald-400 !rounded-full shadow-lg"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-lg border-2 border-emerald-200">
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
            
            {expanded && data.agent?.agent_id && (
              <div className="text-sm text-emerald-600 font-medium mb-2 p-2 bg-emerald-50 rounded-2xl border border-emerald-200">
                Agent ID: {data.agent.agent_id}
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-sm text-emerald-700 leading-relaxed p-3 bg-emerald-50 rounded-2xl border border-emerald-200 mt-3">
                <span className="font-semibold text-emerald-800">Agent Purpose:</span>
                <div className="mt-1">{data.explanation}</div>
                
                {data.agent && (
                  <div className="mt-2 text-xs text-emerald-600 space-y-1">
                    {data.agent.input_prompt && (
                      <div><span className="font-medium">Input:</span> {data.agent.input_prompt}</div>
                    )}
                    {data.agent.output_variable && (
                      <div><span className="font-medium">Output:</span> {data.agent.output_variable}</div>
                    )}
                    {isRecommended && (
                      <div className="text-emerald-700 font-semibold">This AI agent is recommended for optimal performance</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Other node components with clean design
  const RetryNodeComponent = () => {
    const maxAttempts = data.retry?.max_attempts || 3;

    return (
      <div 
        onClick={handleExpansion}
        className={`${baseNodeClasses} border-amber-300 hover:border-amber-400 ${
          selected ? 'border-amber-400 shadow-amber-200' : ''
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-white !border-2 !border-amber-400 !rounded-full shadow-lg"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-white !border-2 !border-amber-400 !rounded-full shadow-lg"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shadow-lg border-2 border-amber-200 relative">
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

            <div className="text-sm text-amber-600 font-medium mb-2 p-2 bg-amber-50 rounded-2xl border border-amber-200">
              Max Attempts: {maxAttempts}
            </div>
            
            {expanded && data.explanation && (
              <div className="text-sm text-amber-700 leading-relaxed p-3 bg-amber-50 rounded-2xl border border-amber-200 mt-3">
                <span className="font-semibold text-amber-800">Retry Configuration:</span>
                <div className="mt-1">{data.explanation}</div>
                
                {data.retry && (
                  <div className="mt-2 text-xs text-amber-600 space-y-1">
                    <div><span className="font-medium">Max Attempts:</span> {data.retry.max_attempts}</div>
                    {data.retry.steps && (
                      <div><span className="font-medium">Retry Steps:</span> {data.retry.steps.length} actions</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const LoopNodeComponent = () => {
    return (
      <div 
        onClick={handleExpansion}
        className={`${baseNodeClasses} border-purple-300 hover:border-purple-400 ${
          selected ? 'border-purple-400 shadow-purple-200' : ''
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-white !border-2 !border-purple-400 !rounded-full shadow-lg"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-white !border-2 !border-purple-400 !rounded-full shadow-lg"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center shadow-lg border-2 border-purple-200">
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
              <div className="text-sm text-purple-600 font-medium mb-2 p-2 bg-purple-50 rounded-2xl border border-purple-200">
                Iterating: {data.loop.array_source}
              </div>
            )}
            
            {expanded && data.explanation && (
              <div className="text-sm text-purple-700 leading-relaxed p-3 bg-purple-50 rounded-2xl border border-purple-200 mt-3">
                <span className="font-semibold text-purple-800">Loop Details:</span>
                <div className="mt-1">{data.explanation}</div>
                
                {data.loop && (
                  <div className="mt-2 text-xs text-purple-600 space-y-1">
                    {data.loop.array_source && (
                      <div><span className="font-medium">Source:</span> {data.loop.array_source}</div>
                    )}
                    {data.loop.steps && (
                      <div><span className="font-medium">Loop Steps:</span> {data.loop.steps.length} actions</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DelayNodeComponent = () => {
    const delaySeconds = data.delay?.duration_seconds || 0;
    const delayDisplay = delaySeconds >= 60 ? `${Math.floor(delaySeconds / 60)}m ${delaySeconds % 60}s` : `${delaySeconds}s`;

    return (
      <div 
        onClick={handleExpansion}
        className={`${baseNodeClasses} border-slate-300 hover:border-slate-400 ${
          selected ? 'border-slate-400 shadow-slate-200' : ''
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-white !border-2 !border-slate-400 !rounded-full shadow-lg"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-white !border-2 !border-slate-400 !rounded-full shadow-lg"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shadow-lg border-2 border-slate-200">
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

            <div className="text-sm text-slate-600 font-medium mb-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
              Duration: {delayDisplay}
            </div>
            
            {expanded && data.explanation && (
              <div className="text-sm text-slate-700 leading-relaxed p-3 bg-slate-50 rounded-2xl border border-slate-200 mt-3">
                <span className="font-semibold text-slate-800">Delay Details:</span>
                <div className="mt-1">{data.explanation}</div>
                
                {data.delay && (
                  <div className="mt-2 text-xs text-slate-600 space-y-1">
                    <div><span className="font-medium">Duration:</span> {data.delay.duration_seconds} seconds</div>
                    <div><span className="font-medium">Purpose:</span> Wait before next action</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const FallbackNodeComponent = () => {
    return (
      <div 
        onClick={handleExpansion}
        className={`${baseNodeClasses} border-indigo-300 hover:border-indigo-400 ${
          selected ? 'border-indigo-400 shadow-indigo-200' : ''
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-white !border-2 !border-indigo-400 !rounded-full shadow-lg"
        />
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-lg border-2 border-indigo-200">
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
              <div className="text-sm text-indigo-700 leading-relaxed p-3 bg-indigo-50 rounded-2xl border border-indigo-200 mt-3">
                <span className="font-semibold text-indigo-800">Fallback Strategy:</span>
                <div className="mt-1">{data.explanation}</div>
                
                {data.fallback && (
                  <div className="mt-2 text-xs text-indigo-600 space-y-1">
                    {data.fallback.primary_steps && (
                      <div><span className="font-medium">Primary Steps:</span> {data.fallback.primary_steps.length} actions</div>
                    )}
                    {data.fallback.fallback_steps && (
                      <div><span className="font-medium">Fallback Steps:</span> {data.fallback.fallback_steps.length} actions</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Two outgoing paths: Primary and Fallback */}
        <Handle
          type="source"
          position={Position.Right}
          id="primary"
          className="w-4 h-4 !rounded-full !border-2 !bg-white shadow-lg"
          style={{ 
            top: '35%',
            borderColor: '#8b5cf6'
          }}
        />
        <div 
          className="absolute text-sm font-bold px-3 py-1 rounded-full border-2 shadow-lg bg-white"
          style={{ 
            top: '25%',
            right: '-55px',
            borderColor: '#8b5cf6',
            color: '#8b5cf6'
          }}
        >
          Primary
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id="fallback"
          className="w-4 h-4 !rounded-full !border-2 !bg-white shadow-lg"
          style={{ 
            top: '65%',
            borderColor: '#8b5cf6'
          }}
        />
        <div 
          className="absolute text-sm font-bold px-3 py-1 rounded-full border-2 shadow-lg bg-white"
          style={{ 
            top: '55%',
            right: '-55px',
            borderColor: '#8b5cf6',
            color: '#8b5cf6'
          }}
        >
          Fallback
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
