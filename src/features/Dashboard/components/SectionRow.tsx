import { ChevronRight, type LucideIcon } from 'lucide-react';
import styles from '../Dashboard.module.scss';

interface SectionRowProps {
  label: string;
  description: string;
  icon: LucideIcon;
  value?: number;
  failed?: boolean;
  onClick: () => void;
}

export const SectionRow: React.FC<SectionRowProps> = ({ label, description, icon: Icon, value, failed, onClick }) => (
  <button type="button" className={styles.row} onClick={onClick}>
    <span className={styles.rowIcon}>
      <Icon size={18} />
    </span>
    <span className={styles.rowText}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowDescription} title={description}>{description}</span>
    </span>
    {failed && value === undefined ? (
      <span className={styles.rowValue} title="Не удалось загрузить" aria-label="Не удалось загрузить">—</span>
    ) : value === undefined ? (
      <span className={`${styles.skeleton} ${styles.skeletonSmall}`} aria-label="Загрузка" />
    ) : (
      <span className={styles.rowValue}>{value}</span>
    )}
    <ChevronRight size={18} className={styles.rowArrow} />
  </button>
);
