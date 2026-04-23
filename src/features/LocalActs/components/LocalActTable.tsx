import styles from '../LocalActsManager.module.scss';
import { Button } from '@/components/common/Button';
import type { LocalAct } from '@/types';

interface LocalActTableProps {
    documents: LocalAct[];
    onEdit: (doc: LocalAct) => void;
    onDelete: (id: string) => void;
}

export const LocalActTable: React.FC<LocalActTableProps> = ({ documents, onEdit, onDelete }) => {
    if (documents.length === 0) return <div className={styles.emptyState}><p>Нет добавленных документов</p></div>;

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
                <thead><tr><th>Название</th><th>Файл</th><th>Размер</th><th>Дата</th><th>Действия</th></tr></thead>
                <tbody>{documents.map((doc) => (<tr key={doc.id}><td className={styles.titleCell}>{doc.title}</td><td><a href={doc.file_url} download={doc.file_name} className={styles.downloadLink}>📄 {doc.file_name}</a></td><td>{(doc.file_size / 1024).toFixed(2)} KB</td><td>{new Date(doc.date).toLocaleDateString('ru-RU')}</td><td><Button variant="outline" size="sm" onClick={() => onEdit(doc)}>✏️</Button><Button variant="danger" size="sm" onClick={() => onDelete(doc.id)}>🗑️</Button></td></tr>))}</tbody>
            </table>
        </div>
    );
};