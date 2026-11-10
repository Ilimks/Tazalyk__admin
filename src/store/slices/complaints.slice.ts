import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { complaintsService } from '@/api/services/complaints.service';
import { toSaveError } from '@/utils/apiErrors';
import type { Complaint, ComplaintStatus, ComplaintType, ComplaintUpdate, SaveResult } from '@/types';

interface ComplaintsState {
  complaints: Complaint[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  // фильтры списка, '' — все. По умолчанию показываются все жалобы любого типа
  status: ComplaintStatus | '';
  complaintType: ComplaintType | '';
  // сколько новых жалоб ждут ответа (бейдж в меню и на «Обзоре»)
  newCount: number | null;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  setStatus: (status: ComplaintStatus | '') => void;
  setComplaintType: (complaintType: ComplaintType | '') => void;
  resetFilters: () => void;
  fetchNewCount: () => Promise<void>;
  updateComplaint: (id: string, data: ComplaintUpdate) => Promise<SaveResult<Complaint>>;
  deleteComplaint: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
}

// при быстром переключении фильтров ответ на старый запрос не должен затереть новый
let lastRequest = 0;

export const useComplaintsStore = create<ComplaintsState>()(
  devtools((set, get) => ({
    complaints: [],
    loading: false,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    status: '',
    complaintType: '',
    newCount: null,

    fetchPage: async (page = 1, pageSize = 10) => {
      const requestId = ++lastRequest;
      const { status, complaintType } = get();
      set({ loading: true });
      const response = await complaintsService.getPage(page, pageSize, { status, complaint_type: complaintType });
      if (requestId !== lastRequest) return;
      set({
        complaints: response.results,
        totalCount: response.count,
        currentPage: page,
        pageSize,
        loading: false,
        // список новых жалоб без фильтра по типу заодно обновляет счётчик
        ...(status === 'new' && !complaintType ? { newCount: response.count } : {}),
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

    resetFilters: () => {
      set({ status: '', complaintType: '' });
      get().fetchPage(1, get().pageSize);
    },

    fetchNewCount: async () => {
      const response = await complaintsService.getPage(1, 1, { status: 'new' });
      set({ newCount: response.count });
    },

    updateComplaint: async (id, data) => {
      try {
        const updated = await complaintsService.patch(id, data);
        const { status, currentPage, pageSize } = get();
        if (status && updated.status !== status) {
          // жалоба ушла из отфильтрованного списка; тип в админке не меняется
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
