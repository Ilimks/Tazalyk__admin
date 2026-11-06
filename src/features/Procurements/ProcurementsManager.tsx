import React, { useState, useEffect } from 'react';
import { ClipboardList, FileSpreadsheet, Plus } from 'lucide-react';
import styles from './ProcurementsManager.module.scss';
import { useAuthStore, useProcurementsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { procurementsService } from '@/api/services/procurements.service';
import { saveBlob } from '@/utils/download';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Loader } from '@/components/common/Loader';
import { ProcurementForm } from './components/ProcurementForm';
import { ProcurementTable } from './components/ProcurementTable';
import type { Procurement } from '@/types';

export const ProcurementsManager: React.FC = () => {
  const {
    procurements,
    loading,
    totalCount,
    currentPage,
    pageSize,
    fetchPage,
    deleteProcurement,
    goToPage,
  } = useProcurementsStore();
  const { canCreate, canEdit, canDelete } = useAuthStore();

  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcurement, setEditingProcurement] = useState<Procurement | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Procurement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const allowCreate = canCreate('procurements');
  const allowEdit = canEdit('procurements');
  const allowDelete = canDelete('procurements');

  const handleDeleteClick = (id: string) => {
    const item = procurements.find(p => p.id === id);
    if (item) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const success = await deleteProcurement(itemToDelete.id);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setItemToDelete(null);
    if (success) {
      showNotification('Закупка успешно удалена!', 'success');
    } else {
      showNotification('Ошибка при удалении закупки', 'error');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const file = await procurementsService.exportToExcel();
      const today = new Date().toISOString().slice(0, 10);
      saveBlob(file, `Закупки ТАЗАЛЫК ${today}.xlsx`);
      showNotification('Файл Excel с закупками сохранён', 'success');
    } catch {
      showNotification('Не удалось выгрузить закупки. Попробуйте ещё раз.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  useEffect(() => {
    fetchPage(1, 10);
  }, [fetchPage]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const openCreate = () => {
    setEditingProcurement(null);
    setIsModalOpen(true);
  };

  const handleEdit = (procurement: Procurement) => {
    setEditingProcurement(procurement);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProcurement(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchPage(1, pageSize);
    showNotification(
      editingProcurement ? 'Закупка успешно обновлена!' : 'Закупка успешно добавлена!',
      'success'
    );
  };

  const handlePageChange = (page: number) => {
    goToPage(page);
  };

  const addButton = allowCreate && (
    <Button icon={<Plus />} onClick={openCreate}>
      Добавить закупку
    </Button>
  );

  const headerActions = (
    <div className={styles.headerActions}>
      {totalCount > 0 && (
        <Button variant="outline" icon={<FileSpreadsheet />} loading={isExporting} onClick={handleExport}>
          Выгрузить в Excel
        </Button>
      )}
      {addButton}
    </div>
  );

  const renderContent = () => {
    // первая загрузка: шапка остаётся на месте, спиннер — вместо таблицы
    if (loading && procurements.length === 0) {
      return (
        <div className={styles.loaderCard}>
          <Loader />
        </div>
      );
    }

    if (procurements.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title="Закупок пока нет"
          description="Добавьте первую закупку — она появится в реестре закупок на сайте."
          action={addButton}
        />
      );
    }

    return (
      <ProcurementTable
        procurements={procurements}
        busy={loading}
        onEdit={allowEdit ? handleEdit : undefined}
        onDelete={allowDelete ? handleDeleteClick : undefined}
      />
    );
  };

  return (
    <div className={styles.manager}>
      <PageHeader
        icon={ClipboardList}
        title="Закупки"
        description={`Реестр закупок и заключённых контрактов предприятия${totalCount > 0 ? ` · всего ${totalCount}` : ''}`}
        actions={headerActions}
      />

      {renderContent()}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          onPageChange={handlePageChange}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProcurement ? 'Редактировать закупку' : 'Добавить закупку'}
        size="md"
      >
        <ProcurementForm
          initialData={editingProcurement || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Удалить закупку?"
        message={`Закупка № ${itemToDelete?.number || itemToDelete?.contractNumber || '—'} исчезнет с сайта. Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
};
