import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, Plus, SearchX } from 'lucide-react';
import styles from './VacanciesManager.module.scss';
import { useAuthStore, useVacanciesStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Loader } from '@/components/common/Loader';
import { Select } from '@/components/common/Form';
import { VacancyForm } from './components/VacancyForm';
import { VacancyTable } from './components/VacancyTable';
import type { Vacancy, VacancyFilters } from '@/types';

const PAGE_SIZE = 10;

type StatusFilter = NonNullable<VacancyFilters['status']>;

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'Все вакансии' },
  { value: 'active', label: 'Только активные' },
  { value: 'inactive', label: 'Только неактивные' },
];

export const VacanciesManager: React.FC = () => {
  const {
    vacancies,
    loading,
    totalCount,
    currentPage,
    pageSize,
    toggling,
    fetchPage,
    setActive,
    deleteVacancy,
    goToPage,
  } = useVacanciesStore();
  const { canCreate, canEdit, canDelete } = useAuthStore();

  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Vacancy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<StatusFilter>('');

  const allowCreate = canCreate('vacancies');
  const allowEdit = canEdit('vacancies');
  const allowDelete = canDelete('vacancies');

  useEffect(() => {
    fetchPage(1, PAGE_SIZE, { status });
  }, [fetchPage, status]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleToggle = async (vacancy: Vacancy) => {
    const next = !vacancy.is_active;
    const success = await setActive(vacancy.id, next);
    if (success) {
      showNotification(next ? `«${vacancy.title_ru}» снова на сайте` : `«${vacancy.title_ru}» скрыта с сайта`, 'success');
    } else {
      showNotification('Не удалось изменить вакансию. Попробуйте ещё раз.', 'error');
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(vacancies.find((v) => v.id === id) || null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const success = await deleteVacancy(itemToDelete.id);
    setIsDeleting(false);
    setItemToDelete(null);
    if (success) {
      showNotification('Вакансия удалена', 'success');
    } else {
      showNotification('Ошибка при удалении вакансии', 'error');
    }
  };

  const openCreate = () => {
    setEditingVacancy(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vacancy: Vacancy) => {
    setEditingVacancy(vacancy);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVacancy(null);
  };

  const handleSuccess = () => {
    showNotification(editingVacancy ? 'Вакансия сохранена' : 'Вакансия добавлена', 'success');
    handleCloseModal();
  };

  const addButton = allowCreate && (
    <Button icon={<Plus />} onClick={openCreate}>
      Добавить вакансию
    </Button>
  );

  const renderContent = () => {
    // первая загрузка: шапка остаётся на месте, спиннер — вместо таблицы
    if (loading && vacancies.length === 0) {
      return (
        <div className={styles.loaderCard}>
          <Loader />
        </div>
      );
    }

    if (vacancies.length === 0 && status) {
      return (
        <EmptyState
          icon={SearchX}
          title={status === 'active' ? 'Активных вакансий нет' : 'Неактивных вакансий нет'}
          description="Выберите «Все вакансии», чтобы увидеть остальные."
          action={
            <Button variant="outline" onClick={() => setStatus('')}>
              Показать все
            </Button>
          }
        />
      );
    }

    if (vacancies.length === 0) {
      return (
        <EmptyState
          icon={BriefcaseBusiness}
          title="Вакансий пока нет"
          description="Добавьте первую вакансию — она появится карточкой на странице «Вакансии» сайта."
          action={addButton}
        />
      );
    }

    return (
      <VacancyTable
        vacancies={vacancies}
        busy={loading}
        toggling={toggling}
        onToggle={allowEdit ? handleToggle : undefined}
        onEdit={allowEdit ? handleEdit : undefined}
        onDelete={allowDelete ? handleDeleteClick : undefined}
      />
    );
  };

  return (
    <div className={styles.manager}>
      <PageHeader
        icon={BriefcaseBusiness}
        title="Вакансии"
        description={`Карточки на странице «Вакансии» сайта${totalCount > 0 ? ` · всего ${totalCount}` : ''}`}
        actions={addButton}
      />

      <div className={styles.toolbar}>
        <Select
          className={styles.toolbarSelect}
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          options={statusOptions}
          aria-label="Фильтр по статусу"
        />
        <span className={styles.toolbarHint}>На сайте видны только активные вакансии</span>
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
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVacancy ? 'Редактировать вакансию' : 'Добавить вакансию'}
        size="lg"
      >
        <VacancyForm
          initialData={editingVacancy || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="Удалить вакансию?"
        message={`Вакансия «${itemToDelete?.title_ru ?? ''}» будет удалена навсегда. Чтобы скрыть её на время, просто отключите переключатель «На сайте».`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
};
