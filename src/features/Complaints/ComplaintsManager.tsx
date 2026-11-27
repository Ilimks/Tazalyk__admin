import React, { useEffect, useState } from 'react';
import { MessageSquareWarning, SearchX } from 'lucide-react';
import styles from '@/features/Orders/OrdersManager.module.scss';
import own from './ComplaintsManager.module.scss';
import { useAuthStore, useComplaintsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { useOpenRecordStore } from '@/store/openRecord.store';
import { useListSearch } from '@/hooks/useListSearch';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadError } from '@/components/common/LoadError';
import { TableSkeleton } from '@/components/common/Skeleton';
import { SearchBox } from '@/components/common/SearchBox';
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
    search,
    setSearch,
    fetchNewCount,
    setStatus,
    setComplaintType,
    resetFilters,
    deleteComplaint,
    goToPage,
  } = useComplaintsStore();
  const loadError = useComplaintsStore((state) => state.loadError);
  const retryLoad = () => {
    const { currentPage, pageSize, fetchPage } = useComplaintsStore.getState();
    fetchPage(currentPage, pageSize);
  };
  const { canEdit, canDelete } = useAuthStore();
  const searchBox = useListSearch(search, setSearch);
  const { showNotification } = useNotificationStore();

  const [selected, setSelected] = useState<Complaint | null>(null);
  const [toDelete, setToDelete] = useState<Complaint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPage(1, PAGE_SIZE);
    fetchNewCount();
  }, [fetchPage, fetchNewCount]);

  useEffect(() => {
    const record = useOpenRecordStore.getState().take('complaints');
    if (record) setSelected(record);
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  const showAll = () => {
    searchBox.setValue('');
    resetFilters();
  };
  const isFiltered = Boolean(status || complaintType);
  const countLabel = complaintType || search ? 'найдено' : status ? COMPLAINT_FILTER_LABELS[status].toLowerCase() : 'всего';

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
        <TableSkeleton />
      );
    }

    if (loadError) {
      return <LoadError message={loadError} onRetry={retryLoad} />;
    }

    if (complaints.length === 0 && search) {
      return (
        <EmptyState
          icon={SearchX}
          title="Ничего не найдено"
          description="Проверьте написание или посмотрите все жалобы."
          action={
            <Button variant="outline" onClick={showAll}>
              Показать все
            </Button>
          }
        />
      );
    }

    if (complaints.length === 0 && isFiltered) {
      return (
        <EmptyState
          icon={MessageSquareWarning}
          title="Нет жалоб по выбранному фильтру"
          description="Выберите другой статус или тип либо посмотрите все жалобы."
          action={
            <Button variant="outline" onClick={showAll}>
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

      <SearchBox
        value={searchBox.value}
        onChange={searchBox.setValue}
        placeholder="ФИО, телефон, тема, текст или адрес"
        label="Поиск жалобы по ФИО, телефону, теме, тексту или адресу"
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
