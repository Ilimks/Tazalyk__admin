import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.scss';
import { Button } from '../Button';
import { ConfirmModal } from '../ConfirmModal';
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
  const [dirty, setDirty] = useState(false);
  const [askClose, setAskClose] = useState(false);
  const pressedOnOverlay = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setDirty(false);
      setAskClose(false);
    }
  }, [isOpen]);

  const requestClose = () => {
    if (dirty) setAskClose(true);
    else onClose();
  };

  const dialogRef = useDialog<HTMLDivElement>(isOpen, requestClose);
  const markDirty = () => setDirty(true);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const dialog = (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        pressedOnOverlay.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedOnOverlay.current) requestClose();
        pressedOnOverlay.current = false;
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`${styles.modal} ${styles[size]}`}
        onClick={(e) => e.stopPropagation()}
        onInput={markDirty}
        onChange={markDirty}
        onDrop={markDirty}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <h3>{title}</h3>
          {showCloseButton && (
            <button type="button" className={styles.closeBtn} onClick={requestClose} aria-label="Закрыть" title="Закрыть">
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
    </div>
  );

  return (
    <>
      {createPortal(dialog, document.body)}
      <ConfirmModal
        isOpen={askClose}
        type="warning"
        title="Закрыть без сохранения?"
        message="Введённые данные пропадут. Чтобы их сохранить, вернитесь к форме и нажмите «Сохранить»."
        confirmText="Закрыть"
        cancelText="Вернуться к форме"
        onConfirm={() => {
          setAskClose(false);
          onClose();
        }}
        onCancel={() => setAskClose(false)}
      />
    </>
  );
};
