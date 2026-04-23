// src/features/News/components/NewsTable.tsx
import React from 'react';
import styles from '../NewsManager.module.scss';
import { Button } from '@/components/common/Button';
import type { News } from '@/types';

interface NewsTableProps {
    news: News[];
    onEdit: (news: News) => void;
    onDelete: (id: string) => void;
}

export const NewsTable: React.FC<NewsTableProps> = ({ news, onEdit, onDelete }) => {
    return (
        <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        <th>Изображение</th>
                        <th>Название (Русский)</th>
                        <th>Название (Кыргызча)</th>
                        <th>Дата</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {news.map((item) => (
                        <tr key={item.id}>
                            <td className={styles.imageCell}>
                                {item.image && (
                                    <img src={item.image} alt={item.title_ru} className={styles.thumbnail} />
                                )}
                            </td>
                            <td className={styles.titleCell}>{item.title_ru}</td>
                            <td className={styles.titleCell}>{item.title_ky || '—'}</td>
                            <td>{new Date(item.date).toLocaleDateString('ru-RU')}</td>
                            <td>
                                <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                                    ✏️
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => onDelete(item.id)}>
                                    🗑️
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {news.length === 0 && (
                        <tr>
                            <td colSpan={5} className={styles.emptyCell}>
                                Нет добавленных новостей
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};