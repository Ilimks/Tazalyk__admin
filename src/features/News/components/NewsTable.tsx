// src/features/News/components/NewsTable.tsx
import React from 'react';
import { ImageOff, Pencil, Trash2 } from 'lucide-react';
import styles from '../NewsManager.module.scss';
import type { News } from '@/types';

interface NewsTableProps {
    news: News[];
    // идёт перезагрузка списка (смена страницы, удаление) — таблица приглушается
    busy?: boolean;
    // без обработчика кнопка не показывается (нет прав)
    onEdit?: (news: News) => void;
    onDelete?: (id: string) => void;
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('ru-RU');

export const NewsTable: React.FC<NewsTableProps> = ({ news, busy = false, onEdit, onDelete }) => {
    const hasActions = Boolean(onEdit || onDelete);

    return (
        <div className={`${styles.tableCard} ${busy ? styles.busy : ''}`} aria-busy={busy}>
            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.imageCell}>Фото</th>
                            <th className={styles.titleCell}>Заголовок</th>
                            <th className={styles.dateCell}>Дата</th>
                            {hasActions && (
                                <th className={styles.actionsCell}>
                                    <span className={styles.srOnly}>Действия</span>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {news.map((item) => (
                            <tr key={item.id}>
                                <td className={styles.imageCell}>
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt=""
                                            width={56}
                                            height={40}
                                            loading="lazy"
                                            decoding="async"
                                            className={styles.thumbnail}
                                        />
                                    ) : (
                                        <span className={styles.thumbnailEmpty} title="Нет изображения">
                                            <ImageOff size={16} />
                                        </span>
                                    )}
                                </td>
                                <td className={styles.titleCell}>
                                    <span className={styles.title} title={item.title_ru}>
                                        {item.title_ru}
                                    </span>
                                    {item.title_ky && (
                                        <span className={styles.subtitle}>
                                            <span className={styles.langTag}>KY</span>
                                            <span className={styles.subtitleText} title={item.title_ky}>
                                                {item.title_ky}
                                            </span>
                                        </span>
                                    )}
                                </td>
                                <td className={styles.dateCell}>
                                    <time dateTime={item.date}>{formatDate(item.date)}</time>
                                </td>
                                {hasActions && (
                                    <td className={styles.actionsCell}>
                                        <div className={styles.actions}>
                                            {onEdit && (
                                                <button
                                                    type="button"
                                                    className={styles.iconBtn}
                                                    onClick={() => onEdit(item)}
                                                    aria-label={`Редактировать новость «${item.title_ru}»`}
                                                    title="Редактировать"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    type="button"
                                                    className={`${styles.iconBtn} ${styles.danger}`}
                                                    onClick={() => onDelete(item.id)}
                                                    aria-label={`Удалить новость «${item.title_ru}»`}
                                                    title="Удалить"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
