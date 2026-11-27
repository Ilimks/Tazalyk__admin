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
import { signOut, useAuthStore } from '@/store';
import { useSectionRoute } from '@/hooks/useSectionRoute';
import { ProtectedRoute } from '../common/Protected/ProtectedRoute';
import type { ActiveTab } from '@/types';

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
  complaints: lazy(() =>
    import('@/features/Complaints/ComplaintsManager').then((m) => ({ default: m.ComplaintsManager })),
  ),
  vacancies: lazy(() => import('@/features/Vacancies/VacanciesManager').then((m) => ({ default: m.VacanciesManager }))),
  applications: lazy(() =>
    import('@/features/Applications/ApplicationsManager').then((module) => ({ default: module.ApplicationsManager }))
  ),
};

export const AdminPanel: React.FC = () => {
  const { isAuthenticated, checkServer, refreshPermissions, canView, setServerStatus } = useAuthStore();
  const { tab: activeTab, go, fix } = useSectionRoute();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) checkServer();
  }, [isAuthenticated, checkServer]);

  useEffect(() => {
    const handleServer = (event: Event) => {
      const status = (event as CustomEvent<'online' | 'offline'>).detail;
      if (status === 'online' || status === 'offline') setServerStatus(status);
    };
    window.addEventListener('api:server', handleServer);
    return () => window.removeEventListener('api:server', handleServer);
  }, [setServerStatus]);

  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated) refreshPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      signOut();
      useAuthStore.setState({ loginError: 'Сессия истекла — войдите снова.' });
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'current_user' && !event.newValue) handleExpired();
    };
    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const availableTabs: ActiveTab[] = ['dashboard', ...SECTIONS.filter((section) => canView(section))];
  const currentTab = availableTabs.includes(activeTab) ? activeTab : 'dashboard';

  useEffect(() => {
    if (!isAuthenticated) return;
    fix(currentTab);
    document.title = `${NAV_ITEMS[currentTab].label} · Админ-панель МП «Тазалык»`;
  }, [isAuthenticated, currentTab, fix]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleTabChange = (tab: ActiveTab) => {
    go(tab);
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
