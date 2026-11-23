import styles from './Skeleton.module.scss';

interface TableSkeletonProps {
  rows?: number;
  // слева миниатюра (новости, товары, документы)
  withThumb?: boolean;
}

// Первая загрузка списка: строки-заглушки вместо спиннера посреди пустой карточки
export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 6, withThumb = false }) => (
  <div className={styles.table} role="status" aria-label="Загрузка списка">
    <div className={styles.head} />
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className={styles.row}>
        {withThumb && <span className={`${styles.bar} ${styles.thumb}`} />}
        <span className={styles.lines}>
          <span className={`${styles.bar} ${styles.long}`} />
          <span className={`${styles.bar} ${styles.short}`} />
        </span>
        <span className={`${styles.bar} ${styles.cell}`} />
        <span className={`${styles.bar} ${styles.cell}`} />
      </div>
    ))}
  </div>
);

// Первая загрузка фото и видео
export const GridSkeleton: React.FC<{ cards?: number }> = ({ cards = 8 }) => (
  <div className={styles.grid} role="status" aria-label="Загрузка списка">
    {Array.from({ length: cards }, (_, i) => (
      <div key={i} className={styles.card}>
        <span className={`${styles.bar} ${styles.image}`} />
        <span className={`${styles.bar} ${styles.caption}`} />
      </div>
    ))}
  </div>
);
