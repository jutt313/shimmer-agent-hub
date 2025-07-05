
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Zap, 
  GitFork, 
  Repeat, 
  RefreshCw, 
  CornerDownRight, 
  Bot, 
  Clock, 
  PlugZap,
  Flag,
  Settings,
  Play,
  Plus,
  X,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getPlatformIconConfig, getStepTypeIcon } from '@/utils/platformIcons';

const getNodeIcon = (iconName: string, platform?: string, stepType?: string) => {
  // Priority 1: Use platform icons
  if (platform) {
    console.log('🔍 Using platform icon for:', platform);
    const { icon: PlatformIcon } = getPlatformIconConfig(platform);
    return <PlatformIcon className="w-6 h-6" />;
  }

  // Priority 2: Use step type icons
  if (stepType) {
    console.log('🔍 Using step type icon for:', stepType);
    const { icon: StepIcon } = getStepTypeIcon(stepType);
    return <StepIcon className="w-6 h-6" />;
  }

  // Priority 3: Fallback to generic icons
  const iconMap: { [key: string]: React.ReactElement } = {
    'Zap': <Zap className="w-6 h-6" />,
    'GitFork': <GitFork className="w-6 h-6" />,
    'Repeat': <Repeat className="w-6 h-6" />,
    'RefreshCw': <RefreshCw className="w-6 h-6" />,
    'CornerDownRight': <CornerDownRight className="w-6 h-6" />,
    'Bot': <Bot className="w-6 h-6" />,
    'Clock': <Clock className="w-6 h-6" />,
    'PlugZap': <PlugZap className="w-6 h-6" />,
    'Flag': <Flag className="w-6 h-6" />,
    'Settings': <Settings className="w-6 h-6" />,
    'Play': <Play className="w-6 h-6" />,
  };
  
  return iconMap[iconName] || <Zap className="w-6 h-6" />;
};

const getNodeStyle = (stepType: string, isRecommended: boolean = false) => {
  const baseStyle = "relative rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl cursor-pointer min-w-[320px] max-w-[400px]";
  
  if (isRecommended) {
    return `${baseStyle} bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 border-emerald-400 hover:border-emerald-500 ring-2 ring-emerald-200`;
  }

  const styleMap: { [key: string]: string } = {
    'trigger': `${baseStyle} bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-purple-400 hover:border-purple-500`,
    'condition': `${baseStyle} bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 border-orange-400 hover:border-orange-500`,
    'ai_agent_call': `${baseStyle} bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-400 hover:border-emerald-500`,
    'loop': `${baseStyle} bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 border-indigo-400 hover:border-indigo-500`,
    'retry': `${baseStyle} bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-amber-400 hover:border-amber-500`,
    'delay': `${baseStyle} bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 border-gray-400 hover:border-gray-500`,
    'end': `${baseStyle} bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 border-red-400 hover:border-red-500`,
    'stop': `${baseStyle} bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 border-red-400 hover:border-red-500`,
  };
  
  return styleMap[stepType] || `${baseStyle} bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-400 hover:border-blue-500`;
};

const getPlatformIconColor = (platform?: string, stepType?: string) => {
  if (platform) {
    const { color } = getPlatformIconConfig(platform);
    return color;
  }
  if (stepType) {
    const { color } = getStepTypeIcon(stepType);
    return color;
  }
  return '#6B7280';
};

