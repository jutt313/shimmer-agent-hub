
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getPlatformIconConfig } from '@/utils/platformIcons';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface PlatformNodeData {
  label: string;
  icon?: string;
  platform?: string;
  action?: any;
  explanation?: string;
  isRecommended?: boolean;
  onAdd?: () => void;
  onDismiss?: () => void;
}

interface PlatformNodeProps {
  data: PlatformNodeData;
  selected?: boolean;
}

const PlatformNode: React.FC<PlatformNodeProps> = ({ data, selected }) => {
  const iconConfig = getPlatformIconConfig(data.platform || '', data.action?.method);
  const IconComponent = iconConfig.icon;
  const isRecommended = data.isRecommended;

  return (
    <div 
      className={`relative group transition-all duration-300 ${
        isRecommended ? 'animate-pulse' : ''
      }`}
    >
      {/* Recommendation overlay buttons */}
      {isRecommended && (
        <div className="absolute -top-2 -right-2 flex gap-1 z-10">
          <Button
            size="sm"
            onClick={data.onAdd}
            className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={data.onDismiss}
            className="h-6 w-6 p-0 bg-white hover:bg-gray-50 text-gray-500 border-gray-300 rounded-full shadow-md"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div 
        className={`px-4 py-3 shadow-lg rounded-xl border-2 transition-all duration-300 min-w-[180px] max-w-[220px] bg-white/95 backdrop-blur-sm ${
          selected ? 'border-blue-300 shadow-blue-100 shadow-xl scale-105' : 'border-slate-200 hover:border-slate-300'
        } ${isRecommended ? 'border-green-300 bg-green-50/50' : ''}`}
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
        
        <div className="flex items-center space-x-3">
          <div 
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{ 
              backgroundColor: `${iconConfig.color}20`,
              border: `1px solid ${iconConfig.color}40`
            }}
          >
            {IconComponent && (
              <IconComponent 
                className="w-4 h-4" 
                style={{ color: iconConfig.color }} 
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {data.platform || data.label}
            </div>
            {isRecommended && (
              <div className="text-xs text-green-600 font-medium">
                Recommended
              </div>
            )}
          </div>
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
          {data.explanation || `${data.action?.method || 'Action'} on ${data.platform || 'platform'}`}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
        
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-slate-100 !border-2 !border-slate-300 !rounded-full"
        />
      </div>
    </div>
  );
};

export default PlatformNode;
