
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Edit, Search, Plus, Database, Brain, Lock, Settings, FileJson, Wrench } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeChat from "@/components/KnowledgeChat";
import PlatformCredentialManager from "@/components/PlatformCredentialManager";
import JsonDataImporter from "@/components/JsonDataImporter";

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
  platform_name?: string;
  credential_fields?: any[];
  platform_description?: string;
  use_cases?: string[];
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
  const [showPlatformManager, setShowPlatformManager] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchKnowledge();
    }
  }, [isAuthenticated]);

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

  const handleSavePlatformData = async (platformData: any) => {
    try {
      const { error } = await supabase
        .from('universal_knowledge_store')
        .insert({
          category: 'platform_knowledge',
          title: `${platformData.platform_name} Integration`,
          summary: platformData.summary,
          platform_name: platformData.platform_name,
          credential_fields: platformData.credential_fields,
          platform_description: platformData.platform_description,
          use_cases: platformData.use_cases,
          details: {
            credential_count: platformData.credential_fields.length,
            integration_type: 'API',
            last_updated: new Date().toISOString()
          },
          tags: [platformData.platform_name.toLowerCase().replace(/\s+/g, '-'), 'platform', 'integration'],
          priority: 5,
          source_type: 'admin'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${platformData.platform_name} platform data saved successfully`,
      });
      
      setShowPlatformManager(false);
      fetchKnowledge();
    } catch (error) {
      console.error('Error saving platform data:', error);
      toast({
        title: "Error",
        description: "Failed to save platform data",
        variant: "destructive",
      });
    }
  };

  const handleImportJsonData = async (jsonData: any[]) => {
    try {
      const insertPromises = jsonData.map(platformData => 
        supabase
          .from('universal_knowledge_store')
          .insert({
            category: 'platform_knowledge',
            title: `${platformData.platform_name} Integration`,
            summary: platformData.summary,
            platform_name: platformData.platform_name,
            credential_fields: platformData.credential_fields,
            platform_description: platformData.platform_description,
            use_cases: platformData.use_cases,
            details: {
              credential_count: platformData.credential_fields?.length || 0,
              integration_type: 'API',
              imported_at: new Date().toISOString()
            },
            tags: [platformData.platform_name.toLowerCase().replace(/\s+/g, '-'), 'platform', 'integration'],
            priority: 5,
            source_type: 'import'
          })
      );

      await Promise.all(insertPromises);
      
      toast({
        title: "Import Successful",
        description: `Imported ${jsonData.length} platform entries`,
      });
      
      fetchKnowledge();
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import platform data",
        variant: "destructive",
      });
    }
  };

  const handleExportJsonData = () => {
    return knowledge
      .filter(entry => entry.platform_name)
      .map(entry => ({
        platform_name: entry.platform_name,
        summary: entry.summary,
        platform_description: entry.platform_description,
        credential_fields: entry.credential_fields || [],
        use_cases: entry.use_cases || []
      }));
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
        {/* Left Side - Knowledge Management (Larger) */}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-300 rounded-xl">
                      <Settings className="h-4 w-4 mr-2" />
                      Tools
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <DropdownMenuItem onClick={handleSeedInitialData} disabled={isLoading}>
                      <Database className="h-4 w-4 mr-2" />
                      Seed Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  onClick={() => setShowPlatformManager(true)}
                  variant="outline" 
                  className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Platform Manager
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

          {/* Platform Manager Dialog */}
          <Dialog open={showPlatformManager} onOpenChange={setShowPlatformManager}>
            <DialodContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>Platform Credential Manager</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="manager" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manager">Platform Manager</TabsTrigger>
                  <TabsTrigger value="import">JSON Import/Export</TabsTrigger>
                </TabsList>
                <TabsContent value="manager">
                  <PlatformCredentialManager onSave={handleSavePlatformData} />
                </TabsContent>
                <TabsContent value="import">
                  <JsonDataImporter 
                    onImport={handleImportJsonData}
                    onExport={handleExportJsonData}
                  />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

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
                        {entry.platform_name && (
                          <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                            {entry.platform_name}
                          </Badge>
                        )}
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
                    
                    {/* Show credential fields count for platform entries */}
                    {entry.credential_fields && entry.credential_fields.length > 0 && (
                      <div className="mb-3">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          {entry.credential_fields.length} credential fields
                        </Badge>
                      </div>
                    )}

                    {/* Show use cases */}
                    {entry.use_cases && entry.use_cases.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {entry.use_cases.slice(0, 3).map((useCase, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-purple-50 text-purple-700 rounded-lg">
                            {useCase}
                          </Badge>
                        ))}
                        {entry.use_cases.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 rounded-lg">
                            +{entry.use_cases.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

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

        {/* Right Side - AI Chat (Smaller) */}
        <div className="w-96 border-l border-gray-200 bg-white/60 backdrop-blur-sm">
          <KnowledgeChat onKnowledgeUpdate={fetchKnowledge} />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeAdmin;
