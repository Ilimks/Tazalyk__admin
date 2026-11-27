import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { complaintsService } from '@/api/services/complaints.service';
import { isMissingPage, toLoadError, toSaveError } from '@/utils/apiErrors';
import type { Complaint, ComplaintStatus, ComplaintType, ComplaintUpdate, SaveResult } from '@/types';

interface ComplaintsState {
  complaints: Complaint[];
  loading: boolean;
  loadError: string | null;
  newCountError: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  status: ComplaintStatus | '';
  complaintType: ComplaintType | '';
  search: string;
  newCount: number | null;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  setStatus: (status: ComplaintStatus | '') => void;
  setComplaintType: (complaintType: ComplaintType | '') => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
  fetchNewCount: () => Promise<void>;
  updateComplaint: (id: string, data: ComplaintUpdate) => Promise<SaveResult<Complaint>>;
  deleteComplaint: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
}

let lastRequest = 0;

export const useComplaintsStore = create<ComplaintsState>()(
  devtools((set, get) => ({
    complaints: [],
    loading: false,
    loadError: null,
    newCountError: false,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    status: '',
    complaintType: '',
    search: '',
    newCount: null,

    fetchPage: async (page = 1, pageSize = 10) => {
      const requestId = ++lastRequest;
      const { status, complaintType, search } = get();
      set({ loading: true, loadError: null });
      let response: Awaited<ReturnType<typeof complaintsService.getPage>>;
      try {
        response = await complaintsService.getPage(page, pageSize, { status, complaint_type: complaintType, search });
      } catch (error) {
        if (requestId !== lastRequest) return;
        if (isMissingPage(error) && page > 1) {
          get().fetchPage(page - 1, pageSize);
          return;
        }
        console.error('Failed to fetch complaints page:', error);
        set({ loadError: toLoadError(error), loading: false, complaints: [] });
        return;
      }
      if (requestId !== lastRequest) return;
      set({
        complaints: response.results,
        totalCount: response.count,
        currentPage: page,
        pageSize,
        loading: false,
        ...(status === 'new' && !complaintType && !search ? { newCount: response.count } : {}),
      });
    },

    setStatus: (status) => {
      set({ status });
      get().fetchPage(1, get().pageSize);
    },

    setComplaintType: (complaintType) => {
      set({ complaintType });
      get().fetchPage(1, get().pageSize);
    },

    setSearch: (search) => {
      set({ search });
      get().fetchPage(1, get().pageSize);
    },

    resetFilters: () => {
      set({ status: '', complaintType: '', search: '' });
      get().fetchPage(1, get().pageSize);
    },

    fetchNewCount: async () => {
      try {
        const response = await complaintsService.getPage(1, 1, { status: 'new' });
        set({ newCount: response.count, newCountError: false });
      } catch {
        set({ newCountError: true });
      }
    },

    updateComplaint: async (id, data) => {
      try {
        const updated = await complaintsService.patch(id, data);
        const { status, currentPage, pageSize } = get();
        if (status && updated.status !== status) {
          await get().fetchPage(currentPage, pageSize);
        } else {
          set((state) => ({
            complaints: state.complaints.map((item) => (item.id === id ? updated : item)),
          }));
        }
        get().fetchNewCount();
        return { success: true, data: updated };
      } catch (error) {
        console.error('Failed to update complaint:', error);
        return toSaveError(error);
      }
    },

    deleteComplaint: async (id) => {
      const success = await complaintsService.delete(id);
      if (success) {
        const { currentPage, pageSize, complaints } = get();
        const page = complaints.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        await get().fetchPage(page, pageSize);
        get().fetchNewCount();
      }
      return success;
    },

    goToPage: (page) => {
      get().fetchPage(page, get().pageSize);
    },
  }))
);
