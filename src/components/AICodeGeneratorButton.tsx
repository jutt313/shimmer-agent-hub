
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AICodeGeneratorButtonProps {
  automationId: string;
  onCodeGenerated?: (code: string) => void;
}

const AICodeGeneratorButton = ({ automationId, onCodeGenerated }: AICodeGeneratorButtonProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerateCode = async () => {
    if (!user || isGenerating) return;

    setIsGenerating(true);
    toast.info('🤖 AI is generating custom execution code...');

    try {
      const { data, error } = await supabase.functions.invoke('ai-execution-code-generator', {
        body: {
          automation_id: automationId,
          user_id: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        setIsGenerated(true);
        toast.success('✅ AI execution code generated successfully!', {
          description: `Generated ${data.code_length} characters of code using ${data.agents_count} agents and ${data.credentials_count} credentials`
        });
        onCodeGenerated?.(data.generated_code);
      } else {
        throw new Error(data.error || 'Code generation failed');
      }

    } catch (error: any) {
      console.error('❌ Code generation failed:', error);
      toast.error('Failed to generate execution code', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateCode}
      disabled={isGenerating}
      className={`${isGenerated ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          AI Generating...
        </>
      ) : isGenerated ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Code Generated
        </>
      ) : (
        <>
          <Zap className="w-4 h-4 mr-2" />
          Generate AI Code
        </>
      )}
    </Button>
  );
};

export default AICodeGeneratorButton;
