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

// ответ GET /me/: права выдаются по группам сотрудника на сервере
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

  // заказы создают покупатели на сайте, canCreateOrders есть только для единообразия
  canViewOrders: boolean;
  canCreateOrders: boolean;
  canEditOrders: boolean;
  canDeleteOrders: boolean;

  canViewVacancies: boolean;
  canCreateVacancies: boolean;
  canEditVacancies: boolean;
  canDeleteVacancies: boolean;

  // жалобы присылают граждане с сайта, поэтому права на создание нет
  canViewComplaints: boolean;
  canEditComplaints: boolean;
  canDeleteComplaints: boolean;

  canManageUsers: boolean;
}

// ========== ВИДЕО ==========
export interface Video {
  id: string; 
  main_video_url: string;
  gallery_videos: string[];
  // кадр-превью (JPEG data URL); у старых видео может отсутствовать
  thumbnail?: string | null;
  date: string;
  created_at?: string;
}

// ========== ФОТО ==========
export interface Photo {
  id: string;
  main_image: string;
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

// ========== МАГАЗИН ==========
export type ProductMaterial = 'plastic' | 'metal' | 'galvanized';

export interface Product {
  id: string;
  name_ru: string;
  name_ky: string;
  description_ru: string;
  description_ky: string;
  // объём в литрах
  volume: number;
  material: ProductMaterial;
  material_label: string;
  // десятичное число строкой, например "3500.00"
  price: string;
  // полный адрес фото или null
  image: string | null;
  in_stock: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// тело POST/PUT товара. image: data URL — новое фото, '' — удалить фото, поля нет — фото не меняется
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
  // поиск по названию
  q?: string;
  material?: ProductMaterial | '';
}

export type OrderStatus = 'new' | 'awaiting_payment' | 'paid' | 'completed' | 'cancelled';

export interface OrderItem {
  id: number;
  // null, если товар уже удалён из каталога
  product: string | null;
  product_name: string;
  volume: number;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface Order {
  // номер заказа
  id: number;
  customer_name: string;
  phone: string;
  // имя пользователя без @, может быть пустым
  telegram: string;
  contact_method: 'whatsapp' | 'telegram';
  contact_label: string;
  // ссылки, чтобы менеджер сам написал покупателю
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
}

// менеджер меняет только статус и свою заметку, остальное — только чтение
export interface OrderUpdate {
  status?: OrderStatus;
  manager_note?: string;
}

// ========== ВАКАНСИИ ==========
export interface Vacancy {
  id: string;
  title_ru: string;
  title_ky: string;
  description_ru: string;
  description_ky: string;
  // каждая строка — отдельный пункт списка на сайте
  requirements_ru: string;
  requirements_ky: string;
  schedule_ru: string;
  schedule_ky: string;
  // сомы; оба null — «по договорённости»
  salary_from: number | null;
  salary_to: number | null;
  // неактивная вакансия скрыта с сайта
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type VacancyInput = Omit<Vacancy, 'id' | 'created_at' | 'updated_at'>;

export interface VacancyFilters {
  // '' — все, 'active' — только активные, 'inactive' — только отключённые
  status?: '' | 'active' | 'inactive';
}

// результат сохранения формы
export interface SaveResult<T = unknown> {
  success: boolean;
  // сохранённая запись (при успехе)
  data?: T;
  // при ошибке: общий текст и тексты сервера по полям (400 в формате DRF)
  message?: string;
  fieldErrors?: Record<string, string>;
}

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

// ========== ОТКЛИКИ НА ВАКАНСИИ ==========
export type ApplicationStatus = 'new' | 'in_review' | 'invited' | 'hired' | 'rejected';

export interface VacancyApplication {
  id: string;
  // null, если вакансию уже удалили; название остаётся в vacancy_title
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
}

// отдел кадров меняет только статус и свою заметку
export interface ApplicationUpdate {
  status?: ApplicationStatus;
  hr_note?: string;
}

// ========== ЖАЛОБЫ (ОБРАЩЕНИЯ ГРАЖДАН) ==========
export type ComplaintType = 'waste_issue' | 'billing_error' | 'service_quality' | 'employee_complaint' | 'other';
export type ComplaintStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';

// фото — личные данные: ссылки на файл нет, админка скачивает его по id с входом сотрудника
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
  // многострочный текст гражданина
  description: string;
  // 'YYYY-MM-DD' или null, если гражданин не указал
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
}

// сотрудник меняет только статус и свою заметку
export interface ComplaintUpdate {
  status?: ComplaintStatus;
  manager_note?: string;
}

// ========== АКТИВНЫЕ ВКЛАДКИ ==========
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

// разделы с правами доступа (всё, кроме «Обзора»)
export type PermissionSection = Exclude<ActiveTab, 'dashboard'>;