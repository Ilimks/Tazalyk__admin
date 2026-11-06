import React, { useEffect, useState } from 'react';
import { CircleAlert, ClipboardList, Eye, EyeOff, Lock, LogIn, Newspaper, ShieldCheck, User } from 'lucide-react';
import styles from './Login.module.scss';
import { useAuthStore } from '@/store';
import { Button } from '@/components/common/Button';

const features = [
  { icon: Newspaper, text: 'Новости, фото и видео сайта' },
  { icon: ClipboardList, text: 'Закупки, акты и законодательство' },
  { icon: ShieldCheck, text: 'Доступ по ролям сотрудников' },
];

const statusTexts = {
  online: 'Сервер доступен',
  offline: 'Сервер недоступен',
  checking: 'Проверяем подключение…',
};

export const Login: React.FC = () => {
  const { login, serverStatus, isLoading, loginError, clearLoginError, checkServer } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkServer();
  }, [checkServer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username.trim(), password);
  };

  const handleFieldChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (loginError) clearLoginError();
  };

  return (
    <div className={styles.page}>
      <aside className={styles.brand}>
        <div className={styles.brandTop}>
          <span className={styles.logo}>
            <img src="/favicon.svg" alt="" width={44} height={44} />
          </span>
          <div>
            <div className={styles.brandName}>МП «Тазалык»</div>
            <div className={styles.brandCaption}>Муниципальное предприятие г. Бишкек</div>
          </div>
        </div>

        <div className={styles.brandBody}>
          <h1>Панель управления сайтом</h1>
          <p>Публикуйте новости и медиа, обновляйте документы и закупки — изменения сразу появятся на mptazalyk.kg.</p>
          <ul className={styles.features}>
            {features.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className={styles.featureIcon}>
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.brandFooter}>© {new Date().getFullYear()} МП «Тазалык»</div>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.card}>
          <div className={styles.mobileLogo}>
            <img src="/favicon.svg" alt="" width={40} height={40} />
            <span>МП «Тазалык»</span>
          </div>

          <div className={styles.heading}>
            <h2>Вход в админ-панель</h2>
            <p>Введите логин и пароль, выданные администратором</p>
          </div>

          <div className={`${styles.status} ${styles[serverStatus]}`} role="status">
            <span className={styles.statusDot} />
            {statusTexts[serverStatus]}
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Логин</span>
              <span className={styles.inputWrap}>
                <User size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  value={username}
                  onChange={handleFieldChange(setUsername)}
                  placeholder="Введите логин"
                  autoComplete="username"
                  autoFocus
                  required
                  aria-invalid={Boolean(loginError)}
                />
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Пароль</span>
              <span className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handleFieldChange(setPassword)}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  required
                  aria-invalid={Boolean(loginError)}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {loginError && (
              <div className={styles.error} role="alert">
                <CircleAlert size={18} />
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={!username.trim() || !password}
              icon={<LogIn />}
            >
              Войти
            </Button>
          </form>

          {serverStatus === 'offline' && (
            <p className={styles.offlineHint}>
              Сервер не отвечает. Проверьте интернет или попробуйте позже — если проблема не уйдёт, сообщите администратору.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};
