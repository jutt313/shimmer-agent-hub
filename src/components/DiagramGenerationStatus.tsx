
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Settings } from 'lucide-react';

interface DiagramGenerationStatusProps {
  isGenerating: boolean;
  hasBlueprint: boolean;
  hasDiagramData: boolean;
  blueprintStepCount?: number;
  diagramNodeCount?: number;
  lastGenerated?: string;
  onRegenerate?: () => void;
  onFallbackGenerate?: () => void;
}

const DiagramGenerationStatus: React.FC<DiagramGenerationStatusProps> = ({
  isGenerating,
  hasBlueprint,
  hasDiagramData,
  blueprintStepCount = 0,
  diagramNodeCount = 0,
  lastGenerated,
  onRegenerate,
  onFallbackGenerate
}) => {
  const getStatusInfo = () => {
    if (isGenerating) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
        title: "Generating Diagram",
        description: "AI is creating your automation visualization...",
        variant: "default" as const
      };
    }

    if (hasDiagramData && hasBlueprint) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        title: "Diagram Ready",
        description: `Successfully generated with ${diagramNodeCount} nodes from ${blueprintStepCount} steps`,
        variant: "default" as const
      };
    }

    if (hasBlueprint && !hasDiagramData) {
      return {
        icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
        title: "Blueprint Ready",
        description: `Blueprint available with ${blueprintStepCount} steps - diagram generation needed`,
        variant: "secondary" as const
      };
    }

    if (!hasBlueprint && !hasDiagramData) {
      return {
        icon: <AlertCircle className="w-4 h-4 text-gray-500" />,
        title: "Waiting for Data",
        description: "No blueprint or diagram data available yet",
        variant: "outline" as const
      };
    }

    return {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      title: "Data Mismatch",
      description: "Diagram data exists but no blueprint found",
      variant: "destructive" as const
    };
  };

  const status = getStatusInfo();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {status.icon}
          {status.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-600">{status.description}</p>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant={hasBlueprint ? "default" : "secondary"} className="text-xs">
            Blueprint: {hasBlueprint ? `${blueprintStepCount} steps` : 'Missing'}
          </Badge>
          <Badge variant={hasDiagramData ? "default" : "secondary"} className="text-xs">
            Diagram: {hasDiagramData ? `${diagramNodeCount} nodes` : 'Missing'}
          </Badge>
        </div>

        {lastGenerated && (
          <p className="text-xs text-gray-500">
            Last generated: {new Date(lastGenerated).toLocaleString()}
          </p>
        )}

        <div className="flex gap-2">
          {hasBlueprint && !isGenerating && onRegenerate && (
            <Button
              onClick={onRegenerate}
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Generate
            </Button>
          )}
          
          {hasBlueprint && !hasDiagramData && onFallbackGenerate && (
            <Button
              onClick={onFallbackGenerate}
              size="sm"
              variant="secondary"
              className="flex-1 text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              Fallback
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiagramGenerationStatus;
