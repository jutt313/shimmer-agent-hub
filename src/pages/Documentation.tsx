
import { useState, useEffect } from 'react';
import { Search, Book, ChevronRight, Star, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DocumentationSidebar from '@/components/documentation/DocumentationSidebar';
import DocumentationArticle from '@/components/documentation/DocumentationArticle';
import { useToast } from '@/components/ui/use-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface Article {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  read_count: number;
  rating_sum: number;
  rating_count: number;
  created_at: string;
}

const Documentation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDocumentation();
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchDocumentation = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('documentation_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('documentation_articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');

      if (articlesError) throw articlesError;

      setCategories(categoriesData || []);
      setArticles(articlesData || []);
    } catch (error) {
      console.error('Error fetching documentation:', error);
      toast({
        title: "Error",
        description: "Failed to load documentation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documentation_progress')
        .select('article_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (error) throw error;

      const completedArticles = new Set(data.map(p => p.article_id));
      setUserProgress(completedArticles);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const markArticleAsRead = async (articleId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('documentation_progress')
        .upsert({
          user_id: user.id,
          article_id: articleId,
          is_completed: true,
          last_read_at: new Date().toISOString(),
        });

      if (error) throw error;

      setUserProgress(prev => new Set([...prev, articleId]));
    } catch (error) {
      console.error('Error marking article as read:', error);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      rocket: '🚀',
      bot: '🤖',
      webhook: '🔗',
      brain: '🧠',
      plug: '🔌',
      'help-circle': '❓',
      star: '⭐',
    };
    return iconMap[iconName] || '📄';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Documentation
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Everything you need to know about building powerful automations
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <DocumentationSidebar
              categories={categories}
              articles={articles}
              selectedArticle={selectedArticle}
              onArticleSelect={setSelectedArticle}
              userProgress={userProgress}
              getIconComponent={getIconComponent}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {selectedArticle ? (
              <DocumentationArticle
                article={selectedArticle}
                onMarkAsRead={() => markArticleAsRead(selectedArticle.id)}
                isCompleted={userProgress.has(selectedArticle.id)}
                user={user}
              />
            ) : (
              <div className="space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-blue-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>

                {/* Categories Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map((category) => {
                    const categoryArticles = articles.filter(a => a.category_id === category.id);
                    const completedCount = categoryArticles.filter(a => userProgress.has(a.id)).length;
                    
                    return (
                      <Card key={category.id} className="bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{getIconComponent(category.icon)}</div>
                              <div>
                                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {category.name}
                                </CardTitle>
                                <CardDescription className="text-sm text-gray-600">
                                  {category.description}
                                </CardDescription>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {categoryArticles.length} article{categoryArticles.length !== 1 ? 's' : ''}
                            </Badge>
                            {user && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4" />
                                {completedCount}/{categoryArticles.length} completed
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Search Results */}
                {searchQuery && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Search Results ({filteredArticles.length})
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      {filteredArticles.map((article) => {
                        const category = categories.find(c => c.id === article.category_id);
                        const avgRating = article.rating_count > 0 ? article.rating_sum / article.rating_count : 0;
                        
                        return (
                          <Card 
                            key={article.id}
                            className="bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
                            onClick={() => setSelectedArticle(article)}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {category?.name}
                                    </Badge>
                                    {userProgress.has(article.id) && (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                  </div>
                                  <CardTitle className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                    {article.title}
                                  </CardTitle>
                                  <CardDescription className="text-sm text-gray-600 mt-1">
                                    {article.excerpt}
                                  </CardDescription>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm text-gray-600">
                                      {avgRating.toFixed(1)} ({article.rating_count})
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {article.read_count} reads
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {article.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
