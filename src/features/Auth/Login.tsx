import React, { useEffect, useState } from 'react';
import {
  CircleAlert,
  ClipboardList,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  LockKeyhole,
  LogIn,
  Newspaper,
  ShieldCheck,
  User,
} from 'lucide-react';
import styles from './Login.module.scss';
import { useAuthStore } from '@/store';

// Экран входа сделан в одном стиле с ассистентом поручений (tazalyk-assistant/web/src/features/auth)

const features = [
  { icon: Newspaper, text: 'Новости, фото и видео' },
  { icon: ClipboardList, text: 'Закупки и документы' },
  { icon: ShieldCheck, text: 'Доступ по ролям' },
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
  const [emptyError, setEmptyError] = useState('');
  const error = loginError || emptyError;

  useEffect(() => {
    checkServer();
  }, [checkServer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    // кнопка всегда активна: пустые поля подсказываем текстом, а не бледной кнопкой
    if (!username.trim() || !password) {
      setEmptyError('Введите логин и пароль');
      return;
    }
    await login(username.trim(), password);
  };

  const handleFieldChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (loginError) clearLoginError();
    if (emptyError) setEmptyError('');
  };

  return (
    <div className={styles.page}>
      <aside className={styles.brand}>
        {/* арка и здания с герба предприятия — водяным знаком */}
        <img className={styles.arch} src="/arch.svg" alt="" aria-hidden="true" draggable={false} />

        <header className={styles.brandTop}>
          <span className={styles.logo}>
            <img src="/favicon.svg" alt="" width={46} height={46} />
          </span>
          <div className={styles.brandText}>
            <div className={styles.brandName}>МП «Тазалык»</div>
            <div className={styles.brandCaption}>Муниципальное предприятие · Бишкек</div>
          </div>
          <span className={styles.appChip}>Админ-панель</span>
        </header>

        <div className={styles.hero}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Панель управления сайтом
          </span>
          <h1>
            <span>Сайт предприятия</span>
            <span className={styles.accent}>под контролем</span>
          </h1>
          <p>Публикуйте новости и медиа, обновляйте документы и закупки — изменения сразу появятся на mptazalyk.kg.</p>
          <ul className={styles.features}>
            {features.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className={styles.featureIcon}>
                  <Icon size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <footer className={styles.brandFooter}>
          <span>© {new Date().getFullYear()} МП «Тазалык»</span>
          <span>mptazalyk.kg · колл-центр 1400</span>
        </footer>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.card}>
          <span className={styles.cardIcon}>
            <LockKeyhole size={22} />
          </span>
          <h2 className={styles.title}>Вход в админ-панель</h2>
          <p className={styles.subtitle}>Введите логин и пароль, выданные администратором</p>

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
                  aria-invalid={Boolean(error)}
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
                  aria-invalid={Boolean(error)}
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

            {error && (
              <div className={styles.error} role="alert">
                <CircleAlert size={18} />
                {error}
              </div>
            )}

            <button type="submit" className={styles.submit} disabled={isLoading}>
              {isLoading ? <LoaderCircle size={20} className={styles.spin} /> : <LogIn size={20} />}
              {isLoading ? 'Входим…' : 'Войти'}
            </button>
          </form>

          {serverStatus === 'offline' ? (
            <p className={styles.note}>Сервер не отвечает. Проверьте интернет или попробуйте позже.</p>
          ) : (
            <p className={styles.note}>Забыли пароль — обратитесь к администратору, он выдаст новый.</p>
          )}
        </div>

        <p className={styles.secure}>
          <ShieldCheck size={15} />
          Защищённое подключение · МП «Тазалык», Бишкек
        </p>
      </main>
    </div>
  );
};
