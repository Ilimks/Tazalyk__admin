export interface User {
  id: string;
  username: string;
  role: 'admin' | 'content_manager' | 'procurement_manager' | 'legal_manager' | 'viewer' | 'guest';
  permissions: string[];
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface UserPermissions {
  canViewVideos: boolean;
  canCreateVideos: boolean;
  canEditVideos: boolean;
  canDeleteVideos: boolean;
  
  canViewPhotos: boolean;
  canCreatePhotos: boolean;
  canEditPhotos: boolean;
  canDeletePhotos: boolean;
  
  canViewNews: boolean;
  canCreateNews: boolean;
  canEditNews: boolean;
  canDeleteNews: boolean;
  
  canViewProcurements: boolean;
  canCreateProcurements: boolean;
  canEditProcurements: boolean;
  canDeleteProcurements: boolean;
  
  canViewLocalActs: boolean;
  canCreateLocalActs: boolean;
  canEditLocalActs: boolean;
  canDeleteLocalActs: boolean;
  
  canViewLegislation: boolean;
  canCreateLegislation: boolean;
  canEditLegislation: boolean;
  canDeleteLegislation: boolean;
  
  canManageUsers: boolean;
}

// ========== ВИДЕО ==========
export interface Video {
  id: string; 
  main_video_url: string;
  gallery_videos: string[];
  date: string;
  created_at?: string;
}

// ========== ФОТО ==========
export interface Photo {
  id: string;
  main_image: string;
  gallery_images: string[];
  date: string;
  created_at: string;
}

// ========== НОВОСТИ ==========
export interface News {
    id: string;
    title_ru: string;
    description_ru: string;
    title_ky?: string;
    description_ky?: string;
    image: string;
    date: string;
    createdAt: string;
}

// ========== ЗАКУПКИ ==========
export interface Procurement {
  id: string;
  number: string;
  contractNumber: string;
  supplier: string;
  type: 'goods' | 'services' | 'works';
  method: 'direct' | 'quotation' | 'simple' | 'tender';
  status: 'active' | 'completed' | 'cancelled';
  date: string;
  amount: number;
  created_at: string;
  updated_at?: string;
}

// ========== ДОКУМЕНТЫ ==========
export interface Document {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  file_size: number;
  date: string;
  created_at: string;
}

export interface LocalAct extends Document {}
export interface Legislation extends Document {}

// ========== ПАГИНАЦИЯ (только один раз!) ==========
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface FilterParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

// ========== API ОТВЕТЫ ==========
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ========== АКТИВНЫЕ ВКЛАДКИ ==========
export type ActiveTab = 'dashboard' | 'videos' | 'photos' | 'news' | 'procurements' | 'local_acts' | 'legislation';