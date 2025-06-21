
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Edit, Search, Plus, Database, Brain } from "lucide-react";
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

const KnowledgeAdmin = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const ADMIN_PASSWORD = "shimmer2024admin"; // You can change this

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchKnowledge();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to Knowledge Administration",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password",
        variant: "destructive",
      });
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Brain className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Knowledge Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full">
              Access Knowledge Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Universal Knowledge Store
            </h1>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleSeedInitialData} disabled={isLoading} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Seed Initial Data
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
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
                    <SelectTrigger>
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
                  />
                  <Textarea
                    placeholder="Summary"
                    value={newEntry.summary}
                    onChange={(e) => setNewEntry({...newEntry, summary: e.target.value})}
                  />
                  <Textarea
                    placeholder="Details (JSON format)"
                    value={newEntry.details}
                    onChange={(e) => setNewEntry({...newEntry, details: e.target.value})}
                    rows={6}
                  />
                  <Input
                    placeholder="Tags (comma separated)"
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry({...newEntry, tags: e.target.value})}
                  />
                  <Input
                    type="number"
                    placeholder="Priority (1-10)"
                    value={newEntry.priority}
                    onChange={(e) => setNewEntry({...newEntry, priority: parseInt(e.target.value) || 1})}
                  />
                  <Button onClick={handleAddEntry} className="w-full">
                    Add Entry
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search knowledge entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
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

        {/* Knowledge Entries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKnowledge.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      {entry.category.replace('_', ' ')}
                    </Badge>
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
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
                <p className="text-sm text-gray-600 mb-3">{entry.summary}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {entry.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
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
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Knowledge Entries Found</h3>
            <p className="text-gray-500">Add some knowledge entries to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeAdmin;
