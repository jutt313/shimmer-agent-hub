import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Edit, Search, Plus, Database, Brain, Lock, MessageCircle, Send, Bot, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  summary: string;
  details: any;
  tags: string[];
  priority: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'ai';
  message: string;
  timestamp: Date;
}

const KnowledgeAdmin = () => {
  // Authentication state
  const [currentPasswordStep, setCurrentPasswordStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [enteredPasswords, setEnteredPasswords] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState<Date | null>(null);

  // Main application state
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', type: 'system', message: 'Universal Memory System AI Ready - Secure OpenAI Connection Established', timestamp: new Date() }
  ]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedChatCategory, setSelectedChatCategory] = useState("");

  const { toast } = useToast();

  // Security configuration
  const REQUIRED_PASSWORDS = [
    "Yasmin7223",
    "26052007", 
    "14011977",
    "19052005",
    "313"
  ];

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

  const [newEntry, setNewEntry] = useState({
    category: 'platform_knowledge',
    title: '',
    summary: '',
    details: '{}',
    tags: '',
    priority: 1
  });

  // Load OpenAI API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setOpenAiApiKey(savedApiKey);
    }
  }, []);

  // Save OpenAI API key to localStorage
  const saveApiKey = (key: string) => {
    localStorage.setItem('openai_api_key', key);
    setOpenAiApiKey(key);
  };

  // Check if currently blocked
  useEffect(() => {
    const storedBlockTime = localStorage.getItem('universalAdminBlockEnd');
    const storedAttempts = localStorage.getItem('universalAdminAttempts');
    
    if (storedBlockTime) {
      const blockEnd = new Date(storedBlockTime);
      if (new Date() < blockEnd) {
        setIsBlocked(true);
        setBlockEndTime(blockEnd);
      } else {
        localStorage.removeItem('universalAdminBlockEnd');
        localStorage.removeItem('universalAdminAttempts');
      }
    }
    
    if (storedAttempts) {
      setAttemptCount(parseInt(storedAttempts));
    }
  }, []);

  // Timer for block countdown
  useEffect(() => {
    if (isBlocked && blockEndTime) {
      const timer = setInterval(() => {
        if (new Date() >= blockEndTime) {
          setIsBlocked(false);
          setBlockEndTime(null);
          setAttemptCount(0);
          setCurrentPasswordStep(1);
          setEnteredPasswords([]);
          localStorage.removeItem('universalAdminBlockEnd');
          localStorage.removeItem('universalAdminAttempts');
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isBlocked, blockEndTime]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchKnowledge();
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = () => {
    if (isBlocked) {
      toast({
        title: "Access Blocked",
        description: "Too many failed attempts. Please wait.",
        variant: "destructive",
      });
      return;
    }

    const expectedPassword = REQUIRED_PASSWORDS[currentPasswordStep - 1];
    
    if (currentPassword === expectedPassword) {
      const newEnteredPasswords = [...enteredPasswords, currentPassword];
      setEnteredPasswords(newEnteredPasswords);
      setCurrentPassword("");
      
      if (currentPasswordStep === 5) {
        // All passwords correct
        setIsAuthenticated(true);
        setAttemptCount(0);
        localStorage.removeItem('universalAdminAttempts');
        localStorage.removeItem('universalAdminBlockEnd');
        toast({
          title: "Access Granted",
          description: "Welcome to Universal Memory System",
        });
      } else {
        setCurrentPasswordStep(currentPasswordStep + 1);
      }
    } else {
      // Wrong password - reset and increment attempts
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      setCurrentPasswordStep(1);
      setEnteredPasswords([]);
      setCurrentPassword("");
      localStorage.setItem('universalAdminAttempts', newAttemptCount.toString());
      
      if (newAttemptCount >= 3) {
        const blockEnd = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
        setIsBlocked(true);
        setBlockEndTime(blockEnd);
        localStorage.setItem('universalAdminBlockEnd', blockEnd.toISOString());
        toast({
          title: "Access Blocked",
          description: "Too many failed attempts. Access blocked for 12 hours.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Access Denied",
          description: `Invalid password. ${3 - newAttemptCount} attempts remaining.`,
          variant: "destructive",
        });
      }
    }
  };

  const addChatMessage = (message: string, type: 'user' | 'system' | 'ai' = 'user') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const sendToAI = async (message: string) => {
    setIsChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-ai-chat', {
        body: { 
          message: message,
          category: selectedChatCategory || null
        }
      });

      if (error) throw error;
      
      addChatMessage(data.response, 'ai');
    } catch (error) {
      console.error('AI Chat Error:', error);
      addChatMessage("Sorry, I couldn't process your request. Please try again.", 'system');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (newChatMessage.trim()) {
      let fullMessage = newChatMessage;
      
      if (selectedChatCategory) {
        fullMessage = `[Context: ${selectedChatCategory.replace('_', ' ')}] ${newChatMessage}`;
      }
      
      addChatMessage(fullMessage);
      sendToAI(fullMessage);
      setNewChatMessage("");
      setSelectedChatCategory("");
    }
  };

  const handleQuickCategorySelect = (category: string) => {
    setSelectedChatCategory(category);
    setNewChatMessage(`Analyze ${category.replace('_', ' ')} and suggest improvements`);
  };

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('universal_knowledge_store')
        .select('*')
        .order('priority', { ascending: false })
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setKnowledge(data || []);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
      toast({
        title: "Error",
        description: "Failed to fetch knowledge entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    try {
      let parsedDetails;
      try {
        parsedDetails = JSON.parse(newEntry.details);
      } catch {
        parsedDetails = { raw: newEntry.details };
      }

      const { error } = await supabase
        .from('universal_knowledge_store')
        .insert({
          category: newEntry.category,
          title: newEntry.title,
          summary: newEntry.summary,
          details: parsedDetails,
          tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          priority: newEntry.priority,
          source_type: 'admin'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Knowledge entry added successfully",
      });

      setNewEntry({
        category: 'platform_knowledge',
        title: '',
        summary: '',
        details: '{}',
        tags: '',
        priority: 1
      });
      setShowAddDialog(false);
      fetchKnowledge();
      addChatMessage(`Added new ${newEntry.category} entry: ${newEntry.title}`, 'system');
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Error",
        description: "Failed to add knowledge entry",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('universal_knowledge_store')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Knowledge entry deleted successfully",
      });
      fetchKnowledge();
      addChatMessage("Knowledge entry deleted", 'system');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge entry",
        variant: "destructive",
      });
    }
  };

  const handleSeedInitialData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-knowledge-store');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Initial knowledge data seeded successfully",
      });
      fetchKnowledge();
      addChatMessage("Initial knowledge data seeded", 'system');
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: "Error", 
        description: "Failed to seed initial data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredKnowledge = knowledge.filter(entry => {
    const matchesSearch = searchTerm === "" || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || entry.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getTimeRemaining = () => {
    if (!blockEndTime) return "";
    const now = new Date();
    const diff = blockEndTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-red-50 to-orange-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-red-200 rounded-3xl shadow-2xl">
          <CardHeader className="text-center">
            <Lock className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-3xl text-red-700 font-bold">System Locked</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-700 mb-6 text-lg">
              Security protocols activated. Access temporarily restricted.
            </p>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
              <p className="text-xl font-bold text-red-700 mb-2">
                Time Remaining: {getTimeRemaining()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-gray-200 rounded-3xl shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <Lock className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <CardTitle className="text-3xl text-gray-800 font-bold">Secure Access Required</CardTitle>
            <p className="text-gray-600 mt-2">Step {currentPasswordStep} of 5</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Input
                type="password"
                placeholder={`Enter Password ${currentPasswordStep}`}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border-gray-300 rounded-xl h-12 text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <Button 
                onClick={handlePasswordSubmit} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl h-12 text-lg font-semibold"
              >
                {currentPasswordStep === 5 ? 'Complete Authentication' : 'Next Step'}
              </Button>
            </div>
            
            {enteredPasswords.length > 0 && (
              <div className="flex justify-center space-x-2 mt-4">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      enteredPasswords.length >= step 
                        ? 'bg-green-500' 
                        : step === currentPasswordStep 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {attemptCount > 0 && (
              <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-xl">
                {3 - attemptCount} attempts remaining
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <div className="flex h-screen">
        {/* Left Side - Secure AI Chat Interface */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white/60 backdrop-blur-sm">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-7 w-7 text-blue-600" />
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Secure AI Assistant</h2>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-green-800 font-medium">🔐 Protected System</p>
              <p className="text-xs text-green-700">AI has read-only access. All changes require your permission.</p>
            </div>

            {/* Quick Category Analysis Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {categories.slice(0, 6).map((cat) => (
                <Button
                  key={cat}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickCategorySelect(cat)}
                  className="text-xs rounded-lg border-blue-200 hover:bg-blue-50"
                >
                  {cat.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm shadow-lg ${
                  msg.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                    : msg.type === 'ai'
                    ? 'bg-gradient-to-r from-green-100 to-blue-100 text-gray-800 border border-green-200'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  {msg.type === 'ai' && <Bot className="w-4 h-4 inline mr-2 text-green-600" />}
                  {msg.message}
                </div>
              </div>
            ))}
            
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-green-100 to-blue-100 text-gray-800 border border-green-200 px-4 py-3 rounded-2xl">
                  <Bot className="w-4 h-4 inline mr-2 animate-pulse text-green-600" />
                  AI is analyzing...
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-white/80 space-y-3">
            <Select value={selectedChatCategory} onValueChange={setSelectedChatCategory}>
              <SelectTrigger className="border-gray-300 rounded-xl">
                <SelectValue placeholder="Select category for focused analysis" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="hover:bg-blue-50">
                    {cat.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-3">
              <Input
                placeholder="Ask AI about knowledge management..."
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="border-gray-300 rounded-xl"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isChatLoading}
                size="sm" 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side - Knowledge Management */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Brain className="h-10 w-10 text-indigo-600" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Universal Memory System
                </h1>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleSeedInitialData} disabled={isLoading} variant="outline" className="border-gray-300 rounded-xl">
                  <Database className="h-4 w-4 mr-2" />
                  Seed Data
                </Button>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Knowledge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Knowledge Entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={newEntry.category} onValueChange={(value) => setNewEntry({...newEntry, category: value})}>
                        <SelectTrigger className="border-gray-300 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat} className="hover:bg-blue-50">
                              {cat.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Title"
                        value={newEntry.title}
                        onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                        className="border-gray-300 rounded-xl"
                      />
                      <Textarea
                        placeholder="Summary"
                        value={newEntry.summary}
                        onChange={(e) => setNewEntry({...newEntry, summary: e.target.value})}
                        className="border-gray-300 rounded-xl"
                      />
                      <Textarea
                        placeholder="Details (JSON format)"
                        value={newEntry.details}
                        onChange={(e) => setNewEntry({...newEntry, details: e.target.value})}
                        rows={6}
                        className="border-gray-300 rounded-xl"
                      />
                      <Input
                        placeholder="Tags (comma separated)"
                        value={newEntry.tags}
                        onChange={(e) => setNewEntry({...newEntry, tags: e.target.value})}
                        className="border-gray-300 rounded-xl"
                      />
                      <Input
                        type="number"
                        placeholder="Priority (1-10)"
                        value={newEntry.priority}
                        onChange={(e) => setNewEntry({...newEntry, priority: parseInt(e.target.value) || 1})}
                        className="border-gray-300 rounded-xl"
                      />
                      <Button onClick={handleAddEntry} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl">
                        Add Entry
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search universal memory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 rounded-xl"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 border-gray-300 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <SelectItem value="all" className="hover:bg-blue-50">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="hover:bg-blue-50">
                      {cat.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Knowledge Entries Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredKnowledge.map((entry) => (
                <Card key={entry.id} className="hover:shadow-xl transition-all duration-300 border-gray-200 rounded-2xl bg-white/70 backdrop-blur-sm hover:bg-white/90">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-3 border-indigo-300 text-indigo-700 bg-indigo-50 rounded-lg">
                          {entry.category.replace('_', ' ')}
                        </Badge>
                        <CardTitle className="text-lg text-gray-800">{entry.title}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingEntry(entry)} className="rounded-lg">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteEntry(entry.id)} className="rounded-lg text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{entry.summary}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700 rounded-lg">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Priority: {entry.priority}</span>
                      <span>Used: {entry.usage_count} times</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredKnowledge.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No Knowledge Entries Found</h3>
                <p className="text-gray-500">Add some knowledge entries to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeAdmin;
