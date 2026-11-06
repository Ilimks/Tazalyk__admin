import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { applicationsService } from '@/api/services/applications.service';
import { toSaveError } from '@/utils/apiErrors';
import type { ApplicationStatus, ApplicationUpdate, SaveResult, VacancyApplication } from '@/types';

interface ApplicationsState {
  applications: VacancyApplication[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  // фильтр по статусу, '' — все отклики
  status: ApplicationStatus | '';
  // сколько новых откликов ждут ответа (бейдж в меню и на «Обзоре»)
  newCount: number | null;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  setStatus: (status: ApplicationStatus | '') => void;
  fetchNewCount: () => Promise<void>;
  updateApplication: (id: string, data: ApplicationUpdate) => Promise<SaveResult<VacancyApplication>>;
  deleteApplication: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
}

// при быстром переключении фильтров ответ на старый запрос не должен затереть новый
let lastRequest = 0;

export const useApplicationsStore = create<ApplicationsState>()(
  devtools((set, get) => ({
    applications: [],
    loading: false,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    status: '',
    newCount: null,

    fetchPage: async (page = 1, pageSize = 10) => {
      const requestId = ++lastRequest;
      const { status } = get();
      set({ loading: true });
      const response = await applicationsService.getPage(page, pageSize, { status });
      if (requestId !== lastRequest) return;
      set({
        applications: response.results,
        totalCount: response.count,
        currentPage: page,
        pageSize,
        loading: false,
        // список новых откликов заодно обновляет счётчик
        ...(status === 'new' ? { newCount: response.count } : {}),
      });
    },

    setStatus: (status) => {
      set({ status });
      get().fetchPage(1, get().pageSize);
    },

    fetchNewCount: async () => {
      const response = await applicationsService.getPage(1, 1, { status: 'new' });
      set({ newCount: response.count });
    },

    updateApplication: async (id, data) => {
      try {
        const updated = await applicationsService.patch(id, data);
        const { status, currentPage, pageSize } = get();
        if (status && updated.status !== status) {
          // отклик ушёл из отфильтрованного списка
          await get().fetchPage(currentPage, pageSize);
        } else {
          set((state) => ({
            applications: state.applications.map((item) => (item.id === id ? updated : item)),
          }));
        }
        get().fetchNewCount();
        return { success: true, data: updated };
      } catch (error) {
        console.error('Failed to update application:', error);
        return toSaveError(error);
      }
    },

    deleteApplication: async (id) => {
      const success = await applicationsService.delete(id);
      if (success) {
        const { currentPage, pageSize, applications } = get();
        const page = applications.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
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
