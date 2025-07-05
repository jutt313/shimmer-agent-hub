
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
import { Copy, Check, Download, Search, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
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
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopy = async (data: any, tabName: string) => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopiedTab(tabName);
      toast({
        title: "Copied successfully",
        description: `${tabName} data copied to clipboard`,
      });
      
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
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
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
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
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatJson = (data: any) => {
    if (!data) return 'null';
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return 'Error formatting JSON data';
    }
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: yellow; color: black;">$1</mark>');
  };

  const getDataStats = (data: any) => {
    if (!data) return null;
    
    if (data.nodes && data.edges) {
      // Diagram data
      const aiAgentCount = data.nodes.filter((n: any) => n.data?.isRecommended || n.type === 'aiAgentNode').length;
      const conditionCount = data.nodes.filter((n: any) => n.type?.includes('condition')).length;
      const platformCount = [...new Set(data.nodes.map((n: any) => n.data?.platform).filter(Boolean))].length;
      
      return {
        nodes: data.nodes.length,
        edges: data.edges.length,
        nodeTypes: [...new Set(data.nodes.map((n: any) => n.type))],
        conditionNodes: conditionCount,
        aiAgentNodes: aiAgentCount,
        platformNodes: platformCount,
        hasMetadata: !!data.metadata
      };
    } else if (data.steps) {
      // Blueprint data
      const conditionSteps = data.steps.filter((s: any) => s.type === 'condition').length;
      const aiSteps = data.steps.filter((s: any) => s.type === 'ai_agent_call' || s.is_recommended).length;
      const platforms = [...new Set(data.steps.map((s: any) => s.action?.integration).filter(Boolean))];
      
      return {
        steps: data.steps.length,
        trigger: data.trigger?.type || 'none',
        version: data.version || 'unknown',
        conditionSteps,
        aiSteps,
        platforms: platforms.length,
        platformsList: platforms
      };
    }
    
    return null;
  };

  const diagramStats = getDataStats(diagramData);
  const blueprintStats = getDataStats(blueprintData);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Diagram JSON Debug Console
              </span>
              <Badge variant="outline" className="text-xs">
                Developer Tool
              </Badge>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search functionality */}
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search in JSON data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="px-3"
              >
                Clear
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="diagram" className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="diagram" className="flex items-center gap-2">
              Diagram Data
              {diagramStats && (
                <Badge variant="secondary" className="text-xs">
                  {diagramStats.nodes} nodes • {diagramStats.edges} edges
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="blueprint" className="flex items-center gap-2">
              Blueprint Data
              {blueprintStats && (
                <Badge variant="secondary" className="text-xs">
                  {blueprintStats.steps} steps • {blueprintStats.trigger}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagram" className="flex-1 flex flex-col mt-4">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">Diagram Structure</h3>
                {diagramStats && (
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {diagramStats.nodes} nodes
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {diagramStats.edges} connections
                    </Badge>
                    {diagramStats.aiAgentNodes > 0 && (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                        {diagramStats.aiAgentNodes} AI agents
                      </Badge>
                    )}
                    {diagramStats.conditionNodes > 0 && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        {diagramStats.conditionNodes} conditions
                      </Badge>
                    )}
                    {diagramStats.platformNodes > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        {diagramStats.platformNodes} platforms
                      </Badge>
                    )}
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
              <pre 
                className="p-4 text-sm text-gray-800 font-mono leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: highlightSearchTerm(formatJson(diagramData), searchTerm)
                }}
              />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="blueprint" className="flex-1 flex flex-col mt-4">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">Blueprint Structure</h3>
                {blueprintStats && (
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {blueprintStats.steps} steps
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {blueprintStats.trigger} trigger
                    </Badge>
                    {blueprintStats.aiSteps > 0 && (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                        {blueprintStats.aiSteps} AI steps
                      </Badge>
                    )}
                    {blueprintStats.conditionSteps > 0 && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        {blueprintStats.conditionSteps} conditions
                      </Badge>
                    )}
                    {blueprintStats.platforms > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        {blueprintStats.platforms} platforms
                      </Badge>
                    )}
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
              <pre 
                className="p-4 text-sm text-gray-800 font-mono leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: highlightSearchTerm(formatJson(blueprintData), searchTerm)
                }}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* Enhanced footer with data insights */}
        <div className="flex-shrink-0 pt-4 border-t bg-gray-50 rounded-b-lg p-4 mt-4">
          <div className="text-sm text-gray-600">
            <strong>Debug Info:</strong> Generated at {new Date().toLocaleString()} • 
            Total Data Size: {JSON.stringify({ diagramData, blueprintData }).length} characters
            {searchTerm && (
              <span className="ml-2">
                • Searching for: <strong>"{searchTerm}"</strong>
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JsonDebugModal;
