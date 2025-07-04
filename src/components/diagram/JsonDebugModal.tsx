
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check, Download } from 'lucide-react';
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
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const handleCopy = async (data: any, tabName: string) => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopiedTab(tabName);
      toast({
        title: "Copied to clipboard",
        description: `${tabName} data copied successfully`,
      });
      
      // Reset copy status after 2 seconds
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (data: any, filename: string) => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `${filename}.json is being downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the file",
        variant: "destructive",
      });
    }
  };

  const formatJson = (data: any) => {
    if (!data) return 'null';
    return JSON.stringify(data, null, 2);
  };

  const getDataStats = (data: any) => {
    if (!data) return null;
    
    if (data.nodes && data.edges) {
      // Diagram data
      return {
        nodes: data.nodes.length,
        edges: data.edges.length,
        nodeTypes: [...new Set(data.nodes.map((n: any) => n.type))],
      };
    } else if (data.steps) {
      // Blueprint data
      return {
        steps: data.steps.length,
        trigger: data.trigger?.type || 'none',
        version: data.version || 'unknown',
      };
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Diagram JSON Debug
            </span>
            <Badge variant="outline" className="text-xs">
              Developer Tool
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="diagram" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diagram" className="flex items-center gap-2">
              Diagram Data
              {diagramData && (
                <Badge variant="secondary" className="text-xs">
                  {getDataStats(diagramData)?.nodes || 0} nodes
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="blueprint" className="flex items-center gap-2">
              Blueprint Data
              {blueprintData && (
                <Badge variant="secondary" className="text-xs">
                  {getDataStats(blueprintData)?.steps || 0} steps
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagram" className="flex-1 flex flex-col mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">Diagram Structure</h3>
                {diagramData && getDataStats(diagramData) && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getDataStats(diagramData)!.nodes} nodes
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getDataStats(diagramData)!.edges} edges
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(diagramData, 'Diagram')}
                  className="flex items-center gap-2"
                >
                  {copiedTab === 'Diagram' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(diagramData, 'automation-diagram')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 border rounded-lg bg-gray-50">
              <pre className="p-4 text-sm text-gray-800 font-mono">
                {formatJson(diagramData)}
              </pre>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="blueprint" className="flex-1 flex flex-col mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">Blueprint Structure</h3>
                {blueprintData && getDataStats(blueprintData) && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getDataStats(blueprintData)!.steps} steps
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getDataStats(blueprintData)!.trigger} trigger
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(blueprintData, 'Blueprint')}
                  className="flex items-center gap-2"
                >
                  {copiedTab === 'Blueprint' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(blueprintData, 'automation-blueprint')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 border rounded-lg bg-gray-50">
              <pre className="p-4 text-sm text-gray-800 font-mono">
                {formatJson(blueprintData)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default JsonDebugModal;
