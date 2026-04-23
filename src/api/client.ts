import { config } from '@/config';

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
    console.log('ApiClient initialized with baseUrl:', this.baseUrl);
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(access: string, refresh: string): void {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach(cb => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void): void {
    this.refreshSubscribers.push(cb);
  }

  private async refreshToken(): Promise<string | null> {
    const refresh = this.getRefreshToken();
    if (!refresh) return null;

    try {
      const response = await fetch(`${this.baseUrl}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        return data.access;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Making request to: ${url}`);

    const makeRequest = async (token?: string): Promise<Response> => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      return fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
    };

    try {
      let token = this.getAccessToken();
      let response = await makeRequest(token || undefined);

      // Если токен истек (401), пробуем обновить
      if (response.status === 401 && token) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.refreshToken();
          this.isRefreshing = false;
          
          if (newToken) {
            this.onRefreshed(newToken);
            token = newToken;
          } else {
            this.clearTokens();
            window.location.href = '/login';
            throw new Error('Session expired');
          }
        }

        // Ждем обновления токена
        await new Promise<void>((resolve) => {
          this.addRefreshSubscriber((newToken) => {
            token = newToken;
            resolve();
          });
        });

        response = await makeRequest(token);
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          const text = await response.text();
          if (text.includes('RuntimeError')) {
            errorMessage = 'Ошибка сервера. Проверьте URL и настройки Django.';
          } else {
            errorMessage = text.substring(0, 200);
          }
        }
        throw new ApiError(response.status, errorMessage);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Request failed:', error);
      
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(408, 'Превышено время ожидания ответа от сервера');
      }
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError(0, 'Не удается подключиться к серверу. Убедитесь, что сервер запущен.');
      }
      throw new ApiError(500, 'Ошибка сети: ' + (error as Error).message);
    }
  }

  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();