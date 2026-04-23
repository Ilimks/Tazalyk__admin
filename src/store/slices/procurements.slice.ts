import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { procurementsService } from '@/api/services/procurements.service';
import type { Procurement } from '@/types';

interface ProcurementsState {
  procurements: Procurement[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  addProcurement: (procurement: Omit<Procurement, 'id' | 'number' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateProcurement: (id: string, procurement: Partial<Procurement>) => Promise<boolean>;
  deleteProcurement: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

export const useProcurementsStore = create<ProcurementsState>()(
  devtools((set, get) => ({
    procurements: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 12,

    fetchPage: async (page = 1, pageSize = 12) => {
      set({ loading: true, error: null });
      try {
        const response = await procurementsService.getPage(page, pageSize);
        set({ 
          procurements: response.results,
          totalCount: response.count,
          currentPage: page,
          pageSize: pageSize,
          loading: false 
        });
      } catch (error) {
        console.error('Failed to fetch procurements page:', error);
        set({ error: 'Failed to fetch procurements', loading: false, procurements: [] });
      }
    },

    addProcurement: async (procurement) => {
      set({ loading: true });
      try {
        const newProcurement = await procurementsService.create(procurement);
        if (newProcurement) {
          await get().fetchPage(1, get().pageSize);
          set({ loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to add procurement:', error);
        set({ error: 'Failed to add procurement', loading: false });
        return false;
      }
    },

    updateProcurement: async (id, procurement) => {
      set({ loading: true });
      try {
        const updatedProcurement = await procurementsService.update(id, procurement);
        if (updatedProcurement) {
          set((state) => ({
            procurements: state.procurements.map((p) => (p.id === id ? updatedProcurement : p)),
            loading: false,
          }));
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to update procurement:', error);
        set({ error: 'Failed to update procurement', loading: false });
        return false;
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

    goToPage: (page: number) => {
      const { pageSize } = get();
      get().fetchPage(page, pageSize);
    },

    changePageSize: (size: number) => {
      get().fetchPage(1, size);
    },
  }))
);