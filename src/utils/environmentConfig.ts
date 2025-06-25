
// Environment configuration and validation
export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.validateAndLoadConfig();
  }

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  private validateAndLoadConfig(): EnvironmentConfig {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zorwtyijosgdcckljmqd.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvcnd0eWlqb3NnZGNja2xqbXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMTA4NDksImV4cCI6MjA2NTY4Njg0OX0.R-HltFpAhGNf_U2WEAYurf9LQ1xLgdQyP7C4ez6zRP4';
    const mode = import.meta.env.MODE;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
    }

    return {
      supabaseUrl,
      supabaseAnonKey,
      isDevelopment: mode === 'development',
      isProduction: mode === 'production'
    };
  }

  getConfig(): EnvironmentConfig {
    return this.config;
  }

  validateSupabaseConfig(): boolean {
    const { supabaseUrl, supabaseAnonKey } = this.config;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required Supabase configuration');
      return false;
    }

    if (!supabaseUrl.startsWith('https://')) {
      console.error('Supabase URL must use HTTPS');
      return false;
    }

    if (supabaseAnonKey.length < 100) {
      console.error('Supabase anon key appears to be invalid');
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const environmentConfig = EnvironmentValidator.getInstance();
