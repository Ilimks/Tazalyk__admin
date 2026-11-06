import { config } from '@/config';

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  // Токены лежат в cookie, недоступных скриптам. В браузере хранится только имя и права для меню.
  // access_token и refresh_token остались от прежних версий админки
  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
  }

  private hasSession(): boolean {
    return Boolean(localStorage.getItem('current_user'));
  }

  // одно обновление токена на все запросы, получившие 401 одновременно
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

      // Если токен истек (401), пробуем обновить
      if (response.status === 401 && this.hasSession()) {
        if (!(await this.refreshAccessToken())) {
          // AdminPanel ловит событие и возвращает на экран входа
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

      return await parse(response);
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
        credentials: 'include',
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

  // файл с сервера: авторизация и обновление токена те же, что у обычных запросов
  download(endpoint: string): Promise<Blob> {
    return this.request<Blob>(endpoint, { method: 'GET' }, (response) => response.blob());
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