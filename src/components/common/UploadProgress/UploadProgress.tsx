import React from 'react';
import styles from './UploadProgress.module.scss';

export const UploadProgress: React.FC<{ ratio: number; label?: string }> = ({ ratio, label = 'Загрузка' }) => {
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label}>
      <div className={styles.bar} style={{ transform: `scaleX(${percent / 100})` }} />
      <span className={styles.text}>{label}: {percent}%</span>
    </div>
  );
};
