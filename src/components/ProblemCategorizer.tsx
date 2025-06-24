
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Plus, AlertTriangle } from "lucide-react";

interface ProblemData {
  problem: string;
  category: string;
  solution: string;
  steps?: string[];
  platforms?: string[];
  error_type?: string;
}

interface ProblemCategorizerProps {
  problemData: ProblemData;
  onSave: () => void;
  onDismiss: () => void;
}

const ProblemCategorizer = ({ problemData, onSave, onDismiss }: ProblemCategorizerProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('universal_knowledge_store')
        .insert({
          category: getCategoryType(problemData.category),
          title: problemData.problem.substring(0, 100),
          summary: problemData.problem,
          details: {
            solution: problemData.solution,
            steps: problemData.steps || [],
            platforms: problemData.platforms || [],
            error_type: problemData.error_type || 'general',
            auto_categorized: true
          },
          tags: extractTags(problemData),
          priority: 2,
          source_type: 'ai_categorized'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Problem Stored",
        description: "The problem and solution have been saved to the knowledge store.",
      });

      onSave();
    } catch (error) {
      console.error('Error saving problem:', error);
      toast({
        title: "Error",
        description: "Failed to save the problem to knowledge store.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryType = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'workflow': 'workflow_patterns',
      'platform': 'platform_knowledge',
      'error': 'error_solutions',
      'automation': 'automation_patterns',
      'credential': 'credential_knowledge',
      'agent': 'agent_recommendations'
    };
    return categoryMap[category.toLowerCase()] || 'automation_patterns';
  };

  const extractTags = (data: ProblemData): string[] => {
    const tags = [];
    if (data.platforms) tags.push(...data.platforms);
    if (data.error_type) tags.push(data.error_type);
    if (data.category) tags.push(data.category);
    return [...new Set(tags.map(tag => tag.toLowerCase()))];
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-800">Problem Categorized</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Category</h4>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {problemData.category}
          </Badge>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Problem</h4>
          <p className="text-sm text-gray-700 bg-white p-3 rounded border">
            {problemData.problem}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-800 mb-2">Solution</h4>
          <p className="text-sm text-gray-700 bg-white p-3 rounded border">
            {problemData.solution}
          </p>
        </div>

        {problemData.steps && problemData.steps.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Steps</h4>
            <ol className="list-decimal list-inside text-sm text-gray-700 bg-white p-3 rounded border">
              {problemData.steps.map((step, index) => (
                <li key={index} className="mb-1">{step}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Add to Knowledge Store'}
          </Button>
          <Button 
            onClick={onDismiss} 
            variant="outline"
            className="border-gray-300"
          >
            <X className="w-4 h-4 mr-2" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProblemCategorizer;
