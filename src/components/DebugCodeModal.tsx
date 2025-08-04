
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code } from 'lucide-react';
import { YusrAIStructuredResponse } from "@/utils/jsonParser";

interface DebugCodeModalProps {
  structuredData: YusrAIStructuredResponse | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DebugCodeModal = ({ structuredData, isOpen, onOpenChange }: DebugCodeModalProps) => {
  if (!structuredData) return null;

  const sections = [
    {
      title: "Summary Code",
      data: structuredData.summary,
      show: !!structuredData.summary
    },
    {
      title: "Steps Code", 
      data: structuredData.steps,
      show: Array.isArray(structuredData.steps) && structuredData.steps.length > 0
    },
    {
      title: "Platforms Code",
      data: structuredData.platforms, 
      show: Array.isArray(structuredData.platforms) && structuredData.platforms.length > 0
    },
    {
      title: "Clarification Questions Code",
      data: structuredData.clarification_questions,
      show: Array.isArray(structuredData.clarification_questions) && structuredData.clarification_questions.length > 0
    },
    {
      title: "Agents Code",
      data: structuredData.agents,
      show: Array.isArray(structuredData.agents) && structuredData.agents.length > 0
    },
    {
      title: "Execution Blueprint Code", 
      data: structuredData.execution_blueprint,
      show: !!structuredData.execution_blueprint
    },
    {
      title: "Test Payload Code",
      data: structuredData.test_payloads,
      show: !!structuredData.test_payloads
    }
  ];

  const visibleSections = sections.filter(section => section.show);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            YusrAI Structured Data Code
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh]">
          <div className="space-y-6">
            {visibleSections.map((section, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-blue-600 border-b pb-2">
                  {section.title}
                </h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                  <code>
                    {JSON.stringify(section.data, null, 2)}
                  </code>
                </pre>
              </div>
            ))}
            
            {visibleSections.length === 0 && (
              <div className="text-center text-gray-500 p-8">
                No structured data sections available
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DebugCodeModal;
