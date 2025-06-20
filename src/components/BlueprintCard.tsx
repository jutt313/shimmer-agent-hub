
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Code2, X } from "lucide-react";
import { useState } from "react";
import { AutomationBlueprint } from "@/types/automation";

interface BlueprintCardProps {
  blueprint: AutomationBlueprint;
  onClose: () => void;
}

const BlueprintCard = ({ blueprint, onClose }: BlueprintCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Backdrop overlay only when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* Slide-out panel - positioned from right edge */}
      <div className={`
        fixed top-0 right-0 h-full z-50 transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-[500px]' : 'w-16'}
      `}>
        <Card className="h-full bg-white/95 backdrop-blur-md border-l border-green-200 shadow-2xl rounded-none rounded-l-2xl">
          {/* Tab button - shows when collapsed */}
          {!isExpanded && (
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full
                bg-green-600 text-white p-3 rounded-l-lg cursor-pointer
                hover:bg-green-700 transition-colors shadow-lg z-10"
              onClick={() => setIsExpanded(true)}
            >
              <Code2 className="w-5 h-5" />
            </div>
          )}

          <CardHeader className="pb-2 border-b border-green-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-green-600" />
                {isExpanded && (
                  <CardTitle className="text-lg text-green-800">
                    Automation Blueprint
                  </CardTitle>
                )}
              </div>
              
              <div className="flex gap-2">
                {isExpanded && (
                  <Button
                    onClick={() => setIsExpanded(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-green-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {isExpanded && (
            <CardContent className="pt-4 h-full overflow-hidden">
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="space-y-4">
                  <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-medium mb-1">Blueprint Status:</p>
                    <p>This is the technical specification for your automation. It contains all the configuration details needed for execution.</p>
                  </div>
                  
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-auto leading-relaxed">
                    <code className="text-gray-800">{JSON.stringify(blueprint, null, 2)}</code>
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
};

export default BlueprintCard;
