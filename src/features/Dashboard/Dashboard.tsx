import React, { useEffect, useState } from 'react';
import { CircleCheck, ExternalLink, Gauge, ImageDown, MonitorPlay } from 'lucide-react';
import styles from './Dashboard.module.scss';
import { AttentionCard } from './components/AttentionCard';
import { RECENT_SECTIONS, RecentList } from './components/RecentList';
import { SectionRow } from './components/SectionRow';
import { WinterCard } from './components/WinterCard';
import { useApplicationsStore, useAuthStore, useComplaintsStore, useOrdersStore } from '@/store';
import { config } from '@/config';
import { NAV_GROUPS, NAV_ITEMS, ROLE_LABELS, SECTIONS, type Section } from '@/layout/navigation';
import {
  legislationService,
  localActsService,
  newsService,
  ordersService,
  photosService,
  procurementsService,
  productsService,
  vacanciesService,
  applicationsService,
  complaintsService,
  videosService,
} from '@/api/services';
import type { ActiveTab } from '@/types';

interface DashboardProps {
  availableTabs: ActiveTab[];
  onNavigate: (tab: ActiveTab) => void;
}

const services: Record<Section, { getPage: (page: number, pageSize: number) => Promise<{ count: number }> }> = {
  news: newsService,
  photos: photosService,
  videos: videosService,
  procurements: procurementsService,
  local_acts: localActsService,
  legislation: legislationService,
  products: productsService,
  orders: ordersService,
  complaints: complaintsService,
  vacancies: vacanciesService,
  applications: applicationsService,
};

const plural = (count: number, [one, few, many]: [string, string, string]) => {
  const tens = count % 100;
  const units = count % 10;
  if (units === 1 && tens !== 11) return one;
  if (units >= 2 && units <= 4 && (tens < 12 || tens > 14)) return few;
  return many;
};

const ATTENTION: { id: Section; forms: [string, string, string]; empty: string }[] = [
  { id: 'orders', forms: ['новый заказ', 'новых заказа', 'новых заказов'], empty: 'Новых заказов нет' },
  { id: 'complaints', forms: ['новая жалоба', 'новые жалобы', 'новых жалоб'], empty: 'Новых жалоб нет' },
  { id: 'applications', forms: ['новый отклик', 'новых отклика', 'новых откликов'], empty: 'Новых откликов нет' },
];

const CACHE_TTL = 60_000;
let countsCache: { counts: Partial<Record<Section, number>>; time: number } | null = null;

const MEDIA_SECTIONS: Section[] = ['news', 'photos', 'products', 'videos'];

