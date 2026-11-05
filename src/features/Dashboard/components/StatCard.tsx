import { ArrowRight, type LucideIcon } from 'lucide-react';
import styles from '../Dashboard.module.scss';

interface StatCardProps {
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  // undefined — число ещё загружается
  value?: number;
  // выделенная подпись рядом с числом, например «3 новых»
  badge?: string;
  onClick: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ label, description, icon: Icon, tone, value, badge, onClick }) => (
  <button type="button" className={`${styles.statCard} ${styles[tone]}`} onClick={onClick}>
    <span className={styles.statTop}>
      <span className={styles.statIcon}>
        <Icon size={22} />
      </span>
      <ArrowRight size={18} className={styles.statArrow} />
    </span>
    <span className={styles.statValueRow}>
      {value === undefined ? (
        <span className={styles.skeleton} aria-label="Загрузка" />
      ) : (
        <span className={styles.statValue}>{value}</span>
      )}
      {badge && <span className={styles.statBadge}>{badge}</span>}
    </span>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statDescription}>{description}</span>
  </button>
);
