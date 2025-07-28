
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zorwtyijosgdcckljmqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvcnd0eWlqb3NnZGNja2xqbXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMTA4NDksImV4cCI6MjA2NTY4Njg0OX0.R-HltFpAhGNf_U2WEAYurf9LQ1xLgdQyP7C4ez6zRP4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate a secure encryption key for the user
async function generateUserEncryptionKey(userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + 'yusrai-security-salt-v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// AES-GCM encryption
async function encryptData(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBuffer = new Uint8Array(key.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = encoder.encode(data);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encodedData
  );
  
  const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
  const ivArray = Array.from(iv);
  
  return JSON.stringify({
    iv: ivArray,
    data: encryptedArray
  });
}

// AES-GCM decryption
async function decryptData(encryptedData: string, key: string): Promise<string> {
  const { iv, data } = JSON.parse(encryptedData);
  const keyBuffer = new Uint8Array(key.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    cryptoKey,
    new Uint8Array(data)
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

export class SecureCredentials {
  static async encrypt(credentials: Record<string, string>, userId: string): Promise<string> {
    try {
      const key = await generateUserEncryptionKey(userId);
      const credentialsString = JSON.stringify(credentials);
      return await encryptData(credentialsString, key);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt credentials');
    }
  }

  static async decrypt(encryptedCredentials: string, userId: string): Promise<Record<string, string>> {
    try {
      const key = await generateUserEncryptionKey(userId);
      const credentialsString = await decryptData(encryptedCredentials, key);
      return JSON.parse(credentialsString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt credentials');
    }
  }

  static async saveCredentials(
    platformName: string,
    credentials: Record<string, string>,
    userId: string,
    automationId: string
  ): Promise<boolean> {
    try {
      const encryptedCredentials = await this.encrypt(credentials, userId);
      
      const { error } = await supabase
        .from('automation_platform_credentials')
        .upsert({
          platform_name: platformName,
          credentials: encryptedCredentials,
          user_id: userId,
          automation_id: automationId,
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database save error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Save credentials error:', error);
      return false;
    }
  }

  static async getCredentials(
    platformName: string,
    userId: string,
    automationId: string
  ): Promise<Record<string, string> | null> {
    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('credentials')
        .eq('platform_name', platformName)
        .eq('user_id', userId)
        .eq('automation_id', automationId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return await this.decrypt(data.credentials, userId);
    } catch (error) {
      console.error('Get credentials error:', error);
      return null;
    }
  }
}
