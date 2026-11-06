import {
  BriefcaseBusiness,
  Clapperboard,
  ClipboardList,
  Images,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Package,
  Scale,
  ScrollText,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';
import type { ActiveTab, User } from '@/types';

export type Section = Exclude<ActiveTab, 'dashboard'>;

export interface NavItem {
  id: ActiveTab;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<ActiveTab, NavItem> = {
  dashboard: { id: 'dashboard', label: 'Обзор', description: 'Сводка по разделам сайта', icon: LayoutDashboard },
  news: { id: 'news', label: 'Новости', description: 'Публикации на главной и в разделе «Новости»', icon: Newspaper },
  photos: { id: 'photos', label: 'Фото', description: 'Фотогалерея сайта', icon: Images },
  videos: { id: 'videos', label: 'Видео', description: 'Видеогалерея сайта', icon: Clapperboard },
  procurements: { id: 'procurements', label: 'Закупки', description: 'Договоры и поставщики', icon: ClipboardList },
  local_acts: { id: 'local_acts', label: 'Локальные акты', description: 'Внутренние документы предприятия', icon: ScrollText },
  legislation: { id: 'legislation', label: 'Законодательство КР', description: 'Нормативные акты Кыргызстана', icon: Scale },
  products: { id: 'products', label: 'Товары', description: 'Каталог мусорных контейнеров', icon: Package },
  orders: { id: 'orders', label: 'Заказы', description: 'Заказы покупателей с сайта', icon: ShoppingCart },
  vacancies: { id: 'vacancies', label: 'Вакансии', description: 'Открытые вакансии на странице «Вакансии»', icon: BriefcaseBusiness },
  applications: { id: 'applications', label: 'Отклики', description: 'Резюме кандидатов с сайта', icon: Inbox },
};

// группы бокового меню
export const NAV_GROUPS: { title?: string; items: ActiveTab[] }[] = [
  { items: ['dashboard'] },
  { title: 'Контент', items: ['news', 'photos', 'videos'] },
  { title: 'Закупки', items: ['procurements'] },
  { title: 'Документы', items: ['local_acts', 'legislation'] },
  { title: 'Магазин', items: ['products', 'orders'] },
  { title: 'Отдел кадров', items: ['vacancies', 'applications'] },
];

export const SECTIONS: Section[] = [
  'news',
  'photos',
  'videos',
  'procurements',
  'local_acts',
  'legislation',
  'products',
  'orders',
  'vacancies',
  'applications',
];

export const ROLE_LABELS: Record<User['role'], string> = {
  admin: 'Администратор',
  content_manager: 'Контент-менеджер',
  procurement_manager: 'Менеджер по закупкам',
  legal_manager: 'Юрист',
  shop_manager: 'Менеджер магазина',
  hr_manager: 'Отдел кадров',
  viewer: 'Только просмотр',
  guest: 'Гость',
};
