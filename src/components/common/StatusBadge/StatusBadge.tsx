import styles from './StatusBadge.module.scss';

type StatusType = 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'open' 
  | 'closed' 
  | 'pending' 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error';

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusLabels: Record<StatusType, string> = {
  active: 'Активен',
  completed: 'Завершен',
  cancelled: 'Отменен',
  open: 'Открыта',
  closed: 'Закрыта',
  pending: 'В ожидании',
  info: 'Информация',
  success: 'Успешно',
  warning: 'Внимание',
  error: 'Ошибка',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = true,
  className = '',
  size = 'md',
}) => {
  return (
    <span className={`${styles.badge} ${styles[status]} ${styles[size]} ${className}`}>
      {showDot && <span className={`${styles.dot} ${styles[status]}`}></span>}
      {statusLabels[status] || status}
    </span>
  );
};