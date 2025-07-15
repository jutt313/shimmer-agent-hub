
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircleQuestion, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ErrorHelpButtonProps {
  errorMessage?: string;
  onHelpRequest?: () => void;
}

const ErrorHelpButton = ({ errorMessage, onHelpRequest }: ErrorHelpButtonProps) => {
  const { toast } = useToast();

  const handleHelpClick = () => {
    if (onHelpRequest) {
      onHelpRequest();
    } else {
      // Default help behavior - could open chat or support
      toast({
        title: "Help Available",
        description: "Our AI assistant is ready to help you resolve this issue. Please describe what you were trying to do.",
      });
    }
  };

  return (
    <Button
      onClick={handleHelpClick}
      variant="outline"
      size="sm"
      className="mt-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
    >
      <MessageCircleQuestion className="w-4 h-4 mr-2" />
      Get Help with This Error
      <ExternalLink className="w-3 h-3 ml-1" />
    </Button>
  );
};

export default ErrorHelpButton;
