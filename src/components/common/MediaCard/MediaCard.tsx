import { CalendarDays, Film, Images, Pencil, Play, Trash2 } from 'lucide-react';
import styles from './MediaCard.module.scss';

interface MediaCardProps {
  kind: 'photo' | 'video';
  previewSrc?: string | null;
  caption?: string;
  extraCount?: number;
  date: string;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  kind,
  previewSrc,
  caption,
  extraCount = 0,
  date,
  onOpen,
  onEdit,
  onDelete,
}) => {
  const isVideo = kind === 'video';
  const formattedDate = new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.preview}
        onClick={onOpen}
        aria-label={`${isVideo ? 'Смотреть видео' : 'Открыть фото'}${caption ? `: ${caption}` : ''}`}
      >
        {previewSrc ? (
          <img src={previewSrc} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className={`${styles.placeholder} ${isVideo ? styles.placeholderVideo : ''}`}>
            {!isVideo && <Images size={32} strokeWidth={1.5} />}
            <span>{isVideo ? 'Нет превью' : 'Нет фото'}</span>
          </span>
        )}

        {isVideo && (
          <span className={styles.play}>
            <Play size={20} fill="currentColor" />
          </span>
        )}

        {extraCount > 0 && (
          <span className={styles.count}>
            {isVideo ? <Film size={12} /> : <Images size={12} />}
            +{extraCount}
          </span>
        )}
      </button>

      {caption && (
        <p className={styles.caption} title={caption}>
          {caption}
        </p>
      )}

      <div className={styles.footer}>
        <span className={styles.date}>
          <CalendarDays size={14} />
          {formattedDate}
        </span>
        <div className={styles.actions}>
          {onEdit && (
            <button type="button" className={styles.action} onClick={onEdit} aria-label="Редактировать" title="Редактировать">
              <Pencil size={16} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={`${styles.action} ${styles.danger}`}
              onClick={onDelete}
              aria-label="Удалить"
              title="Удалить"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
