import { useEffect } from 'react';
import { ExternalLink, LogOut, X } from 'lucide-react';
import styles from './Sidebar.module.scss';
import { useAuthStore, useOrdersStore } from '@/store';
import { config } from '@/config';
import { NAV_GROUPS, NAV_ITEMS, ROLE_LABELS } from '../navigation';
import type { ActiveTab } from '@/types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  availableTabs: ActiveTab[];
  // на телефоне меню выезжает поверх контента
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, availableTabs, isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const { newCount, fetchNewCount } = useOrdersStore();
  const showOrders = availableTabs.includes('orders');

  // счётчик новых заказов: загружается при входе, потом обновляется вместе со списком заказов
  useEffect(() => {
    if (showOrders) fetchNewCount();
  }, [showOrders, fetchNewCount]);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((id) => availableTabs.includes(id)),
  })).filter((group) => group.items.length > 0);

  const initials = (user?.username || '?').slice(0, 2).toUpperCase();

  return (
    <>
      <div className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`} onClick={onClose} aria-hidden />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} aria-label="Разделы админ-панели">
        <div className={styles.brand}>
          <span className={styles.logo}>
            <img src="/favicon.svg" alt="" width={30} height={30} />
          </span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>Тазалык</span>
            <span className={styles.brandCaption}>Админ-панель</span>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть меню">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {groups.map((group, index) => (
            <div key={group.title || index} className={styles.group}>
              {group.title && <span className={styles.groupTitle}>{group.title}</span>}
              {group.items.map((id) => {
                const { label, icon: Icon } = NAV_ITEMS[id];
                const isActive = activeTab === id;
                const badge = id === 'orders' && newCount ? newCount : 0;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    onClick={() => onTabChange(id)}
                    aria-current={isActive ? 'page' : undefined}
                    title={badge ? `${label} · новых: ${badge}` : label}
                  >
                    <Icon size={20} className={styles.navIcon} />
                    <span className={styles.navLabel}>{label}</span>
                    {badge > 0 && (
                      <span className={styles.navBadge}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <a className={styles.siteLink} href={config.siteUrl} target="_blank" rel="noreferrer" title="Открыть сайт">
            <ExternalLink size={18} />
            <span className={styles.navLabel}>Открыть сайт</span>
          </a>

          <div className={styles.user}>
            <span className={styles.avatar} aria-hidden>
              {initials}
            </span>
            <div className={styles.userText}>
              <span className={styles.userName}>{user?.username}</span>
              <span className={styles.userRole}>{user ? ROLE_LABELS[user.role] || user.role : ''}</span>
            </div>
            <button type="button" className={styles.logoutButton} onClick={logout} title="Выйти" aria-label="Выйти">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
