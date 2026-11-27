export interface User {
  id: string;
  username: string;
  role:
    | 'admin'
    | 'content_manager'
    | 'procurement_manager'
    | 'legal_manager'
    | 'shop_manager'
    | 'hr_manager'
    | 'complaints_manager'
    | 'viewer'
    | 'guest';
  permissions: string[];
  createdAt: string;
}

export interface MeResponse {
  username: string;
  is_superuser: boolean;
  groups: string[];
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

  canViewProducts: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;

  canViewOrders: boolean;
  canCreateOrders: boolean;
  canEditOrders: boolean;
  canDeleteOrders: boolean;

  canViewVacancies: boolean;
  canCreateVacancies: boolean;
  canEditVacancies: boolean;
  canDeleteVacancies: boolean;

  canViewComplaints: boolean;
  canEditComplaints: boolean;
  canDeleteComplaints: boolean;

  canManageUsers: boolean;
}

export interface Video {
  id: string; 
  main_video_url: string;
  gallery_videos: string[];
  thumbnail?: string | null;
  caption_ru?: string;
  caption_ky?: string;
  date: string;
  created_at?: string;
}

export interface Photo {
  id: string;
  main_image: string;
  caption_ru?: string;
  caption_ky?: string;
  date: string;
  created_at: string;
}

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

export type ProductMaterial = 'plastic' | 'metal' | 'galvanized';

export interface Product {
  id: string;
  name_ru: string;
  name_ky: string;
  description_ru: string;
  description_ky: string;
  volume: number;
  material: ProductMaterial;
  material_label: string;
  price: string;
  image: string | null;
  in_stock: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name_ru: string;
  name_ky: string;
  description_ru: string;
  description_ky: string;
  volume: number;
  material: ProductMaterial;
  price: string;
  in_stock: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  image?: string;
}

export interface ProductFilters {
  q?: string;
  material?: ProductMaterial | '';
}

export type OrderStatus = 'new' | 'awaiting_payment' | 'paid' | 'completed' | 'cancelled';

export interface OrderItem {
  id: number;
  product: string | null;
  product_name: string;
  volume: number;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface Order {
  id: number;
  customer_name: string;
  phone: string;
  telegram: string;
  contact_method: 'whatsapp' | 'telegram';
  contact_label: string;
  customer_whatsapp_url: string;
  customer_telegram_url: string;
  delivery_method: 'pickup' | 'delivery';
  delivery_label: string;
  address: string;
  comment: string;
  status: OrderStatus;
  status_label: string;
  total: string;
  manager_note: string;
  telegram_notified: boolean;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderFilters {
  status?: OrderStatus | '';
  search?: string;
}

export interface OrderUpdate {
  status?: OrderStatus;
  manager_note?: string;
}

export interface Vacancy {
  id: string;
  title_ru: string;
  title_ky: string;
  description_ru: string;
  description_ky: string;
  requirements_ru: string;
  requirements_ky: string;
  schedule_ru: string;
  schedule_ky: string;
  salary_from: number | null;
  salary_to: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type VacancyInput = Omit<Vacancy, 'id' | 'created_at' | 'updated_at'>;

export interface VacancyFilters {
  status?: '' | 'active' | 'inactive';
  search?: string;
}

export interface SaveResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface FilterParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type ApplicationStatus = 'new' | 'in_review' | 'invited' | 'hired' | 'rejected';

export interface VacancyApplication {
  id: string;
  vacancy: string | null;
  vacancy_title: string;
  full_name: string;
  phone: string;
  email: string;
  comment: string;
  resume_name: string;
  resume_size: number;
  status: ApplicationStatus;
  status_label: string;
  hr_note: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationFilters {
  status?: ApplicationStatus | '';
  search?: string;
}

export interface ApplicationUpdate {
  status?: ApplicationStatus;
  hr_note?: string;
}

export type ComplaintType = 'waste_issue' | 'billing_error' | 'service_quality' | 'employee_complaint' | 'other';
export type ComplaintStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';

export interface ComplaintPhoto {
  id: number;
  content_type: string;
  size: number;
}

export interface Complaint {
  id: string;
  complaint_type: ComplaintType;
  type_label: string;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  incident_date: string | null;
  incident_location: string;
  photos: ComplaintPhoto[];
  status: ComplaintStatus;
  status_label: string;
  manager_note: string;
  created_at: string;
  updated_at: string;
}

export interface ComplaintFilters {
  status?: ComplaintStatus | '';
  complaint_type?: ComplaintType | '';
  search?: string;
}

export interface ComplaintUpdate {
  status?: ComplaintStatus;
  manager_note?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'videos'
  | 'photos'
  | 'news'
  | 'procurements'
  | 'local_acts'
  | 'legislation'
  | 'products'
  | 'orders'
  | 'complaints'
  | 'vacancies'
  | 'applications';

export type PermissionSection = Exclude<ActiveTab, 'dashboard'>;