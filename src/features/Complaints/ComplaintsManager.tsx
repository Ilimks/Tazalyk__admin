import React, { useEffect, useState } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import styles from '@/features/Orders/OrdersManager.module.scss';
import own from './ComplaintsManager.module.scss';
import { useAuthStore, useComplaintsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { ComplaintDetails } from './components/ComplaintDetails';
import { ComplaintTable } from './components/ComplaintTable';
import { COMPLAINT_FILTER_LABELS, COMPLAINT_STATUSES, COMPLAINT_TYPE_LABELS, COMPLAINT_TYPES } from './statuses';
import type { Complaint, ComplaintStatus, ComplaintType } from '@/types';

const PAGE_SIZE = 10;

const statusFilters: { value: ComplaintStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  ...COMPLAINT_STATUSES.map((value) => ({ value, label: COMPLAINT_FILTER_LABELS[value] })),
];

export const ComplaintsManager: React.FC = () => {
  const {
    complaints,
    loading,
    totalCount,
    currentPage,
    pageSize,
    status,
    complaintType,
    newCount,
    fetchPage,
    fetchNewCount,
    setStatus,
    setComplaintType,
    resetFilters,
    deleteComplaint,
    goToPage,
  } = useComplaintsStore();
  const { canEdit, canDelete } = useAuthStore();
  const { showNotification } = useNotificationStore();

  const [selected, setSelected] = useState<Complaint | null>(null);
  // отдельно от selected: карточку под окном подтверждения можно закрыть клавишей Esc
  const [toDelete, setToDelete] = useState<Complaint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPage(1, PAGE_SIZE);
    fetchNewCount();
  }, [fetchPage, fetchNewCount]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const isFiltered = Boolean(status || complaintType);
  // с фильтром по типу «новые: 3» вводило бы в заблуждение — это не все новые жалобы
  const countLabel = complaintType ? 'найдено' : status ? COMPLAINT_FILTER_LABELS[status].toLowerCase() : 'всего';

  const handleSaved = (complaint: Complaint) => {
    setSelected(null);
    showNotification(`Жалоба: ${complaint.full_name} — сохранено`, 'success');
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    const success = await deleteComplaint(toDelete.id);
    setIsDeleting(false);
    setToDelete(null);
    if (success) {
      setSelected(null);
      showNotification('Жалоба и её фото удалены', 'success');
    } else {
      showNotification('Не удалось удалить жалобу', 'error');
    }
  };

  const renderContent = () => {
    if (loading && complaints.length === 0) {
      return (
        <div className={styles.loaderCard}>
          <Loader />
        </div>
      );
    }

    if (complaints.length === 0 && isFiltered) {
      return (
        <EmptyState
          icon={MessageSquareWarning}
          title="Нет жалоб по выбранному фильтру"
          description="Выберите другой статус или тип либо посмотрите все жалобы."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Показать все
            </Button>
          }
        />
      );
    }

    if (complaints.length === 0) {
      return (
        <EmptyState
          icon={MessageSquareWarning}
          title="Жалоб пока нет"
          description="Обращения граждан, отправленные с сайта, появятся здесь."
        />
      );
    }

    return <ComplaintTable complaints={complaints} busy={loading} onOpen={setSelected} />;
  };

  return (
    <div className={styles.manager}>
      <PageHeader
        icon={MessageSquareWarning}
        title="Жалобы"
        description={`Обращения граждан с сайта${totalCount > 0 ? ` · ${countLabel}: ${totalCount}` : ''}`}
      />

      <div className={own.filters}>
        <div className={styles.pills} role="group" aria-label="Фильтр по статусу">
          {statusFilters.map(({ value, label }) => {
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

        {/* по умолчанию — все типы: в админку приходят все жалобы, фильтр только помогает их разобрать */}
        <select
          className={`${own.typeSelect} ${complaintType ? own.typeSelectActive : ''}`}
          value={complaintType}
          onChange={(e) => setComplaintType(e.target.value as ComplaintType | '')}
          aria-label="Фильтр по типу обращения"
        >
          <option value="">Все типы</option>
          {COMPLAINT_TYPES.map((value) => (
            <option key={value} value={value}>
              {COMPLAINT_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
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
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.subject || selected.type_label : ''}
        size="lg"
      >
        {selected && (
          <ComplaintDetails
            key={selected.id}
            complaint={selected}
            allowEdit={canEdit('complaints')}
            allowDelete={canDelete('complaints')}
            onSaved={handleSaved}
            onDelete={() => setToDelete(selected)}
            onClose={() => setSelected(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(toDelete)}
        title="Удалить жалобу?"
        message={`Жалоба «${toDelete?.subject ?? ''}» (${toDelete?.full_name ?? ''}) и её фото будут удалены без возможности восстановления.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleConfirmDelete}
        onCancel={() => setToDelete(null)}
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
};
