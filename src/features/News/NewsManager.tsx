import React, { useState, useEffect } from 'react';
import { Newspaper, Plus } from 'lucide-react';
import styles from './NewsManager.module.scss';
import { useAuthStore, useNewsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Loader } from '@/components/common/Loader/Loader';
import { NewsForm } from './components/NewsForm';
import { NewsTable } from './components/NewsTable';
import type { News } from '@/types';

export const NewsManager: React.FC = () => {
  const {
    news,
    loading,
    totalCount,
    currentPage,
    pageSize,
    fetchPage,
    deleteNews,
    goToPage,
  } = useNewsStore();
  const { canCreate, canEdit, canDelete } = useAuthStore();

  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<News | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const allowCreate = canCreate('news');
  const allowEdit = canEdit('news');
  const allowDelete = canDelete('news');

  const handleDeleteClick = (id: string) => {
    const item = news.find(n => n.id === id);
    if (item) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const success = await deleteNews(itemToDelete.id);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setItemToDelete(null);
    if (success) {
      showNotification('Новость успешно удалена!', 'success');
    } else {
      showNotification('Ошибка при удалении новости', 'error');
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
    setEditingNews(null);
    setIsModalOpen(true);
  };

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNews(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchPage(1, pageSize);
    showNotification(
      editingNews ? 'Новость успешно обновлена!' : 'Новость успешно добавлена!',
      'success'
    );
  };

  const handlePageChange = (page: number) => {
    goToPage(page);
  };

  const addButton = allowCreate && (
    <Button icon={<Plus />} onClick={openCreate}>
      Добавить новость
    </Button>
  );

  const renderContent = () => {
    // первая загрузка: шапка остаётся на месте, спиннер — вместо таблицы
    if (loading && news.length === 0) {
      return (
        <div className={styles.loaderCard}>
          <Loader />
        </div>
      );
    }

    if (news.length === 0) {
      return (
        <EmptyState
          icon={Newspaper}
          title="Новостей пока нет"
          description="Добавьте первую новость — она появится в разделе «Новости» на сайте."
          action={addButton}
        />
      );
    }

    return (
      <NewsTable
        news={news}
        busy={loading}
        onEdit={allowEdit ? handleEdit : undefined}
        onDelete={allowDelete ? handleDeleteClick : undefined}
      />
    );
  };

  return (
    <div className={styles.manager}>
      <PageHeader
        icon={Newspaper}
        title="Новости"
        description={`Публикации сайта на русском и кыргызском языках${totalCount > 0 ? ` · всего ${totalCount}` : ''}`}
        actions={addButton}
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
        title={editingNews ? 'Редактировать новость' : 'Добавить новость'}
        size="lg"
      >
        <NewsForm
          initialData={editingNews || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Удалить новость?"
        message={`Новость «${itemToDelete?.title_ru ?? ''}» исчезнет с сайта. Это действие нельзя отменить.`}
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
