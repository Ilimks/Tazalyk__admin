import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ordersService } from '@/api/services/orders.service';
import { isMissingPage, toLoadError, toSaveError } from '@/utils/apiErrors';
import type { Order, OrderStatus, OrderUpdate, SaveResult } from '@/types';

interface OrdersState {
  orders: Order[];
  loading: boolean;
  loadError: string | null;
  newCountError: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  status: OrderStatus | '';
  search: string;
  newCount: number | null;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  setStatus: (status: OrderStatus | '') => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
  fetchNewCount: () => Promise<void>;
  updateOrder: (id: number, data: OrderUpdate) => Promise<SaveResult<Order>>;
  deleteOrder: (id: number) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

let lastRequest = 0;

export const useOrdersStore = create<OrdersState>()(
  devtools((set, get) => ({
    orders: [],
    loading: false,
    loadError: null,
    newCountError: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    status: '',
    search: '',
    newCount: null,

    fetchPage: async (page = 1, pageSize = 10) => {
      const requestId = ++lastRequest;
      const { status, search } = get();
      set({ loading: true, error: null, loadError: null });
      try {
        const response = await ordersService.getPage(page, pageSize, { status, search });
        if (requestId !== lastRequest) return;
        set({
          orders: response.results,
          totalCount: response.count,
          currentPage: page,
          pageSize: pageSize,
          loading: false,
          ...(status === 'new' && !search ? { newCount: response.count } : {}),
        });
      } catch (error) {
        if (requestId !== lastRequest) return;
        if (isMissingPage(error) && page > 1) {
          get().fetchPage(page - 1, pageSize);
          return;
        }
        console.error('Failed to fetch orders page:', error);
        set({ loadError: toLoadError(error), loading: false, orders: [] });
      }
    },

    setStatus: (status) => {
      set({ status });
      get().fetchPage(1, get().pageSize);
    },

    setSearch: (search) => {
      set({ search });
      get().fetchPage(1, get().pageSize);
    },

    resetFilters: () => {
      set({ status: '', search: '' });
      get().fetchPage(1, get().pageSize);
    },

    fetchNewCount: async () => {
      try {
        const response = await ordersService.getPage(1, 1, { status: 'new' });
        set({ newCount: response.count, newCountError: false });
      } catch {
        set({ newCountError: true });
      }
    },

    updateOrder: async (id, data) => {
      try {
        const updated = await ordersService.patch(id, data);
        const { status, currentPage, pageSize } = get();
        if (status && updated.status !== status) {
          await get().fetchPage(currentPage, pageSize);
        } else {
          set((state) => ({
            orders: state.orders.map((o) => (o.id === id ? updated : o)),
          }));
        }
        get().fetchNewCount();
        return { success: true, data: updated };
      } catch (error) {
        console.error('Failed to update order:', error);
        return toSaveError(error);
      }
    },

    deleteOrder: async (id) => {
      set({ loading: true });
      try {
        const success = await ordersService.delete(String(id));
        if (success) {
          const { currentPage, pageSize, orders } = get();
          let newPage = currentPage;
          if (orders.length === 1 && currentPage > 1) {
            newPage = currentPage - 1;
          }
          await get().fetchPage(newPage, pageSize);
          get().fetchNewCount();
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to delete order:', error);
        set({ error: 'Failed to delete order', loading: false });
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
