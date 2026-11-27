import { isMissingPage, toLoadError, toSaveError } from '@/utils/apiErrors';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { localActsService } from '@/api/services/localActs.service';
import type { LocalAct, SaveResult } from '@/types';

interface LocalActsState {
  items: LocalAct[];
  loading: boolean;
  loadError: string | null;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  setSearch: (search: string) => void;
  addItem: (item: Omit<LocalAct, 'id' | 'created_at'>) => Promise<SaveResult<LocalAct>>;
  updateItem: (id: string, item: Partial<LocalAct>) => Promise<SaveResult<LocalAct>>;
  deleteItem: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

let lastRequest = 0;

export const useLocalActsStore = create<LocalActsState>()(
  devtools((set, get) => ({
    items: [],
    loading: false,
    loadError: null,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    search: '',

    fetchPage: async (page = 1, pageSize = 10) => {
      const requestId = ++lastRequest;
      set({ loading: true, error: null, loadError: null });
      try {
        const response = await localActsService.getPage(page, pageSize, get().search);
        if (requestId !== lastRequest) return;
        set({ 
          items: response.results,
          totalCount: response.count,
          currentPage: page,
          pageSize: pageSize,
          loading: false 
        });
      } catch (error) {
        if (requestId !== lastRequest) return;
        if (isMissingPage(error) && page > 1) {
          get().fetchPage(page - 1, pageSize);
          return;
        }
        console.error('Failed to fetch local acts:', error);
        set({ loadError: toLoadError(error), loading: false, items: [] });
      }
    },

    addItem: async (item) => {
      set({ loading: true });
      try {
        const created = await localActsService.create(item);
        await get().fetchPage(1, get().pageSize);
        set({ loading: false });
        return { success: true, data: created };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    updateItem: async (id, item) => {
      set({ loading: true });
      try {
        const updated = await localActsService.update(id, item);
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? updated : i)),
          loading: false,
        }));
        return { success: true, data: updated };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    deleteItem: async (id) => {
      set({ loading: true });
      try {
        const success = await localActsService.delete(id);
        if (success) {
          const { currentPage, pageSize, items } = get();
          let newPage = currentPage;
          if (items.length === 1 && currentPage > 1) {
            newPage = currentPage - 1;
          }
          await get().fetchPage(newPage, pageSize);
          set({ loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to delete local act:', error);
        set({ error: 'Failed to delete local act', loading: false });
        return false;
      }
    },

    setSearch: (search) => {
      set({ search });
      get().fetchPage(1, get().pageSize);
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