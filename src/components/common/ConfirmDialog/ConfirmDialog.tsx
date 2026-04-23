import { Button } from '../Button';
import styles from './ConfirmDialog.module.scss';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'danger',
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
        </div>
        <div className={styles.content}>
          <p>{message}</p>
        </div>
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={type === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};