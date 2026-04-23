import React, { useState, useEffect } from 'react';
import styles from './Header.module.scss';
import { useAuthStore } from '@/store';
import { Button } from '@/components/common/Button';

export const Header: React.FC = () => {
  const { serverStatus, logout } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusText = () => {
    switch (serverStatus) {
      case 'online':
        return { text: 'Сервер подключен', dotClass: styles.online };
      case 'offline':
        return { text: 'Сервер недоступен', dotClass: styles.offline };
      default:
        return { text: 'Проверка...', dotClass: styles.checking };
    }
  };

  const status = getStatusText();

  return (
    <div className={styles.header}>
      <div className={styles.headerInfo}>
        <div className={styles.serverStatusIndicator}>
          <span className={`${styles.statusDot} ${status.dotClass}`}></span>
          <span className={styles.statusText}>{status.text}</span>
        </div>
        <span className={styles.date}>
          {currentTime.toLocaleDateString('ru-RU')}
        </span>
        <span className={styles.time}>
          {currentTime.toLocaleTimeString('ru-RU')}
        </span>
      </div>
      <Button variant="danger" size="sm" onClick={logout}>
        Выйти
      </Button>
    </div>
  );
};