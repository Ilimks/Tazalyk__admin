import React, { useEffect } from 'react';
import styles from './Dashboard.module.scss';
import { StatCard } from './components/StatCard';
import { useVideosStore } from '@/store';
import { usePhotosStore } from '@/store';
import { useNewsStore } from '@/store';
import { useProcurementsStore } from '@/store';
import { useLocalActsStore } from '@/store';
import { useLegislationStore } from '@/store';

export const Dashboard: React.FC = () => {
  const { 
    totalCount: videosCount, 
    loading: videosLoading, 
    fetchPage: fetchVideosPage 
  } = useVideosStore();
  
  const { 
    totalCount: photosCount, 
    loading: photosLoading, 
    fetchPage: fetchPhotosPage 
  } = usePhotosStore();
  
  const { 
    totalCount: newsCount, 
    loading: newsLoading, 
    fetchPage: fetchNewsPage 
  } = useNewsStore();
  
  const { 
    totalCount: procurementsCount, 
    loading: procurementsLoading, 
    fetchPage: fetchProcurementsPage 
  } = useProcurementsStore();

  // Добавлено для локальных актов
  const { 
    totalCount: localActsCount, 
    loading: localActsLoading, 
    fetchPage: fetchLocalActsPage 
  } = useLocalActsStore();

  // Добавлено для законодательства
  const { 
    totalCount: legislationCount, 
    loading: legislationLoading, 
    fetchPage: fetchLegislationPage 
  } = useLegislationStore();

  useEffect(() => {
    Promise.all([
      fetchVideosPage(1, 1),
      fetchPhotosPage(1, 1),
      fetchNewsPage(1, 1),
      fetchProcurementsPage(1, 1),
      fetchLocalActsPage(1, 1),      // Добавлено
      fetchLegislationPage(1, 1),    // Добавлено
    ]);
  }, []);

  const loading = videosLoading || photosLoading || newsLoading || procurementsLoading || localActsLoading || legislationLoading;

  const stats = [
    { label: 'Видео', value: videosCount, icon: '🎬', color: '#ef4444' },
    { label: 'Фото', value: photosCount, icon: '📸', color: '#3b82f6' },
    { label: 'Новости', value: newsCount, icon: '📰', color: '#10b981' },
    { label: 'Закупки', value: procurementsCount, icon: '📋', color: '#f59e0b' },
    { label: 'Локальные акты', value: localActsCount, icon: '📜', color: '#8b5cf6' },
    { label: 'Законодательство КР', value: legislationCount, icon: '⚖️', color: '#06b6d4' },
  ];

  if (loading && stats.every(stat => stat.value === 0)) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1>Дашборд</h1>
          <p>Добро пожаловать в админ-панель МП "Тазалык"</p>
        </div>
        <div className={styles.statsGrid}>
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Дашборд</h1>
        <p>Добро пожаловать в админ-панель МП "Тазалык"</p>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
};