
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getPlatformIconConfig, getStepTypeIcon } from '@/utils/platformIcons';

const getNodeIcon = (iconName: string, platform?: string, stepType?: string) => {
  // Use platform icons first
  if (platform) {
    const { icon: PlatformIcon } = getPlatformIconConfig(platform);
    return <PlatformIcon className="w-5 h-5" />;
  }

  // Use step type icons
  if (stepType) {
    const { icon: StepIcon } = getStepTypeIcon(stepType);
    return <StepIcon className="w-5 h-5" />;
  }

  // Fallback to generic icons
  switch (iconName) {
    case 'Zap': return <Zap className="w-5 h-5" />;
    case 'GitFork': return <GitFork className="w-5 h-5" />;
    case 'Repeat': return <Repeat className="w-5 h-5" />;
    case 'RefreshCw': return <RefreshCw className="w-5 h-5" />;
    case 'CornerDownRight': return <CornerDownRight className="w-5 h-5" />;
    case 'Bot': return <Bot className="w-5 h-5" />;
    case 'Clock': return <Clock className="w-5 h-5" />;
    case 'PlugZap': return <PlugZap className="w-5 h-5" />;
    case 'Flag': return <Flag className="w-5 h-5" />;
    case 'Settings': return <Settings className="w-5 h-5" />;
    case 'Play': return <Play className="w-5 h-5" />;
    default: return <Zap className="w-5 h-5" />;
  }
};

const getNodeStyle = (stepType: string, isRecommended: boolean = false) => {
  const baseStyle = "relative rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl cursor-pointer";
  
  if (isRecommended) {
    return `${baseStyle} bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-300 hover:border-emerald-400`;
  }

  switch (stepType) {
    case 'trigger':
      return `${baseStyle} bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300 hover:border-purple-400`;
    case 'condition':
      return `${baseStyle} bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-300 hover:border-orange-400`;
    case 'ai_agent_call':
      return `${baseStyle} bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 hover:border-emerald-400`;
    case 'loop':
      return `${baseStyle} bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 hover:border-indigo-400`;
    case 'retry':
      return `${baseStyle} bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 hover:border-amber-400`;
    case 'delay':
      return `${baseStyle} bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300 hover:border-gray-400`;
    case 'end':
    case 'stop':
      return `${baseStyle} bg-gradient-to-br from-red-50 to-pink-50 border-red-300 hover:border-red-400`;
    default:
      return `${baseStyle} bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-400`;
  }
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

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Node info:', { label, stepType, explanation, data });
  };

  const getDetailedDescription = () => {
    let details = explanation || 'No detailed information available.';
    
    if (trigger) {
      details += `\n\nTrigger Type: ${trigger.type}`;
      if (trigger.platform) details += `\nPlatform: ${trigger.platform}`;
      if (trigger.cron_expression) details += `\nSchedule: ${trigger.cron_expression}`;
    }
    
    if (action) {
      details += `\n\nIntegration: ${action.integration}`;
      details += `\nMethod: ${action.method}`;
      if (action.parameters && Object.keys(action.parameters).length > 0) {
        details += `\nParameters: ${Object.keys(action.parameters).join(', ')}`;
      }
    }
    
    if (condition && condition.cases) {
      details += `\n\nCondition Branches: ${condition.cases.length}`;
      condition.cases.forEach((c: any, i: number) => {
        details += `\n  ${i + 1}. ${c.label}: ${c.expression}`;
      });
    }
    
    if (loop) {
      details += `\n\nLoop Source: ${loop.array_source}`;
      details += `\nLoop Steps: ${loop.steps?.length || 0}`;
    }
    
    if (delay) {
      details += `\n\nDelay Duration: ${delay.duration_seconds} seconds`;
    }
    
    if (retry) {
      details += `\n\nMax Attempts: ${retry.max_attempts}`;
      details += `\nRetry Steps: ${retry.steps?.length || 0}`;
    }
    
    if (ai_agent_call) {
      details += `\n\nAI Agent: ${ai_agent_call.agent_id}`;
      details += `\nInput: ${ai_agent_call.input_prompt}`;
      details += `\nOutput Variable: ${ai_agent_call.output_variable}`;
    }
    
    return details;
  };

  const getPlatformIconColor = () => {
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

  return (
    <TooltipProvider>
      <div 
        className={`${getNodeStyle(stepType, isRecommended)} min-w-[280px] max-w-[380px] p-4 ${isExpanded ? 'min-h-[200px]' : ''}`}
        onClick={handleNodeClick}
      >
        {/* AI Recommendation Actions */}
        {isRecommended && (onAdd || onDismiss) && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            {onAdd && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
                className="w-6 h-6 p-0 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
              >
                <Plus className="w-3 h-3" />
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
                className="w-6 h-6 p-0 rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-lg"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Main Node Content */}
        <div className="flex items-start gap-3">
          {/* Platform/Step Icon */}
          <div 
            className="flex-shrink-0 p-2 rounded-xl"
            style={{ 
              backgroundColor: `${getPlatformIconColor()}20`,
              color: getPlatformIconColor()
            }}
          >
            {getNodeIcon(icon, platform, stepType)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-gray-800 leading-tight">
                {label}
              </h3>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNodeClick}
                  className="flex-shrink-0 w-6 h-6 p-0 hover:bg-gray-200 rounded-full"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleInfoClick}
                      className="flex-shrink-0 w-6 h-6 p-0 hover:bg-gray-200 rounded-full"
                    >
                      <Info className="w-3 h-3" />
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
                className="mt-2 text-xs"
                style={{ backgroundColor: `${getPlatformIconColor()}15`, color: getPlatformIconColor() }}
              >
                {platform}
              </Badge>
            )}

            {/* AI Recommendation Badge */}
            {isRecommended && (
              <Badge className="mt-2 bg-emerald-100 text-emerald-700 text-xs">
                AI Recommended
              </Badge>
            )}

            {/* Step Type Badge */}
            <Badge variant="outline" className="mt-1 text-xs capitalize">
              {stepType}
            </Badge>

            {/* Expanded Description */}
            {isExpanded && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
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
          className="w-3 h-3 bg-gray-400 border-2 border-white hover:bg-gray-600 transition-colors"
          style={{ left: -6 }}
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
              className="w-3 h-3 border-2 border-white hover:bg-gray-600 transition-colors"
              style={{ 
                right: -6, 
                top: `${35 + (index * 15)}%`,
                backgroundColor: branch.color || getPlatformIconColor()
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
              className="w-3 h-3 bg-green-500 border-2 border-white hover:bg-green-600 transition-colors"
              style={{ right: -6, top: '35%' }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="failure"
              className="w-3 h-3 bg-red-500 border-2 border-white hover:bg-red-600 transition-colors"
              style={{ right: -6, top: '65%' }}
            />
          </>
        ) : stepType !== 'end' && stepType !== 'stop' ? (
          // Standard single handle for most nodes
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 bg-gray-400 border-2 border-white hover:bg-gray-600 transition-colors"
            style={{ right: -6 }}
          />
        ) : null}
      </div>
    </TooltipProvider>
  );
};

export default CustomNodeMapper;
