
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface DocumentationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentationArticle {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  sort_order: number;
  is_published: boolean;
  read_count: number;
  rating_sum: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  article_id: string;
  is_completed: boolean;
  last_read_at: string;
  created_at: string;
}

export const useDocumentation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<DocumentationCategory[]>([]);
  const [articles, setArticles] = useState<DocumentationArticle[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentation();
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchDocumentation = async () => {
    try {
      setLoading(true);

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
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserProgress(data || []);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const markArticleAsRead = async (articleId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documentation_progress')
        .upsert({
          user_id: user.id,
          article_id: articleId,
          is_completed: true,
          last_read_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUserProgress(prev => {
        const existing = prev.find(p => p.article_id === articleId);
        if (existing) {
          return prev.map(p => p.article_id === articleId ? data : p);
        } else {
          return [...prev, data];
        }
      });

      return data;
    } catch (error) {
      console.error('Error marking article as read:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
      return null;
    }
  };

  const submitFeedback = async (articleId: string, rating?: number, comment?: string, isHelpful?: boolean) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documentation_feedback')
        .insert({
          user_id: user.id,
          article_id: articleId,
          rating,
          comment,
          is_helpful: isHelpful,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted.",
      });

      return data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
      return null;
    }
  };

  const searchArticles = (query: string) => {
    if (!query.trim()) return articles;

    return articles.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      article.content.toLowerCase().includes(query.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const getArticlesByCategory = (categoryId: string) => {
    return articles.filter(article => article.category_id === categoryId);
  };

  const getUserProgress = (articleId: string) => {
    return userProgress.find(p => p.article_id === articleId);
  };

  const getCompletedArticlesCount = () => {
    return userProgress.filter(p => p.is_completed).length;
  };

  const getTotalArticlesCount = () => {
    return articles.length;
  };

  const getProgressPercentage = () => {
    const total = getTotalArticlesCount();
    if (total === 0) return 0;
    return (getCompletedArticlesCount() / total) * 100;
  };

  return {
    categories,
    articles,
    userProgress,
    loading,
    fetchDocumentation,
    fetchUserProgress,
    markArticleAsRead,
    submitFeedback,
    searchArticles,
    getArticlesByCategory,
    getUserProgress,
    getCompletedArticlesCount,
    getTotalArticlesCount,
    getProgressPercentage,
  };
};
