import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import styles from './OrdersManager.module.scss';
import { useAuthStore, useOrdersStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Loader } from '@/components/common/Loader';
import { OrderTable } from './components/OrderTable';
import { OrderDetails } from './components/OrderDetails';
import { ORDER_FILTER_LABELS, ORDER_STATUSES } from './statuses';
import type { Order, OrderStatus } from '@/types';

const PAGE_SIZE = 10;

const filters: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  ...ORDER_STATUSES.map((value) => ({ value, label: ORDER_FILTER_LABELS[value] })),
];

export const OrdersManager: React.FC = () => {
  const {
    orders,
    loading,
    totalCount,
    currentPage,
    pageSize,
    status,
    newCount,
    fetchPage,
    fetchNewCount,
    setStatus,
    deleteOrder,
    goToPage,
  } = useOrdersStore();
  const { canEdit, canDelete } = useAuthStore();

  const { showNotification } = useNotificationStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // отдельно от selectedOrder: карточку под окном подтверждения могут закрыть клавишей Esc
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const allowEdit = canEdit('orders');
  const allowDelete = canDelete('orders');

  useEffect(() => {
    fetchPage(1, PAGE_SIZE);
    fetchNewCount();
  }, [fetchPage, fetchNewCount]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleCloseDetails = () => setSelectedOrder(null);

  const handleSaved = (order: Order) => {
    setSelectedOrder(null);
    showNotification(`Заказ № ${order.id} сохранён`, 'success');
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    const success = await deleteOrder(orderToDelete.id);
    setIsDeleting(false);
    setOrderToDelete(null);
    if (success) {
      showNotification(`Заказ № ${orderToDelete.id} удалён`, 'success');
      setSelectedOrder(null);
    } else {
      showNotification('Ошибка при удалении заказа', 'error');
    }
  };

  const renderContent = () => {
    // первая загрузка: шапка остаётся на месте, спиннер — вместо таблицы
    if (loading && orders.length === 0) {
      return (
        <div className={styles.loaderCard}>
          <Loader />
        </div>
      );
    }

    if (orders.length === 0 && status) {
      return (
        <EmptyState
          icon={ShoppingCart}
          title="Нет заказов с таким статусом"
          description="Выберите другой статус или посмотрите все заказы."
          action={
            <Button variant="outline" onClick={() => setStatus('')}>
              Показать все
            </Button>
          }
        />
      );
    }

    if (orders.length === 0) {
      return (
        <EmptyState
          icon={ShoppingCart}
          title="Заказов пока нет"
          description="Заказы, оформленные покупателями в магазине на сайте, появятся здесь."
        />
      );
    }

    return <OrderTable orders={orders} busy={loading} onOpen={setSelectedOrder} />;
  };

  return (
    <div className={styles.manager}>
      <PageHeader
        icon={ShoppingCart}
        title="Заказы"
        description={`Заказы покупателей из магазина на сайте${
          totalCount > 0 ? ` · ${status ? ORDER_FILTER_LABELS[status].toLowerCase() : 'всего'}: ${totalCount}` : ''
        }`}
      />

      <div className={styles.pills} role="group" aria-label="Фильтр по статусу">
        {filters.map(({ value, label }) => {
          const isActive = status === value;
          return (
            <button
              key={value || 'all'}
              type="button"
              className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
              aria-pressed={isActive}
              onClick={() => !isActive && setStatus(value)}
            >
              {label}
              {value === 'new' && newCount ? <span className={styles.pillCount}>{newCount}</span> : null}
            </button>
          );
        })}
      </div>

      {renderContent()}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          onPageChange={goToPage}
        />
      )}

      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={handleCloseDetails}
        title={selectedOrder ? `Заказ № ${selectedOrder.id}` : ''}
        size="lg"
      >
        {selectedOrder && (
          <OrderDetails
            key={selectedOrder.id}
            order={selectedOrder}
            allowEdit={allowEdit}
            allowDelete={allowDelete}
            onSaved={handleSaved}
            onDelete={() => setOrderToDelete(selectedOrder)}
            onClose={handleCloseDetails}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(orderToDelete)}
        title="Удалить заказ?"
        message={`Заказ № ${orderToDelete?.id ?? ''} (${orderToDelete?.customer_name ?? ''}) будет удалён из истории продаж. Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleConfirmDelete}
        onCancel={() => setOrderToDelete(null)}
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
};
