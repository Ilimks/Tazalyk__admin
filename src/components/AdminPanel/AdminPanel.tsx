import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import styles from './AdminPanel.module.scss';
import { Sidebar } from '@/layout/Sidebar/Sidebar';
import { Header } from '@/layout/Header/Header';
import { NAV_ITEMS, SECTIONS, type Section } from '@/layout/navigation';
import { Dashboard } from '@/features/Dashboard/Dashboard';
import { Login } from '@/features/Auth/Login';
import { Loader } from '@/components/common/Loader';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthStore } from '@/store';
import { ProtectedRoute } from '../common/Protected/ProtectedRoute';
import type { ActiveTab } from '@/types';

// разделы грузятся отдельными чанками — экран входа открывается быстрее
const SECTION_COMPONENTS: Record<Section, React.LazyExoticComponent<React.FC>> = {
  videos: lazy(() => import('@/features/Videos/VideosManager').then((m) => ({ default: m.VideosManager }))),
  photos: lazy(() => import('@/features/Photos/PhotosManager').then((m) => ({ default: m.PhotosManager }))),
  news: lazy(() => import('@/features/News/NewsManager').then((m) => ({ default: m.NewsManager }))),
  procurements: lazy(() =>
    import('@/features/Procurements/ProcurementsManager').then((m) => ({ default: m.ProcurementsManager })),
  ),
  local_acts: lazy(() => import('@/features/LocalActs/LocalActsManager').then((m) => ({ default: m.LocalActsManager }))),
  legislation: lazy(() =>
    import('@/features/Legislation/LegislationManager').then((m) => ({ default: m.LegislationManager })),
  ),
  products: lazy(() => import('@/features/Products/ProductsManager').then((m) => ({ default: m.ProductsManager }))),
  orders: lazy(() => import('@/features/Orders/OrdersManager').then((m) => ({ default: m.OrdersManager }))),
  vacancies: lazy(() => import('@/features/Vacancies/VacanciesManager').then((m) => ({ default: m.VacanciesManager }))),
  applications: lazy(() =>
    import('@/features/Applications/ApplicationsManager').then((module) => ({ default: module.ApplicationsManager }))
  ),
};

export const AdminPanel: React.FC = () => {
  const { isAuthenticated, checkServer, refreshPermissions, canView, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) checkServer();
  }, [isAuthenticated, checkServer]);

  // сессия восстановлена из браузера: права могли устареть (сменили группы, обновилась админка).
  // Сразу после входа не нужно — права только что пришли с сервера
  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated) refreshPermissions();
    // только при открытии страницы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refresh-токен тоже истёк — возвращаемся на экран входа
  useEffect(() => {
    const handleExpired = () => {
      logout();
      useAuthStore.setState({ loginError: 'Сессия истекла — войдите снова.' });
    };
    // выход в соседней вкладке: здесь не должны оставаться данные заказов и откликов
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'current_user' && !event.newValue) handleExpired();
    };
    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('storage', handleStorage);
    };
  }, [logout]);

  // меню на телефоне не должно прокручивать страницу под собой
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const availableTabs: ActiveTab[] = ['dashboard', ...SECTIONS.filter((section) => canView(section))];
  const currentTab = availableTabs.includes(activeTab) ? activeTab : 'dashboard';

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  const renderContent = () => {
    if (currentTab === 'dashboard') {
      return <Dashboard availableTabs={availableTabs} onNavigate={handleTabChange} />;
    }

    const SectionComponent = SECTION_COMPONENTS[currentTab];
    return (
      <ProtectedRoute
        section={currentTab}
        action="view"
        fallback={
          <EmptyState
            icon={Lock}
            title="Нет доступа"
            description="У вашей учётной записи нет прав на этот раздел. Обратитесь к администратору."
          />
        }
      >
        <Suspense fallback={<Loader />}>
          <SectionComponent />
        </Suspense>
      </ProtectedRoute>
    );
  };

  return (
    <div className={styles.adminPanel}>
      <Sidebar
        activeTab={currentTab}
        onTabChange={handleTabChange}
        availableTabs={availableTabs}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className={styles.mainContent}>
        <Header title={NAV_ITEMS[currentTab].label} onMenuClick={() => setMenuOpen(true)} />
        <main className={styles.content}>{renderContent()}</main>
      </div>
    </div>
  );
};
