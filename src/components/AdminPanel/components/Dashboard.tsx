import { useEffect, useState } from 'react';
import styles from '../AdminPanel.module.scss';
import { api } from '../../../api/api';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        videos: 0,
        photos: 0,
        news: 0,
        procurements: 0,
        vacancies: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const [videos, photos, news, procurements, vacancies] = await Promise.all([
                api.getVideos(),
                api.getPhotos(),
                api.getNews(),
                api.getProcurements(),
                api.getVacancies()
            ]);
            
            setStats({
                videos: videos.length,
                photos: photos.length,
                news: news.length,
                procurements: procurements.length,
                vacancies: vacancies.length
            });
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Видео', value: stats.videos, icon: '🎬', color: '#ef4444' },
        { label: 'Фото', value: stats.photos, icon: '📸', color: '#3b82f6' },
        { label: 'Новости', value: stats.news, icon: '📰', color: '#10b981' },
        { label: 'Закупки', value: stats.procurements, icon: '📋', color: '#f59e0b' },
        { label: 'Вакансии', value: stats.vacancies, icon: '💼', color: '#8b5cf6' }
    ];

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <h1>Дашборд</h1>
                <p>Добро пожаловать в админ-панель МП "Тазалык"</p>
                <div className={styles.statsGrid}>
                    {statCards.map(stat => (
                        <div key={stat.label} className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: stat.color }}>
                                {stat.icon}
                            </div>
                            <div className={styles.statInfo}>
                                <div className={styles.skeleton}></div>
                                <p>{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <h1>Дашборд</h1>
            <p>Добро пожаловать в админ-панель МП "Тазалык"</p>
            
            <div className={styles.statsGrid}>
                {statCards.map(stat => (
                    <div key={stat.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className={styles.statInfo}>
                            <h3>{stat.value}</h3>
                            <p>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};