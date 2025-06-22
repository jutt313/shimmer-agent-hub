
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, MessageSquare, Lightbulb, X, Loader2 } from "lucide-react";

interface ErrorAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    message: string;
    stack?: string;
    fileName?: string;
    userAction?: string;
  };
}

const ErrorAnalysisModal = ({ isOpen, onClose, error }: ErrorAnalysisModalProps) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const { toast } = useToast();

  const analyzeError = async () => {
    setIsLoading(true);
    try {
      const { data, error: analysisError } = await supabase.functions.invoke('error-analyzer', {
        body: {
          error: error.message,
          stackTrace: error.stack,
          fileName: error.fileName,
          userAction: error.userAction,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (analysisError) throw analysisError;

      setAnalysis(data.analysis);
      toast({
        title: "Error Analyzed",
        description: "AI has analyzed your error and provided a solution.",
      });
    } catch (err) {
      console.error('Error analysis failed:', err);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const askFollowUp = async () => {
    if (!chatMessage.trim()) return;

    setIsLoading(true);
    try {
      const { data, error: chatError } = await supabase.functions.invoke('knowledge-ai-chat', {
        body: {
          message: `I have this error: "${error.message}". ${chatMessage}`,
          context: analysis
        }
      });

      if (chatError) throw chatError;

      setChatResponse(data.response);
      setChatMessage("");
    } catch (err) {
      console.error('Chat failed:', err);
      toast({
        title: "Chat Failed",
        description: "Could not get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <DialogTitle className="text-xl">Error Analysis</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
            <p className="text-red-700 text-sm mb-2">{error.message}</p>
            {error.fileName && (
              <Badge variant="outline" className="bg-red-100 text-red-700">
                File: {error.fileName}
              </Badge>
            )}
          </div>

          {/* Analysis Section */}
          <div className="space-y-4">
            {!analysis && (
              <Button 
                onClick={analyzeError} 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Error...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Get AI Analysis & Solution
                  </>
                )}
              </Button>
            )}

            {analysis && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI Analysis & Solution
                </h3>
                <div className="text-green-700 text-sm whitespace-pre-wrap">
                  {analysis}
                </div>
              </div>
            )}
          </div>

          {/* Chat Section */}
          {analysis && (
            <div className="border-t pt-4">
              <Button
                onClick={() => setShowChat(!showChat)}
                variant="outline"
                className="mb-4"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {showChat ? 'Hide Chat' : 'Ask Follow-up Questions'}
              </Button>

              {showChat && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask for more help about this error..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1"
                      rows={2}
                    />
                    <Button 
                      onClick={askFollowUp}
                      disabled={isLoading || !chatMessage.trim()}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Ask'
                      )}
                    </Button>
                  </div>

                  {chatResponse && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">AI Assistant Response</h4>
                      <div className="text-blue-700 text-sm whitespace-pre-wrap">
                        {chatResponse}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorAnalysisModal;
