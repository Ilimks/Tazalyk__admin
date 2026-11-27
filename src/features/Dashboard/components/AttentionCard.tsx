import { AlertTriangle, ArrowRight, Check, type LucideIcon } from 'lucide-react';
import styles from '../Dashboard.module.scss';

interface AttentionCardProps {
  label: string;
  caption: string;
  icon: LucideIcon;
  value: number | null;
  failed?: boolean;
  onClick: () => void;
}

export const AttentionCard: React.FC<AttentionCardProps> = ({ label, caption, icon: Icon, value, failed, onClick }) => (
  <button
    type="button"
    className={`${styles.attentionCard} ${value && !failed ? styles.attentionHot : ''}`}
    onClick={onClick}
    aria-label={failed ? `${label}: не удалось загрузить` : value ? `${label}: ${value} ${caption}` : `${label}: ${caption}`}
  >
    <span className={styles.attentionIcon}>
      <Icon size={22} />
    </span>
    <span className={styles.attentionText}>
      <span className={styles.attentionLabel}>{label}</span>
      {failed ? (
        <span className={`${styles.attentionDone} ${styles.attentionFailed}`}>
          <AlertTriangle size={16} />
          Не удалось загрузить
        </span>
      ) : value === null ? (
        <span className={styles.skeleton} aria-label="Загрузка" />
      ) : value > 0 ? (
        <span className={styles.attentionValue}>
          <strong>{value}</strong> {caption}
        </span>
      ) : (
        <span className={styles.attentionDone}>
          <Check size={16} />
          {caption}
        </span>
      )}
    </span>
    <ArrowRight size={18} className={styles.arrow} />
  </button>
);
