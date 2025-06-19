
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
    <div className={`
      fixed bottom-6 left-6 right-6 z-30 transition-all duration-300 ease-in-out
      ${isExpanded ? 'h-80' : 'h-16'}
    `}>
      <Card className="h-full bg-white/90 backdrop-blur-md border border-green-200 shadow-2xl">
        <CardHeader 
          className="pb-2 cursor-pointer flex-row items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">
                Automation Blueprint
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isExpanded ? 
                <ChevronLeft className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </Button>
          </div>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0 h-full">
            <ScrollArea className="h-60">
              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-auto">
                <code>{JSON.stringify(blueprint, null, 2)}</code>
              </pre>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default BlueprintCard;
