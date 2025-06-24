
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const mode = import.meta.env.MODE;

    // Fallback to hardcoded values if environment variables are not set
    // This ensures backward compatibility during migration
    const finalUrl = supabaseUrl || "https://zorwtyijosgdcckljmqd.supabase.co";
    const finalKey = supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvcnd0eWlqb3NnZGNja2xqbXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMTA4NDksImV4cCI6MjA2NTY4Njg0OX0.R-HltFpAhGNf_U2WEAYurf9LQ1xLgdQyP7C4ez6zRP4";

    // Log warnings if using fallback values
    if (!supabaseUrl) {
      console.warn('VITE_SUPABASE_URL not found in environment, using fallback');
    }
    if (!supabaseAnonKey) {
      console.warn('VITE_SUPABASE_ANON_KEY not found in environment, using fallback');
    }

    return {
      supabaseUrl: finalUrl,
      supabaseAnonKey: finalKey,
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
