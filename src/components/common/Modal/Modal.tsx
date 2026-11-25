import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.scss';
import { Button } from '../Button';
import { useDialog } from '@/hooks/useDialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  onConfirm,
  confirmText = 'Сохранить',
  isLoading = false,
}) => {
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`${styles.modal} ${styles[size]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <h3>{title}</h3>
          {showCloseButton && (
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть" title="Закрыть">
              <X size={20} />
            </button>
          )}
        </div>

        <div className={styles.body}>{children}</div>

        {onConfirm && (
          <div className={styles.footer}>
            <Button variant="primary" onClick={onConfirm} loading={isLoading}>
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};