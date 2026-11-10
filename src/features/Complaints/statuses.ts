import type { ComponentProps } from 'react';
import type { StatusBadge } from '@/components/common/StatusBadge';
import type { ComplaintStatus, ComplaintType } from '@/types';

type BadgeStatus = ComponentProps<typeof StatusBadge>['status'];

// порядок — как жалоба проходит обработку
export const COMPLAINT_STATUSES: ComplaintStatus[] = ['new', 'in_progress', 'resolved', 'rejected'];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  resolved: 'Решена',
  rejected: 'Отклонена',
};

// подписи кнопок-фильтров во множественном числе
export const COMPLAINT_FILTER_LABELS: Record<ComplaintStatus, string> = {
  new: 'Новые',
  in_progress: 'В работе',
  resolved: 'Решённые',
  rejected: 'Отклонённые',
};

export const COMPLAINT_STATUS_BADGES: Record<ComplaintStatus, BadgeStatus> = {
  new: 'info',
  in_progress: 'warning',
  resolved: 'success',
  rejected: 'error',
};

export const COMPLAINT_STATUS_OPTIONS = COMPLAINT_STATUSES.map((value) => ({
  value,
  label: COMPLAINT_STATUS_LABELS[value],
}));

// те же подписи, что в форме на сайте; в карточке берём type_label с сервера
export const COMPLAINT_TYPES: ComplaintType[] = [
  'waste_issue',
  'billing_error',
  'service_quality',
  'employee_complaint',
  'other',
];

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  waste_issue: 'Проблема с вывозом отходов',
  billing_error: 'Неправильное начисление за вывоз мусора',
  service_quality: 'Качество услуг',
  employee_complaint: 'Жалоба на сотрудника',
  other: 'Другое',
};
