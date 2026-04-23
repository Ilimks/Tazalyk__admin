import React, { useEffect } from 'react';
import styles from './AdminPanel.module.scss';
import { Sidebar } from '@/layout/Sidebar/Sidebar';
import { Header } from '@/layout/Header/Header';
import { Dashboard } from '@/features/Dashboard/Dashboard';
import { VideosManager } from '@/features/Videos/VideosManager';
import { PhotosManager } from '@/features/Photos/PhotosManager';
import { NewsManager } from '@/features/News/NewsManager';
import { LocalActsManager } from '@/features/LocalActs/LocalActsManager';
import { LegislationManager } from '@/features/Legislation/LegislationManager';
import { ProcurementsManager } from '@/features/Procurements/ProcurementsManager';
import { Login } from '@/features/Auth/Login';
import { useAuthStore } from '@/store';
import { ProtectedRoute } from '../common/Protected/ProtectedRoute';
import type { ActiveTab } from '@/types';

export const AdminPanel: React.FC = () => {
  const { isAuthenticated, setServerStatus, canView } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('dashboard');

  useEffect(() => {
    setServerStatus('online');
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'videos':
        return (
          <ProtectedRoute section="videos" action="view" fallback={<div>Нет доступа к видео</div>}>
            <VideosManager />
          </ProtectedRoute>
        );
      case 'photos':
        return (
          <ProtectedRoute section="photos" action="view" fallback={<div>Нет доступа к фото</div>}>
            <PhotosManager />
          </ProtectedRoute>
        );
      case 'news':
        return (
          <ProtectedRoute section="news" action="view" fallback={<div>Нет доступа к новостям</div>}>
            <NewsManager />
          </ProtectedRoute>
        );
      case 'procurements':
        return (
          <ProtectedRoute section="procurements" action="view" fallback={<div>Нет доступа к закупкам</div>}>
            <ProcurementsManager />
          </ProtectedRoute>
        );
      case 'local_acts':
        return (
          <ProtectedRoute section="local_acts" action="view" fallback={<div>Нет доступа к локальным актам</div>}>
            <LocalActsManager />
          </ProtectedRoute>
        );
      case 'legislation':
        return (
          <ProtectedRoute section="legislation" action="view" fallback={<div>Нет доступа к законодательству</div>}>
            <LegislationManager />
          </ProtectedRoute>
        );
      default:
        return <Dashboard />;
    }
  };

  const availableTabs: ActiveTab[] = ['dashboard'];
  if (canView('videos')) availableTabs.push('videos');
  if (canView('photos')) availableTabs.push('photos');
  if (canView('news')) availableTabs.push('news');
  if (canView('procurements')) availableTabs.push('procurements');
  if (canView('local_acts')) availableTabs.push('local_acts');
  if (canView('legislation')) availableTabs.push('legislation');
  
  if (!availableTabs.includes(activeTab)) {
    setActiveTab('dashboard');
  }

  return (
    <div className={styles.adminPanel}>
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        availableTabs={availableTabs}
      />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.content}>{renderContent()}</div>
      </div>
    </div>
  );
};