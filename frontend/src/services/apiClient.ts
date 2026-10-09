import type { ApiConfig, ApiError, ValidationError } from '../types/api';

class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.baseUrl.replace(/\/$/, '');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
      delete (headers as Record<string, string>)['Content-Type'];
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: ApiError | ValidationError;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = {
            code: 'HTTP_ERROR',
            message: text || `HTTP ${response.status}: ${response.statusText}`,
            status_code: response.status,
          };
        }

        throw errorData;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json();
      }

      return response.text() as T;
    } catch (error) {
      if (error && typeof error === 'object' && 'status_code' in error) {
        throw error; // Re-throw our ApiError
      }

      // Network or other errors
      const apiError: ApiError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
        status_code: 0,
      };
      throw apiError;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Update config
  setConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }
}

// Create singleton instance
const apiConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  useMock: import.meta.env.VITE_USE_MOCK_API === 'true',
};

export const apiClient = new ApiClient(apiConfig);

// Helper to format API errors for display
export function formatApiError(error: unknown, t: (key: string) => string): string {
  if (!error || typeof error !== 'object') {
    return t('common.error');
  }

  const apiError = error as ApiError | ValidationError;

  // Validation errors
  if (apiError.code === 'VALIDATION_ERROR' && 'details' in apiError && Array.isArray(apiError.details)) {
    return apiError.details.map(d => `${d.field}: ${d.message}`).join(', ');
  }

  // Known error codes
  switch (apiError.code) {
    case 'NETWORK_ERROR':
      return 'Unable to connect to server. Please check your connection.';
    case 'HTTP_ERROR':
      return `Server error: ${apiError.message}`;
    case 'NOT_FOUND':
      return 'The requested resource was not found.';
    case 'UNAUTHORIZED':
      return 'Authentication required. Please log in.';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    case 'RATE_LIMITED':
      return 'Too many requests. Please try again later.';
    default:
      return apiError.message || t('common.error');
  }
}

// Check if error is a validation error
export function isValidationError(error: unknown): error is ValidationError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as ApiError).code === 'VALIDATION_ERROR'
  );
}

// Check if error is network error
export function isNetworkError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as ApiError).code === 'NETWORK_ERROR'
  );
}