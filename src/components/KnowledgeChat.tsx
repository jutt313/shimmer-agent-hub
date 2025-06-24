
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Send, Plus, Edit, Trash2, User, Crown } from "lucide-react";
import ProblemCategorizer from "./ProblemCategorizer";
import { analyzeProblem } from "@/utils/problemAnalyzer";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  message: string;
  timestamp: Date;
  actionButtons?: {
    type: 'add' | 'edit' | 'delete';
    data?: any;
  }[];
  showProblemCard?: boolean;
  problemData?: any;
}

interface KnowledgeChatProps {
  onKnowledgeUpdate: () => void;
}

const KnowledgeChat = ({ onKnowledgeUpdate }: KnowledgeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      type: 'system', 
      message: 'Hello! I am your Universal Memory AI. I can help you solve problems and automatically organize solutions in our knowledge store. Just tell me about any issue you\'re facing!', 
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

  const addMessage = (message: string, type: 'user' | 'ai' | 'system' = 'user', actionButtons?: any[], showProblemCard = false, problemData?: any) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      actionButtons,
      showProblemCard,
      problemData
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg.id;
  };

  const sendToAI = async (message: string) => {
    setIsLoading(true);
    try {
      // Get relevant knowledge for context
      const { data: knowledgeData, error: knowledgeError } = await supabase
        .from('universal_knowledge_store')
        .select('*')
        .or(`title.ilike.%${message}%,summary.ilike.%${message}%,tags.cs.{${message.toLowerCase()}}`)
        .limit(3);

      const knowledgeContext = knowledgeData && knowledgeData.length > 0 
        ? `\n\nRelevant Knowledge:\n${knowledgeData.map(k => `- ${k.title}: ${k.summary}`).join('\n')}`
        : '';

      const { data, error } = await supabase.functions.invoke('knowledge-ai-chat', {
        body: { 
          message: message + knowledgeContext,
          category: selectedCategory || null,
          userRole: 'founder',
          context: 'problem_solving'
        }
      });

      if (error) throw error;
      
      let aiResponse = data.response
        .replace(/[#$%&'*]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Analyze if this is a problem that should be categorized
      const problemAnalysis = analyzeProblem(message, aiResponse);
      
      let messageId;
      if (problemAnalysis) {
        // Add AI response with problem card
        messageId = addMessage(
          aiResponse, 
          'ai', 
          undefined, 
          true, 
          problemAnalysis
        );
      } else {
        // Regular AI response
        messageId = addMessage(aiResponse, 'ai');
      }

    } catch (error) {
      console.error('AI Chat Error:', error);
      addMessage("Sorry, I encountered an issue. Please try again.", 'system');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      let fullMessage = newMessage;
      
      if (selectedCategory) {
        fullMessage = `Context: ${selectedCategory.replace('_', ' ')} - ${newMessage}`;
      }
      
      addMessage(fullMessage);
      sendToAI(fullMessage);
      setNewMessage("");
      setSelectedCategory("");
    }
  };

  const handleProblemSaved = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, showProblemCard: false }
        : msg
    ));
    onKnowledgeUpdate();
    toast({
      title: "Knowledge Updated",
      description: "Problem and solution have been added to the knowledge store.",
    });
  };

  const handleProblemDismissed = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, showProblemCard: false }
        : msg
    ));
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <Crown className="h-4 w-4 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-800">Universal Memory AI</h3>
        </div>
        <p className="text-sm text-gray-600">Your personal problem-solving and knowledge management AI</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Problem Categorizer Card */}
              {msg.showProblemCard && msg.problemData && (
                <div className="mt-3">
                  <ProblemCategorizer
                    problemData={msg.problemData}
                    onSave={() => handleProblemSaved(msg.id)}
                    onDismiss={() => handleProblemDismissed(msg.id)}
                  />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl">
                <Bot className="w-4 h-4 inline mr-2 animate-pulse text-blue-600" />
                <span className="text-sm">AI is analyzing your problem...</span>
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
            <SelectValue placeholder="Select category for focused help (optional)" />
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
            placeholder="Describe your problem or ask a question..."
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
