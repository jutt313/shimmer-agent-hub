import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { YusrAIStructuredResponse } from '@/utils/jsonParser';

interface AutomationResponse {
  id: string;
  user_id: string;
  automation_id: string;
  chat_message_id?: number;
  response_text: string;
  structured_data?: any;
  yusrai_powered: boolean;
  seven_sections_validated: boolean;
  error_help_available: boolean;
  is_ready_for_execution: boolean;
  created_at: string;
  updated_at: string;
}

export const useAutomationPersistence = (automationId: string) => {
  const [savedResponses, setSavedResponses] = useState<AutomationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load saved automation responses
  const loadAutomationResponses = async () => {
    if (!user?.id || !automationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('automation_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('automation_id', automationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Failed to load automation responses:', error);
        setError('Failed to load automation details');
        return;
      }

      console.log('✅ Loaded automation responses:', data?.length || 0);
      setSavedResponses(data || []);
    } catch (err: any) {
      console.error('❌ Error loading automation responses:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Save automation response
  const saveAutomationResponse = async (responseData: {
    chat_message_id?: number;
    response_text: string;
    structured_data?: any;
    yusrai_powered?: boolean;
    seven_sections_validated?: boolean;
    error_help_available?: boolean;
    is_ready_for_execution?: boolean;
  }) => {
    if (!user?.id || !automationId) return false;
    
    try {
      const { data, error } = await supabase
        .from('automation_responses')
        .insert({
          user_id: user.id,
          automation_id: automationId,
          ...responseData
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to save automation response:', error);
        return false;
      }

      console.log('✅ Automation response saved successfully:', data.id);
      
      // Update local state
      setSavedResponses(prev => [...prev, data]);
      return true;
    } catch (err: any) {
      console.error('❌ Error saving automation response:', err);
      return false;
    }
  };

  // Update automation response
  const updateAutomationResponse = async (responseId: string, updates: Partial<AutomationResponse>) => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await supabase
        .from('automation_responses')
        .update(updates)
        .eq('id', responseId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update automation response:', error);
        return false;
      }

      console.log('✅ Automation response updated successfully');
      
      // Update local state
      setSavedResponses(prev => 
        prev.map(response => 
          response.id === responseId ? { ...response, ...data } : response
        )
      );
      return true;
    } catch (err: any) {
      console.error('❌ Error updating automation response:', err);
      return false;
    }
  };

  // Get latest structured response
  const getLatestStructuredResponse = (): AutomationResponse | null => {
    const structuredResponses = savedResponses.filter(r => r.structured_data);
    return structuredResponses.length > 0 ? structuredResponses[structuredResponses.length - 1] : null;
  };

  // Check if automation has any saved data
  const hasAutomationData = (): boolean => {
    return savedResponses.length > 0;
  };

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    loadAutomationResponses();
  }, [user?.id, automationId]);

  return {
    savedResponses,
    isLoading,
    error,
    saveAutomationResponse,
    updateAutomationResponse,
    loadAutomationResponses,
    getLatestStructuredResponse,
    hasAutomationData
  };
};