const CustomNodeMapper = ({ data }: { data: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    label,
    stepType,
    explanation,
    isRecommended = false,
    platform,
    icon = 'Zap',
    branches = [],
    onAdd,
    onDismiss,
    trigger,
    action,
    condition,
    loop,
    delay,
    retry,
    ai_agent_call
  } = data;

  console.log('🎨 Rendering node:', { label, stepType, platform, isRecommended, branches: branches.length });

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    console.log('📱 Node clicked, expanded:', !isExpanded);
  };

  const getDetailedDescription = () => {
    let details = explanation || 'No detailed information available.';
    
    if (trigger) {
      details += `\n\n📍 Trigger Details:`;
      details += `\nType: ${trigger.type}`;
      if (trigger.platform) details += `\nPlatform: ${trigger.platform}`;
      if (trigger.cron_expression) details += `\nSchedule: ${trigger.cron_expression}`;
      if (trigger.webhook_url) details += `\nWebhook: ${trigger.webhook_url}`;
    }
    
    if (action) {
      details += `\n\n🔧 Action Details:`;
      details += `\nIntegration: ${action.integration}`;
      details += `\nMethod: ${action.method}`;
      if (action.parameters && Object.keys(action.parameters).length > 0) {
        details += `\nParameters: ${Object.keys(action.parameters).join(', ')}`;
      }
    }
    
    if (condition && condition.cases) {
      details += `\n\n🔀 Condition Details:`;
      details += `\nBranches: ${condition.cases.length}`;
      condition.cases.forEach((c: any, i: number) => {
        details += `\n  ${i + 1}. ${c.label}: ${c.expression}`;
      });
    }
    
    if (loop) {
      details += `\n\n🔄 Loop Details:`;
      details += `\nSource: ${loop.array_source}`;
      details += `\nSteps: ${loop.steps?.length || 0}`;
    }
    
    if (delay) {
      details += `\n\n⏱️ Delay Details:`;
      details += `\nDuration: ${delay.duration_seconds} seconds`;
    }
    
    if (retry) {
      details += `\n\n🔁 Retry Details:`;
      details += `\nMax Attempts: ${retry.max_attempts}`;
      details += `\nRetry Steps: ${retry.steps?.length || 0}`;
    }
    
    if (ai_agent_call) {
      details += `\n\n🤖 AI Agent Details:`;
      details += `\nAgent: ${ai_agent_call.agent_id}`;
      details += `\nInput: ${ai_agent_call.input_prompt}`;
      details += `\nOutput: ${ai_agent_call.output_variable}`;
    }
    
    return details;
  };

  return (
    <TooltipProvider>
      <div 
        className={`${getNodeStyle(stepType, isRecommended)} p-4 sm:p-5 ${isExpanded ? 'min-h-[250px]' : ''}`}
        onClick={handleNodeClick}
      >
        {/* AI Recommendation Actions */}
        {isRecommended && (onAdd || onDismiss) && (
          <div className="absolute -top-3 -right-3 flex gap-2">
            {onAdd && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
                className="w-8 h-8 p-0 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-200"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="w-8 h-8 p-0 rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Main Node Content */}
        <div className="flex items-start gap-4">
          {/* Platform/Step Icon */}
          <div 
            className="flex-shrink-0 p-3 rounded-xl shadow-md"
            style={{ 
              backgroundColor: `${getPlatformIconColor(platform, stepType)}20`,
              color: getPlatformIconColor(platform, stepType),
              border: `2px solid ${getPlatformIconColor(platform, stepType)}30`
            }}
          >
            {getNodeIcon(icon, platform, stepType)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-base sm:text-lg text-gray-800 leading-tight">
                {label}
              </h3>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNodeClick}
                  className="flex-shrink-0 w-8 h-8 p-0 hover:bg-gray-200 rounded-full"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('ℹ️ Node info:', { label, stepType, explanation, data });
                      }}
                      className="flex-shrink-0 w-8 h-8 p-0 hover:bg-gray-200 rounded-full"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{explanation}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Platform Badge */}
            {platform && (
              <Badge 
                variant="secondary" 
                className="mt-2 text-sm font-medium"
                style={{ 
                  backgroundColor: `${getPlatformIconColor(platform, stepType)}15`, 
                  color: getPlatformIconColor(platform, stepType),
                  border: `1px solid ${getPlatformIconColor(platform, stepType)}30`
                }}
              >
                {platform}
              </Badge>
            )}

            {/* AI Recommendation Badge */}
            {isRecommended && (
              <Badge className="mt-2 ml-2 bg-emerald-100 text-emerald-700 text-sm font-bold ring-1 ring-emerald-300">
                🤖 AI Recommended
              </Badge>
            )}

            {/* Step Type Badge */}
            <Badge variant="outline" className="mt-2 text-sm capitalize font-medium">
              {stepType}
            </Badge>

            {/* Expanded Description */}
            {isExpanded && (
              <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-inner border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                  {getDetailedDescription()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 bg-gray-400 border-2 border-white hover:bg-gray-600 transition-colors shadow-lg"
          style={{ left: -8 }}
        />

        {/* Source Handles - Dynamic based on node type */}
        {stepType === 'condition' && branches.length > 0 ? (
          // Multiple handles for condition branches
          branches.map((branch: any, index: number) => (
            <Handle
              key={branch.handle}
              type="source"
              position={Position.Right}
              id={branch.handle}
              className="w-4 h-4 border-2 border-white hover:bg-gray-600 transition-colors shadow-lg"
              style={{ 
                right: -8, 
                top: `${30 + (index * 20)}%`,
                backgroundColor: branch.color || getPlatformIconColor(platform, stepType)
              }}
            />
          ))
        ) : stepType === 'retry' ? (
          // Success and failure handles for retry nodes
          <>
            <Handle
              type="source"
              position={Position.Right}
              id="success"
              className="w-4 h-4 bg-green-500 border-2 border-white hover:bg-green-600 transition-colors shadow-lg"
              style={{ right: -8, top: '30%' }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="failure"
              className="w-4 h-4 bg-red-500 border-2 border-white hover:bg-red-600 transition-colors shadow-lg"
              style={{ right: -8, top: '70%' }}
            />
          </>
        ) : stepType !== 'end' && stepType !== 'stop' ? (
          // Standard single handle for most nodes
          <Handle
            type="source"
            position={Position.Right}
            className="w-4 h-4 bg-gray-400 border-2 border-white hover:bg-gray-600 transition-colors shadow-lg"
            style={{ right: -8 }}
          />
        ) : null}
      </div>
    </TooltipProvider>
  );
};

export default CustomNodeMapper;
