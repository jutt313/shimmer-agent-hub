import { supabase } from '@/integrations/supabase/client';

export interface SimpleCredential {
  id: string;
  automation_id: string;
  platform_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified credential manager that focuses on basic storage and validation
 * without complex API testing
 */
export class SimpleCredentialManager {
  /**
   * Save credentials with basic validation
   */
  static async saveCredentials(
    automationId: string,
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Basic validation
      if (!automationId || !platformName || !userId) {
        return { success: false, error: 'Missing required parameters' };
      }

      const hasValidCredentials = Object.values(credentials).some(value => 
        value && value.trim() !== ''
      );

      if (!hasValidCredentials) {
        return { success: false, error: 'At least one credential is required' };
      }

      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .upsert({
          automation_id: automationId,
          platform_name: platformName,
          user_id: userId,
          credentials: JSON.stringify(credentials),
          is_active: true,
          is_tested: false,
          credential_type: 'simple',
          test_status: 'not_tested',
          test_message: 'Credentials will be tested when automation runs'
        }, {
          onConflict: 'automation_id,platform_name,user_id'
        });

      if (error) {
        console.error('Error saving credentials:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Unexpected error saving credentials:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get credentials for a platform
   */
  static async getCredentials(
    automationId: string,
    platformName: string,
    userId: string
  ): Promise<Record<string, string> | null> {
    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('credentials')
        .eq('automation_id', automationId)
        .eq('platform_name', platformName)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return JSON.parse(data.credentials);
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  }

  /**
   * Get all credentials for an automation
   */
  static async getAllCredentials(
    automationId: string,
    userId: string
  ): Promise<SimpleCredential[]> {
    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('id, automation_id, platform_name, is_active, created_at, updated_at')
        .eq('automation_id', automationId)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error getting all credentials:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all credentials:', error);
      return [];
    }
  }

  /**
   * Check which platforms have saved credentials
   */
  static async getCredentialStatus(
    automationId: string,
    requiredPlatforms: string[],
    userId: string
  ): Promise<Record<string, 'saved' | 'missing'>> {
    try {
      const credentials = await this.getAllCredentials(automationId, userId);
      const savedPlatforms = new Set(credentials.map(c => c.platform_name.toLowerCase()));
      
      const status: Record<string, 'saved' | 'missing'> = {};
      
      requiredPlatforms.forEach(platform => {
        status[platform] = savedPlatforms.has(platform.toLowerCase()) ? 'saved' : 'missing';
      });

      return status;
    } catch (error) {
      console.error('Error getting credential status:', error);
      return {};
    }
  }

  /**
   * Delete credentials for a platform
   */
  static async deleteCredentials(
    automationId: string,
    platformName: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('automation_platform_credentials')
        .update({ is_active: false })
        .eq('automation_id', automationId)
        .eq('platform_name', platformName)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Basic credential format validation
   */
  static validateCredentialFormat(
    fieldName: string,
    value: string
  ): { isValid: boolean; message?: string } {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'This field is required' };
    }

    const lowerField = fieldName.toLowerCase();
    const trimmedValue = value.trim();

    // API Key validation
    if (lowerField.includes('api_key') || lowerField.includes('key')) {
      if (trimmedValue.length < 8) {
        return { isValid: false, message: 'API key appears to be too short' };
      }
    }

    // Token validation
    if (lowerField.includes('token')) {
      if (trimmedValue.length < 10) {
        return { isValid: false, message: 'Token appears to be too short' };
      }
    }

    // Email validation
    if (lowerField.includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        return { isValid: false, message: 'Please enter a valid email address' };
      }
    }

    // URL validation
    if (lowerField.includes('url') || lowerField.includes('endpoint')) {
      try {
        new URL(trimmedValue);
      } catch {
        return { isValid: false, message: 'Please enter a valid URL' };
      }
    }

    return { isValid: true };
  }
}