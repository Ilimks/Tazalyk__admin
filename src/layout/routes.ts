import { NAV_ITEMS } from './navigation';
import type { ActiveTab } from '@/types';

// у каждого раздела свой адрес: F5 и кнопка «Назад» работают, ссылку можно отправить коллеге
export const pathOf = (tab: ActiveTab) => (tab === 'dashboard' ? '/' : `/${tab.replace(/_/g, '-')}`);

const TAB_BY_PATH = new Map<string, ActiveTab>((Object.keys(NAV_ITEMS) as ActiveTab[]).map((tab) => [pathOf(tab), tab]));

// null — такого раздела нет
export const tabOf = (path: string): ActiveTab | null => TAB_BY_PATH.get(path.replace(/(.)\/+$/, '$1')) ?? null;
