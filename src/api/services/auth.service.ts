import type { LoginResponse, User } from '@/types';
import { config } from '@/config';

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${config.api.baseUrl}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        // Определяем права на основе username
        let permissions: string[] = [];
        let role: 'admin' | 'content_manager' | 'procurement_manager' | 'legal_manager' | 'viewer' | 'guest' = 'guest';
        
        if (username === 'admin') {
          permissions = ['*'];
          role = 'admin';
        } else if (username === 'content_manager') {
          permissions = [
            'view_videos', 'create_videos', 'edit_videos', 'delete_videos',
            'view_photos', 'create_photos', 'edit_photos', 'delete_photos',
            'view_news', 'create_news', 'edit_news', 'delete_news',
          ];
          role = 'content_manager';
        } else if (username === 'procurement_manager') {
          permissions = [
            'view_procurements', 'create_procurements', 'edit_procurements', 'delete_procurements',
          ];
          role = 'procurement_manager';
        } else if (username === 'legal_manager') {
          permissions = [
            'view_local_acts', 'create_local_acts', 'edit_local_acts', 'delete_local_acts',
            'view_legislation', 'create_legislation', 'edit_legislation', 'delete_legislation',
          ];
          role = 'legal_manager';
        } else if (username === 'viewer') {
          permissions = [
            'view_videos', 'view_photos', 'view_news', 'view_procurements',
            'view_local_acts', 'view_legislation',
          ];
          role = 'viewer';
        }
        
        const user: User = {
          id: username,
          username: username,
          role: role,
          permissions: permissions,
          createdAt: new Date().toISOString(),
        };
        
        localStorage.setItem('current_user', JSON.stringify(user));
        
        return {
          success: true,
          token: data.access,
          user: user,
        };
      }
      
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.detail || 'Неверный логин или пароль' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Ошибка при подключении к серверу' };
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();