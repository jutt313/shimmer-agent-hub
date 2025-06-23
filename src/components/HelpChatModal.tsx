
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User,
  Loader2,
  X,
  HelpCircle
} from 'lucide-react';

interface HelpChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  initialContext?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const HelpChatModal = ({ isOpen, onClose, initialMessage, initialContext }: HelpChatModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat with welcome message and handle initial message
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hello! I'm your AI assistant for this automation platform. I can help you with:

• Understanding notifications and their meanings
• Troubleshooting errors and technical issues  
• Explaining how automations work
• Managing AI agents and credentials
• Platform features and workflows
• General questions about the tool

${initialContext ? `\n**Context:** ${initialContext}\n` : ''}

How can I assist you today?`,
        timestamp: new Date().toISOString()
      };

      setMessages([welcomeMessage]);
      
      if (initialMessage) {
        setInputMessage(initialMessage);
        // Auto-focus input so user can send the pre-filled message
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      setIsInitialized(true);
    }
  }, [isOpen, isInitialized, initialMessage, initialContext]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      setMessages([]);
      setInputMessage('');
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('knowledge-ai-chat', {
        body: {
          message: userMessage.content,
          category: 'general_help',
          userRole: 'user'
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an issue processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Help chat error:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please check your connection and try again, or contact support if the issue persists.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    "How do I create an automation?",
    "What do these notifications mean?",
    "How to fix connection errors?",
    "Explain AI agent settings",
    "Platform credentials help"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Help Assistant
              </DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 p-6 pt-4 overflow-hidden flex flex-col">
          <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] ${message.role === 'user' ? 'order-2' : ''}`}>
                    <Card className={`p-3 ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                        : 'bg-white/80 backdrop-blur-sm border-gray-200'
                    } shadow-lg`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </Card>
                    <div className={`text-xs text-gray-500 mt-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <Card className="p-3 bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions (only show if no messages yet) */}
          {messages.length <= 1 && (
            <div className="mt-4 flex-shrink-0">
              <p className="text-sm text-gray-600 mb-2">Quick help topics:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage(action)}
                    className="text-xs rounded-full bg-white/80 backdrop-blur-sm hover:bg-blue-50"
                  >
                    <HelpCircle className="w-3 h-3 mr-1" />
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2 mt-4 flex-shrink-0">
            <Input
              ref={inputRef}
              placeholder="Ask me anything about the platform..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 rounded-xl bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg focus:ring-2 focus:ring-blue-500/50"
            />
            <Button 
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpChatModal;
