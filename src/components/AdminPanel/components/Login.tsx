import { useState } from 'react';
import styles from '../AdminPanel.module.scss';

interface LoginProps {
    onLogin: (password: string) => void;
    serverStatus: 'checking' | 'online' | 'offline';
}

export const Login: React.FC<LoginProps> = ({ onLogin, serverStatus }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(password);
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <div className={styles.loginHeader}>
                    <h1>Админ панель</h1>
                    <p>МП "Тазалык"</p>
                    <div className={styles.serverStatusBadge}>
                        {serverStatus === 'online' ? (
                            <span className={styles.statusOnline}>✅ Сервер доступен</span>
                        ) : serverStatus === 'offline' ? (
                            <span className={styles.statusOffline}>❌ Сервер недоступен</span>
                        ) : (
                            <span className={styles.statusChecking}>🔄 Проверка...</span>
                        )}
                    </div>
                </div>
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <input
                        type="password"
                        placeholder="Введите пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.loginInput}
                    />
                    <button type="submit" className={styles.loginBtn} disabled={serverStatus === 'offline'}>
                        Войти
                    </button>
                </form>
                {serverStatus === 'offline' && (
                    <div className={styles.warning}>
                        <p>⚠️ Сервер не запущен. Запустите Django сервер:</p>
                        <code>cd C:\Users\Тазалык\Desktop\tazalyk_backend</code>
                        <code>venv\Scripts\activate</code>
                        <code>python manage.py runserver</code>
                    </div>
                )}
            </div>
        </div>
    );
};