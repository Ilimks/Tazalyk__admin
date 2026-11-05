import React, { useEffect, useState } from 'react';
import { ExternalLink, Gauge, ImageDown, MonitorPlay } from 'lucide-react';
import styles from './Dashboard.module.scss';
import { StatCard } from './components/StatCard';
import { useAuthStore, useOrdersStore } from '@/store';
import { config } from '@/config';
import { NAV_ITEMS, ROLE_LABELS, SECTIONS, type Section } from '@/layout/navigation';
import {
  legislationService,
  localActsService,
  newsService,
  ordersService,
  photosService,
  procurementsService,
  productsService,
  vacanciesService,
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
  vacancies: vacanciesService,
};

const tones: Record<Section, string> = {
  news: 'green',
  photos: 'blue',
  videos: 'rose',
  procurements: 'amber',
  local_acts: 'violet',
  legislation: 'cyan',
  products: 'teal',
  orders: 'indigo',
  vacancies: 'orange',
};

// «1 новый», «2 новых», «21 новый»
const newOrdersLabel = (count: number) =>
  `${count} ${count % 10 === 1 && count % 100 !== 11 ? 'новый' : 'новых'}`;

// API не отдаёт отдельные счётчики, поэтому запрашиваем по одной записи из раздела.
// Кэш на минуту, чтобы при возврате на «Обзор» не скачивать их заново.
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
  const { user } = useAuthStore();
  // счётчик новых заказов общий с меню: его загружает и обновляет боковая панель
  const { newCount } = useOrdersStore();
  const sections = SECTIONS.filter((section) => availableTabs.includes(section));
  const [counts, setCounts] = useState<Partial<Record<Section, number>>>(() => countsCache?.counts || {});

  useEffect(() => {
    if (countsCache && Date.now() - countsCache.time < CACHE_TTL) return;

    let cancelled = false;
    const fresh: Partial<Record<Section, number>> = {};
    sections.forEach((section) => {
      services[section].getPage(1, 1).then(({ count }) => {
        fresh[section] = count;
        countsCache = { counts: { ...countsCache?.counts, ...fresh }, time: Date.now() };
        if (!cancelled) setCounts((prev) => ({ ...prev, [section]: count }));
      });
    });
    return () => {
      cancelled = true;
    };
    // список разделов зависит только от прав пользователя
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTabs.join()]);

  return (
    <div className={styles.dashboard}>
      <section className={styles.welcome}>
        <div>
          <h1>
            {getGreeting()}, {user?.username}
          </h1>
          <p>
            {user ? ROLE_LABELS[user.role] || user.role : ''} · выберите раздел, чтобы обновить информацию на сайте
          </p>
        </div>
        <a className={styles.siteButton} href={config.siteUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          Открыть сайт
        </a>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Разделы</h2>
        <div className={styles.statsGrid}>
          {sections.map((section) => {
            const item = NAV_ITEMS[section];
            return (
              <StatCard
                key={section}
                label={item.label}
                description={item.description}
                icon={item.icon}
                tone={tones[section]}
                value={counts[section]}
                badge={section === 'orders' && newCount ? newOrdersLabel(newCount) : undefined}
                onClick={() => onNavigate(section)}
              />
            );
          })}
        </div>
      </section>

      {/* советы про фото и видео — только тем, кто их загружает (отделу кадров не нужны) */}
      {sections.some((section) => MEDIA_SECTIONS.includes(section)) && (
        <section className={styles.tips}>
          <h2 className={styles.sectionTitle}>Чтобы сайт открывался быстро</h2>
          <ul>
            {tips.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className={styles.tipIcon}>
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
