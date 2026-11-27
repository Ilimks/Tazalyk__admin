import React, { useCallback, useEffect, useState } from 'react';
import { RotateCw, Snowflake } from 'lucide-react';
import { siteSettingsService } from '@/api/services';
import { useNotificationStore } from '@/store/notification.store';
import styles from '../Dashboard.module.scss';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; on: boolean };

export const WinterCard: React.FC = () => {
  const { showNotification } = useNotificationStore();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setState({ status: 'loading' });
    siteSettingsService
      .get()
      .then((settings) => setState({ status: 'ready', on: settings.winter_effects }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  useEffect(load, [load]);

  const toggle = async () => {
    if (state.status !== 'ready' || saving) return;
    const next = !state.on;
    setSaving(true);
    try {
      const settings = await siteSettingsService.setWinterEffects(next);
      setState({ status: 'ready', on: settings.winter_effects });
      showNotification(
        settings.winter_effects
          ? 'Снег включён: на сайте он появится примерно через минуту'
          : 'Снег выключен: с сайта он пропадёт примерно через минуту',
        'success',
      );
    } catch {
      showNotification('Не удалось сохранить. Проверьте подключение и попробуйте ещё раз.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const on = state.status === 'ready' && state.on;

  return (
    <section className={styles.winter} aria-labelledby="dashboard-winter">
      <span className={`${styles.winterIcon} ${on ? styles.winterIconOn : ''}`}>
        <Snowflake size={22} />
      </span>
      <div className={styles.winterText}>
        <h2 id="dashboard-winter">Зимнее оформление сайта</h2>
        <p>Падает снег, на шапке и карточках лежат сугробы, Дед Мороз сметает их метлой и машет посетителям. На сайте меняется примерно через минуту.</p>
      </div>
      {state.status === 'loading' && <span className={styles.skeleton} aria-label="Загрузка" />}
      {state.status === 'error' && (
        <button type="button" className={styles.winterRetry} onClick={load}>
          <RotateCw size={16} />
          Повторить
        </button>
      )}
      {state.status === 'ready' && (
        <button
          type="button"
          role="switch"
          aria-checked={state.on}
          aria-labelledby="dashboard-winter"
          className={`${styles.switch} ${state.on ? styles.switchOn : ''}`}
          onClick={toggle}
          disabled={saving}
        >
          <span className={styles.switchTrack} aria-hidden />
          {state.on ? 'Включено' : 'Выключено'}
        </button>
      )}
    </section>
  );
};
