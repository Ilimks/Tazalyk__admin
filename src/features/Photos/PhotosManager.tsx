import React, { useState, useEffect } from 'react';
import styles from './PhotosManager.module.scss';
import { usePhotosStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { PhotoForm } from './components/PhotoForm';
import { PhotoCard } from './components/PhotoCard';
import { Loader } from '@/components/common/Loader/Loader';
import type { Photo } from '@/types';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export const PhotosManager: React.FC = () => {
  const { 
    photos,
    loading, 
    totalCount,
    currentPage,
    pageSize,
    fetchPage, 
    deletePhoto,
    goToPage,
    changePageSize
  } = usePhotosStore();
  
  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (item: Photo) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const success = await deletePhoto(itemToDelete.id);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setItemToDelete(null);
    if (success) {
      showNotification('Фото успешно удалено!', 'success');
    } else {
      showNotification('Ошибка при удалении фото', 'error');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  useEffect(() => {
    fetchPage(1, 8);
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPhoto(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchPage(1, pageSize);
    showNotification(
      editingPhoto ? 'Фото успешно обновлено!' : 'Фото успешно добавлено!',
      'success'
    );
  };

  const handlePageChange = (page: number) => {
    goToPage(page);
  };

  if (loading && photos.length === 0) {
    return <Loader />;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Управление фото</h2>
        <Button onClick={() => setIsModalOpen(true)}>+ Добавить фото</Button>
      </div>

      <div className={styles.photosGrid}>
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onEdit={() => handleEdit(photo)}
            onDelete={() => handleDeleteClick(photo)}  // ← ИСПРАВЛЕНО: handleDeleteClick вместо handleDelete
          />
        ))}
        {photos.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <p>Нет добавленных фото</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline">
              Добавить первое фото
            </Button>
          </div>
        )}
      </div>

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
        title={editingPhoto ? 'Редактировать фото' : 'Добавить фото'}
        size="lg"
      >
        <PhotoForm
          initialData={editingPhoto || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Удаление фото"
        message="Вы уверены, что хотите удалить это фото?"
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