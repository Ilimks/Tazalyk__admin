import React, { useEffect } from 'react';
import styles from './Notification.module.scss';

interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <span className={styles.icon}>{icons[type]}</span>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeBtn} onClick={onClose}>
        ×
      </button>
    </div>
  );
};