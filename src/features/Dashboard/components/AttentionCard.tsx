import { ArrowRight, Check, type LucideIcon } from 'lucide-react';
import styles from '../Dashboard.module.scss';

interface AttentionCardProps {
  label: string;
  // «новых заказа» рядом с числом или «Новых заказов нет»
  caption: string;
  icon: LucideIcon;
  // null — счётчик ещё загружается
  value: number | null;
  onClick: () => void;
}

// Новое с сайта, на что ждут ответа. Есть новое — число и подсветка, нет — спокойная карточка с галочкой
export const AttentionCard: React.FC<AttentionCardProps> = ({ label, caption, icon: Icon, value, onClick }) => (
  <button
    type="button"
    className={`${styles.attentionCard} ${value ? styles.attentionHot : ''}`}
    onClick={onClick}
    aria-label={value ? `${label}: ${value} ${caption}` : `${label}: ${caption}`}
  >
    <span className={styles.attentionIcon}>
      <Icon size={22} />
    </span>
    <span className={styles.attentionText}>
      <span className={styles.attentionLabel}>{label}</span>
      {value === null ? (
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
