import { Download, FileSpreadsheet, FileText, Pencil, Trash2 } from 'lucide-react';
import styles from '../LocalActsManager.module.scss';
import type { LocalAct } from '@/types';

interface LocalActTableProps {
    documents: LocalAct[];
    // идёт перезагрузка списка (смена страницы, удаление) — таблица приглушается
    busy?: boolean;
    // без обработчика кнопка не показывается (нет прав)
    onEdit?: (doc: LocalAct) => void;
    onDelete?: (id: string) => void;
}

const formatFileSize = (bytes: number) => {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date: string) => new Date(date).toLocaleDateString('ru-RU');

// цвет плашки и иконка — по расширению файла
const getFileKind = (fileName = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { className: styles.filePdf, icon: <FileText size={18} /> };
    if (ext === 'doc' || ext === 'docx') return { className: styles.fileDoc, icon: <FileText size={18} /> };
    if (ext === 'xls' || ext === 'xlsx') return { className: styles.fileXls, icon: <FileSpreadsheet size={18} /> };
    return { className: '', icon: <FileText size={18} /> };
};

export const LocalActTable: React.FC<LocalActTableProps> = ({ documents, busy = false, onEdit, onDelete }) => {
    return (
        <div className={`${styles.tableCard} ${busy ? styles.busy : ''}`} aria-busy={busy}>
            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.docCell}>Документ</th>
                            <th className={styles.sizeCell}>Размер</th>
                            <th className={styles.dateCell}>Дата</th>
                            <th className={styles.actionsCell}>
                                <span className={styles.srOnly}>Действия</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((doc) => {
                            const fileKind = getFileKind(doc.file_name);
                            return (
                                <tr key={doc.id}>
                                    <td className={styles.docCell}>
                                        <div className={styles.doc}>
                                            <span className={`${styles.fileIcon} ${fileKind.className}`}>
                                                {fileKind.icon}
                                            </span>
                                            <div className={styles.docText}>
                                                <span className={styles.title} title={doc.title}>
                                                    {doc.title}
                                                </span>
                                                {doc.file_name && (
                                                    <span className={styles.subtitle} title={doc.file_name}>
                                                        {doc.file_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.sizeCell}>{formatFileSize(doc.file_size)}</td>
                                    <td className={styles.dateCell}>
                                        <time dateTime={doc.date}>{formatDate(doc.date)}</time>
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <div className={styles.actions}>
                                            {doc.file_url && (
                                                <a
                                                    href={doc.file_url}
                                                    download={doc.file_name}
                                                    className={styles.iconBtn}
                                                    aria-label={`Скачать файл «${doc.file_name || doc.title}»`}
                                                    title="Скачать"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            )}
                                            {onEdit && (
                                                <button
                                                    type="button"
                                                    className={styles.iconBtn}
                                                    onClick={() => onEdit(doc)}
                                                    aria-label={`Редактировать документ «${doc.title}»`}
                                                    title="Редактировать"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    type="button"
                                                    className={`${styles.iconBtn} ${styles.danger}`}
                                                    onClick={() => onDelete(doc.id)}
                                                    aria-label={`Удалить документ «${doc.title}»`}
                                                    title="Удалить"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
