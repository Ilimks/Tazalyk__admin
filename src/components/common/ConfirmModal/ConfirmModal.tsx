import { Button } from '../Button';
import styles from './ConfirmModal.module.scss';

interface ConfirmModalProps {
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

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
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

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return styles.danger;
            case 'warning':
                return styles.warning;
            case 'info':
                return styles.info;
            default:
                return styles.danger;
        }
    };

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{title}</h3>
                    <button className={styles.closeBtn} onClick={onCancel}>×</button>
                </div>
                
                <div className={styles.body}>
                    <p>{message}</p>
                </div>
                
                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={onConfirm}
                        loading={isLoading}
                        className={getTypeStyles()}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};