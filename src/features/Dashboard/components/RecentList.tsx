import { useEffect, useState } from 'react';
import { ChevronRight, CloudOff, Inbox } from 'lucide-react';
import { Button } from '@/components/common/Button';
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
  version: string;
  onNavigate: (tab: ActiveTab) => void;
}

export const RecentList: React.FC<RecentListProps> = ({ sections, version, onNavigate }) => {
  const [items, setItems] = useState<RecentItem[] | null>(null);
  const [failed, setFailed] = useState<RecentSection[]>([]);
  const [attempt, setAttempt] = useState(0);
  const allowed = RECENT_SECTIONS.filter((section) => sections.includes(section));

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(allowed.map((section) => load[section]())).then((results) => {
      if (cancelled) return;
      const lists: RecentItem[][] = [];
      const broken: RecentSection[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') lists.push(result.value);
        else broken.push(allowed[index]);
      });
      setFailed(broken);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed.join(), version, attempt]);

  return (
    <section aria-labelledby="dashboard-recent">
      <h2 id="dashboard-recent" className={styles.sectionTitle}>
        Последние обращения
      </h2>

      <div className={styles.recent} aria-busy={items === null}>
        {items === null && [0, 1, 2].map((n) => <span key={n} className={styles.recentSkeleton} />)}

        {items !== null && failed.length > 0 && (
          <div className={styles.recentFailed} role="alert">
            <CloudOff size={20} />
            <span>Не удалось загрузить: {failed.map((section) => NAV_ITEMS[section].label).join(', ')}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setItems(null);
                setAttempt((n) => n + 1);
              }}
            >
              Повторить
            </Button>
          </div>
        )}
        {items?.length === 0 && failed.length === 0 && (
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
