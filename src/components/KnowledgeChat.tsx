
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Send, Plus, Edit, Trash2, User, Crown } from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  message: string;
  timestamp: Date;
  actionButtons?: {
    type: 'add' | 'edit' | 'delete';
    data?: any;
  }[];
}

interface KnowledgeChatProps {
  onKnowledgeUpdate: () => void;
}

const KnowledgeChat = ({ onKnowledgeUpdate }: KnowledgeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      type: 'system', 
      message: 'Hello Founder! Universal Memory AI is ready to assist you. I can read the knowledge store and help manage it with your permission.', 
      timestamp: new Date() 
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const categories = [
    'platform_knowledge',
    'credential_knowledge', 
    'workflow_patterns',
    'agent_recommendations',
    'error_solutions',
    'automation_patterns',
    'conversation_insights',
    'summary_templates'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (message: string, type: 'user' | 'ai' | 'system' = 'user', actionButtons?: any[]) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      actionButtons
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const sendToAI = async (message: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-ai-chat', {
        body: { 
          message: message,
          category: selectedCategory || null,
          userRole: 'founder'
        }
      });

      if (error) throw error;
      
      // Clean the response - remove special characters and ensure proper spacing
      const cleanResponse = data.response
        .replace(/[#$%&'*]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Check if AI wants to perform actions
      const actionButtons = [];
      if (cleanResponse.toLowerCase().includes('add') && cleanResponse.toLowerCase().includes('knowledge')) {
        actionButtons.push({ type: 'add', data: null });
      }
      if (cleanResponse.toLowerCase().includes('edit') || cleanResponse.toLowerCase().includes('update')) {
        actionButtons.push({ type: 'edit', data: null });
      }
      if (cleanResponse.toLowerCase().includes('delete') || cleanResponse.toLowerCase().includes('remove')) {
        actionButtons.push({ type: 'delete', data: null });
      }
      
      addMessage(cleanResponse, 'ai', actionButtons.length > 0 ? actionButtons : undefined);
    } catch (error) {
      console.error('AI Chat Error:', error);
      addMessage("Sorry Founder, I encountered an issue. Please try again.", 'system');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      let fullMessage = newMessage;
      
      if (selectedCategory) {
        fullMessage = `Context ${selectedCategory.replace('_', ' ')}: ${newMessage}`;
      }
      
      addMessage(fullMessage);
      sendToAI(fullMessage);
      setNewMessage("");
      setSelectedCategory("");
    }
  };

  const handleAction = async (actionType: string) => {
    if (actionType === 'add') {
      addMessage("I will help you add a new knowledge entry. Please tell me what you want to add and I will prepare it for you.", 'system');
    } else if (actionType === 'edit') {
      addMessage("I will help you edit existing knowledge. Please specify what you want to modify.", 'system');
    } else if (actionType === 'delete') {
      addMessage("I will help you delete knowledge entries. Please specify what you want to remove.", 'system');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <Crown className="h-4 w-4 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
        </div>
        <p className="text-sm text-gray-600">Your personal knowledge management AI</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-xs">
                <div className={`px-4 py-3 rounded-2xl text-sm ${
                  msg.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : msg.type === 'ai'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
                  {msg.type === 'user' && <User className="w-4 h-4 inline mr-2" />}
                  {msg.type === 'ai' && <Bot className="w-4 h-4 inline mr-2 text-blue-600" />}
                  <span>{msg.message}</span>
                </div>
                
                {/* Action Buttons */}
                {msg.actionButtons && msg.actionButtons.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {msg.actionButtons.map((action, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(action.type)}
                        className="text-xs"
                      >
                        {action.type === 'add' && <Plus className="w-3 h-3 mr-1" />}
                        {action.type === 'edit' && <Edit className="w-3 h-3 mr-1" />}
                        {action.type === 'delete' && <Trash2 className="w-3 h-3 mr-1" />}
                        {action.type.charAt(0).toUpperCase() + action.type.slice(1)}
                      </Button>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl">
                <Bot className="w-4 h-4 inline mr-2 animate-pulse text-blue-600" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select category for focused help" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            {categories.map(cat => (
              <SelectItem key={cat} value={cat} className="hover:bg-blue-50">
                {cat.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Input
            placeholder="Ask your AI assistant..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="text-sm"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeChat;
