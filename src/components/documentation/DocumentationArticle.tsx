
import { useState } from 'react';
import { CheckCircle, Star, ThumbsUp, ThumbsDown, MessageCircle, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';

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

interface User {
  id: string;
  email?: string;
}

interface DocumentationArticleProps {
  article: Article;
  onMarkAsRead: () => void;
  isCompleted: boolean;
  user: User | null;
}

const DocumentationArticle = ({ article, onMarkAsRead, isCompleted, user }: DocumentationArticleProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const avgRating = article.rating_count > 0 ? article.rating_sum / article.rating_count : 0;

  const handleRating = async (newRating: number) => {
    if (!user || hasRated) return;

    setRating(newRating);
    try {
      const { error } = await supabase
        .from('documentation_feedback')
        .insert({
          user_id: user.id,
          article_id: article.id,
          rating: newRating,
        });

      if (error) throw error;

      setHasRated(true);
      toast({
        title: "Thank you!",
        description: "Your rating has been submitted.",
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
    }
  };

  const handleFeedbackSubmit = async (helpful: boolean) => {
    if (!user || !feedback.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      const { error } = await supabase
        .from('documentation_feedback')
        .insert({
          user_id: user.id,
          article_id: article.id,
          comment: feedback,
          is_helpful: helpful,
        });

      if (error) throw error;

      setFeedback('');
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const incrementReadCount = async () => {
    try {
      await supabase
        .from('documentation_articles')
        .update({ read_count: article.read_count + 1 })
        .eq('id', article.id);
    } catch (error) {
      console.error('Error incrementing read count:', error);
    }
  };

  // Increment read count when article is first viewed
  useState(() => {
    incrementReadCount();
  });

  return (
    <div className="space-y-6">
      {/* Article Header */}
      <Card className="bg-white/90 backdrop-blur-sm border border-blue-100 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                {article.title}
              </CardTitle>
              <p className="text-gray-600 mb-4">{article.excerpt}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {article.read_count} reads
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {avgRating.toFixed(1)} ({article.rating_count} ratings)
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Button onClick={onMarkAsRead} variant="outline" size="sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark as Read
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Tags */}
          <div className="flex gap-2 mt-4">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Article Content */}
      <Card className="bg-white/90 backdrop-blur-sm border border-blue-100 shadow-lg">
        <CardContent className="p-8">
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-6">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">{children}</h3>,
                p: ({ children }) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="text-gray-700 mb-4 ml-6 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="text-gray-700 mb-4 ml-6 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="list-disc">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg mb-4">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      {user && (
        <Card className="bg-white/90 backdrop-blur-sm border border-blue-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Was this article helpful?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Rate this article:</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    disabled={hasRated}
                    className="p-1 hover:scale-110 transition-transform disabled:cursor-not-allowed"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (rating || 0)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Written Feedback */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Leave feedback:</p>
              <Textarea
                placeholder="Tell us what you think about this article..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleFeedbackSubmit(true)}
                  disabled={!feedback.trim() || isSubmittingFeedback}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful
                </Button>
                <Button
                  onClick={() => handleFeedbackSubmit(false)}
                  disabled={!feedback.trim() || isSubmittingFeedback}
                  size="sm"
                  variant="outline"
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  Not Helpful
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentationArticle;
