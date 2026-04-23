import styles from '../LegislationManager.module.scss';
import { Button } from '@/components/common/Button';
import type { Legislation } from '@/types';

interface LegislationTableProps {
    documents: Legislation[];
    onEdit: (doc: Legislation) => void;
    onDelete: (id: string) => void;
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
};

export const LegislationTable: React.FC<LegislationTableProps> = ({
    documents,
    onEdit,
    onDelete,
}) => {
    if (documents.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>Нет добавленных документов</p>
            </div>
        );
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Файл</th>
                        <th>Размер</th>
                        <th>Дата</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map((doc) => (
                        <tr key={doc.id}>
                            <td className={styles.titleCell}>{doc.title}</td>
                            <td>
                                <a 
                                    href={doc.file_url} 
                                    download={doc.file_name}
                                    className={styles.downloadLink}
                                >
                                    📄 {doc.file_name}
                                </a>
                            </td>
                            <td>{formatFileSize(doc.file_size)}</td>
                            <td>{formatDate(doc.date)}</td>
                            <td>
                                <Button variant="outline" size="sm" onClick={() => onEdit(doc)}>
                                    ✏️
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => onDelete(doc.id)}>
                                    🗑️
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};