import React, { useState, useEffect } from 'react';
import { Clapperboard, Plus } from 'lucide-react';
import styles from './VideosManager.module.scss';
import { useAuthStore, useVideosStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { MediaCard, mediaCardStyles } from '@/components/common/MediaCard';
import { VideoForm } from './components/VideoForm';
import { Loader } from '@/components/common/Loader';
import type { Video } from '@/types';

const PAGE_SIZE = 8;

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
  } = useVideosStore();
  const { canCreate, canEdit, canDelete } = useAuthStore();

  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // просмотр: видео создаётся только здесь, а в сетке — лишь картинка-превью
  const [viewing, setViewing] = useState<{ video: Video; index: number } | null>(null);

  const allowCreate = canCreate('videos');
  const allowEdit = canEdit('videos');
  const allowDelete = canDelete('videos');

  useEffect(() => {
    fetchPage(1, PAGE_SIZE);
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
      showNotification('Видео удалено', 'success');
    } else {
      showNotification('Не удалось удалить видео', 'error');
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
    const wasEditing = Boolean(editingVideo);
    handleCloseModal();
    fetchPage(1, pageSize);
    showNotification(wasEditing ? 'Видео обновлено' : 'Видео добавлено', 'success');
  };

  const openCreate = () => {
    setEditingVideo(null);
    setIsModalOpen(true);
  };

  if (loading && videos.length === 0) {
    return <Loader />;
  }

  const viewingSources = viewing ? [viewing.video.main_video_url, ...(viewing.video.gallery_videos || [])] : [];
  const withoutThumbnail = videos.filter((video) => !video.thumbnail).length;

  return (
    <div className={styles.manager}>
      <PageHeader
        icon={Clapperboard}
        title="Видео"
        description={`Видеогалерея сайта · всего ${totalCount}`}
        actions={
          allowCreate && (
            <Button icon={<Plus />} onClick={openCreate}>
              Добавить видео
            </Button>
          )
        }
      />

      {withoutThumbnail > 0 && allowEdit && (
        <div className={styles.notice}>
          Видео без превью на этой странице: {withoutThumbnail}. На сайте вместо картинки у них показывается заглушка —
          откройте такое видео на редактирование и нажмите «Сохранить», превью создастся автоматически.
        </div>
      )}

      {videos.length === 0 && !loading ? (
        <EmptyState
          icon={Clapperboard}
          title="Видео пока нет"
          description="Добавьте первое видео — оно появится в разделе «Медиа» на сайте."
          action={
            allowCreate && (
              <Button icon={<Plus />} onClick={openCreate}>
                Добавить видео
              </Button>
            )
          }
        />
      ) : (
        <div className={mediaCardStyles.grid}>
          {videos.map((video) => (
            <MediaCard
              key={video.id}
              kind="video"
              previewSrc={video.thumbnail}
              extraCount={video.gallery_videos?.length || 0}
              date={video.date}
              onOpen={() => setViewing({ video, index: 0 })}
              onEdit={allowEdit ? () => handleEdit(video) : undefined}
              onDelete={allowDelete ? () => handleDeleteClick(video) : undefined}
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
        title={editingVideo ? 'Редактировать видео' : 'Добавить видео'}
        size="lg"
      >
        <VideoForm
          initialData={editingVideo || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? new Date(viewing.video.date).toLocaleDateString('ru-RU') : ''}
        size="xl"
      >
        {viewing && (
          <div className={styles.viewer}>
            <video
              key={viewing.index}
              src={viewingSources[viewing.index]}
              poster={viewing.index === 0 ? viewing.video.thumbnail || undefined : undefined}
              className={styles.viewerVideo}
              controls
              autoPlay
              playsInline
            />
            {viewingSources.length > 1 && (
              <div className={styles.viewerParts}>
                {viewingSources.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`${styles.viewerPart} ${index === viewing.index ? styles.viewerPartActive : ''}`}
                    onClick={() => setViewing({ ...viewing, index })}
                  >
                    {index === 0 ? 'Главное' : `Часть ${index + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Удалить видео?"
        message="Видео исчезнет с сайта. Это действие нельзя отменить."
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
