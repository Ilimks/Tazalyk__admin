import { ChevronRight } from 'lucide-react';
import styles from '../OrdersManager.module.scss';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatters } from '@/utils/formatters';
import { ORDER_STATUS_BADGES, ORDER_STATUS_LABELS, countItems } from '../statuses';
import type { Order } from '@/types';

interface OrderTableProps {
  orders: Order[];
  // идёт перезагрузка списка (фильтр, смена страницы) — таблица приглушается
  busy?: boolean;
  onOpen: (order: Order) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({ orders, busy = false, onOpen }) => (
  <div className={`${styles.tableCard} ${busy ? styles.busy : ''}`} aria-busy={busy}>
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.numberCell}>Заказ</th>
            <th className={styles.customerCell}>Покупатель</th>
            <th className={styles.deliveryCell}>Получение</th>
            <th className={styles.itemsCell}>Товары</th>
            <th className={styles.amountCell}>Сумма</th>
            <th className={styles.statusCell}>Статус</th>
            <th className={styles.openCell}>
              <span className={styles.srOnly}>Открыть</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              tabIndex={0}
              onClick={() => onOpen(order)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(order);
                }
              }}
            >
              <td className={styles.numberCell}>
                <span className={styles.number}>№ {order.id}</span>
                <time className={styles.secondary} dateTime={order.created_at}>
                  {formatters.datetime(order.created_at)}
                </time>
              </td>
              <td className={styles.customerCell}>
                <span className={styles.customer} title={order.customer_name}>
                  {order.customer_name}
                </span>
                <span className={styles.secondary}>{order.phone}</span>
              </td>
              <td className={styles.deliveryCell}>
                <span className={styles.primary}>{order.delivery_label}</span>
                {order.delivery_method === 'delivery' && order.address && (
                  <span className={styles.secondary} title={order.address}>
                    {order.address}
                  </span>
                )}
              </td>
              <td className={styles.itemsCell}>{countItems(order)} шт.</td>
              <td className={styles.amountCell}>
                <span className={styles.amount}>{formatters.amount(order.total)}</span>
                <span className={styles.currency}>сом</span>
              </td>
              <td className={styles.statusCell}>
                <StatusBadge
                  status={ORDER_STATUS_BADGES[order.status] || 'info'}
                  size="sm"
                  label={ORDER_STATUS_LABELS[order.status] || order.status_label}
                />
              </td>
              <td className={styles.openCell}>
                <ChevronRight size={18} className={styles.openIcon} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
