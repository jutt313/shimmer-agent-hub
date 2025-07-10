
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

// Secure encryption utilities with environment-based keys
class CredentialEncryption {
  private static async getEncryptionKey(): Promise<CryptoKey> {
    // Use environment variables for encryption keys (never hardcode)
    const keyMaterial = import.meta.env.VITE_ENCRYPTION_KEY || this.generateSecureKey();
    const salt = import.meta.env.VITE_ENCRYPTION_SALT || this.generateSecureSalt();
    
    if (!import.meta.env.VITE_ENCRYPTION_KEY) {
      globalErrorLogger.log('WARN', 'Using generated encryption key - set VITE_ENCRYPTION_KEY for production', {});
    }

    const keyMaterialBuffer = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keyMaterial),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterialBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private static generateSecureKey(): string {
    // Generate a secure random key for development only
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private static generateSecureSalt(): string {
    // Generate a secure random salt for development only
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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
   * Store encrypted credentials securely with enhanced error handling
   */
  static async storeCredentials(
    userId: string,
    platformName: string,
    credentials: Record<string, string>
  ): Promise<boolean> {
    try {
      console.log('🔐 Starting credential storage process...');
      console.log('👤 User ID:', userId);
      console.log('🏢 Platform:', platformName);
      console.log('🔑 Credential keys:', Object.keys(credentials));

      // Validate inputs
      if (!userId || !platformName || !credentials || Object.keys(credentials).length === 0) {
        throw new Error('Invalid input parameters for credential storage');
      }

      // Encrypt credentials
      console.log('🔒 Encrypting credentials...');
      const encryptedCredentials = await CredentialEncryption.encryptCredentials(credentials);

      // Check if credentials already exist
      console.log('🔍 Checking for existing credentials...');
      const { data: existing, error: checkError } = await supabase
        .from('platform_credentials')
        .select('id')
        .eq('user_id', userId)
        .eq('platform_name', platformName)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing credentials:', checkError);
        throw new Error(`Failed to check existing credentials: ${checkError.message}`);
      }

      const credentialData = {
        user_id: userId,
        platform_name: platformName,
        credential_type: 'encrypted_api',
        credentials: encryptedCredentials,
        is_active: true
      };

      let result;
      if (existing) {
        console.log('🔄 Updating existing credentials...');
        result = await supabase
          .from('platform_credentials')
          .update({
            credentials: encryptedCredentials,
            credential_type: 'encrypted_api',
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        console.log('➕ Creating new credentials...');
        result = await supabase
          .from('platform_credentials')
          .insert(credentialData);
      }

      if (result.error) {
        console.error('❌ Database operation failed:', result.error);
        throw new Error(`Database operation failed: ${result.error.message}`);
      }

      console.log('✅ Credentials stored successfully');
      globalErrorLogger.log('INFO', 'Credentials stored securely', {
        userId,
        platformName,
        encrypted: true,
        operation: existing ? 'update' : 'insert'
      });

      return true;
    } catch (error: any) {
      console.error('❌ Failed to store credentials:', error);
      globalErrorLogger.log('ERROR', 'Failed to store credentials', {
        userId,
        platformName,
        error: error.message,
        stack: error.stack
      });
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Retrieve and decrypt credentials with enhanced error handling
   */
  static async getCredentials(
    userId: string,
    platformName: string
  ): Promise<Record<string, string> | null> {
    try {
      console.log('🔍 Retrieving credentials for:', { userId, platformName });

      const { data, error } = await supabase
        .from('platform_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform_name', platformName)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Error retrieving credentials:', error);
        throw new Error(`Failed to retrieve credentials: ${error.message}`);
      }

      if (!data) {
        console.log('ℹ️ No credentials found');
        return null;
      }

      console.log('🔓 Decrypting credentials...');
      const decryptedCredentials = await CredentialEncryption.decryptCredentials(data.credentials);
      console.log('✅ Credentials retrieved and decrypted successfully');
      
      return decryptedCredentials;
    } catch (error: any) {
      console.error('❌ Failed to retrieve credentials:', error);
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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user credentials:', error);
        throw new Error(`Failed to fetch credentials: ${error.message}`);
      }
      
      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching user credentials:', error);
      globalErrorLogger.log('ERROR', 'Error fetching user credentials', {
        userId,
        error: error.message
      });
      throw error;
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

      if (error) {
        console.error('❌ Error checking credentials:', error);
        return false;
      }
      
      return (data?.length || 0) > 0;
    } catch (error: any) {
      console.error('❌ Error checking credentials:', error);
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

      if (error) {
        console.error('❌ Error deleting credentials:', error);
        throw new Error(`Failed to delete credentials: ${error.message}`);
      }

      console.log('✅ Credentials deleted successfully');
      globalErrorLogger.log('INFO', 'Credentials deleted securely', {
        userId,
        platformName
      });

      return true;
    } catch (error: any) {
      console.error('❌ Failed to delete credentials:', error);
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

      if (error) {
        console.error('❌ Error validating credentials:', error);
        throw error;
      }

      return {
        isValid: data?.success === true,
        error: data?.error
      };
    } catch (error: any) {
      console.error('❌ Error validating credentials:', error);
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
