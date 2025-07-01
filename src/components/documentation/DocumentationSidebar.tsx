
import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

interface DocumentationSidebarProps {
  categories: Category[];
  articles: Article[];
  selectedArticle: Article | null;
  onArticleSelect: (article: Article) => void;
  userProgress: Set<string>;
  getIconComponent: (iconName: string) => string;
}

const DocumentationSidebar = ({
  categories,
  articles,
  selectedArticle,
  onArticleSelect,
  userProgress,
  getIconComponent
}: DocumentationSidebarProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sidebarSearch, setSidebarSearch] = useState('');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const filteredCategories = categories.filter(category => {
    if (!sidebarSearch) return true;
    return category.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
           articles.some(article => 
             article.category_id === category.id && 
             article.title.toLowerCase().includes(sidebarSearch.toLowerCase())
           );
  });

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-blue-100 shadow-lg sticky top-8">
      <CardContent className="p-4">
        {/* Sidebar Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="pl-9 text-sm rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {filteredCategories.map((category) => {
            const categoryArticles = articles.filter(a => a.category_id === category.id);
            const filteredArticles = sidebarSearch 
              ? categoryArticles.filter(article => 
                  article.title.toLowerCase().includes(sidebarSearch.toLowerCase())
                )
              : categoryArticles;
            
            const isExpanded = expandedCategories.has(category.id);
            const completedCount = categoryArticles.filter(a => userProgress.has(a.id)).length;

            return (
              <div key={category.id} className="space-y-1">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getIconComponent(category.icon)}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {completedCount}/{categoryArticles.length}
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {filteredArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => onArticleSelect(article)}
                        className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors ${
                          selectedArticle?.id === article.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        {userProgress.has(article.id) && (
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                        )}
                        <span className="text-sm truncate">{article.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Progress Summary */}
        <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Progress</h4>
          <div className="text-xs text-gray-600">
            {userProgress.size} of {articles.length} articles completed
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(userProgress.size / articles.length) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentationSidebar;
