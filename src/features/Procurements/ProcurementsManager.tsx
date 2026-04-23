import React, { useState, useEffect } from 'react';
import styles from './ProcurementsManager.module.scss';
import { useProcurementsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { ProcurementForm } from './components/ProcurementForm';
import { ProcurementTable } from './components/ProcurementTable';
import { Loader } from '@/components/common/Loader';
import type { Procurement } from '@/types';
import { ConfirmModal } from '@/components/common/ConfirmModal';

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
    changePageSize
  } = useProcurementsStore();
  
  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcurement, setEditingProcurement] = useState<Procurement | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Procurement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Исправлено: принимает id, а не item
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

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  useEffect(() => {
    fetchPage(1, 10);
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

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

  if (loading && procurements.length === 0) {
    return <Loader />;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Управление закупками</h2>
        <Button onClick={() => setIsModalOpen(true)}>+ Добавить закупку</Button>
      </div>

      <ProcurementTable
        procurements={procurements}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}  // Теперь передает id:string
      />

      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
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
        title="Удаление закупки"
        message={`Вы уверены, что хотите удалить контракт "${itemToDelete?.number}"?`}
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