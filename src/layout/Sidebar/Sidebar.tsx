import { useEffect, useRef, useState } from 'react';
import { ExternalLink, LogOut, X } from 'lucide-react';
import styles from './Sidebar.module.scss';
import { signOut, useApplicationsStore, useAuthStore, useComplaintsStore, useOrdersStore } from '@/store';
import { usePolling } from '@/hooks/usePolling';

const COUNTERS_REFRESH_MS = 60_000;
import { config } from '@/config';
import { NAV_GROUPS, NAV_ITEMS, ROLE_LABELS } from '../navigation';
import { pathOf } from '../routes';
import type { ActiveTab } from '@/types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  availableTabs: ActiveTab[];
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, availableTabs, isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { newCount, fetchNewCount } = useOrdersStore();
  const { newCount: newApplications, fetchNewCount: fetchNewApplications } = useApplicationsStore();
  const { newCount: newComplaints, fetchNewCount: fetchNewComplaints } = useComplaintsStore();
  const showOrders = availableTabs.includes('orders');
  const showApplications = availableTabs.includes('applications');
  const showComplaints = availableTabs.includes('complaints');

  usePolling(
    () => {
      if (showOrders) fetchNewCount();
      if (showApplications) fetchNewApplications();
      if (showComplaints) fetchNewComplaints();
    },
    COUNTERS_REFRESH_MS,
    showOrders || showApplications || showComplaints,
  );

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((id) => availableTabs.includes(id)),
  })).filter((group) => group.items.length > 0);

  const navRef = useRef<HTMLElement>(null);
  const [fade, setFade] = useState({ top: false, bottom: false });
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () => {
      const top = nav.scrollTop > 4;
      const bottom = nav.scrollTop + nav.clientHeight < nav.scrollHeight - 4;
      setFade((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
    };
    update();
    nav.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => {
      nav.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [groups.length]);

  useEffect(() => {
    const nav = navRef.current;
    const item = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !item) return;
    const top = item.offsetTop - nav.offsetTop;
    if (top < nav.scrollTop) nav.scrollTop = Math.max(0, top - 44);
    else if (top + item.offsetHeight > nav.scrollTop + nav.clientHeight) {
      nav.scrollTop = top + item.offsetHeight - nav.clientHeight + 44;
    }
  }, [activeTab]);

  const initials = (user?.username || '?').slice(0, 2).toUpperCase();

  return (
    <>
      <div className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`} onClick={onClose} aria-hidden />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} aria-label="Разделы админ-панели">
        <div className={styles.brand}>
          <span className={styles.logo}>
            <img src="/apple-touch-icon.png" alt="" width={32} height={32} />
          </span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>Тазалык</span>
            <span className={styles.brandCaption}>Админ-панель</span>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть меню">
            <X size={20} />
          </button>
        </div>

        <nav
          ref={navRef}
          className={`${styles.nav} ${fade.top ? styles.navFadeTop : ''} ${fade.bottom ? styles.navFadeBottom : ''}`}
        >
          {groups.map((group, index) => (
            <div key={group.title || index} className={styles.group}>
              {group.title && <span className={styles.groupTitle}>{group.title}</span>}
              {group.items.map((id) => {
                const { label, icon: Icon } = NAV_ITEMS[id];
                const isActive = activeTab === id;
                const badge =
                  (id === 'orders' && newCount) ||
                  (id === 'complaints' && newComplaints) ||
                  (id === 'applications' && newApplications) ||
                  0;
                return (
                  <a
                    key={id}
                    href={pathOf(id)}
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
                      e.preventDefault();
                      onTabChange(id);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    title={badge ? `${label} · новых: ${badge}` : label}
                  >
                    <Icon size={18} className={styles.navIcon} />
                    <span className={styles.navLabel}>{label}</span>
                    {badge > 0 && (
                      <span className={styles.navBadge}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </a>
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
            <button type="button" className={styles.logoutButton} onClick={signOut} title="Выйти" aria-label="Выйти">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
