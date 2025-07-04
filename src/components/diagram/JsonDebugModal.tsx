
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface JsonDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramData: { nodes: any[]; edges: any[]; warning?: string } | null;
  blueprintData: any;
}

const JsonDebugModal: React.FC<JsonDebugModalProps> = ({
  isOpen,
  onClose,
  diagramData,
  blueprintData
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('diagram');

  const copyToClipboard = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "JSON data has been copied to your clipboard",
      });
    });
  };

  const formatJson = (data: any) => {
    if (!data) return 'No data available';
    return JSON.stringify(data, null, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              JSON Debug Viewer
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diagram">Diagram JSON</TabsTrigger>
            <TabsTrigger value="blueprint">Blueprint JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagram" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Generated Diagram Data</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(diagramData)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {formatJson(diagramData)}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="blueprint" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Automation Blueprint</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(blueprintData)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {formatJson(blueprintData)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default JsonDebugModal;
