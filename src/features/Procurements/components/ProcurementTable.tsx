import styles from '../ProcurementsManager.module.scss';
import { Button } from '@/components/common/Button';
import type { Procurement } from '@/types';

interface ProcurementTableProps {
  procurements: Procurement[];
  onEdit: (procurement: Procurement) => void;
  onDelete: (id: string) => void;
}

const getTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    goods: 'Товар',
    services: 'Услуга',
    works: 'Работа',
  };
  return types[type] || type;
};

const getMethodLabel = (method: string) => {
  const methods: Record<string, string> = {
    direct: 'Прямое заключение',
    quotation: 'Запрос котировок',
    simple: 'Простейшая закупка',
    tender: 'Конкурс',
  };
  return methods[method] || method;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <span className={styles.statusActive}>Активна</span>;
    case 'completed':
      return <span className={styles.statusCompleted}>Завершена</span>;
    case 'cancelled':
      return <span className={styles.statusCancelled}>Отменена</span>;
    default:
      return null;
  }
};

export const ProcurementTable: React.FC<ProcurementTableProps> = ({
  procurements,
  onEdit,
  onDelete,
}) => {
  if (procurements.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Нет добавленных закупок</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>№ закупки</th>
            <th>№ контракта</th>
            <th>Поставщик</th>
            <th>Тип</th>
            <th>Способ</th>
            <th>Статус</th>
            <th>Дата</th>
            <th>Сумма</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {procurements.map((proc) => (
            <tr key={proc.id}>
              <td>{proc.number || '—'}</td>
              <td>{proc.contractNumber || '—'}</td>
              <td>{proc.supplier || '—'}</td>
              <td>{getTypeLabel(proc.type)}</td>
              <td>{getMethodLabel(proc.method)}</td>
              <td>{getStatusBadge(proc.status)}</td>
              <td>{proc.date ? new Date(proc.date).toLocaleDateString('ru-RU') : '—'}</td>
              <td>{proc.amount ? proc.amount.toLocaleString() : '0'} сом</td>
              <td>
                <Button variant="outline" size="sm" onClick={() => onEdit(proc)}>
                  ✏️
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(proc.id)}>
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