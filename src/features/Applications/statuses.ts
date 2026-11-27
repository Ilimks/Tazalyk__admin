import type { ComponentProps } from 'react';
import type { StatusBadge } from '@/components/common/StatusBadge';
import type { ApplicationStatus } from '@/types';

type BadgeStatus = ComponentProps<typeof StatusBadge>['status'];

export const APPLICATION_STATUSES: ApplicationStatus[] = ['new', 'in_review', 'invited', 'hired', 'rejected'];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'Новый',
  in_review: 'На рассмотрении',
  invited: 'Приглашён',
  hired: 'Принят',
  rejected: 'Отказ',
};

export const APPLICATION_FILTER_LABELS: Record<ApplicationStatus, string> = {
  new: 'Новые',
  in_review: 'На рассмотрении',
  invited: 'Приглашённые',
  hired: 'Принятые',
  rejected: 'Отказы',
};

export const APPLICATION_STATUS_BADGES: Record<ApplicationStatus, BadgeStatus> = {
  new: 'info',
  in_review: 'warning',
  invited: 'success',
  hired: 'completed',
  rejected: 'error',
};

export const APPLICATION_STATUS_OPTIONS = APPLICATION_STATUSES.map((value) => ({
  value,
  label: APPLICATION_STATUS_LABELS[value],
}));
