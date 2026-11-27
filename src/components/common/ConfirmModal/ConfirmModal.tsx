import { createPortal } from 'react-dom';
import { Info, TriangleAlert, Trash2, X } from 'lucide-react';
import { Button } from '../Button';
import { useDialog } from '@/hooks/useDialog';
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

const typeIcons = {
    danger: Trash2,
    warning: TriangleAlert,
    info: Info,
};

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
    const dialogRef = useDialog<HTMLDivElement>(isOpen, () => {
        if (!isLoading) onCancel();
    });

    if (!isOpen) return null;

    const Icon = typeIcons[type];

    return createPortal(
        <div className={styles.overlay} onClick={onCancel}>
            <div
                ref={dialogRef}
                tabIndex={-1}
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-label={title}
                aria-describedby="confirm-message"
            >
                <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label="Закрыть" title="Закрыть">
                    <X size={20} />
                </button>

                <div className={styles.body}>
                    <div className={`${styles.iconCircle} ${styles[type]}`}>
                        <Icon size={26} />
                    </div>
                    <h3>{title}</h3>
                    <p id="confirm-message">{message}</p>
                </div>

                <div className={styles.footer} data-dialog-first>
                    <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={type === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        loading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
