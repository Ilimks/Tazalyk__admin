import { config } from '@/config';

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
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

  // одно обновление токена на все запросы, получившие 401 одновременно
  private refreshAccessToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshToken().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
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
        // при ROTATE_REFRESH_TOKENS сервер выдаёт и новый refresh
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
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
        const newToken = await this.refreshAccessToken();

        if (!newToken) {
          // AdminPanel ловит событие и возвращает на экран входа
          this.clearTokens();
          window.dispatchEvent(new Event('auth:expired'));
          throw new ApiError(401, 'Сессия истекла, войдите снова');
        }

        response = await makeRequest(newToken);
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorData: unknown;
        // тело читается один раз: сначала текстом, потом пробуем разобрать JSON
        const text = await response.text().catch(() => '');
        try {
          errorData = JSON.parse(text);
          if (errorData && typeof errorData === 'object') {
            const data = errorData as Record<string, unknown>;
            const message = data.message || data.error || data.detail;
            if (typeof message === 'string') errorMessage = message;
          }
        } catch {
          if (text.includes('RuntimeError')) {
            errorMessage = 'Ошибка сервера. Проверьте URL и настройки Django.';
          } else if (text) {
            errorMessage = text.substring(0, 200);
          }
        }
        // errorData — ответ сервера целиком: для 400 там ошибки по полям {поле: [текст]}
        throw new ApiError(response.status, errorMessage, errorData);
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

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();