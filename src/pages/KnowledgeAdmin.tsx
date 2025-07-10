import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { 
  Database, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Brain,
  Zap,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import KnowledgeChat from "@/components/KnowledgeChat";
import JsonDataImporter from "@/components/JsonDataImporter";
import PlatformCredentialManager from "@/components/PlatformCredentialManager";
import ToolWorkflowDiagram from "@/components/ToolWorkflowDiagram";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  summary: string;
  platform_name?: string;
  credential_fields?: Json;
  platform_description?: string;
  use_cases?: string[];
  details: Json;
  tags: string[];
  priority: number;
  usage_count: number;
  last_used: string | null;
  created_at: string;
  updated_at: string;
  source_type: string;
}

interface KnowledgeStats {
  total_entries: number;
  platform_entries: number;
  categories: { [key: string]: number };
  recent_usage: number;
  top_platforms: Array<{ name: string; count: number }>;
}

const KnowledgeAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [stats, setStats] = useState<KnowledgeStats>({
    total_entries: 0,
    platform_entries: 0,
    categories: {},
    recent_usage: 0,
    top_platforms: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Enhanced knowledge fetching with comprehensive stats
  const fetchKnowledge = async () => {
    try {
      console.log('🔄 Fetching comprehensive knowledge data...');
      setLoading(true);

      // Fetch all knowledge entries with new columns
      const { data: knowledgeData, error: knowledgeError } = await supabase
        .from('universal_knowledge_store')
        .select('*')
        .order('created_at', { ascending: false });

      if (knowledgeError) {
        console.error('❌ Error fetching knowledge:', knowledgeError);
        throw knowledgeError;
      }

      console.log(`✅ Fetched ${knowledgeData?.length || 0} knowledge entries`);
      setKnowledge(knowledgeData || []);

      // Calculate comprehensive stats
      if (knowledgeData && knowledgeData.length > 0) {
        const platformEntries = knowledgeData.filter(entry => entry.category === 'platform_knowledge');
        
        // Category distribution
        const categoryCount: { [key: string]: number } = {};
        knowledgeData.forEach(entry => {
          categoryCount[entry.category] = (categoryCount[entry.category] || 0) + 1;
        });

        // Recent usage (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsage = knowledgeData.filter(entry => 
          entry.last_used && new Date(entry.last_used) > sevenDaysAgo
        ).length;

        // Top platforms by usage using the new platform_name column
        const platformUsage: { [key: string]: number } = {};
        platformEntries.forEach(entry => {
          if (entry.platform_name) {
            platformUsage[entry.platform_name] = (platformUsage[entry.platform_name] || 0) + (entry.usage_count || 0);
          }
        });

        const topPlatforms = Object.entries(platformUsage)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));

        const calculatedStats: KnowledgeStats = {
          total_entries: knowledgeData.length,
          platform_entries: platformEntries.length,
          categories: categoryCount,
          recent_usage: recentUsage,
          top_platforms: topPlatforms
        };

        console.log('📊 Calculated knowledge stats:', calculatedStats);
        setStats(calculatedStats);
      }

    } catch (error) {
      console.error('💥 Error in fetchKnowledge:', error);
      toast({
        title: "Error",
        description: "Failed to fetch knowledge data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // CRITICAL FIX: Auto-refresh after import
  const handleKnowledgeUpdate = async () => {
    console.log('🔄 Knowledge updated, refreshing data...');
    setRefreshKey(prev => prev + 1);
    await fetchKnowledge();
    toast({
      title: "Knowledge Updated",
      description: "Knowledge base has been refreshed with new data",
    });
  };

  // CRITICAL FIX: Auto-refresh after JSON import
  const handleJsonImportSuccess = async (importedCount: number) => {
    console.log(`🎉 Successfully imported ${importedCount} entries, refreshing UI...`);
    await fetchKnowledge(); // Immediately refresh the data
    toast({
      title: "Import Successful",
      description: `Successfully imported ${importedCount} platform entries. UI updated!`,
    });
  };

  // Handle platform save from PlatformCredentialManager
  const handlePlatformSave = async (platformData: any) => {
    try {
      const knowledgeEntry = {
        category: 'platform_knowledge',
        title: `${platformData.platform_name} Integration`,
        summary: platformData.summary,
        platform_name: platformData.platform_name,
        credential_fields: platformData.credential_fields || [],
        platform_description: platformData.platform_description,
        use_cases: platformData.use_cases || [],
        details: {
          credential_count: platformData.credential_fields?.length || 0,
          integration_type: 'API',
          created_via: 'manual_entry',
          created_at: new Date().toISOString()
        },
        tags: [
          platformData.platform_name.toLowerCase().replace(/\s+/g, '-'), 
          'platform', 
          'integration',
          'manually-created'
        ],
        priority: 4,
        source_type: 'manual_entry'
      };

      const { error } = await supabase
        .from('universal_knowledge_store')
        .insert([knowledgeEntry]);

      if (error) {
        throw error;
      }

      await fetchKnowledge();
      toast({
        title: "Platform Added",
        description: `${platformData.platform_name} has been added to the knowledge base`,
      });
    } catch (error: any) {
      console.error('Error saving platform:', error);
      toast({
        title: "Error",
        description: "Failed to save platform data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchKnowledge();
    }
  }, [user, refreshKey]);

  // Filter knowledge based on search and category
  const filteredKnowledge = knowledge.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.platform_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || entry.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please sign in to access Knowledge Admin</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header with Real-time Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Universal Knowledge Admin
              </h1>
              <p className="text-gray-600">
                Manage your AI's comprehensive platform knowledge database
              </p>
            </div>
          </div>
          
          {/* Enhanced Action Bar */}
          <div className="flex items-center gap-3">
            <ToolWorkflowDiagram />
            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 px-3 py-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              {stats.total_entries} Total Entries
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 px-3 py-1">
              <Zap className="h-4 w-4 mr-1" />
              {stats.platform_entries} Platforms
            </Badge>
            <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 px-3 py-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              {stats.recent_usage} Recent Usage
            </Badge>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50">
            <TabsTrigger value="dashboard" className="rounded-xl">
              <Database className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-xl">
              <Brain className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="import" className="rounded-xl">
              <Upload className="h-4 w-4 mr-2" />
              JSON Import
            </TabsTrigger>
            <TabsTrigger value="platforms" className="rounded-xl">
              <Zap className="h-4 w-4 mr-2" />
              Platform Manager
            </TabsTrigger>
            <TabsTrigger value="browse" className="rounded-xl">
              <Search className="h-4 w-4 mr-2" />
              Browse Knowledge
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Enhanced Stats Cards */}
              <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Knowledge</p>
                      <p className="text-3xl font-bold text-green-900">{stats.total_entries}</p>
                    </div>
                    <Database className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Platform Integrations</p>
                      <p className="text-3xl font-bold text-blue-900">{stats.platform_entries}</p>
                    </div>
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Recent Usage</p>
                      <p className="text-3xl font-bold text-purple-900">{stats.recent_usage}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Categories</p>
                      <p className="text-3xl font-bold text-orange-900">{Object.keys(stats.categories).length}</p>
                    </div>
                    <Filter className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Platforms */}
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Platforms by Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {stats.top_platforms.slice(0, 10).map((platform, index) => (
                    <div key={platform.name} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">{platform.name}</div>
                      <div className="text-xs text-gray-600">{platform.count} uses</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="chat" className="mt-6">
            <div className="h-[600px]">
              <KnowledgeChat onKnowledgeUpdate={handleKnowledgeUpdate} />
            </div>
          </TabsContent>

          {/* JSON Import Tab with Auto-refresh */}
          <TabsContent value="import" className="mt-6">
            <JsonDataImporter onImportSuccess={handleJsonImportSuccess} />
          </TabsContent>

          {/* Platform Manager Tab */}
          <TabsContent value="platforms" className="mt-6">
            <PlatformCredentialManager onSave={handlePlatformSave} />
          </TabsContent>

          {/* Browse Knowledge Tab */}
          <TabsContent value="browse" className="mt-6">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle>Browse Knowledge Entries</CardTitle>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search knowledge..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="all">All Categories</option>
                    {Object.keys(stats.categories).map(category => (
                      <option key={category} value={category}>
                        {category} ({stats.categories[category]})
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading knowledge entries...</div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredKnowledge.map((entry) => (
                      <div key={entry.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                            {entry.platform_name && (
                              <p className="text-sm text-blue-600 font-medium">Platform: {entry.platform_name}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">{entry.summary}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{entry.category}</Badge>
                              <Badge variant="outline">Used {entry.usage_count} times</Badge>
                              {entry.credential_fields && Array.isArray(entry.credential_fields) && (
                                <Badge variant="outline">{entry.credential_fields.length} credentials</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredKnowledge.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No knowledge entries found matching your criteria.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KnowledgeAdmin;
