import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Inbox } from 'lucide-react';
import styles from '@/features/Orders/OrdersManager.module.scss';
import { applicationsService } from '@/api/services';
import { useApplicationsStore, useAuthStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { saveBlob } from '@/utils/download';
import { ApplicationDetails } from './components/ApplicationDetails';
import { ApplicationTable } from './components/ApplicationTable';
import { APPLICATION_FILTER_LABELS, APPLICATION_STATUSES } from './statuses';
import type { ApplicationStatus, VacancyApplication } from '@/types';

const PAGE_SIZE = 10;

const filters: { value: ApplicationStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  ...APPLICATION_STATUSES.map((value) => ({ value, label: APPLICATION_FILTER_LABELS[value] })),
];

export const ApplicationsManager: React.FC = () => {
  const {
    applications,
    loading,
    totalCount,
    currentPage,
    pageSize,
    status,
    newCount,
    fetchPage,
    fetchNewCount,
    setStatus,
    deleteApplication,
    goToPage,
  } = useApplicationsStore();
  const { canEdit, canDelete } = useAuthStore();
  const { showNotification } = useNotificationStore();

  const [selected, setSelected] = useState<VacancyApplication | null>(null);
  // отдельно от selected: карточку под окном подтверждения можно отменить
  const [toDelete, setToDelete] = useState<VacancyApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchPage(1, PAGE_SIZE);
    fetchNewCount();
  }, [fetchPage, fetchNewCount]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSaved = (application: VacancyApplication) => {
    setSelected(null);
    showNotification(`Отклик: ${application.full_name} — сохранено`, 'success');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const file = await applicationsService.exportToExcel();
      const today = new Date().toISOString().slice(0, 10);
      saveBlob(file, `Отклики ТАЗАЛЫК ${today}.xlsx`);
      showNotification('Файл Excel с откликами сохранён', 'success');
    } catch {
      showNotification('Не удалось выгрузить отклики. Попробуйте ещё раз.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    const success = await deleteApplication(toDelete.id);
    setIsDeleting(false);
    setToDelete(null);
    if (success) {
      setSelected(null);
      showNotification('Отклик и файл резюме удалены', 'success');
    } else {
      showNotification('Не удалось удалить отклик', 'error');
    }
  };

  const renderContent = () => {
    if (loading && applications.length === 0) {
      return (
        <div className={styles.loaderCard}>
          <Loader />
        </div>
      );
    }

    if (applications.length === 0 && status) {
      return (
        <EmptyState
          icon={Inbox}
          title="Нет откликов с таким статусом"
          description="Выберите другой статус или посмотрите все отклики."
          action={
            <Button variant="outline" onClick={() => setStatus('')}>
              Показать все
            </Button>
          }
        />
      );
    }

    if (applications.length === 0) {
      return (
        <EmptyState
          icon={Inbox}
          title="Откликов пока нет"
          description="Резюме, отправленные со страницы «Вакансии» на сайте, появятся здесь."
        />
      );
    }

    return <ApplicationTable applications={applications} busy={loading} onOpen={setSelected} />;
  };

  return (
    <div className={styles.manager}>
      <PageHeader
        icon={Inbox}
        title="Отклики"
        actions={
          <Button variant="outline" icon={<FileSpreadsheet />} loading={isExporting} onClick={handleExport}>
            Выгрузить в Excel
          </Button>
        }
        description={`Резюме кандидатов с сайта${
          totalCount > 0 ? ` · ${status ? APPLICATION_FILTER_LABELS[status].toLowerCase() : 'всего'}: ${totalCount}` : ''
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
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.full_name : ''}
        size="lg"
      >
        {selected && (
          <ApplicationDetails
            key={selected.id}
            application={selected}
            allowEdit={canEdit('applications')}
            allowDelete={canDelete('applications')}
            onSaved={handleSaved}
            onDelete={() => setToDelete(selected)}
            onClose={() => setSelected(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(toDelete)}
        title="Удалить отклик?"
        message={`Отклик «${toDelete?.full_name ?? ''}» и файл резюме будут удалены без возможности восстановления.`}
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
