'use client'
import { useState, useEffect } from 'react';
import styles from './AdminPanel.module.scss';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { VideosManager } from './components/VideosManager';
import { PhotosManager } from './components/PhotosManager';
import { NewsManager } from './components/NewsManager';
import { ProcurementsManager } from './components/ProcurementsManager';
import { VacanciesManager } from './components/VacanciesManager';
import { Login } from './components/Login';
import type { ActiveTab } from './types';
import { api } from '../../api/api';

export const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/videos/');
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
    }
  };

  // Убираем сохранение в localStorage - только проверяем подключение
  const loadDataFromServer = async () => {
    try {
      // Просто проверяем, что сервер отвечает
      await Promise.all([
        api.getVideos(),
        api.getPhotos(),
        api.getNews(),
        api.getProcurements(),
        api.getVacancies()
      ]);
      return true;
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      throw error;
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadDataFromServer().catch(console.error);
    }
  }, []);

  const handleLogin = async (password: string) => {
    if (serverStatus === 'offline') {
      alert('❌ Сервер недоступен!');
      return;
    }
    
    try {
      const response = await api.login(password);
      if (response.success) {
        localStorage.setItem('admin_auth', 'true');
        setIsAuthenticated(true);
        await loadDataFromServer();
      } else {
        alert('Неверный пароль');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} serverStatus={serverStatus} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'videos':
        return <VideosManager />;
      case 'photos':
        return <PhotosManager />;
      case 'news':
        return <NewsManager />;
      case 'procurements':
        return <ProcurementsManager />;
      case 'vacancies':
        return <VacanciesManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={styles.adminPanel}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={styles.mainContent}>
        <Header onLogout={handleLogout} serverStatus={serverStatus} />
        <div className={styles.content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};