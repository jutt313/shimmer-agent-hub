
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Book, 
  Code, 
  Zap, 
  Settings,
  Key,
  Globe,
  MessageCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface DocumentationArticle {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  tags: string[];
  category_id: string;
  read_count: number;
  rating_count: number;
  rating_sum: number;
}

interface DocumentationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const Documentation = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<DocumentationArticle[]>([]);
  const [categories, setCategories] = useState<DocumentationCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentation();
  }, []);

  const fetchDocumentation = async () => {
    try {
      // Check if we have any categories, if not, seed them
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('documentation_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      if (!categoriesData || categoriesData.length === 0) {
        await seedDocumentation();
        return fetchDocumentation();
      }

      setCategories(categoriesData);

      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('documentation_articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');

      if (articlesError) throw articlesError;
      setArticles(articlesData || []);

    } catch (error) {
      console.error('Error fetching documentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedDocumentation = async () => {
    try {
      // Insert categories
      const categoriesData = [
        {
          name: 'Getting Started',
          description: 'Learn the basics of using our API and platform',
          icon: 'Book',
          sort_order: 1
        },
        {
          name: 'API Reference',
          description: 'Complete API documentation and endpoints',
          icon: 'Code',
          sort_order: 2
        },
        {
          name: 'Automations',
          description: 'Build and manage powerful automations',
          icon: 'Zap',
          sort_order: 3
        },
        {
          name: 'Integrations',
          description: 'Connect with third-party services and platforms',
          icon: 'Globe',
          sort_order: 4
        },
        {
          name: 'Developer Tools',
          description: 'SDKs, webhooks, and development resources',
          icon: 'Settings',
          sort_order: 5
        }
      ];

      const { data: insertedCategories, error: categoryError } = await supabase
        .from('documentation_categories')
        .insert(categoriesData)
        .select();

      if (categoryError) throw categoryError;

      // Insert sample articles
      const articlesData = [
        {
          title: 'Quick Start Guide',
          slug: 'quick-start-guide',
          content: 'Get started with our platform in minutes. This guide will walk you through creating your first automation.',
          excerpt: 'Get started with our platform in minutes',
          category_id: insertedCategories?.find(c => c.name === 'Getting Started')?.id,
          tags: ['quickstart', 'tutorial', 'beginner'],
          sort_order: 1
        },
        {
          title: 'Authentication',
          slug: 'authentication',
          content: 'Learn how to authenticate your API requests using API keys and OAuth tokens.',
          excerpt: 'Learn how to authenticate your API requests',
          category_id: insertedCategories?.find(c => c.name === 'API Reference')?.id,
          tags: ['api', 'auth', 'security'],
          sort_order: 1
        },
        {
          title: 'Creating Your First Automation',
          slug: 'first-automation',
          content: 'Step-by-step tutorial on creating and running your first automation workflow.',
          excerpt: 'Step-by-step tutorial on creating automations',
          category_id: insertedCategories?.find(c => c.name === 'Automations')?.id,
          tags: ['automation', 'workflow', 'tutorial'],
          sort_order: 1
        },
        {
          title: 'Webhook Integration',
          slug: 'webhook-integration',
          content: 'Connect external services using webhooks to trigger automations and receive real-time updates.',
          excerpt: 'Connect external services using webhooks',
          category_id: insertedCategories?.find(c => c.name === 'Integrations')?.id,
          tags: ['webhooks', 'integration', 'realtime'],
          sort_order: 1
        },
        {
          title: 'API Keys Management',
          slug: 'api-keys-management',
          content: 'Learn how to create, manage, and secure your API keys for different use cases.',
          excerpt: 'Learn how to create and manage API keys',
          category_id: insertedCategories?.find(c => c.name === 'Developer Tools')?.id,
          tags: ['api-keys', 'security', 'development'],
          sort_order: 1
        }
      ];

      await supabase
        .from('documentation_articles')
        .insert(articlesData);

    } catch (error) {
      console.error('Error seeding documentation:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons = {
      Book: <Book className="h-6 w-6" />,
      Code: <Code className="h-6 w-6" />,
      Zap: <Zap className="h-6 w-6" />,
      Globe: <Globe className="h-6 w-6" />,
      Settings: <Settings className="h-6 w-6" />,
      Key: <Key className="h-6 w-6" />,
      MessageCircle: <MessageCircle className="h-6 w-6" />
    };
    return icons[iconName as keyof typeof icons] || <Book className="h-6 w-6" />;
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchTerm === '' || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || article.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Documentation
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Everything you need to know about our API and platform
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-300 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg rounded-2xl ${
                selectedCategory === category.id 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'bg-white/80 hover:bg-white'
              }`}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={`mx-auto mb-2 ${selectedCategory === category.id ? 'text-white' : 'text-blue-600'}`}>
                  {getIconComponent(category.icon)}
                </div>
                <h3 className="font-semibold text-sm">{category.name}</h3>
                <p className={`text-xs mt-1 ${selectedCategory === category.id ? 'text-blue-100' : 'text-gray-600'}`}>
                  {category.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => {
            const category = categories.find(c => c.id === article.category_id);
            const avgRating = article.rating_count > 0 ? (article.rating_sum / article.rating_count) : 0;
            
            return (
              <Card key={article.id} className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </CardTitle>
                      {category && (
                        <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                          {category.name}
                        </Badge>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{article.read_count} views</span>
                    {avgRating > 0 && (
                      <span>★ {avgRating.toFixed(1)} ({article.rating_count})</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">Try adjusting your search or browse different categories</p>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Need More Help?</h2>
            <p className="text-blue-100">Explore additional resources and get support</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 text-blue-100" />
              <h3 className="font-semibold mb-2">Community Support</h3>
              <p className="text-sm text-blue-100 mb-3">Join our community for discussions and help</p>
              <ExternalLink className="h-4 w-4 inline text-blue-100" />
            </div>
            
            <div className="text-center">
              <Code className="h-8 w-8 mx-auto mb-3 text-blue-100" />
              <h3 className="font-semibold mb-2">API Explorer</h3>
              <p className="text-sm text-blue-100 mb-3">Interactive API testing and examples</p>
              <ExternalLink className="h-4 w-4 inline text-blue-100" />
            </div>
            
            <div className="text-center">
              <Book className="h-8 w-8 mx-auto mb-3 text-blue-100" />
              <h3 className="font-semibold mb-2">Tutorials</h3>
              <p className="text-sm text-blue-100 mb-3">Step-by-step video tutorials</p>
              <ExternalLink className="h-4 w-4 inline text-blue-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
