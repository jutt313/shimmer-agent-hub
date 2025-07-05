import React from 'react';
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
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getNodeIcon = (iconName: string, platform?: string) => {
  // Platform-specific icons
  if (platform) {
    switch (platform.toLowerCase()) {
      case 'hubspot': return <PlugZap className="w-5 h-5" />;
      case 'salesforce': return <PlugZap className="w-5 h-5" />;
      case 'slack': return <PlugZap className="w-5 h-5" />;
      case 'gmail': return <PlugZap className="w-5 h-5" />;
      case 'zapier': return <PlugZap className="w-5 h-5" />;
      default: return <PlugZap className="w-5 h-5" />;
    }
  }

  // Generic icons based on step type
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
  const baseStyle = "relative rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl";
  
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
  const {
    label,
    stepType,
    explanation,
    isRecommended = false,
    platform,
    icon = 'Zap',
    branches = [],
    onAdd,
    onDismiss
  } = data;

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Could implement detailed info modal here
    console.log('Node info:', { label, stepType, explanation, data });
  };

  return (
    <TooltipProvider>
      <div className={`${getNodeStyle(stepType, isRecommended)} min-w-[240px] max-w-[320px] p-4`}>
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
          {/* Icon */}
          <div className={`flex-shrink-0 p-2 rounded-xl ${
            isRecommended 
              ? 'bg-emerald-100 text-emerald-600' 
              : stepType === 'trigger' 
                ? 'bg-purple-100 text-purple-600'
                : stepType === 'condition'
                  ? 'bg-orange-100 text-orange-600'
                  : stepType === 'ai_agent_call'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-blue-100 text-blue-600'
          }`}>
            {getNodeIcon(icon, platform)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-gray-800 leading-tight line-clamp-2">
                {label}
              </h3>
              
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

            {/* Platform Badge */}
            {platform && (
              <Badge variant="secondary" className="mt-2 text-xs">
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
              className="w-3 h-3 bg-gray-400 border-2 border-white hover:bg-gray-600 transition-colors"
              style={{ 
                right: -6, 
                top: `${30 + (index * 20)}%`,
                backgroundColor: branch.color || '#8b5cf6'
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
              style={{ right: -6, top: '40%' }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="failure"
              className="w-3 h-3 bg-red-500 border-2 border-white hover:bg-red-600 transition-colors"
              style={{ right: -6, top: '60%' }}
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
