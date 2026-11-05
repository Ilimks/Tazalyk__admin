import { Pencil, Trash2 } from 'lucide-react';
import styles from '../ProcurementsManager.module.scss';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Procurement } from '@/types';

interface ProcurementTableProps {
  procurements: Procurement[];
  // идёт перезагрузка списка (смена страницы, удаление) — таблица приглушается
  busy?: boolean;
  // без обработчика кнопка не показывается (нет прав)
  onEdit?: (procurement: Procurement) => void;
  onDelete?: (id: string) => void;
}

const statusLabels: Record<Procurement['status'], string> = {
  active: 'Активна',
  completed: 'Завершена',
  cancelled: 'Отменена',
};

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

const formatDate = (date: string) => (date ? new Date(date).toLocaleDateString('ru-RU') : '—');

const formatAmount = (amount: number) => (amount ? amount.toLocaleString('ru-RU') : '0');

export const ProcurementTable: React.FC<ProcurementTableProps> = ({
  procurements,
  busy = false,
  onEdit,
  onDelete,
}) => {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div className={`${styles.tableCard} ${busy ? styles.busy : ''}`} aria-busy={busy}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.numberCell}>Закупка</th>
              <th className={styles.supplierCell}>Поставщик</th>
              <th className={styles.kindCell}>Тип и способ</th>
              <th className={styles.statusCell}>Статус</th>
              <th className={styles.dateCell}>Дата</th>
              <th className={styles.amountCell}>Сумма</th>
              {hasActions && (
                <th className={styles.actionsCell}>
                  <span className={styles.srOnly}>Действия</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {procurements.map((proc) => (
              <tr key={proc.id}>
                <td className={styles.numberCell}>
                  <span className={styles.number}>{proc.number ? `№ ${proc.number}` : '—'}</span>
                  <span className={styles.secondary} title={proc.contractNumber || undefined}>
                    Контракт {proc.contractNumber || '—'}
                  </span>
                </td>
                <td className={styles.supplierCell}>
                  <span className={styles.supplier} title={proc.supplier || undefined}>
                    {proc.supplier || '—'}
                  </span>
                </td>
                <td className={styles.kindCell}>
                  <span className={styles.kind}>{getTypeLabel(proc.type)}</span>
                  <span className={styles.secondary}>{getMethodLabel(proc.method)}</span>
                </td>
                <td className={styles.statusCell}>
                  {proc.status && <StatusBadge status={proc.status} size="sm" label={statusLabels[proc.status]} />}
                </td>
                <td className={styles.dateCell}>
                  {proc.date ? <time dateTime={proc.date}>{formatDate(proc.date)}</time> : '—'}
                </td>
                <td className={styles.amountCell}>
                  <span className={styles.amount}>{formatAmount(proc.amount)}</span>
                  <span className={styles.currency}>сом</span>
                </td>
                {hasActions && (
                  <td className={styles.actionsCell}>
                    <div className={styles.actions}>
                      {onEdit && (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => onEdit(proc)}
                          aria-label={`Редактировать закупку № ${proc.number || proc.contractNumber || ''}`}
                          title="Редактировать"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.danger}`}
                          onClick={() => onDelete(proc.id)}
                          aria-label={`Удалить закупку № ${proc.number || proc.contractNumber || ''}`}
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
