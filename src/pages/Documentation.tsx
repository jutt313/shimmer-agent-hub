
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Book, Clock, Tag, ArrowLeft } from 'lucide-react';
import { documentationArticles, documentationCategories, getArticleBySlug, searchArticles } from '@/utils/documentationContent';
import ReactMarkdown from 'react-markdown';

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArticles = searchQuery 
    ? searchArticles(searchQuery)
    : selectedCategory
    ? documentationArticles.filter(article => article.category === selectedCategory)
    : documentationArticles;

  const currentArticle = selectedArticle ? getArticleBySlug(selectedArticle) : null;

  if (currentArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => setSelectedArticle(null)}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documentation
          </Button>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
            <CardContent className="p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentArticle.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last updated: {currentArticle.lastUpdated}
                  </div>
                  <Badge variant="outline">{currentArticle.category}</Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  {currentArticle.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>{currentArticle.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Book className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Documentation
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Learn how to build powerful automations with YusrAI. Find guides, tutorials, and API references.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          {documentationCategories.map((category) => (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedCategory === category.name
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0'
                  : 'bg-white/80 backdrop-blur-sm border-0 hover:bg-white'
              }`}
              onClick={() => setSelectedCategory(
                selectedCategory === category.name ? null : category.name
              )}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-sm">{category.name}</h3>
                <p className={`text-xs mt-1 ${
                  selectedCategory === category.name ? 'text-white/80' : 'text-gray-500'
                }`}>
                  {category.articles} articles
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Articles */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => setSelectedArticle(article.slug)}
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2">
                    {article.category}
                  </Badge>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {article.content.substring(0, 150)}...
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {article.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {article.lastUpdated}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No articles found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search terms or browse by category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documentation;
