import type { LoginResponse, MeResponse, User } from '@/types';
import { config } from '@/config';
import { apiClient, ApiError } from '../client';

type Role = User['role'];

interface Access {
  username: string;
  role: Role;
  permissions: string[];
}

// view/create/edit/delete для каждого раздела
const crud = (...sections: string[]) =>
  sections.flatMap((section) => ['view', 'create', 'edit', 'delete'].map((action) => `${action}_${section}`));

// права групп Django. Сотрудник может состоять в нескольких группах — права складываются
const GROUP_PERMISSIONS: Record<string, string[]> = {
  content_managers: crud('videos', 'photos', 'news'),
  procurement_managers: crud('procurements'),
  legal_managers: crud('local_acts', 'legislation'),
  // удалять заказы может только суперпользователь: это история продаж
  shop_managers: [...crud('products'), 'view_orders', 'edit_orders'],
  // отдел кадров видит только вакансии
  hr_managers: crud('vacancies'),
  // заказы не показываем: в них личные данные покупателей
  viewers: [
    'view_videos', 'view_photos', 'view_news', 'view_procurements',
    'view_local_acts', 'view_legislation', 'view_products',
  ],
};

// роль для подписи в меню — по первой подходящей группе
const GROUP_ROLES: [string, Role][] = [
  ['content_managers', 'content_manager'],
  ['procurement_managers', 'procurement_manager'],
  ['legal_managers', 'legal_manager'],
  ['shop_managers', 'shop_manager'],
  ['hr_managers', 'hr_manager'],
  ['viewers', 'viewer'],
];

const accessFromMe = (me: MeResponse): Access => {
  if (me.is_superuser) {
    return { username: me.username, role: 'admin', permissions: ['*'] };
  }
  const groups = me.groups || [];
  const permissions = Array.from(new Set(groups.flatMap((group) => GROUP_PERMISSIONS[group] || [])));
  const role = GROUP_ROLES.find(([group]) => groups.includes(group))?.[1] || 'guest';
  return { username: me.username, role, permissions };
};

const toUser = ({ username, role, permissions }: Access): User => ({
  id: username,
  username,
  role,
  permissions,
  createdAt: new Date().toISOString(),
});

class AuthService {
  // права по только что полученному входу. null — входить нельзя
  private async loadAccess(): Promise<Access | null> {
    try {
      const response = await fetch(`${config.api.baseUrl}/me/`, {
        credentials: 'include',
        signal: AbortSignal.timeout(config.api.timeout),
      });
      return response.ok ? accessFromMe(await response.json()) : null;
    } catch (error) {
      console.error('GET /me/ failed:', error);
      return null;
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${config.api.baseUrl}/token/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // роль и права выдаёт сервер по группам сотрудника (GET /me/)
        const access = await this.loadAccess();
        if (!access) {
          return { success: false, message: 'Не удалось получить права учётной записи. Попробуйте войти позже.' };
        }

        const user = toUser(access);
        localStorage.setItem('current_user', JSON.stringify(user));

        return {
          success: true,
          user: user,
        };
      }

      const errorData = await response.json().catch(() => ({}));
      // сервер отвечает по-английски («No active account…»), показываем понятный текст
      if (response.status === 400 || response.status === 401) {
        return { success: false, message: 'Неверный логин или пароль' };
      }
      if (response.status === 429) {
        return { success: false, message: 'Слишком много попыток входа. Подождите немного и попробуйте снова.' };
      }
      return { success: false, message: errorData.detail || 'Сервер не смог выполнить вход. Попробуйте позже.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Нет связи с сервером. Проверьте подключение к интернету.' };
    }
  }

  // Перечитывает права уже вошедшего сотрудника: группы могли поменять, а сохранённые
  // в браузере права могли остаться от старой версии админки.
  // 'expired' — вход недействителен (нужно войти заново), null — сервер недоступен, оставить как есть
  async refreshCurrentUser(): Promise<User | 'expired' | null> {
    try {
      const me = await apiClient.get<MeResponse>('/me/');
      const user = toUser(accessFromMe(me));
      localStorage.setItem('current_user', JSON.stringify(user));
      return user;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return 'expired';
      if (!(error instanceof ApiError)) console.error('Refresh user failed:', error);
      return null;
    }
  }

  // Сервер отзывает токен: скопированная сессия перестаёт работать сразу, а не через сутки
  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    await fetch(`${config.api.baseUrl}/token/logout/`, { method: 'POST', credentials: 'include' }).catch((error) => {
      console.error('Logout failed:', error);
    });
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
}

export const authService = new AuthService();
