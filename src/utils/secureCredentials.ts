
import { supabase } from '@/integrations/supabase/client';
import { globalErrorLogger } from '@/utils/errorLogger';

export interface SecureCredential {
  id: string;
  platform_name: string;
  credential_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Encryption utilities for secure credential storage
class CredentialEncryption {
  private static async getEncryptionKey(): Promise<CryptoKey> {
    // Generate or derive a key for encryption
    // In production, this should use a proper key management service
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('your-secure-key-32-bytes-long!!'), // This should come from environment
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('salt-should-be-random'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptCredentials(credentials: Record<string, string>): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(JSON.stringify(credentials));

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Credential encryption failed', {
        error: error.message
      });
      throw new Error('Failed to encrypt credentials');
    }
  }

  static async decryptCredentials(encryptedData: string): Promise<Record<string, string>> {
    try {
      const key = await this.getEncryptionKey();
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decryptedText = new TextDecoder().decode(decrypted);
      return JSON.parse(decryptedText);
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Credential decryption failed', {
        error: error.message
      });
      throw new Error('Failed to decrypt credentials');
    }
  }
}

export class SecureCredentialManager {
  /**
   * Store encrypted credentials securely
   */
  static async storeCredentials(
    userId: string,
    platformName: string,
    credentials: Record<string, string>
  ): Promise<boolean> {
    try {
      const encryptedCredentials = await CredentialEncryption.encryptCredentials(credentials);

      // Check if credentials already exist
      const { data: existing } = await supabase
        .from('platform_credentials')
        .select('id')
        .eq('user_id', userId)
        .eq('platform_name', platformName)
        .single();

      const credentialData = {
        user_id: userId,
        platform_name: platformName,
        credential_type: 'encrypted_api',
        credentials: encryptedCredentials,
        is_active: true
      };

      let result;
      if (existing) {
        result = await supabase
          .from('platform_credentials')
          .update(credentialData)
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('platform_credentials')
          .insert(credentialData);
      }

      if (result.error) throw result.error;

      globalErrorLogger.log('INFO', 'Credentials stored securely', {
        userId,
        platformName,
        encrypted: true
      });

      return true;
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to store credentials', {
        userId,
        platformName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Retrieve and decrypt credentials
   */
  static async getCredentials(
    userId: string,
    platformName: string
  ): Promise<Record<string, string> | null> {
    try {
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform_name', platformName)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      return await CredentialEncryption.decryptCredentials(data.credentials);
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to retrieve credentials', {
        userId,
        platformName,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get user's credentials (without exposing actual credential values)
   */
  static async getUserCredentials(userId: string): Promise<SecureCredential[]> {
    try {
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('id, platform_name, credential_type, is_active, created_at, updated_at')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      globalErrorLogger.log('ERROR', 'Error fetching user credentials', {
        userId,
        error: error.message
      });
      throw new Error('Failed to fetch credentials');
    }
  }

  /**
   * Check if user has valid credentials for a platform
   */
  static async hasValidCredentials(userId: string, platformName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('id')
        .eq('user_id', userId)
        .eq('platform_name', platformName)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      globalErrorLogger.log('ERROR', 'Error checking credentials', {
        userId,
        platformName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Delete credentials securely
   */
  static async deleteCredentials(userId: string, platformName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('platform_credentials')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('platform_name', platformName);

      if (error) throw error;

      globalErrorLogger.log('INFO', 'Credentials deleted securely', {
        userId,
        platformName
      });

      return true;
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to delete credentials', {
        userId,
        platformName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Validate API operation without exposing credentials
   */
  static async validateCredentials(credentialId: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: { credentialId }
      });

      if (error) throw error;

      return {
        isValid: data?.success === true,
        error: data?.error
      };
    } catch (error) {
      globalErrorLogger.log('ERROR', 'Error validating credentials', {
        credentialId,
        error: error.message
      });
      return {
        isValid: false,
        error: 'Failed to validate credentials'
      };
    }
  }
}
