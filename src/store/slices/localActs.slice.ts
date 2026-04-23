// src/store/slices/localActs.slice.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { localActsService } from '@/api/services/localActs.service';
import type { LocalAct } from '@/types';

interface LocalActsState {
  items: LocalAct[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  addItem: (item: Omit<LocalAct, 'id' | 'created_at'>) => Promise<boolean>;
  updateItem: (id: string, item: Partial<LocalAct>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

export const useLocalActsStore = create<LocalActsState>()(
  devtools((set, get) => ({
    items: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,

    fetchPage: async (page = 1, pageSize = 10) => {
      set({ loading: true, error: null });
      try {
        const response = await localActsService.getPage(page, pageSize);
        set({ 
          items: response.results,
          totalCount: response.count,
          currentPage: page,
          pageSize: pageSize,
          loading: false 
        });
      } catch (error) {
        console.error('Failed to fetch local acts:', error);
        set({ error: 'Failed to fetch local acts', loading: false, items: [] });
      }
    },

    addItem: async (item) => {
      set({ loading: true });
      try {
        const newItem = await localActsService.create(item);
        if (newItem) {
          await get().fetchPage(1, get().pageSize);
          set({ loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to add local act:', error);
        set({ error: 'Failed to add local act', loading: false });
        return false;
      }
    },

    updateItem: async (id, item) => {
      set({ loading: true });
      try {
        const updatedItem = await localActsService.update(id, item);
        if (updatedItem) {
          set((state) => ({
            items: state.items.map((i) => (i.id === id ? updatedItem : i)),
            loading: false,
          }));
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to update local act:', error);
        set({ error: 'Failed to update local act', loading: false });
        return false;
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

    goToPage: (page: number) => {
      const { pageSize } = get();
      get().fetchPage(page, pageSize);
    },

    changePageSize: (size: number) => {
      get().fetchPage(1, size);
    },
  }))
);