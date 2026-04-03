import { useState, useEffect } from 'react';
import styles from '../AdminPanel.module.scss';

interface HeaderProps {
    onLogout: () => void;
    serverStatus?: 'checking' | 'online' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({ onLogout, serverStatus }) => {
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
                return { text: 'Сервер подключен', color: '#22c55e' };
            case 'offline':
                return { text: 'Сервер недоступен', color: '#ef4444' };
            default:
                return { text: 'Проверка...', color: '#f59e0b' };
        }
    };

    const status = getStatusText();

    return (
        <div className={styles.header}>
            <div className={styles.headerInfo}>
                {serverStatus && (
                    <div className={styles.serverStatusIndicator}>
                        <span 
                            className={styles.statusDot} 
                            style={{ background: status.color }}
                        ></span>
                        <span className={styles.statusText}>{status.text}</span>
                    </div>
                )}
                <span className={styles.date}>
                    {currentTime.toLocaleDateString('ru-RU')}
                </span>
                <span className={styles.time}>
                    {currentTime.toLocaleTimeString('ru-RU')}
                </span>
            </div>
            <button onClick={onLogout} className={styles.logoutBtn}>
                Выйти
            </button>
        </div>
    );
};