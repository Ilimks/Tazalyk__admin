import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/api/services/auth.service';
import { config } from '@/config';
import type { PermissionSection, User, UserPermissions } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  serverStatus: 'checking' | 'online' | 'offline';
  isLoading: boolean;
  // текст ошибки входа для формы (вместо alert)
  loginError: string | null;
  clearLoginError: () => void;
  permissions: UserPermissions;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkServer: () => Promise<void>;
  setServerStatus: (status: 'checking' | 'online' | 'offline') => void;
  // перечитать роль и права с сервера (GET /me/) после перезагрузки страницы
  refreshPermissions: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canView: (section: PermissionSection) => boolean;
  canCreate: (section: PermissionSection) => boolean;
  canEdit: (section: PermissionSection) => boolean;
  canDelete: (section: PermissionSection) => boolean;
}

const getPermissionsForUser = (role: string, customPermissions?: string[]): UserPermissions => {
  const basePermissions: UserPermissions = {
    canViewVideos: false,
    canCreateVideos: false,
    canEditVideos: false,
    canDeleteVideos: false,
    canViewPhotos: false,
    canCreatePhotos: false,
    canEditPhotos: false,
    canDeletePhotos: false,
    canViewNews: false,
    canCreateNews: false,
    canEditNews: false,
    canDeleteNews: false,
    canViewProcurements: false,
    canCreateProcurements: false,
    canEditProcurements: false,
    canDeleteProcurements: false,
    canViewLocalActs: false,
    canCreateLocalActs: false,
    canEditLocalActs: false,
    canDeleteLocalActs: false,
    canViewLegislation: false,
    canCreateLegislation: false,
    canEditLegislation: false,
    canDeleteLegislation: false,
    canViewProducts: false,
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewOrders: false,
    canCreateOrders: false,
    canEditOrders: false,
    canDeleteOrders: false,
    canViewVacancies: false,
    canCreateVacancies: false,
    canEditVacancies: false,
    canDeleteVacancies: false,
    canManageUsers: false,
  };

  if (customPermissions?.includes('*')) {
    return {
      canViewVideos: true,
      canCreateVideos: true,
      canEditVideos: true,
      canDeleteVideos: true,
      canViewPhotos: true,
      canCreatePhotos: true,
      canEditPhotos: true,
      canDeletePhotos: true,
      canViewNews: true,
      canCreateNews: true,
      canEditNews: true,
      canDeleteNews: true,
      canViewProcurements: true,
      canCreateProcurements: true,
      canEditProcurements: true,
      canDeleteProcurements: true,
      canViewLocalActs: true,
      canCreateLocalActs: true,
      canEditLocalActs: true,
      canDeleteLocalActs: true,
      canViewLegislation: true,
      canCreateLegislation: true,
      canEditLegislation: true,
      canDeleteLegislation: true,
      canViewProducts: true,
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canViewOrders: true,
      canCreateOrders: true,
      canEditOrders: true,
      canDeleteOrders: true,
      canViewVacancies: true,
      canCreateVacancies: true,
      canEditVacancies: true,
      canDeleteVacancies: true,
      canManageUsers: true,
    };
  }

  const perms = { ...basePermissions };
  
  customPermissions?.forEach(permission => {
    switch (permission) {
      case 'view_videos': perms.canViewVideos = true; break;
      case 'create_videos': perms.canCreateVideos = true; break;
      case 'edit_videos': perms.canEditVideos = true; break;
      case 'delete_videos': perms.canDeleteVideos = true; break;
      
      case 'view_photos': perms.canViewPhotos = true; break;
      case 'create_photos': perms.canCreatePhotos = true; break;
      case 'edit_photos': perms.canEditPhotos = true; break;
      case 'delete_photos': perms.canDeletePhotos = true; break;
      
      case 'view_news': perms.canViewNews = true; break;
      case 'create_news': perms.canCreateNews = true; break;
      case 'edit_news': perms.canEditNews = true; break;
      case 'delete_news': perms.canDeleteNews = true; break;
      
      case 'view_procurements': perms.canViewProcurements = true; break;
      case 'create_procurements': perms.canCreateProcurements = true; break;
      case 'edit_procurements': perms.canEditProcurements = true; break;
      case 'delete_procurements': perms.canDeleteProcurements = true; break;
      
      case 'view_local_acts': perms.canViewLocalActs = true; break;
      case 'create_local_acts': perms.canCreateLocalActs = true; break;
      case 'edit_local_acts': perms.canEditLocalActs = true; break;
      case 'delete_local_acts': perms.canDeleteLocalActs = true; break;
      
      case 'view_legislation': perms.canViewLegislation = true; break;
      case 'create_legislation': perms.canCreateLegislation = true; break;
      case 'edit_legislation': perms.canEditLegislation = true; break;
      case 'delete_legislation': perms.canDeleteLegislation = true; break;

      case 'view_products': perms.canViewProducts = true; break;
      case 'create_products': perms.canCreateProducts = true; break;
      case 'edit_products': perms.canEditProducts = true; break;
      case 'delete_products': perms.canDeleteProducts = true; break;

      case 'view_orders': perms.canViewOrders = true; break;
      case 'edit_orders': perms.canEditOrders = true; break;
      case 'delete_orders': perms.canDeleteOrders = true; break;

      case 'view_vacancies': perms.canViewVacancies = true; break;
      case 'create_vacancies': perms.canCreateVacancies = true; break;
      case 'edit_vacancies': perms.canEditVacancies = true; break;
      case 'delete_vacancies': perms.canDeleteVacancies = true; break;
      
      case 'manage_users': perms.canManageUsers = true; break;
    }
  });

  return perms;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      serverStatus: 'checking',
      isLoading: false,
      loginError: null,
      permissions: getPermissionsForUser('viewer', []),

      login: async (username: string, password: string) => {
        set({ isLoading: true, loginError: null });
        
        try {
          const response = await authService.login(username, password);
          if (response.success && response.user) {
            const permissions = getPermissionsForUser(response.user.role, response.user.permissions);
            set({ 
              isAuthenticated: true, 
              user: response.user,
              permissions,
              isLoading: false 
            });
            return true;
          } else {
            set({ isLoading: false, loginError: response.message || 'Неверный логин или пароль' });
            return false;
          }
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false, loginError: 'Не удалось войти. Проверьте подключение к интернету.' });
          return false;
        }
      },

      logout: () => {
        authService.logout();
        set({ 
          isAuthenticated: false, 
          user: null,
          permissions: getPermissionsForUser('viewer', [])
        });
      },

      // любой ответ сервера (даже 401) значит, что он доступен; сетевая ошибка — недоступен
      checkServer: async () => {
        set({ serverStatus: 'checking' });
        try {
          await fetch(`${config.api.baseUrl}/health/`, { signal: AbortSignal.timeout(8000) });
          set({ serverStatus: 'online' });
        } catch {
          set({ serverStatus: 'offline' });
        }
      },

      clearLoginError: () => set({ loginError: null }),

      setServerStatus: (status) => set({ serverStatus: status }),

      refreshPermissions: async () => {
        const result = await authService.refreshCurrentUser();
        // пока шёл запрос, сотрудник мог выйти
        if (!result || !get().isAuthenticated) return;
        // сохранённый вход больше не действует (например, сменился ключ сервера) — входим заново,
        // иначе остались бы права старой версии админки без новых разделов
        if (result === 'expired') {
          get().logout();
          set({ loginError: 'Сессия истекла — войдите снова.' });
          return;
        }
        set({ user: result, permissions: getPermissionsForUser(result.role, result.permissions) });
      },

      hasPermission: (permission: string) => {
        const { permissions } = get();
        return permissions[permission as keyof UserPermissions] || false;
      },

      canView: (section) => {
        const { permissions } = get();
        const map: Record<PermissionSection, boolean> = {
          videos: permissions.canViewVideos,
          photos: permissions.canViewPhotos,
          news: permissions.canViewNews,
          procurements: permissions.canViewProcurements,
          local_acts: permissions.canViewLocalActs,
          legislation: permissions.canViewLegislation,
          products: permissions.canViewProducts,
          orders: permissions.canViewOrders,
          vacancies: permissions.canViewVacancies,
          applications: permissions.canViewVacancies,
        };
        // в сохранённых старой версией правах новых ключей может не быть
        return Boolean(map[section]);
      },

      canCreate: (section) => {
        const { permissions } = get();
        const map: Record<PermissionSection, boolean> = {
          videos: permissions.canCreateVideos,
          photos: permissions.canCreatePhotos,
          news: permissions.canCreateNews,
          procurements: permissions.canCreateProcurements,
          local_acts: permissions.canCreateLocalActs,
          legislation: permissions.canCreateLegislation,
          products: permissions.canCreateProducts,
          orders: permissions.canCreateOrders,
          vacancies: permissions.canCreateVacancies,
          // отклики приходят только с сайта
          applications: false,
        };
        return Boolean(map[section]);
      },

      canEdit: (section) => {
        const { permissions } = get();
        const map: Record<PermissionSection, boolean> = {
          videos: permissions.canEditVideos,
          photos: permissions.canEditPhotos,
          news: permissions.canEditNews,
          procurements: permissions.canEditProcurements,
          local_acts: permissions.canEditLocalActs,
          legislation: permissions.canEditLegislation,
          products: permissions.canEditProducts,
          orders: permissions.canEditOrders,
          vacancies: permissions.canEditVacancies,
          applications: permissions.canEditVacancies,
        };
        return Boolean(map[section]);
      },

      canDelete: (section) => {
        const { permissions } = get();
        const map: Record<PermissionSection, boolean> = {
          videos: permissions.canDeleteVideos,
          photos: permissions.canDeletePhotos,
          news: permissions.canDeleteNews,
          procurements: permissions.canDeleteProcurements,
          local_acts: permissions.canDeleteLocalActs,
          legislation: permissions.canDeleteLegislation,
          products: permissions.canDeleteProducts,
          orders: permissions.canDeleteOrders,
          vacancies: permissions.canDeleteVacancies,
          applications: permissions.canDeleteVacancies,
        };
        return Boolean(map[section]);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        permissions: state.permissions 
      }),
    }
  )
);