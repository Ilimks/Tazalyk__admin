import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { vacanciesService } from '@/api/services/vacancies.service';
import { toSaveError } from '@/utils/apiErrors';
import type { SaveResult, Vacancy, VacancyFilters, VacancyInput } from '@/types';

interface VacanciesState {
  vacancies: Vacancy[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: VacancyFilters;
  // id вакансий, у которых сейчас переключается «активна/неактивна»
  toggling: string[];
  // без filters — с текущими фильтрами
  fetchPage: (page?: number, pageSize?: number, filters?: VacancyFilters) => Promise<void>;
  addVacancy: (vacancy: VacancyInput) => Promise<SaveResult<Vacancy>>;
  updateVacancy: (id: string, vacancy: VacancyInput) => Promise<SaveResult<Vacancy>>;
  setActive: (id: string, isActive: boolean) => Promise<boolean>;
  deleteVacancy: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
}

// смена фильтра шлёт новый запрос: ответ на устаревший не должен затереть свежий
let lastRequest = 0;

export const useVacanciesStore = create<VacanciesState>()(
  devtools((set, get) => ({
    vacancies: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    filters: {},
    toggling: [],

    fetchPage: async (page = 1, pageSize = 10, filters) => {
      const requestId = ++lastRequest;
      const activeFilters = filters ?? get().filters;
      set({ loading: true, error: null, filters: activeFilters });
      try {
        const response = await vacanciesService.getPage(page, pageSize, activeFilters);
        if (requestId !== lastRequest) return;
        set({
          vacancies: response.results,
          totalCount: response.count,
          currentPage: page,
          pageSize,
          loading: false,
        });
      } catch (error) {
        if (requestId !== lastRequest) return;
        console.error('Failed to fetch vacancies page:', error);
        set({ error: 'Failed to fetch vacancies', loading: false, vacancies: [] });
      }
    },

    addVacancy: async (vacancy) => {
      try {
        const created = await vacanciesService.save(vacancy);
        await get().fetchPage(1, get().pageSize);
        return { success: true, data: created };
      } catch (error) {
        console.error('Failed to add vacancy:', error);
        return toSaveError(error);
      }
    },

    updateVacancy: async (id, vacancy) => {
      try {
        const updated = await vacanciesService.save(vacancy, id);
        set((state) => ({
          vacancies: state.vacancies.map((v) => (v.id === id ? updated : v)),
        }));
        return { success: true, data: updated };
      } catch (error) {
        console.error('Failed to update vacancy:', error);
        return toSaveError(error);
      }
    },

    setActive: async (id, isActive) => {
      set((state) => ({ toggling: [...state.toggling, id] }));
      try {
        const updated = await vacanciesService.setActive(id, isActive);
        set((state) => ({
          vacancies: state.vacancies.map((v) => (v.id === id ? updated : v)),
        }));
        return true;
      } catch (error) {
        console.error('Failed to toggle vacancy:', error);
        return false;
      } finally {
        set((state) => ({ toggling: state.toggling.filter((item) => item !== id) }));
      }
    },

    deleteVacancy: async (id) => {
      set({ loading: true });
      const success = await vacanciesService.delete(id);
      if (!success) {
        set({ loading: false });
        return false;
      }
      const { currentPage, pageSize, vacancies } = get();
      // удалили последнюю вакансию на странице — переходим на предыдущую
      const newPage = vacancies.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      await get().fetchPage(newPage, pageSize);
      return true;
    },

    goToPage: (page: number) => {
      get().fetchPage(page, get().pageSize);
    },
  }))
);
