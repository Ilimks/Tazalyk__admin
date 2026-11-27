import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { applicationsService } from '@/api/services/applications.service';
import { isMissingPage, toLoadError, toSaveError } from '@/utils/apiErrors';
import type { ApplicationStatus, ApplicationUpdate, SaveResult, VacancyApplication } from '@/types';

interface ApplicationsState {
  applications: VacancyApplication[];
  loading: boolean;
  loadError: string | null;
  newCountError: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  status: ApplicationStatus | '';
  search: string;
  newCount: number | null;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  setStatus: (status: ApplicationStatus | '') => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
  fetchNewCount: () => Promise<void>;
  updateApplication: (id: string, data: ApplicationUpdate) => Promise<SaveResult<VacancyApplication>>;
  deleteApplication: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
}

let lastRequest = 0;

export const useApplicationsStore = create<ApplicationsState>()(
  devtools((set, get) => ({
    applications: [],
    loading: false,
    loadError: null,
    newCountError: false,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    status: '',
    search: '',
    newCount: null,

    fetchPage: async (page = 1, pageSize = 10) => {
      const requestId = ++lastRequest;
      const { status, search } = get();
      set({ loading: true, loadError: null });
      let response: Awaited<ReturnType<typeof applicationsService.getPage>>;
      try {
        response = await applicationsService.getPage(page, pageSize, { status, search });
      } catch (error) {
        if (requestId !== lastRequest) return;
        if (isMissingPage(error) && page > 1) {
          get().fetchPage(page - 1, pageSize);
          return;
        }
        console.error('Failed to fetch applications page:', error);
        set({ loadError: toLoadError(error), loading: false, applications: [] });
        return;
      }
      if (requestId !== lastRequest) return;
      set({
        applications: response.results,
        totalCount: response.count,
        currentPage: page,
        pageSize,
        loading: false,
        ...(status === 'new' && !search ? { newCount: response.count } : {}),
      });
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
        const response = await applicationsService.getPage(1, 1, { status: 'new' });
        set({ newCount: response.count, newCountError: false });
      } catch {
        set({ newCountError: true });
      }
    },

    updateApplication: async (id, data) => {
      try {
        const updated = await applicationsService.patch(id, data);
        const { status, currentPage, pageSize } = get();
        if (status && updated.status !== status) {
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
