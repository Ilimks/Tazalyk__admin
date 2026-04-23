import React, { useState, useEffect } from 'react';
import styles from './NewsManager.module.scss';
import { useNewsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { NewsForm } from './components/NewsForm';
import { NewsTable } from './components/NewsTable';
import { Loader } from '@/components/common/Loader/Loader';
import type { News } from '@/types';
import { ConfirmModal } from '@/components/common/ConfirmModal';

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
    changePageSize
  } = useNewsStore();
  
  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<News | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Исправлено: принимает id, а не item
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
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

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

  if (loading && news.length === 0) {
    return <Loader />;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Управление новостями</h2>
        <Button onClick={() => setIsModalOpen(true)}>+ Добавить новость</Button>
      </div>

      <NewsTable
        news={news}
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
        title={editingNews ? 'Редактировать новость' : 'Добавить новость'}
        size="md"
      >
        <NewsForm
          initialData={editingNews || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Удаление новости"
        message={`Вы уверены, что хотите удалить новость "${itemToDelete?.title_ru}"?`}
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