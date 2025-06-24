
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Send, User, Crown, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProblemCategorizer from "./ProblemCategorizer";
import { analyzeProblem } from "@/utils/problemAnalyzer";
import { parseStructuredResponse, cleanDisplayText, StructuredResponse } from "@/utils/jsonParser";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  message: string;
  timestamp: Date;
  showProblemCard?: boolean;
  problemData?: any;
  structuredData?: StructuredResponse;
}

interface KnowledgeChatProps {
  onKnowledgeUpdate: () => void;
}

const KnowledgeChat = ({ onKnowledgeUpdate }: KnowledgeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      type: 'system', 
      message: 'Hello! I am your Universal Memory AI. I can help you solve problems and automatically organize solutions in our knowledge store. Just tell me about any automation you want to create!', 
      timestamp: new Date() 
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
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

  const addMessage = (message: string, type: 'user' | 'ai' | 'system' = 'user', showProblemCard = false, problemData?: any, structuredData?: StructuredResponse) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      showProblemCard,
      problemData,
      structuredData
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg.id;
  };

  const sendToAI = async (message: string) => {
    setIsLoading(true);
    try {
      console.log('Sending message to AI:', message);

      const { data, error } = await supabase.functions.invoke('knowledge-ai-chat', {
        body: { 
          message: message,
          category: selectedCategory || null,
          userRole: 'founder',
          context: 'automation_creation'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('AI response received:', data);
      
      let aiResponse = data.response || "I'm sorry, I couldn't process your request.";

      // Parse structured response from AI
      const structuredData = parseStructuredResponse(aiResponse);
      console.log('Parsed structured data:', structuredData);

      // Analyze if this is a problem that should be categorized
      const problemAnalysis = analyzeProblem(message, aiResponse);
      console.log('Problem analysis:', problemAnalysis);
      
      if (problemAnalysis) {
        // Add AI response with problem card
        addMessage(aiResponse, 'ai', true, problemAnalysis, structuredData);
      } else {
        // Regular AI response with structured data
        addMessage(aiResponse, 'ai', false, undefined, structuredData);
      }

    } catch (error) {
      console.error('AI Chat Error:', error);
      addMessage("Sorry, I encountered an issue. Please try again.", 'system');
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
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

  const handleAgentAdd = (agent: any) => {
    toast({
      title: "Agent Recommended",
      description: `${agent.name} has been suggested for your automation.`,
    });
  };

  const handleAgentDismiss = (agentName: string) => {
    setDismissedAgents(prev => new Set([...prev, agentName]));
  };

  const renderStructuredContent = (structuredData: StructuredResponse) => {
    const content = [];

    // Summary
    if (structuredData.summary) {
      content.push(
        <div key="summary" className="mb-4">
          <h4 className="font-medium text-blue-800 mb-2">Automation Summary</h4>
          <p className="text-sm text-gray-700 bg-white p-3 rounded border">{structuredData.summary}</p>
        </div>
      );
    }

    // Steps
    if (structuredData.steps && structuredData.steps.length > 0) {
      content.push(
        <div key="steps" className="mb-4">
          <h4 className="font-medium text-blue-800 mb-2">Step-by-Step Workflow</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 bg-white p-3 rounded border">
            {structuredData.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      );
    }

    // Platforms
    if (structuredData.platforms && structuredData.platforms.length > 0) {
      content.push(
        <div key="platforms" className="mb-4">
          <h4 className="font-medium text-blue-800 mb-2">Required Platform Credentials</h4>
          <div className="bg-white p-3 rounded border space-y-3">
            {structuredData.platforms.map((platform, index) => (
              <div key={index}>
                <h5 className="font-medium text-gray-800">{platform.name}</h5>
                {platform.credentials && platform.credentials.length > 0 && (
                  <ul className="list-disc list-inside ml-4 text-sm text-gray-700">
                    {platform.credentials.map((cred, credIndex) => (
                      <li key={credIndex}>
                        <strong>{cred.field.replace(/_/g, ' ').toUpperCase()}</strong>: {cred.why_needed}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // AI Agents
    if (structuredData.agents && structuredData.agents.length > 0) {
      content.push(
        <div key="agents" className="mb-4">
          <h4 className="font-medium text-blue-800 mb-3">Recommended AI Agents</h4>
          <div className="space-y-3">
            {structuredData.agents.map((agent, index) => {
              if (dismissedAgents.has(agent.name)) return null;
              
              return (
                <div key={index} className="border rounded-lg p-4 bg-blue-50/50 border-blue-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h5 className="font-semibold text-blue-800">{agent.name}</h5>
                      <p className="text-sm text-blue-600">{agent.role}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAgentAdd(agent)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAgentDismiss(agent.name)}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><strong>Goal:</strong> {agent.goal}</p>
                    <p><strong>Why needed:</strong> {agent.why_needed}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Clarification Questions
    if (structuredData.clarification_questions && structuredData.clarification_questions.length > 0) {
      content.push(
        <div key="clarification" className="mb-4">
          <h4 className="font-medium text-yellow-800 mb-2">I need some clarification:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 bg-yellow-50 p-3 rounded border border-yellow-200">
            {structuredData.clarification_questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        </div>
      );
    }

    return content;
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
        <p className="text-sm text-gray-600">Your automation expert with comprehensive workflow guidance</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-4xl">
                  <div className={`px-4 py-3 rounded-2xl text-sm ${
                    msg.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : msg.type === 'ai'
                      ? 'bg-gray-50 text-gray-800 border border-gray-200'
                      : 'bg-green-50 text-green-800 border border-green-200'
                  }`}>
                    {msg.type === 'user' && <User className="w-4 h-4 inline mr-2" />}
                    {msg.type === 'ai' && <Bot className="w-4 h-4 inline mr-2 text-blue-600" />}
                    
                    {/* Show structured content for AI messages if available */}
                    {msg.type === 'ai' && msg.structuredData ? (
                      <div className="space-y-3">
                        <div className="whitespace-pre-wrap">{cleanDisplayText(msg.message)}</div>
                        {renderStructuredContent(msg.structuredData)}
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.message}</span>
                    )}
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
              <div className="bg-gray-50 text-gray-800 px-4 py-3 rounded-2xl border border-gray-200">
                <Bot className="w-4 h-4 inline mr-2 animate-pulse text-blue-600" />
                <span className="text-sm">AI is creating your comprehensive automation plan...</span>
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
            placeholder="Describe the automation you want to create..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            className="text-sm"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !newMessage.trim()}
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
