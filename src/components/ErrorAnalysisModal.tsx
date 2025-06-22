
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, MessageSquare, Lightbulb, X, Loader2, Send } from "lucide-react";

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

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const ErrorAnalysisModal = ({ isOpen, onClose, error }: ErrorAnalysisModalProps) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [conversationId, setConversationId] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const { toast } = useToast();

  const analyzeError = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error: analysisError } = await supabase.functions.invoke('error-analyzer', {
        body: {
          error: error.message,
          stackTrace: error.stack,
          fileName: error.fileName,
          userAction: error.userAction,
          userId: userData.user?.id,
          isNewError: true
        }
      });

      if (analysisError) throw analysisError;

      setAnalysis(data.analysis);
      setConversationId(data.conversationId);
      setConversationHistory(data.conversationHistory || []);
      
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

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !conversationId) return;

    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error: chatError } = await supabase.functions.invoke('error-analyzer', {
        body: {
          conversationId: conversationId,
          chatMessage: chatMessage,
          userId: userData.user?.id,
          isNewError: false
        }
      });

      if (chatError) throw chatError;

      setConversationHistory(data.conversationHistory || []);
      setChatMessage("");
    } catch (err) {
      console.error('Chat failed:', err);
      toast({
        title: "Chat Failed",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <DialogTitle className="text-xl">Error Analysis & Chat</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
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

          {/* Initial Analysis */}
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

          {/* Conversation Display */}
          {conversationHistory.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Analysis & Conversation
              </h3>
              
              <div className="max-h-96 overflow-y-auto space-y-3 bg-gray-50 rounded-lg p-4">
                {conversationHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === 'assistant'
                        ? 'bg-green-100 border border-green-200'
                        : 'bg-blue-100 border border-blue-200 ml-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={message.role === 'assistant' ? 'default' : 'secondary'}>
                        {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          {conversationId && (
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask follow-up questions about this error..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-h-[60px]"
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendChatMessage}
                  disabled={isLoading || !chatMessage.trim()}
                  className="px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorAnalysisModal;
