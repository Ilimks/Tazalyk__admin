import type { ComponentProps } from 'react';
import type { StatusBadge } from '@/components/common/StatusBadge';
import type { Order, OrderStatus } from '@/types';

type BadgeStatus = ComponentProps<typeof StatusBadge>['status'];

// порядок — как заказ проходит обработку
export const ORDER_STATUSES: OrderStatus[] = ['new', 'awaiting_payment', 'paid', 'completed', 'cancelled'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  awaiting_payment: 'Ожидает оплаты',
  paid: 'Оплачен',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

// подписи кнопок-фильтров во множественном числе
export const ORDER_FILTER_LABELS: Record<OrderStatus, string> = {
  new: 'Новые',
  awaiting_payment: 'Ожидают оплаты',
  paid: 'Оплачены',
  completed: 'Выполнены',
  cancelled: 'Отменены',
};

export const ORDER_STATUS_BADGES: Record<OrderStatus, BadgeStatus> = {
  new: 'info',
  awaiting_payment: 'warning',
  paid: 'success',
  completed: 'completed',
  cancelled: 'error',
};

export const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] }));

// сколько штук товара в заказе
export const countItems = (order: Order) => order.items.reduce((sum, item) => sum + item.quantity, 0);
