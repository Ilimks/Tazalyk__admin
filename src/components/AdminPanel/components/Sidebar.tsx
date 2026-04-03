import styles from '../AdminPanel.module.scss';
import type { ActiveTab } from '../types';

interface SidebarProps {
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Дашборд', icon: '📊' },
        { id: 'videos', label: 'Видео', icon: '🎬' },
        { id: 'photos', label: 'Фото', icon: '📸' },
        { id: 'news', label: 'Новости', icon: '📰' },
        { id: 'procurements', label: 'Закупки', icon: '📋' },
        { id: 'vacancies', label: 'Вакансии', icon: '💼' }
    ];

    return (
        <div className={styles.sidebar}>
            <div className={styles.logo}>
                <h2>Тазалык</h2>
                <p>Админ панель</p>
            </div>
            <nav className={styles.nav}>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                        onClick={() => onTabChange(item.id as ActiveTab)}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};