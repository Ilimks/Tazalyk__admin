import { config } from '@/config';

const reportServer = (status: 'online' | 'offline') => {
  window.dispatchEvent(new CustomEvent('api:server', { detail: status }));
};

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
  }

  private hasSession(): boolean {
    return Boolean(localStorage.getItem('current_user'));
  }

  private refreshAccessToken(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshToken().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/token/refresh/`, {
        method: 'POST',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    parse: (response: Response) => Promise<T> = (response) => response.json()
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const url = `${this.baseUrl}${endpoint}`;

    const makeRequest = (): Promise<Response> =>
      fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

    try {
      let response = await makeRequest();
      reportServer('online');

      if (response.status === 401 && this.hasSession()) {
        if (!(await this.refreshAccessToken())) {
          this.clearSession();
          window.dispatchEvent(new Event('auth:expired'));
          throw new ApiError(401, 'Сессия истекла, войдите снова');
        }

        response = await makeRequest();
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorData: unknown;
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
        throw new ApiError(response.status, errorMessage, errorData);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await parse(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        reportServer('offline');
        throw new ApiError(408, 'Превышено время ожидания ответа от сервера');
      }
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        reportServer('offline');
        throw new ApiError(0, 'Не удается подключиться к серверу. Убедитесь, что сервер запущен.');
      }
      throw new ApiError(500, 'Ошибка сети: ' + (error as Error).message);
    }
  }

  refreshSession(): Promise<boolean> {
    return this.refreshAccessToken();
  }

  download(endpoint: string): Promise<Blob> {
    return this.request<Blob>(endpoint, { method: 'GET' }, (response) => response.blob());
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
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