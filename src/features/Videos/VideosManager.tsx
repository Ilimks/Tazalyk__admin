import React, { useState, useEffect } from 'react';
import styles from './VideosManager.module.scss';
import { useVideosStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { VideoForm } from './components/VideoForm';
import { VideoCard } from './components/VideoCard';
import { Loader } from '@/components/common/Loader';
import type { Video } from '@/types';

export const VideosManager: React.FC = () => {
  const { 
    videos,
    loading, 
    totalCount,
    currentPage,
    pageSize,
    fetchPage, 
    deleteVideo,
    goToPage,
    changePageSize
  } = useVideosStore();
  
  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPage(1, 8);
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDeleteClick = (video: Video) => {
    setVideoToDelete(video);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!videoToDelete) return;
    
    setIsDeleting(true);
    const success = await deleteVideo(videoToDelete.id);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setVideoToDelete(null);
    
    if (success) {
      showNotification('Видео успешно удалено!', 'success');
    } else {
      showNotification('Ошибка при удалении видео', 'error');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setVideoToDelete(null);
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchPage(1, pageSize);
    showNotification(
      editingVideo ? 'Видео успешно обновлено!' : 'Видео успешно добавлено!',
      'success'
    );
  };

  const handlePageChange = (page: number) => {
    goToPage(page);
  };

  if (loading && videos.length === 0) {
    return <Loader />;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Управление видео</h2>
        <Button onClick={() => setIsModalOpen(true)}>+ Добавить видео</Button>
      </div>

      <div className={styles.videosGrid}>
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onEdit={() => handleEdit(video)}
            onDelete={() => handleDeleteClick(video)}
          />
        ))}
        {videos.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <p>Нет добавленных видео</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline">
              Добавить первое видео
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
        title={editingVideo ? 'Редактировать видео' : 'Добавить видео'}
        size="lg"
      >
        <VideoForm
          initialData={editingVideo || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Удаление видео"
        message={`Вы уверены, что хотите удалить это видео?`}
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