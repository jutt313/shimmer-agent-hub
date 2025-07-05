
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AutomationBlueprint, AutomationDiagramData } from '@/types/automation';

interface JsonDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramData?: AutomationDiagramData | null;
  blueprintData?: AutomationBlueprint | null;
}

const JsonDebugModal: React.FC<JsonDebugModalProps> = ({
  isOpen,
  onClose,
  diagramData,
  blueprintData
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('diagram');

  const copyToClipboard = (data: any, type: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: `${type} data has been copied to clipboard`,
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy data to clipboard",
        variant: "destructive",
      });
    });
  };

  const downloadJson = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: `${filename}.json has been downloaded`,
    });
  };

  const renderJsonView = (data: any, title: string) => {
    if (!data) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No {title.toLowerCase()} data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Data Stats */}
        <div className="flex flex-wrap gap-2">
          {title === 'Diagram' && diagramData && (
            <>
              <Badge variant="outline">
                {diagramData.nodes?.length || 0} Nodes
              </Badge>
              <Badge variant="outline">
                {diagramData.edges?.length || 0} Edges
              </Badge>
              {(diagramData as any).metadata?.source && (
                <Badge className="bg-emerald-100 text-emerald-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {(diagramData as any).metadata.source}
                </Badge>
              )}
              {(diagramData as any).metadata?.generatedAt && (
                <Badge variant="secondary">
                  {new Date((diagramData as any).metadata.generatedAt).toLocaleString()}
                </Badge>
              )}
            </>
          )}
          {title === 'Blueprint' && blueprintData && (
            <>
              <Badge variant="outline">
                {blueprintData.steps?.length || 0} Steps
              </Badge>
              <Badge variant="outline">
                {blueprintData.trigger?.type || 'No Trigger'}
              </Badge>
              {blueprintData.version && (
                <Badge variant="secondary">
                  v{blueprintData.version}
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(data, title)}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy {title}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadJson(data, title.toLowerCase())}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        {/* JSON Content */}
        <ScrollArea className="h-96 w-full rounded-md border">
          <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </ScrollArea>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Debug OpenAI Diagram Data
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diagram" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Diagram Data
            </TabsTrigger>
            <TabsTrigger value="blueprint" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Blueprint Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagram" className="mt-4">
            {renderJsonView(diagramData, 'Diagram')}
          </TabsContent>

          <TabsContent value="blueprint" className="mt-4">
            {renderJsonView(blueprintData, 'Blueprint')}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default JsonDebugModal;
