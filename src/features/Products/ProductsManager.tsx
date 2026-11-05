import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, SearchX } from 'lucide-react';
import styles from './ProductsManager.module.scss';
import { useAuthStore, useProductsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Loader } from '@/components/common/Loader';
import { Input, Select } from '@/components/common/Form';
import { ProductForm } from './components/ProductForm';
import { ProductTable } from './components/ProductTable';
import { MATERIAL_OPTIONS } from './materials';
import type { Product, ProductMaterial } from '@/types';

const PAGE_SIZE = 10;

const materialFilterOptions = [{ value: '', label: 'Все материалы' }, ...MATERIAL_OPTIONS];

export const ProductsManager: React.FC = () => {
  const {
    products,
    loading,
    totalCount,
    currentPage,
    pageSize,
    fetchPage,
    deleteProduct,
    goToPage,
  } = useProductsStore();
  const { canCreate, canEdit, canDelete } = useAuthStore();

  const { showNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [material, setMaterial] = useState<ProductMaterial | ''>('');
  // запрос уходит, когда пользователь перестал печатать
  const debouncedSearch = useDebounce(search.trim(), 400);

  const allowCreate = canCreate('products');
  const allowEdit = canEdit('products');
  const allowDelete = canDelete('products');
  const hasFilters = Boolean(debouncedSearch || material);

  useEffect(() => {
    fetchPage(1, PAGE_SIZE, { q: debouncedSearch, material });
  }, [fetchPage, debouncedSearch, material]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDeleteClick = (id: string) => {
    const item = products.find((p) => p.id === id);
    if (item) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const success = await deleteProduct(itemToDelete.id);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setItemToDelete(null);
    if (success) {
      showNotification('Товар удалён из каталога', 'success');
    } else {
      showNotification('Ошибка при удалении товара', 'error');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSuccess = () => {
    showNotification(editingProduct ? 'Товар успешно обновлён!' : 'Товар успешно добавлен!', 'success');
    handleCloseModal();
  };

  const resetFilters = () => {
    setSearch('');
    setMaterial('');
  };

  const addButton = allowCreate && (
    <Button icon={<Plus />} onClick={openCreate}>
      Добавить товар
    </Button>
  );

  const renderContent = () => {
    // первая загрузка: шапка остаётся на месте, спиннер — вместо таблицы
    if (loading && products.length === 0) {
      return (
        <div className={styles.loaderCard}>
          <Loader />
        </div>
      );
    }

    if (products.length === 0 && hasFilters) {
      return (
        <EmptyState
          icon={SearchX}
          title="Ничего не найдено"
          description="Измените запрос или сбросьте фильтр по материалу."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          }
        />
      );
    }

    if (products.length === 0) {
      return (
        <EmptyState
          icon={Package}
          title="Товаров пока нет"
          description="Добавьте первый контейнер — он появится в магазине на сайте."
          action={addButton}
        />
      );
    }

    return (
      <ProductTable
        products={products}
        busy={loading}
        onEdit={allowEdit ? handleEdit : undefined}
        onDelete={allowDelete ? handleDeleteClick : undefined}
      />
    );
  };

  return (
    <div className={styles.manager}>
      <PageHeader
        icon={Package}
        title="Товары"
        description={`Каталог мусорных контейнеров в магазине сайта${totalCount > 0 ? ` · всего ${totalCount}` : ''}`}
        actions={addButton}
      />

      <div className={styles.toolbar} role="search">
        <Input
          className={styles.toolbarSearch}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию"
          aria-label="Поиск товара по названию"
          icon={<Search />}
          maxLength={100}
        />
        <Select
          className={styles.toolbarSelect}
          value={material}
          onChange={(e) => setMaterial(e.target.value as ProductMaterial | '')}
          options={materialFilterOptions}
          aria-label="Фильтр по материалу"
        />
      </div>

      {renderContent()}

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
        title={editingProduct ? 'Редактировать товар' : 'Добавить товар'}
        size="lg"
      >
        <ProductForm
          initialData={editingProduct || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Удалить товар?"
        message={`Товар «${itemToDelete?.name_ru ?? ''}» исчезнет из каталога. В уже оформленных заказах он останется. Чтобы скрыть товар на время, снимите отметку «Опубликован на сайте».`}
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
