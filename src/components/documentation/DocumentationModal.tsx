
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocumentation } from '@/hooks/useDocumentation';
import { 
  Book, 
  Search, 
  Code, 
  Settings, 
  Bot,
  PlayCircle,
  AlertCircle,
  Zap,
  FileText,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Key
} from 'lucide-react';

const DocumentationModal = () => {
  const { categories, articles, loading, searchArticles, getArticlesByCategory } = useDocumentation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const getIconForCategory = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'PlayCircle': <PlayCircle className="h-5 w-5" />,
      'Code': <Code className="h-5 w-5" />,
      'Settings': <Settings className="h-5 w-5" />,
      'Bot': <Bot className="h-5 w-5" />,
      'AlertCircle': <AlertCircle className="h-5 w-5" />,
      'Zap': <Zap className="h-5 w-5" />
    };
    return iconMap[iconName] || <FileText className="h-5 w-5" />;
  };

  const filteredArticles = searchTerm 
    ? searchArticles(searchTerm)
    : selectedCategory 
      ? getArticlesByCategory(selectedCategory)
      : [];

  const displayArticles = selectedCategory || searchTerm ? filteredArticles : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Book className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                YusrAI Documentation
              </h1>
              <p className="text-gray-600">
                Complete guide to automation and AI-powered workflows
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Documentation Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={!selectedCategory ? "default" : "ghost"}
                  className={`w-full justify-start rounded-xl ${
                    !selectedCategory 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedArticle(null);
                    setSearchTerm('');
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  All Documentation
                </Button>

                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className={`w-full justify-start rounded-xl ${
                      selectedCategory === category.id 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedArticle(null);
                      setSearchTerm('');
                    }}
                  >
                    {getIconForCategory(category.icon)}
                    <span className="ml-2">{category.name}</span>
                  </Button>
                ))}

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Links</h4>
                  <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      API Playground
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      <Key className="h-3 w-3 mr-2" />
                      Create API Key
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedArticle ? (
              // Article View
              <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {selectedArticle.title}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        {selectedArticle.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedArticle(null)}
                      className="rounded-xl"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Articles
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] w-full">
                    <div className="prose prose-gray max-w-none pr-4">
                      <div 
                        className="whitespace-pre-wrap text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: selectedArticle.content
                            .replace(/```(\w+)?\n([\s\S]+?)\n```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto"><code>$2</code></pre>')
                            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
                            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                            .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$1</h3>')
                            .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
                            .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-6 text-gray-900">$1</h1>')
                            .replace(/^\- (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
                        }}
                      />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              // Articles List or Category Overview
              <>
                {!selectedCategory && !searchTerm ? (
                  // Welcome/Overview when no category selected
                  <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg mb-6">
                    <CardContent className="p-8">
                      <div className="text-center">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Book className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          Welcome to YusrAI Documentation
                        </h2>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                          Get started with our comprehensive guides covering everything from basic setup to advanced automation patterns. 
                          Choose a category from the sidebar to explore specific topics.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                          {categories.slice(0, 4).map((category) => (
                            <Button
                              key={category.id}
                              variant="outline"
                              className="p-6 h-auto flex flex-col items-center gap-3 rounded-2xl hover:shadow-lg transition-all"
                              onClick={() => setSelectedCategory(category.id)}
                            >
                              <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                                {getIconForCategory(category.icon)}
                              </div>
                              <div className="text-center">
                                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Articles List
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {searchTerm 
                          ? `Search Results for "${searchTerm}"` 
                          : categories.find(c => c.id === selectedCategory)?.name || 'Articles'
                        }
                      </h2>
                      <p className="text-gray-600">
                        {searchTerm 
                          ? `Found ${displayArticles.length} result${displayArticles.length !== 1 ? 's' : ''}`
                          : categories.find(c => c.id === selectedCategory)?.description || 'Browse our documentation'
                        }
                      </p>
                    </div>

                    <div className="space-y-4">
                      {displayArticles.map((article) => (
                        <Card 
                          key={article.id}
                          className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                          onClick={() => setSelectedArticle(article)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                  {article.title}
                                </h3>
                                <div className="flex gap-2 mb-3">
                                  {article.tags?.map((tag: string) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-gray-600 line-clamp-2">
                                  {article.excerpt || article.content.substring(0, 150) + '...'}
                                </p>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400 ml-4 group-hover:text-blue-600 transition-colors" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {displayArticles.length === 0 && (
                      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
                        <CardContent className="p-12 text-center">
                          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'No Results Found' : 'No Articles Available'}
                          </h3>
                          <p className="text-gray-600">
                            {searchTerm 
                              ? `No articles found matching "${searchTerm}". Try different keywords.`
                              : 'Articles for this section are coming soon.'
                            }
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
