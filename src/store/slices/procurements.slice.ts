import { create } from 'zustand';
import { isMissingPage, toLoadError, toSaveError } from '@/utils/apiErrors';
import { devtools } from 'zustand/middleware';
import { procurementsService } from '@/api/services/procurements.service';
import type { Procurement, SaveResult } from '@/types';

interface ProcurementsState {
  procurements: Procurement[];
  loading: boolean;
  loadError: string | null;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  setSearch: (search: string) => void;
  addProcurement: (procurement: Omit<Procurement, 'id' | 'number' | 'created_at' | 'updated_at'>) => Promise<SaveResult<Procurement>>;
  updateProcurement: (id: string, procurement: Partial<Procurement>) => Promise<SaveResult<Procurement>>;
  deleteProcurement: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

let lastRequest = 0;

export const useProcurementsStore = create<ProcurementsState>()(
  devtools((set, get) => ({
    procurements: [],
    loading: false,
    loadError: null,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 12,
    search: '',

    fetchPage: async (page = 1, pageSize = 12) => {
      const requestId = ++lastRequest;
      set({ loading: true, error: null, loadError: null });
      try {
        const response = await procurementsService.getPage(page, pageSize, get().search);
        if (requestId !== lastRequest) return;
        set({ 
          procurements: response.results,
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
        console.error('Failed to fetch procurements page:', error);
        set({ loadError: toLoadError(error), loading: false, procurements: [] });
      }
    },

    addProcurement: async (procurement) => {
      set({ loading: true });
      try {
        const created = await procurementsService.create(procurement);
        await get().fetchPage(1, get().pageSize);
        set({ loading: false });
        return { success: true, data: created };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    updateProcurement: async (id, procurement) => {
      set({ loading: true });
      try {
        const updated = await procurementsService.update(id, procurement);
        set((state) => ({
          procurements: state.procurements.map((p) => (p.id === id ? updated : p)),
          loading: false,
        }));
        return { success: true, data: updated };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    deleteProcurement: async (id) => {
      set({ loading: true });
      try {
        const success = await procurementsService.delete(id);
        if (success) {
          const { currentPage, pageSize, procurements } = get();
          let newPage = currentPage;
          if (procurements.length === 1 && currentPage > 1) {
            newPage = currentPage - 1;
          }
          await get().fetchPage(newPage, pageSize);
          set({ loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to delete procurement:', error);
        set({ error: 'Failed to delete procurement', loading: false });
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