import type { LucideIcon } from 'lucide-react';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// Пустой список: иконка, текст и кнопка «Добавить первый…»
export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className={styles.emptyState}>
    <span className={styles.icon}>
      <Icon size={28} />
    </span>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
);
