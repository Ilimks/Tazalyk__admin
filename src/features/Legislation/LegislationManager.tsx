import React, { useState, useEffect } from 'react';
import styles from './LegislationManager.module.scss';
import { useLegislationStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { LegislationForm } from './components/LegislationForm';
import { LegislationTable } from './components/LegislationTable';
import { Loader } from '@/components/common/Loader';
import type { Legislation } from '@/types';

export const LegislationManager: React.FC = () => {
    const { 
        items: documents,
        loading, 
        totalCount,
        currentPage,
        pageSize,
        fetchPage, 
        deleteItem,
        goToPage,
        changePageSize
    } = useLegislationStore();
    
    const { showNotification } = useNotificationStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<Legislation | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Legislation | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchPage(1, 10);
    }, []);

    const totalPages = Math.ceil(totalCount / pageSize);

    const handleDeleteClick = (id: string) => {
        const item = documents.find(doc => doc.id === id);
        if (item) {
            setItemToDelete(item);
            setDeleteModalOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        const success = await deleteItem(itemToDelete.id);
        setIsDeleting(false);
        setDeleteModalOpen(false);
        setItemToDelete(null);
        if (success) {
            showNotification('Документ успешно удален!', 'success');
            fetchPage(1, pageSize);
        } else {
            showNotification('Ошибка при удалении документа', 'error');
        }
    };

    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleEdit = (doc: Legislation) => {
        setEditingDocument(doc);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDocument(null);
    };

    const handleSuccess = () => {
        handleCloseModal();
        fetchPage(1, pageSize);
        showNotification(
            editingDocument ? 'Документ успешно обновлен!' : 'Документ успешно добавлен!',
            'success'
        );
    };

    const handlePageChange = (page: number) => {
        goToPage(page);
    };

    if (loading && documents.length === 0) {
        return <Loader />;
    }

    return (
        <div className={styles.manager}>
            <div className={styles.header}>
                <h2>Законодательство КР</h2>
                <Button onClick={() => setIsModalOpen(true)}>+ Добавить документ</Button>
            </div>

            <LegislationTable
                documents={documents}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
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
                title={editingDocument ? 'Редактировать документ' : 'Добавить документ'}
                size="md"
            >
                <LegislationForm
                    initialData={editingDocument || undefined}
                    onSuccess={handleSuccess}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmModal
                isOpen={deleteModalOpen}
                title="Удаление документа"
                message={`Вы уверены, что хотите удалить "${itemToDelete?.title}"?`}
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