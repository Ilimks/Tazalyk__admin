import { isMissingPage, toLoadError, toSaveError } from '@/utils/apiErrors';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { legislationService } from '@/api/services/legislation.service';
import type { Legislation, SaveResult } from '@/types';

interface LegislationState {
  items: Legislation[];
  loading: boolean;
  loadError: string | null;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  setSearch: (search: string) => void;
  addItem: (item: Omit<Legislation, 'id' | 'created_at'>) => Promise<SaveResult<Legislation>>;
  updateItem: (id: string, item: Partial<Legislation>) => Promise<SaveResult<Legislation>>;
  deleteItem: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

let lastRequest = 0;

export const useLegislationStore = create<LegislationState>()(
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
        const response = await legislationService.getPage(page, pageSize, get().search);
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
        console.error('Failed to fetch legislation:', error);
        set({ loadError: toLoadError(error), loading: false, items: [] });
      }
    },

    addItem: async (item) => {
      set({ loading: true });
      try {
        const created = await legislationService.create(item);
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
        const updated = await legislationService.update(id, item);
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
        const success = await legislationService.delete(id);
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
        console.error('Failed to delete legislation:', error);
        set({ error: 'Failed to delete legislation', loading: false });
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