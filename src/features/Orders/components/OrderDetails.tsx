import React, { useState } from 'react';
import { ClipboardCheck, MessageCircle, Package, Phone, Send, Trash2, TriangleAlert, Truck, UserRound } from 'lucide-react';
import styles from '../OrdersManager.module.scss';
import { useOrdersStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Select, Textarea } from '@/components/common/Form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatters } from '@/utils/formatters';
import { ORDER_STATUS_BADGES, ORDER_STATUS_LABELS, ORDER_STATUS_OPTIONS, countItems } from '../statuses';
import type { Order, OrderStatus, OrderUpdate } from '@/types';

interface OrderDetailsProps {
  order: Order;
  // без прав на изменение блок «Обработка» только для чтения
  allowEdit: boolean;
  // удалять заказы может только администратор
  allowDelete: boolean;
  onSaved: (order: Order) => void;
  onDelete: () => void;
  onClose: () => void;
}

// для ссылки tel: оставляем только цифры и плюс
const phoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, allowEdit, allowDelete, onSaved, onDelete, onClose }) => {
  const { updateOrder } = useOrdersStore();
  const { showNotification } = useNotificationStore();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState(order.manager_note || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isDirty = status !== order.status || note !== (order.manager_note || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    const changes: OrderUpdate = {};
    if (status !== order.status) changes.status = status;
    if (note !== (order.manager_note || '')) changes.manager_note = note;

    setSaving(true);
    const result = await updateOrder(order.id, changes);
    setSaving(false);

    if (result.success && result.data) {
      onSaved(result.data);
      return;
    }
    const fieldErrors = result.fieldErrors || {};
    setErrors(fieldErrors);
    const other = Object.entries(fieldErrors)
      .filter(([field]) => field !== 'status' && field !== 'manager_note')
      .map(([, text]) => text);
    showNotification([result.message, ...other].filter(Boolean).join(' '), 'error');
  };

  return (
    <form className={styles.details} onSubmit={handleSubmit}>
      <div className={styles.detailsHead}>
        <StatusBadge
          status={ORDER_STATUS_BADGES[order.status] || 'info'}
          label={ORDER_STATUS_LABELS[order.status] || order.status_label}
        />
        <span>
          Оформлен <time dateTime={order.created_at}>{formatters.datetime(order.created_at)}</time>
        </span>
      </div>

      {!order.telegram_notified && (
        <div className={styles.alert} role="note">
          <TriangleAlert size={18} />
          <span>
            <strong>Заказ не отправлен в Telegram.</strong> Уведомление менеджерам не дошло — свяжитесь с покупателем
            сами: кнопки WhatsApp и Telegram ниже.
          </span>
        </div>
      )}

      <div className={styles.infoGrid}>
        <section className={styles.formSection}>
          <div className={styles.formSectionHead}>
            <span className={styles.sectionIcon}>
              <UserRound size={16} />
            </span>
            <div className={styles.formSectionText}>
              <h4 className={styles.formSectionTitle}>Покупатель</h4>
            </div>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Имя</span>
              <span className={styles.infoValue}>{order.customer_name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Телефон</span>
              <a className={styles.contactLink} href={phoneHref(order.phone)}>
                <Phone size={15} />
                {order.phone}
              </a>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Удобнее общаться</span>
              <span className={styles.infoValue}>{order.contact_label}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Написать покупателю</span>
              <span className={styles.contactLinks}>
                <a className={styles.contactLink} href={order.customer_whatsapp_url} target="_blank" rel="noreferrer">
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
                <a className={styles.contactLink} href={order.customer_telegram_url} target="_blank" rel="noreferrer">
                  <Send size={15} />
                  Telegram
                </a>
              </span>
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.formSectionHead}>
            <span className={styles.sectionIcon}>
              <Truck size={16} />
            </span>
            <div className={styles.formSectionText}>
              <h4 className={styles.formSectionTitle}>Получение</h4>
            </div>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Способ</span>
              <span className={styles.infoValue}>{order.delivery_label}</span>
            </div>
            {order.delivery_method === 'delivery' && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Адрес</span>
                <span className={styles.infoValue}>{order.address || '—'}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Комментарий покупателя</span>
              {order.comment ? (
                <span className={styles.infoValue}>{order.comment}</span>
              ) : (
                <span className={`${styles.infoValue} ${styles.muted}`}>Нет</span>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className={`${styles.formSection} ${styles.itemsSection}`}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <Package size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Товары</h4>
            <p className={styles.formSectionHint}>
              {countItems(order)} шт. · цены на момент заказа
            </p>
          </div>
        </div>
        <div className={styles.itemsScroll}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Товар</th>
                <th className={styles.num}>Объём</th>
                <th className={styles.num}>Цена</th>
                <th className={styles.num}>Кол-во</th>
                <th className={styles.num}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className={styles.itemName}>{item.product_name}</td>
                  <td className={styles.num}>{item.volume} л</td>
                  <td className={styles.num}>{formatters.amount(item.price)} сом</td>
                  <td className={styles.num}>{item.quantity}</td>
                  <td className={styles.num}>{formatters.amount(item.subtotal)} сом</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Итого</td>
                <td className={styles.num}>{formatters.amount(order.total)} сом</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <ClipboardCheck size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Обработка</h4>
            <p className={styles.formSectionHint}>Статус и заметка видны только сотрудникам</p>
          </div>
        </div>
        <Select
          label="Статус заказа"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          options={ORDER_STATUS_OPTIONS}
          error={errors.status}
          disabled={!allowEdit}
        />
        <Textarea
          label="Заметка менеджера"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={errors.manager_note}
          rows={3}
          placeholder="Например: созвонились, оплата при получении"
          disabled={!allowEdit}
        />
      </section>

      <div className={styles.formActions}>
        {allowDelete && (
          <Button
            type="button"
            variant="outline"
            className={`${styles.actionsStart} ${styles.deleteButton}`}
            icon={<Trash2 />}
            onClick={onDelete}
            disabled={saving}
          >
            Удалить заказ
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Закрыть
        </Button>
        {allowEdit && (
          <Button type="submit" loading={saving} disabled={!isDirty}>
            Сохранить
          </Button>
        )}
      </div>
    </form>
  );
};
