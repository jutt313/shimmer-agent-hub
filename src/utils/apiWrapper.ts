
import { globalErrorLogger } from './errorLogger';

interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

class ApiWrapper {
  private baseUrl: string;
  private defaultTimeout = 30000; // 30 seconds
  private defaultRetries = 3;
  private defaultRetryDelay = 1000; // 1 second

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options;

    const url = this.baseUrl + endpoint;
    let lastError: Error;

    // Add default headers
    const headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        globalErrorLogger.log('DEBUG', `API Request attempt ${attempt + 1}`, {
          url,
          method: fetchOptions.method || 'GET',
          attempt: attempt + 1,
          maxAttempts: retries + 1
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json().catch(() => null);

        globalErrorLogger.log('DEBUG', 'API Request successful', {
          url,
          status: response.status,
          attempt: attempt + 1
        });

        return {
          data,
          error: null,
          success: true,
        };

      } catch (error: any) {
        lastError = error;

        globalErrorLogger.log('WARN', `API Request failed (attempt ${attempt + 1})`, {
          url,
          error: error.message,
          attempt: attempt + 1,
          maxAttempts: retries + 1
        });

        // Don't retry on certain errors
        if (error.name === 'AbortError' || 
            (error.message && error.message.includes('401')) ||
            (error.message && error.message.includes('403')) ||
            attempt === retries) {
          break;
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    globalErrorLogger.log('ERROR', 'API Request failed after all retries', {
      url,
      error: lastError!.message,
      totalAttempts: retries + 1
    });

    return {
      data: null,
      error: lastError!.message,
      success: false,
    };
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Global API wrapper instance
export const apiClient = new ApiWrapper();

// Supabase-specific wrapper
export const supabaseApiClient = new ApiWrapper('https://zorwtyijosgdcckljmqd.supabase.co');
