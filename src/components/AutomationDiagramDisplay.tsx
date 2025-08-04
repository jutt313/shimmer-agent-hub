import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Workflow, 
  Play, 
  ArrowRight, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { AutomationBlueprint } from '@/types/automation';

interface AutomationStep {
  id: string;
  name: string;
  type: string;
  status?: 'completed' | 'pending' | 'error';
  platform?: string;
  description?: string;
}

interface AutomationDiagramDisplayProps {
  automationBlueprint?: AutomationBlueprint | null;
  automationDiagramData?: any;
}

const AutomationDiagramDisplay: React.FC<AutomationDiagramDisplayProps> = ({
  automationBlueprint,
  automationDiagramData
}) => {
  // Use blueprint data if available, otherwise create a basic structure
  const blueprint = automationBlueprint || {
    version: '1.0',
    description: 'Default automation workflow',
    trigger: {
      type: 'manual' as const,
      platform: 'Generic'
    },
    steps: automationDiagramData?.steps || []
  };

  function getStatusIcon(status?: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-400" />;
    }
  }

  function getStatusColor(status?: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          Automation Workflow Diagram
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-4 p-4">
            {/* Trigger */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Trigger: {blueprint.trigger.type}</div>
                <div className="text-sm text-muted-foreground">
                  Platform: {blueprint.trigger.platform || 'Generic'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {blueprint.description || 'Automation trigger'}
                </div>
              </div>
              <Badge variant="outline">Start</Badge>
            </div>

            {/* Arrow */}
            {blueprint.steps.length > 0 && (
              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            )}

            {/* Steps */}
            {blueprint.steps.map((step, index) => (
              <React.Fragment key={step.id || index}>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getStatusColor(step.status)}`}>
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      Step {index + 1}: {step.name || `Step ${index + 1}`}
                    </div>
                    {step.platform && (
                      <div className="text-sm text-muted-foreground">
                        Platform: {step.platform}
                      </div>
                    )}
                    {step.action?.integration && (
                      <div className="text-xs text-muted-foreground">
                        {step.action.integration}
                      </div>
                    )}
                  </div>
                  <Badge variant={step.status === 'completed' ? 'default' : 'outline'}>
                    {step.type || 'Action'}
                  </Badge>
                </div>

                {/* Arrow between steps */}
                {index < blueprint.steps.length - 1 && (
                  <div className="flex justify-center">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Empty state */}
            {blueprint.steps.length === 0 && (
              <div className="text-center py-8">
                <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No automation steps configured yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Steps will appear here once your automation is configured
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AutomationDiagramDisplay;