const tips = [
  { icon: ImageDown, text: 'Фото уменьшаются до 1920 px прямо в браузере перед загрузкой — оригинал можно не сжимать.' },
  { icon: MonitorPlay, text: 'Для видео сохраняется кадр-превью: на сайте ролик скачивается только после нажатия.' },
  { icon: Gauge, text: 'Длинные ролики лучше сократить или сжать: чем меньше файл, тем быстрее открывается сайт.' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
};

export const Dashboard: React.FC<DashboardProps> = ({ availableTabs, onNavigate }) => {
  const { user, canEdit } = useAuthStore();
  const { newCount: newOrders, newCountError: ordersFailed } = useOrdersStore();
  const { newCount: newApplications, newCountError: applicationsFailed } = useApplicationsStore();
  const { newCount: newComplaints, newCountError: complaintsFailed } = useComplaintsStore();
  const sections = SECTIONS.filter((section) => availableTabs.includes(section));
  const hasRecent = RECENT_SECTIONS.some((section) => sections.includes(section));
  const [counts, setCounts] = useState<Partial<Record<Section, number>>>(() => countsCache?.counts || {});
  const [failedCounts, setFailedCounts] = useState<Partial<Record<Section, boolean>>>({});

  useEffect(() => {
    if (hasRecent) return;
    if (countsCache && Date.now() - countsCache.time < CACHE_TTL) return;

    let cancelled = false;
    const fresh: Partial<Record<Section, number>> = {};
    sections.forEach((section) => {
      services[section].getPage(1, 1).then(({ count }) => {
        fresh[section] = count;
        countsCache = { counts: { ...countsCache?.counts, ...fresh }, time: Date.now() };
        if (!cancelled) setCounts((prev) => ({ ...prev, [section]: count }));
      }).catch(() => {
        if (!cancelled) setFailedCounts((prev) => ({ ...prev, [section]: true }));
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTabs.join()]);

  const newCounts: Partial<Record<Section, number | null>> = {
    orders: newOrders,
    complaints: newComplaints,
    applications: newApplications,
  };
  const failedNew: Partial<Record<Section, boolean>> = {
    orders: ordersFailed,
    complaints: complaintsFailed,
    applications: applicationsFailed,
  };

  const attention = ATTENTION.filter(({ id }) => availableTabs.includes(id));
  const allDone = attention.length > 0 && attention.every(({ id }) => newCounts[id] === 0 && !failedNew[id]);

  const groups = NAV_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.filter((id): id is Section => id !== 'dashboard' && availableTabs.includes(id)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className={styles.dashboard}>
      <section className={styles.welcome}>
        <div className={styles.welcomeText}>
          <h1>
            {getGreeting()}, {user?.username}
          </h1>
          <p>
            {user ? ROLE_LABELS[user.role] || user.role : ''}
            {hasRecent ? ' · вот что пришло с сайта' : ' · выберите раздел, чтобы обновить информацию на сайте'}
          </p>
        </div>
        <a className={styles.siteButton} href={config.siteUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          Открыть сайт
        </a>
      </section>

      {canEdit('news') && <WinterCard />}

      {attention.length > 0 && (
        <section aria-labelledby="dashboard-attention">
          <h2 id="dashboard-attention" className={styles.sectionTitle}>
            Требует внимания
          </h2>
          {allDone ? (
            <div className={styles.calm} role="status">
              <span className={styles.calmIcon}>
                <CircleCheck size={22} />
              </span>
              <div>
                <strong>Всё обработано</strong>
                <p>{attention.map(({ empty }) => empty).join(' · ')}</p>
              </div>
            </div>
          ) : (
            <div className={styles.attentionGrid}>
              {attention.map(({ id, forms, empty }) => {
                const value = newCounts[id] ?? null;
                return (
                  <AttentionCard
                    key={id}
                    label={NAV_ITEMS[id].label}
                    icon={NAV_ITEMS[id].icon}
                    value={value}
                    failed={failedNew[id]}
                    caption={value ? plural(value, forms) : empty}
                    onClick={() => onNavigate(id)}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {hasRecent ? (
        <RecentList
          sections={sections}
          version={[newComplaints, newOrders, newApplications].join()}
          onNavigate={onNavigate}
        />
      ) : (
        <section aria-labelledby="dashboard-sections">
          <h2 id="dashboard-sections" className={styles.sectionTitle}>
            Разделы
          </h2>
          <div className={styles.groups}>
            {groups.map((group, index) => (
              <div key={group.title || index} className={styles.group}>
                {group.title && <h3 className={styles.groupTitle}>{group.title}</h3>}
                {group.items.map((id) => (
                  <SectionRow
                    key={id}
                    label={NAV_ITEMS[id].label}
                    description={NAV_ITEMS[id].description}
                    icon={NAV_ITEMS[id].icon}
                    value={counts[id]}
                    failed={failedCounts[id]}
                    onClick={() => onNavigate(id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.some((section) => MEDIA_SECTIONS.includes(section)) && (
        <section className={styles.tips} aria-labelledby="dashboard-tips">
          <h2 id="dashboard-tips" className={styles.tipsTitle}>
            Чтобы сайт открывался быстро
          </h2>
          <ul>
            {tips.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon size={18} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
