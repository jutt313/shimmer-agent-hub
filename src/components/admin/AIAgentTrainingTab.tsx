
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Bot, 
  Brain, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit, 
  Send,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Settings,
  Activity
} from 'lucide-react';

interface Instruction {
  id: string;
  instruction_type: string;
  content: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface Memory {
  id: string;
  conversation_context: any;
  learned_patterns: any;
  successful_solutions: any;
  memory_type: string;
  created_at: string;
}

interface Feedback {
  id: string;
  feedback_type: string;
  original_output: string;
  desired_output?: string;
  solution_applied?: string;
  created_at: string;
}

const AIAgentTrainingTab = () => {
  const { user } = useAuth();
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string, timestamp: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  // Instruction form state
  const [newInstruction, setNewInstruction] = useState({
    instruction_type: 'system_behavior',
    content: '',
    priority: 1
  });
  const [editingInstruction, setEditingInstruction] = useState<string | null>(null);

  const instructionTypes = [
    { value: 'system_behavior', label: 'System Behavior Rules' },
    { value: 'platform_rules', label: 'Platform-Specific Instructions' },
    { value: 'problem_solutions', label: 'Problem Solutions' },
    { value: 'user_preferences', label: 'User Preferences' },
    { value: 'field_name_mappings', label: 'Field Name Mappings' }
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch instructions
      const { data: instructionsData, error: instructionsError } = await supabase
        .from('chat_ai_instructions')
        .select('*')
        .order('priority', { ascending: true });

      if (instructionsError) throw instructionsError;
      setInstructions(instructionsData || []);

      // Fetch memories
      const { data: memoriesData, error: memoriesError } = await supabase
        .from('chat_ai_memory')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (memoriesError) throw memoriesError;
      setMemories(memoriesData || []);

      // Fetch feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('chat_ai_feedback')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;
      setFeedbacks(feedbackData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const createInstruction = async () => {
    if (!newInstruction.content.trim()) {
      toast.error('Instruction content is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_ai_instructions')
        .insert({
          ...newInstruction,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setInstructions(prev => [...prev, data]);
      setNewInstruction({
        instruction_type: 'system_behavior',
        content: '',
        priority: 1
      });
      toast.success('Instruction added successfully');
    } catch (error) {
      console.error('Error creating instruction:', error);
      toast.error('Failed to create instruction');
    }
  };

  const updateInstruction = async (id: string, updates: Partial<Instruction>) => {
    try {
      const { error } = await supabase
        .from('chat_ai_instructions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setInstructions(prev => 
        prev.map(inst => inst.id === id ? { ...inst, ...updates } : inst)
      );
      setEditingInstruction(null);
      toast.success('Instruction updated');
    } catch (error) {
      console.error('Error updating instruction:', error);
      toast.error('Failed to update instruction');
    }
  };

  const deleteInstruction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chat_ai_instructions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInstructions(prev => prev.filter(inst => inst.id !== id));
      toast.success('Instruction deleted');
    } catch (error) {
      console.error('Error deleting instruction:', error);
      toast.error('Failed to delete instruction');
    }
  };

  const chatWithAI = async () => {
    if (!chatInput.trim()) return;

    setIsChatting(true);
    const userMessage = chatInput;
    setChatInput('');
    
    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      // Call the enhanced chat-ai function
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { 
          message: userMessage,
          isTrainingMode: true,
          userId: user?.id
        }
      });

      if (error) throw error;

      // Add AI response to chat
      const aiMessage = {
        role: 'assistant',
        content: data.response || 'I understand. I have updated my instructions accordingly.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, aiMessage]);

      // Refresh data to show any new instructions/memory
      fetchData();

    } catch (error) {
      console.error('Error chatting with AI:', error);
      toast.error('Failed to communicate with AI agent');
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  const provideFeedback = async (messageContent: string, isPositive: boolean, correction?: string) => {
    try {
      await supabase
        .from('chat_ai_feedback')
        .insert({
          user_id: user?.id,
          feedback_type: isPositive ? 'positive' : 'negative',
          original_output: messageContent,
          desired_output: correction || null
        });

      toast.success(`${isPositive ? 'Positive' : 'Negative'} feedback recorded`);
      fetchData();
    } catch (error) {
      console.error('Error providing feedback:', error);
      toast.error('Failed to record feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
          <Bot className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            AI Agent Training
          </h1>
          <p className="text-gray-600">
            Train and configure your intelligent Chat-AI agent
          </p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 rounded-2xl p-1">
          <TabsTrigger value="chat" className="flex items-center gap-2 rounded-xl">
            <MessageSquare className="w-4 h-4" />
            Agent Chat
          </TabsTrigger>
          <TabsTrigger value="instructions" className="flex items-center gap-2 rounded-xl">
            <Settings className="w-4 h-4" />
            Instructions
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center gap-2 rounded-xl">
            <Brain className="w-4 h-4" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2 rounded-xl">
            <Activity className="w-4 h-4" />
            Feedback
          </TabsTrigger>
        </TabsList>

        {/* Agent Chat Tab */}
        <TabsContent value="chat" className="mt-6">
          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Direct Chat with AI Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <ScrollArea className="h-96 w-full border rounded-2xl p-4">
                  <div className="space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Start chatting with your AI agent to provide training and instructions.</p>
                      </div>
                    ) : (
                      chatMessages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl ${
                            message.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs opacity-70">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                              {message.role === 'assistant' && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => provideFeedback(message.content, true)}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => provideFeedback(message.content, false)}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your instruction or feedback for the AI agent..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isChatting && chatWithAI()}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={chatWithAI}
                    disabled={isChatting || !chatInput.trim()}
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    {isChatting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructions Tab */}
        <TabsContent value="instructions" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Instruction */}
            <Card className="rounded-3xl border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Instruction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Instruction Type</label>
                  <Select 
                    value={newInstruction.instruction_type} 
                    onValueChange={(value) => setNewInstruction(prev => ({ ...prev, instruction_type: value }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {instructionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newInstruction.priority}
                    onChange={(e) => setNewInstruction(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Instruction Content</label>
                  <Textarea
                    placeholder="Enter the instruction for the AI agent..."
                    value={newInstruction.content}
                    onChange={(e) => setNewInstruction(prev => ({ ...prev, content: e.target.value }))}
                    className="rounded-xl min-h-[100px]"
                  />
                </div>
                
                <Button onClick={createInstruction} className="w-full rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Instruction
                </Button>
              </CardContent>
            </Card>

            {/* Current Instructions */}
            <Card className="rounded-3xl border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Current Instructions ({instructions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {instructions.map((instruction) => (
                      <div key={instruction.id} className="p-3 border rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {instructionTypes.find(t => t.value === instruction.instruction_type)?.label}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Priority: {instruction.priority}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => setEditingInstruction(instruction.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-600"
                              onClick={() => deleteInstruction(instruction.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{instruction.content}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(instruction.created_at).toLocaleDateString()}
                          </span>
                          <Badge variant={instruction.is_active ? "default" : "secondary"}>
                            {instruction.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {instructions.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No instructions yet. Add your first instruction to start training the AI agent.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="mt-6">
          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Agent Memory ({memories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {memories.map((memory) => (
                    <div key={memory.id} className="p-4 border rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">{memory.memory_type}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(memory.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm font-medium">Learned Patterns:</h4>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                            {JSON.stringify(memory.learned_patterns, null, 2)}
                          </pre>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Successful Solutions:</h4>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                            {JSON.stringify(memory.successful_solutions, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {memories.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No memory entries yet. The AI agent will create memories as it learns from interactions.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="mt-6">
          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Feedback History ({feedbacks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="p-4 border rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <Badge 
                          variant={feedback.feedback_type === 'positive' ? 'default' : 'destructive'}
                        >
                          {feedback.feedback_type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm font-medium">Original Output:</h4>
                          <p className="text-sm bg-gray-50 p-2 rounded">{feedback.original_output}</p>
                        </div>
                        
                        {feedback.desired_output && (
                          <div>
                            <h4 className="text-sm font-medium">Desired Output:</h4>
                            <p className="text-sm bg-green-50 p-2 rounded">{feedback.desired_output}</p>
                          </div>
                        )}
                        
                        {feedback.solution_applied && (
                          <div>
                            <h4 className="text-sm font-medium">Solution Applied:</h4>
                            <p className="text-sm bg-blue-50 p-2 rounded">{feedback.solution_applied}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {feedbacks.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No feedback yet. Provide feedback on AI responses to help improve the agent.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAgentTrainingTab;
