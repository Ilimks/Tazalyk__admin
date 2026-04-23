export const APP_CONSTANTS = {
  APP_NAME: 'МП "Тазалык" Админ',
  APP_VERSION: '2.0.0',
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },
  
  DATE_FORMATS: {
    DISPLAY: 'dd.MM.yyyy',
    DISPLAY_WITH_TIME: 'dd.MM.yyyy HH:mm',
    API: 'yyyy-MM-dd',
    API_FULL: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  },
  
  STATUSES: {
    PROCUREMENT: {
      ACTIVE: 'active',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    },
    VACANCY: {
      OPEN: 'open',
      CLOSED: 'closed',
    },
  },
  
  PROCUREMENT_TYPES: {
    GOODS: { value: 'goods', label: 'Товар' },
    SERVICES: { value: 'services', label: 'Услуга' },
    WORKS: { value: 'works', label: 'Работа' },
  },
  
  PROCUREMENT_METHODS: {
    DIRECT: { value: 'direct', label: 'Прямое заключение договора' },
    QUOTATION: { value: 'quotation', label: 'Запрос котировок' },
    SIMPLE: { value: 'simple', label: 'Простейшая закупка' },
  },
  
  ERROR_MESSAGES: {
    NETWORK: 'Ошибка сети. Проверьте подключение к интернету',
    SERVER: 'Ошибка сервера. Попробуйте позже',
    NOT_FOUND: 'Данные не найдены',
    UNAUTHORIZED: 'Не авторизован. Пожалуйста, войдите снова',
    VALIDATION: 'Пожалуйста, проверьте правильность заполнения полей',
  },
  
  SUCCESS_MESSAGES: {
    CREATED: 'Успешно создано',
    UPDATED: 'Успешно обновлено',
    DELETED: 'Успешно удалено',
    SAVED: 'Успешно сохранено',
  },
  
  STORAGE_KEYS: {
    AUTH: 'admin_auth',
    THEME: 'admin_theme',
    LANGUAGE: 'admin_language',
    SETTINGS: 'admin_settings',
  },
  
  API_ENDPOINTS: {
    LOGIN: '/admin-login/',
    VIDEOS: '/videos/',
    PHOTOS: '/photos/',
    NEWS: '/news/',
    PROCUREMENTS: '/procurements/',
    VACANCIES: '/vacancies/',
    IMPORT: '/import-data/',
    HEALTH: '/health/',
  },
} as const;

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Дашборд', icon: '📊', order: 1 },
  { id: 'videos', label: 'Видео', icon: '🎬', order: 2 },
  { id: 'photos', label: 'Фото', icon: '📸', order: 3 },
  { id: 'news', label: 'Новости', icon: '📰', order: 4 },
  { id: 'procurements', label: 'Закупки', icon: '📋', order: 5 },
  { id: 'vacancies', label: 'Вакансии', icon: '💼', order: 6 },
] as const;

export const DEFAULT_THEME = {
  primaryColor: '#22c55e',
  secondaryColor: '#1e293b',
  dangerColor: '#ef4444',
  warningColor: '#f59e0b',
  infoColor: '#3b82f6',
  successColor: '#10b981',
};