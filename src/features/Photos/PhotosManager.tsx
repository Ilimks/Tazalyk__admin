import React, { useState } from 'react';
import { Images, Plus } from 'lucide-react';
import styles from './PhotosManager.module.scss';
import { useAuthStore, usePhotosStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { MediaCard, mediaCardStyles, useMediaGrid } from '@/components/common/MediaCard';
import { PhotoForm } from './components/PhotoForm';
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
  } = usePhotosStore();
  const { canCreate, canEdit, canDelete } = useAuthStore();

  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewing, setViewing] = useState<Photo | null>(null);

  const allowCreate = canCreate('photos');
  const allowEdit = canEdit('photos');
  const allowDelete = canDelete('photos');

  // сколько фото на странице, решает ширина сетки: последний ряд всегда полный
  const grid = useMediaGrid<HTMLDivElement>(fetchPage, { currentPage, pageSize });

  const totalPages = Math.ceil(totalCount / pageSize);

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
      showNotification('Фото удалено', 'success');
    } else {
      showNotification('Не удалось удалить фото', 'error');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPhoto(null);
  };

  const handleSuccess = () => {
    const wasEditing = Boolean(editingPhoto);
    handleCloseModal();
    fetchPage(1, pageSize);
    showNotification(wasEditing ? 'Фото обновлено' : 'Фото добавлено', 'success');
  };

  const openCreate = () => {
    setEditingPhoto(null);
    setIsModalOpen(true);
  };

  if (loading && photos.length === 0) {
    return <Loader />;
  }

  return (
    <div ref={grid.ref} className={styles.manager}>
      <PageHeader
        icon={Images}
        title="Фото"
        description={`Фотогалерея сайта · всего ${totalCount}`}
        actions={
          allowCreate && (
            <Button icon={<Plus />} onClick={openCreate}>
              Добавить фото
            </Button>
          )
        }
      />

      {photos.length === 0 && !loading ? (
        <EmptyState
          icon={Images}
          title="Фото пока нет"
          description="Добавьте первую подборку — она появится в разделе «Медиа» на сайте."
          action={
            allowCreate && (
              <Button icon={<Plus />} onClick={openCreate}>
                Добавить фото
              </Button>
            )
          }
        />
      ) : (
        <div className={mediaCardStyles.grid} style={grid.gridStyle}>
          {photos.map((photo) => (
            <MediaCard
              key={photo.id}
              kind="photo"
              previewSrc={photo.main_image}
              date={photo.date}
              onOpen={() => setViewing(photo)}
              onEdit={allowEdit ? () => handleEdit(photo) : undefined}
              onDelete={allowDelete ? () => handleDeleteClick(photo) : undefined}
            />
          ))}
        </div>
      )}

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
        title={editingPhoto ? 'Редактировать фото' : 'Добавить фото'}
        size="lg"
      >
        <PhotoForm
          initialData={editingPhoto || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? new Date(viewing.date).toLocaleDateString('ru-RU') : ''}
        size="xl"
      >
        {viewing && (
          <div className={styles.viewer}>
            <img src={viewing.main_image} alt="" className={styles.viewerImage} decoding="async" />
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Удалить фото?"
        message="Подборка исчезнет с сайта. Это действие нельзя отменить."
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
