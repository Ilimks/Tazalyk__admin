import { useEffect, useState } from 'react';
import { ChevronRight, Inbox } from 'lucide-react';
import styles from '../Dashboard.module.scss';
import { applicationsService, complaintsService, ordersService } from '@/api/services';
import { StatusBadge } from '@/components/common/StatusBadge';
import { NAV_ITEMS, type Section } from '@/layout/navigation';
import { useOpenRecordStore } from '@/store/openRecord.store';
import { formatters } from '@/utils/formatters';
import { APPLICATION_STATUS_BADGES, APPLICATION_STATUS_LABELS } from '@/features/Applications/statuses';
import { COMPLAINT_STATUS_BADGES, COMPLAINT_STATUS_LABELS, COMPLAINT_TYPE_LABELS } from '@/features/Complaints/statuses';
import { ORDER_STATUS_BADGES, ORDER_STATUS_LABELS } from '@/features/Orders/statuses';
import type { ActiveTab } from '@/types';

export const RECENT_SECTIONS = ['complaints', 'orders', 'applications'] as const;
type RecentSection = (typeof RECENT_SECTIONS)[number];

interface RecentItem {
  key: string;
  section: RecentSection;
  title: string;
  person: string;
  createdAt: string;
  status: { tone: React.ComponentProps<typeof StatusBadge>['status']; label: string };
  // запомнить запись: раздел откроет её сразу
  remember: () => void;
}

const LIMIT = 6;

const load: Record<RecentSection, () => Promise<RecentItem[]>> = {
  complaints: async () =>
    (await complaintsService.getPage(1, LIMIT)).results.map((item) => ({
      key: `c${item.id}`,
      section: 'complaints',
      title: item.subject || item.type_label || COMPLAINT_TYPE_LABELS[item.complaint_type],
      person: item.full_name,
      createdAt: item.created_at,
      status: {
        tone: COMPLAINT_STATUS_BADGES[item.status] || 'info',
        label: COMPLAINT_STATUS_LABELS[item.status] || item.status_label,
      },
      remember: () => useOpenRecordStore.getState().set({ section: 'complaints', record: item }),
    })),
  orders: async () =>
    (await ordersService.getPage(1, LIMIT)).results.map((item) => ({
      key: `o${item.id}`,
      section: 'orders',
      title: `Заказ № ${item.id} на ${formatters.amount(item.total)} сом`,
      person: item.customer_name,
      createdAt: item.created_at,
      status: {
        tone: ORDER_STATUS_BADGES[item.status] || 'info',
        label: ORDER_STATUS_LABELS[item.status] || item.status_label,
      },
      remember: () => useOpenRecordStore.getState().set({ section: 'orders', record: item }),
    })),
  applications: async () =>
    (await applicationsService.getPage(1, LIMIT)).results.map((item) => ({
      key: `a${item.id}`,
      section: 'applications',
      title: item.vacancy_title,
      person: item.full_name,
      createdAt: item.created_at,
      status: {
        tone: APPLICATION_STATUS_BADGES[item.status] || 'info',
        label: APPLICATION_STATUS_LABELS[item.status] || item.status_label,
      },
      remember: () => useOpenRecordStore.getState().set({ section: 'applications', record: item }),
    })),
};

interface RecentListProps {
  sections: Section[];
  // меняется, когда приходит новое обращение: список загружается заново
  version: string;
  onNavigate: (tab: ActiveTab) => void;
}

// Последние жалобы, заказы и отклики одним списком: с них начинается рабочий день
export const RecentList: React.FC<RecentListProps> = ({ sections, version, onNavigate }) => {
  const [items, setItems] = useState<RecentItem[] | null>(null);
  const allowed = RECENT_SECTIONS.filter((section) => sections.includes(section));

  useEffect(() => {
    let cancelled = false;
    Promise.all(allowed.map((section) => load[section]())).then((lists) => {
      if (cancelled) return;
      setItems(
        lists
          .flat()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, LIMIT),
      );
    });
    return () => {
      cancelled = true;
    };
    // список разделов зависит только от прав пользователя
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed.join(), version]);

  return (
    <section aria-labelledby="dashboard-recent">
      <h2 id="dashboard-recent" className={styles.sectionTitle}>
        Последние обращения
      </h2>

      <div className={styles.recent} aria-busy={items === null}>
        {items === null && [0, 1, 2].map((n) => <span key={n} className={styles.recentSkeleton} />)}

        {items?.length === 0 && (
          <p className={styles.recentEmpty}>
            <Inbox size={20} />
            С сайта пока ничего не присылали
          </p>
        )}

        {items?.map((item) => {
          const { icon: Icon, label } = NAV_ITEMS[item.section];
          return (
            <button
              key={item.key}
              type="button"
              className={styles.recentRow}
              onClick={() => {
                item.remember();
                onNavigate(item.section);
              }}
            >
              <span className={styles.rowIcon} title={label}>
                <Icon size={18} />
              </span>
              <span className={styles.recentText}>
                <span className={styles.recentTitle}>{item.title}</span>
                <span className={styles.recentMeta}>
                  {label} · {item.person}
                </span>
              </span>
              <time className={styles.recentTime} dateTime={item.createdAt}>
                {formatters.datetime(item.createdAt)}
              </time>
              <StatusBadge status={item.status.tone} size="sm" label={item.status.label} />
              <ChevronRight size={18} className={styles.rowArrow} />
            </button>
          );
        })}
      </div>
    </section>
  );
};
