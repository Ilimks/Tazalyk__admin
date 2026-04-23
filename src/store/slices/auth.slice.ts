import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/api/services/auth.service';
import type { User, UserPermissions } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  serverStatus: 'checking' | 'online' | 'offline';
  isLoading: boolean;
  permissions: UserPermissions;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkServer: () => Promise<void>;
  setServerStatus: (status: 'checking' | 'online' | 'offline') => void;
  hasPermission: (permission: string) => boolean;
  canView: (section: 'videos' | 'photos' | 'news' | 'procurements' | 'local_acts' | 'legislation') => boolean;
  canCreate: (section: 'videos' | 'photos' | 'news' | 'procurements' | 'local_acts' | 'legislation') => boolean;
  canEdit: (section: 'videos' | 'photos' | 'news' | 'procurements' | 'local_acts' | 'legislation') => boolean;
  canDelete: (section: 'videos' | 'photos' | 'news' | 'procurements' | 'local_acts' | 'legislation') => boolean;
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
      serverStatus: 'online',
      isLoading: false,
      permissions: getPermissionsForUser('viewer', []),

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        
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
            alert(response.message || 'Неверный логин или пароль');
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Login error:', error);
          alert('Ошибка при входе');
          set({ isLoading: false });
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

      checkServer: async () => {
        set({ serverStatus: 'online' });
      },

      setServerStatus: (status) => set({ serverStatus: status }),

      hasPermission: (permission: string) => {
        const { permissions } = get();
        return permissions[permission as keyof UserPermissions] || false;
      },

      canView: (section) => {
        const { permissions } = get();
        const map = {
          videos: permissions.canViewVideos,
          photos: permissions.canViewPhotos,
          news: permissions.canViewNews,
          procurements: permissions.canViewProcurements,
          local_acts: permissions.canViewLocalActs,
          legislation: permissions.canViewLegislation,
        };
        return map[section];
      },

      canCreate: (section) => {
        const { permissions } = get();
        const map = {
          videos: permissions.canCreateVideos,
          photos: permissions.canCreatePhotos,
          news: permissions.canCreateNews,
          procurements: permissions.canCreateProcurements,
          local_acts: permissions.canCreateLocalActs,
          legislation: permissions.canCreateLegislation,
        };
        return map[section];
      },

      canEdit: (section) => {
        const { permissions } = get();
        const map = {
          videos: permissions.canEditVideos,
          photos: permissions.canEditPhotos,
          news: permissions.canEditNews,
          procurements: permissions.canEditProcurements,
          local_acts: permissions.canEditLocalActs,
          legislation: permissions.canEditLegislation,
        };
        return map[section];
      },

      canDelete: (section) => {
        const { permissions } = get();
        const map = {
          videos: permissions.canDeleteVideos,
          photos: permissions.canDeletePhotos,
          news: permissions.canDeleteNews,
          procurements: permissions.canDeleteProcurements,
          local_acts: permissions.canDeleteLocalActs,
          legislation: permissions.canDeleteLegislation,
        };
        return map[section];
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