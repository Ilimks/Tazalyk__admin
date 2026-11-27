import { BaseService } from './base.service';
import { apiClient } from '../client';
import type { PaginatedResponse, Vacancy, VacancyFilters, VacancyInput } from '@/types';

const STATUS_PARAMS: Record<NonNullable<VacancyFilters['status']>, string | null> = {
  '': null,
  active: '1',
  inactive: '0',
};

class VacanciesService extends BaseService<Vacancy> {
  constructor() {
    super('/vacancies');
  }

  async getPage(page: number = 1, pageSize: number = 10, filters: VacancyFilters = {}): Promise<PaginatedResponse<Vacancy>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), all: '1' });
    const isActive = STATUS_PARAMS[filters.status || ''];
    if (isActive) params.append('is_active', isActive);
    if (filters.search) params.append('search', filters.search);

    try {
      return await apiClient.get<PaginatedResponse<Vacancy>>(`${this.endpoint}?${params.toString()}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  save(data: VacancyInput, id?: string): Promise<Vacancy> {
    return id ? apiClient.put<Vacancy>(`${this.endpoint}${id}/`, data) : apiClient.post<Vacancy>(this.endpoint, data);
  }

  setActive(id: string, isActive: boolean): Promise<Vacancy> {
    return apiClient.patch<Vacancy>(`${this.endpoint}${id}/`, { is_active: isActive });
  }
}

export const vacanciesService = new VacanciesService();
