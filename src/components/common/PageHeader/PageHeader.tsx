import type { LucideIcon } from 'lucide-react';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  // кнопки справа: «Добавить», фильтры и т.п.
  actions?: React.ReactNode;
}

// Шапка раздела админки: иконка, заголовок, пояснение и действия
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon: Icon, actions }) => (
  <div className={styles.pageHeader}>
    <div className={styles.titleBlock}>
      {Icon && (
        <span className={styles.icon}>
          <Icon size={22} />
        </span>
      )}
      <div>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </div>
    {actions && <div className={styles.actions}>{actions}</div>}
  </div>
);
