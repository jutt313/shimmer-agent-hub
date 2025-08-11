
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

  // EMERGENCY FIX: Enhanced error handling for automation loading
  const loadAutomationResponses = async () => {
    if (!user?.id || !automationId) {
      console.log('⚠️ EMERGENCY FIX: Missing user or automation ID');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 EMERGENCY FIX: Loading automation responses for:', { 
        userId: user.id, 
        automationId 
      });

      const { data, error: queryError } = await supabase
        .from('automation_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('automation_id', automationId)
        .order('created_at', { ascending: true });

      if (queryError) {
        console.error('❌ EMERGENCY FIX: Failed to load automation responses:', queryError);
        setError(`Database error: ${queryError.message}`);
        return;
      }

      console.log('✅ EMERGENCY FIX: Loaded automation responses:', data?.length || 0);
      setSavedResponses(data || []);
    } catch (err: any) {
      console.error('❌ EMERGENCY FIX: Unexpected error loading automation responses:', err);
      setError(`System error: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // EMERGENCY FIX: Enhanced error handling for saving responses
  const saveAutomationResponse = async (responseData: {
    chat_message_id?: number;
    response_text: string;
    structured_data?: any;
    yusrai_powered?: boolean;
    seven_sections_validated?: boolean;
    error_help_available?: boolean;
    is_ready_for_execution?: boolean;
  }) => {
    if (!user?.id || !automationId) {
      console.error('❌ EMERGENCY FIX: Cannot save - missing user or automation ID');
      return false;
    }
    
    try {
      console.log('💾 EMERGENCY FIX: Saving automation response for:', { 
        userId: user.id, 
        automationId 
      });

      const { data, error: insertError } = await supabase
        .from('automation_responses')
        .insert({
          user_id: user.id,
          automation_id: automationId,
          ...responseData
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ EMERGENCY FIX: Failed to save automation response:', insertError);
        return false;
      }

      console.log('✅ EMERGENCY FIX: Automation response saved successfully:', data.id);
      
      // Update local state
      setSavedResponses(prev => [...prev, data]);
      return true;
    } catch (err: any) {
      console.error('❌ EMERGENCY FIX: Unexpected error saving automation response:', err);
      return false;
    }
  };

  // EMERGENCY FIX: Enhanced error handling for updating responses
  const updateAutomationResponse = async (responseId: string, updates: Partial<AutomationResponse>) => {
    if (!user?.id) {
      console.error('❌ EMERGENCY FIX: Cannot update - missing user ID');
      return false;
    }
    
    try {
      console.log('🔄 EMERGENCY FIX: Updating automation response:', responseId);

      const { data, error: updateError } = await supabase
        .from('automation_responses')
        .update(updates)
        .eq('id', responseId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ EMERGENCY FIX: Failed to update automation response:', updateError);
        return false;
      }

      console.log('✅ EMERGENCY FIX: Automation response updated successfully');
      
      // Update local state
      setSavedResponses(prev => 
        prev.map(response => 
          response.id === responseId ? { ...response, ...data } : response
        )
      );
      return true;
    } catch (err: any) {
      console.error('❌ EMERGENCY FIX: Unexpected error updating automation response:', err);
      return false;
    }
  };

  // Get latest structured response with error handling
  const getLatestStructuredResponse = (): AutomationResponse | null => {
    try {
      const structuredResponses = savedResponses.filter(r => r.structured_data);
      return structuredResponses.length > 0 ? structuredResponses[structuredResponses.length - 1] : null;
    } catch (err) {
      console.error('❌ EMERGENCY FIX: Error getting latest structured response:', err);
      return null;
    }
  };

  // Check if automation has any saved data with error handling
  const hasAutomationData = (): boolean => {
    try {
      return savedResponses.length > 0;
    } catch (err) {
      console.error('❌ EMERGENCY FIX: Error checking automation data:', err);
      return false;
    }
  };

  // EMERGENCY FIX: Auto-load with enhanced error handling
  useEffect(() => {
    if (user?.id && automationId) {
      console.log('🚀 EMERGENCY FIX: Auto-loading automation responses');
      loadAutomationResponses();
    } else {
      console.log('⚠️ EMERGENCY FIX: Skipping auto-load - missing dependencies');
    }
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
