import React, { useState, useEffect } from 'react';
import { Plus, ScrollText } from 'lucide-react';
import styles from './LocalActsManager.module.scss';
import { useAuthStore, useLocalActsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Loader } from '@/components/common/Loader';
import { LocalActForm } from './components/LocalActForm';
import { LocalActTable } from './components/LocalActTable';
import type { LocalAct } from '@/types';

export const LocalActsManager: React.FC = () => {
    const {
        items: documents,
        loading,
        totalCount,
        currentPage,
        pageSize,
        fetchPage,
        deleteItem,
        goToPage,
    } = useLocalActsStore();
    const { canCreate, canEdit, canDelete } = useAuthStore();

    const { showNotification } = useNotificationStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<LocalAct | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<LocalAct | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const allowCreate = canCreate('local_acts');
    const allowEdit = canEdit('local_acts');
    const allowDelete = canDelete('local_acts');

    useEffect(() => {
        fetchPage(1, 10);
    }, [fetchPage]);

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

    const openCreate = () => {
        setEditingDocument(null);
        setIsModalOpen(true);
    };

    const handleEdit = (doc: LocalAct) => {
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

    const addButton = allowCreate && (
        <Button icon={<Plus />} onClick={openCreate}>
            Добавить документ
        </Button>
    );

    const renderContent = () => {
        // первая загрузка: шапка остаётся на месте, спиннер — вместо таблицы
        if (loading && documents.length === 0) {
            return (
                <div className={styles.loaderCard}>
                    <Loader />
                </div>
            );
        }

        if (documents.length === 0) {
            return (
                <EmptyState
                    icon={ScrollText}
                    title="Локальных актов пока нет"
                    description="Добавьте первый документ — он появится в разделе «Локальные акты» на сайте."
                    action={addButton}
                />
            );
        }

        return (
            <LocalActTable
                documents={documents}
                busy={loading}
                onEdit={allowEdit ? handleEdit : undefined}
                onDelete={allowDelete ? handleDeleteClick : undefined}
            />
        );
    };

    return (
        <div className={styles.manager}>
            <PageHeader
                icon={ScrollText}
                title="Локальные акты"
                description={`Приказы, положения и другие внутренние документы предприятия${totalCount > 0 ? ` · всего ${totalCount}` : ''}`}
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
                title={editingDocument ? 'Редактировать документ' : 'Добавить документ'}
                size="md"
            >
                <LocalActForm
                    initialData={editingDocument || undefined}
                    onSuccess={handleSuccess}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmModal
                isOpen={deleteModalOpen}
                title="Удалить документ?"
                message={`Документ «${itemToDelete?.title ?? ''}» исчезнет с сайта. Это действие нельзя отменить.`}
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
