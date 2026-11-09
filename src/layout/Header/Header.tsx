import React from 'react';
import { Menu, Moon, RefreshCw, Sun } from 'lucide-react';
import styles from './Header.module.scss';
import { useAuthStore } from '@/store';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const statusTexts = {
  online: 'Сервер на связи',
  offline: 'Нет связи с сервером',
  checking: 'Проверка связи…',
};

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { serverStatus, checkServer } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  // дата меняется раз в сутки — секундный таймер не нужен
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className={styles.header}>
      <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label="Открыть меню">
        <Menu size={22} />
      </button>

      <div className={styles.titleBlock}>
        <span className={styles.title}>{title}</span>
        <span className={styles.date}>{today}</span>
      </div>

      <button
        type="button"
        className={`${styles.status} ${styles[serverStatus]}`}
        onClick={checkServer}
        disabled={serverStatus === 'checking'}
        title="Проверить связь с сервером"
      >
        <span className={styles.statusDot} />
        <span className={styles.statusText}>{statusTexts[serverStatus]}</span>
        <RefreshCw size={14} className={styles.refreshIcon} />
      </button>

      <button
        type="button"
        className={styles.themeButton}
        onClick={toggleTheme}
        title={themeLabel}
        aria-label={themeLabel}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
};
