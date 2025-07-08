import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Send, Bot, User, Loader2, X } from 'lucide-react';
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
const HelpChatModal = ({
  isOpen,
  onClose,
  initialMessage,
  initialContext
}: HelpChatModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat with welcome message and handle initial message
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hi! I'm your AI assistant. I can help you with automations, troubleshooting, and platform features. How can I assist you today?${initialContext ? `\n\nContext: ${initialContext}` : ''}`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      if (initialMessage) {
        setInputMessage(initialMessage);
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
      const {
        data,
        error
      } = await supabase.functions.invoke('knowledge-ai-chat', {
        body: {
          message: userMessage.content,
          category: 'general_help',
          userRole: 'user'
        }
      });
      if (error) throw error;
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || 'Sorry, I encountered an issue. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Help chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I\'m having trouble connecting. Please check your connection and try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
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
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] bg-white border border-blue-200 shadow-2xl rounded-2xl p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">AI Help Assistant</h3>
          </div>
          
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4">
            
          </ScrollArea>
        </div>

        {/* Input Area with Glow Effect */}
        <div className="p-4 border-t border-blue-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-sm opacity-20"></div>
            <div className="relative flex gap-2">
              <Input ref={inputRef} placeholder="Ask me anything..." value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} disabled={isLoading} className="flex-1 bg-white border-blue-200 rounded-xl focus:border-blue-400 focus:ring-blue-400/30" />
              <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()} className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" size="sm">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default HelpChatModal;