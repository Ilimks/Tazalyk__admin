import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productsService } from '@/api/services/products.service';
import { toSaveError } from '@/utils/apiErrors';
import type { Product, ProductFilters, ProductInput, SaveResult } from '@/types';

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: ProductFilters;
  // без filters — с текущими фильтрами
  fetchPage: (page?: number, pageSize?: number, filters?: ProductFilters) => Promise<void>;
  addProduct: (product: ProductInput) => Promise<SaveResult<Product>>;
  updateProduct: (id: string, product: ProductInput) => Promise<SaveResult<Product>>;
  deleteProduct: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

// поиск шлёт запросы на ходу: ответ на устаревший запрос не должен затереть свежий
let lastRequest = 0;

export const useProductsStore = create<ProductsState>()(
  devtools((set, get) => ({
    products: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    filters: {},

    fetchPage: async (page = 1, pageSize = 10, filters) => {
      const requestId = ++lastRequest;
      const activeFilters = filters ?? get().filters;
      set({ loading: true, error: null, filters: activeFilters });
      try {
        const response = await productsService.getPage(page, pageSize, activeFilters);
        if (requestId !== lastRequest) return;
        set({
          products: response.results,
          totalCount: response.count,
          currentPage: page,
          pageSize: pageSize,
          loading: false,
        });
      } catch (error) {
        if (requestId !== lastRequest) return;
        console.error('Failed to fetch products page:', error);
        set({ error: 'Failed to fetch products', loading: false, products: [] });
      }
    },

    addProduct: async (product) => {
      try {
        const created = await productsService.save(product);
        await get().fetchPage(1, get().pageSize);
        return { success: true, data: created };
      } catch (error) {
        console.error('Failed to add product:', error);
        return toSaveError(error);
      }
    },

    updateProduct: async (id, product) => {
      try {
        const updated = await productsService.save(product, id);
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? updated : p)),
        }));
        return { success: true, data: updated };
      } catch (error) {
        console.error('Failed to update product:', error);
        return toSaveError(error);
      }
    },

    deleteProduct: async (id) => {
      set({ loading: true });
      try {
        const success = await productsService.delete(id);
        if (success) {
          const { currentPage, pageSize, products } = get();
          let newPage = currentPage;
          if (products.length === 1 && currentPage > 1) {
            newPage = currentPage - 1;
          }
          await get().fetchPage(newPage, pageSize);
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to delete product:', error);
        set({ error: 'Failed to delete product', loading: false });
        return false;
      }
    },

    goToPage: (page: number) => {
      const { pageSize } = get();
      get().fetchPage(page, pageSize);
    },

    changePageSize: (size: number) => {
      get().fetchPage(1, size);
    },
  }))
);
