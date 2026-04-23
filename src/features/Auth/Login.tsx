import React, { useState } from 'react';
import styles from './Login.module.scss';
import { useAuthStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Form';

export const Login: React.FC = () => {
  const { login, serverStatus, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const getStatusText = () => {
    switch (serverStatus) {
      case 'online':
        return { text: 'Сервер доступен', className: styles.statusOnline };
      case 'offline':
        return { text: 'Сервер недоступен', className: styles.statusOffline };
      default:
        return { text: 'Проверка подключения...', className: styles.statusChecking };
    }
  };

  const status = getStatusText();

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <h1>Админ панель</h1>
          <p>МП "Тазалык"</p>
          <div className={styles.serverStatusBadge}>
            <div className={status.className}>{status.text}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <Input
            type="text"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth loading={isLoading} disabled={serverStatus === 'offline'}>
            Войти
          </Button>
        </form>

        {serverStatus === 'offline' && (
          <div className={styles.warning}>
            <p>⚠️ Сервер не запущен.</p>
          </div>
        )}
      </div>
    </div>
  );
};