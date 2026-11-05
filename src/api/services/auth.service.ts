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

// Запасной вариант для сервера без /me/ (или если запрос не дошёл): права по логину, как раньше
const legacyAccess = (username: string): Access => {
  let permissions: string[] = [];
  let role: Role = 'guest';

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

  return { username, role, permissions };
};

const toUser = ({ username, role, permissions }: Access): User => ({
  id: username,
  username,
  role,
  permissions,
  createdAt: new Date().toISOString(),
});

class AuthService {
  // права по только что выданному токену. null — сервер ответил ошибкой, входить нельзя
  private async loadAccess(token: string, username: string): Promise<Access | null> {
    let response: Response;
    try {
      response = await fetch(`${config.api.baseUrl}/me/`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(config.api.timeout),
      });
    } catch (error) {
      console.error('GET /me/ failed:', error);
      return legacyAccess(username);
    }

    if (response.status === 404) return legacyAccess(username);
    if (!response.ok) return null;

    try {
      return accessFromMe(await response.json());
    } catch {
      return null;
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${config.api.baseUrl}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        // роль и права выдаёт сервер по группам сотрудника (GET /me/)
        const access = await this.loadAccess(data.access, username);
        if (!access) {
          return { success: false, message: 'Не удалось получить права учётной записи. Попробуйте войти позже.' };
        }

        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);

        const user = toUser(access);
        localStorage.setItem('current_user', JSON.stringify(user));

        return {
          success: true,
          token: data.access,
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
