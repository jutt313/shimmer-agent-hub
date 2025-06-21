
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Edit, Search, Plus, Database, Brain, Lock, MessageCircle } from "lucide-react";
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
  type: 'user' | 'system';
  message: string;
  timestamp: Date;
}

const KnowledgeAdmin = () => {
  // Authentication state
  const [passwords, setPasswords] = useState({
    password1: "",
    password2: "",
    password3: "",
    password4: "",
    password5: ""
  });
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
    { id: '1', type: 'system', message: 'Knowledge Admin System Ready', timestamp: new Date() }
  ]);
  const [newChatMessage, setNewChatMessage] = useState("");

  const { toast } = useToast();

  // Security configuration
  const REQUIRED_PASSWORDS = {
    password1: "Yasmin7223",
    password2: "26052007", 
    password3: "14011977",
    password4: "19052005",
    password5: "313"
  };

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

  // Check if currently blocked
  useEffect(() => {
    const storedBlockTime = localStorage.getItem('knowledgeAdminBlockEnd');
    const storedAttempts = localStorage.getItem('knowledgeAdminAttempts');
    
    if (storedBlockTime) {
      const blockEnd = new Date(storedBlockTime);
      if (new Date() < blockEnd) {
        setIsBlocked(true);
        setBlockEndTime(blockEnd);
      } else {
        localStorage.removeItem('knowledgeAdminBlockEnd');
        localStorage.removeItem('knowledgeAdminAttempts');
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
          localStorage.removeItem('knowledgeAdminBlockEnd');
          localStorage.removeItem('knowledgeAdminAttempts');
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

  const handleLogin = () => {
    if (isBlocked) {
      toast({
        title: "Access Blocked",
        description: "Too many failed attempts. Please wait.",
        variant: "destructive",
      });
      return;
    }

    const isValid = 
      passwords.password1 === REQUIRED_PASSWORDS.password1 &&
      passwords.password2 === REQUIRED_PASSWORDS.password2 &&
      passwords.password3 === REQUIRED_PASSWORDS.password3 &&
      passwords.password4 === REQUIRED_PASSWORDS.password4 &&
      passwords.password5 === REQUIRED_PASSWORDS.password5;

    if (isValid) {
      setIsAuthenticated(true);
      setAttemptCount(0);
      localStorage.removeItem('knowledgeAdminAttempts');
      localStorage.removeItem('knowledgeAdminBlockEnd');
      toast({
        title: "Access Granted",
        description: "Welcome to Universal Knowledge System",
      });
    } else {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      localStorage.setItem('knowledgeAdminAttempts', newAttemptCount.toString());
      
      if (newAttemptCount >= 3) {
        const blockEnd = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
        setIsBlocked(true);
        setBlockEndTime(blockEnd);
        localStorage.setItem('knowledgeAdminBlockEnd', blockEnd.toISOString());
        toast({
          title: "Access Blocked",
          description: "Too many failed attempts. Access blocked for 12 hours.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Access Denied",
          description: `Invalid passwords. ${3 - newAttemptCount} attempts remaining.`,
          variant: "destructive",
        });
      }
      
      setPasswords({
        password1: "",
        password2: "",
        password3: "",
        password4: "",
        password5: ""
      });
    }
  };

  const addChatMessage = (message: string, type: 'user' | 'system' = 'user') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (newChatMessage.trim()) {
      addChatMessage(newChatMessage);
      setNewChatMessage("");
      
      // Simple auto-response for demo
      setTimeout(() => {
        addChatMessage("Message logged to knowledge system", 'system');
      }, 1000);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-600">Access Blocked</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Too many failed login attempts. Access is blocked for security.
            </p>
            <p className="text-lg font-semibold text-red-600">
              Time remaining: {getTimeRemaining()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-slate-200">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-slate-800">Secure Access Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="password"
                placeholder="Password 1"
                value={passwords.password1}
                onChange={(e) => setPasswords({...passwords, password1: e.target.value})}
                className="border-slate-300"
              />
              <Input
                type="password"
                placeholder="Password 2"
                value={passwords.password2}
                onChange={(e) => setPasswords({...passwords, password2: e.target.value})}
                className="border-slate-300"
              />
              <Input
                type="password"
                placeholder="Password 3"
                value={passwords.password3}
                onChange={(e) => setPasswords({...passwords, password3: e.target.value})}
                className="border-slate-300"
              />
              <Input
                type="password"
                placeholder="Password 4"
                value={passwords.password4}
                onChange={(e) => setPasswords({...passwords, password4: e.target.value})}
                className="border-slate-300"
              />
            </div>
            <Input
              type="password"
              placeholder="Password 5"
              value={passwords.password5}
              onChange={(e) => setPasswords({...passwords, password5: e.target.value})}
              className="border-slate-300"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full bg-slate-800 hover:bg-slate-700">
              Authenticate Access
            </Button>
            {attemptCount > 0 && (
              <p className="text-sm text-red-600 text-center">
                {3 - attemptCount} attempts remaining
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="flex h-screen">
        {/* Left Side - Chat Interface */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-800">System Chat</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.type === 'user' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="border-slate-300"
              />
              <Button onClick={handleSendMessage} size="sm" className="bg-slate-800 hover:bg-slate-700">
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side - Knowledge Management */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-slate-600" />
                <h1 className="text-3xl font-bold text-slate-800">
                  Universal Knowledge Store
                </h1>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleSeedInitialData} disabled={isLoading} variant="outline" className="border-slate-300">
                  <Database className="h-4 w-4 mr-2" />
                  Seed Data
                </Button>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-slate-800 hover:bg-slate-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Knowledge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Knowledge Entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={newEntry.category} onValueChange={(value) => setNewEntry({...newEntry, category: value})}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Title"
                        value={newEntry.title}
                        onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                        className="border-slate-300"
                      />
                      <Textarea
                        placeholder="Summary"
                        value={newEntry.summary}
                        onChange={(e) => setNewEntry({...newEntry, summary: e.target.value})}
                        className="border-slate-300"
                      />
                      <Textarea
                        placeholder="Details (JSON format)"
                        value={newEntry.details}
                        onChange={(e) => setNewEntry({...newEntry, details: e.target.value})}
                        rows={6}
                        className="border-slate-300"
                      />
                      <Input
                        placeholder="Tags (comma separated)"
                        value={newEntry.tags}
                        onChange={(e) => setNewEntry({...newEntry, tags: e.target.value})}
                        className="border-slate-300"
                      />
                      <Input
                        type="number"
                        placeholder="Priority (1-10)"
                        value={newEntry.priority}
                        onChange={(e) => setNewEntry({...newEntry, priority: parseInt(e.target.value) || 1})}
                        className="border-slate-300"
                      />
                      <Button onClick={handleAddEntry} className="w-full bg-slate-800 hover:bg-slate-700">
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
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search knowledge entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Knowledge Entries Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredKnowledge.map((entry) => (
                <Card key={entry.id} className="hover:shadow-lg transition-shadow border-slate-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2 border-slate-300 text-slate-600">
                          {entry.category.replace('_', ' ')}
                        </Badge>
                        <CardTitle className="text-lg text-slate-800">{entry.title}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingEntry(entry)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteEntry(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-3">{entry.summary}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Priority: {entry.priority}</span>
                      <span>Used: {entry.usage_count} times</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredKnowledge.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Knowledge Entries Found</h3>
                <p className="text-slate-500">Add some knowledge entries to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeAdmin;
