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

  // all=1 — отделу кадров нужны и отключённые вакансии, которых нет на сайте
  async getPage(page: number = 1, pageSize: number = 10, filters: VacancyFilters = {}): Promise<PaginatedResponse<Vacancy>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), all: '1' });
    const isActive = STATUS_PARAMS[filters.status || ''];
    if (isActive) params.append('is_active', isActive);

    try {
      return await apiClient.get<PaginatedResponse<Vacancy>>(`${this.endpoint}?${params.toString()}`);
    } catch (error) {
      this.handleError(error);
      return { count: 0, next: null, previous: null, results: [] };
    }
  }

  // в отличие от BaseService ошибки не глотаются: форме нужны тексты ошибок по полям
  save(data: VacancyInput, id?: string): Promise<Vacancy> {
    return id ? apiClient.put<Vacancy>(`${this.endpoint}${id}/`, data) : apiClient.post<Vacancy>(this.endpoint, data);
  }

  // включить или отключить вакансию, не трогая остальные поля
  setActive(id: string, isActive: boolean): Promise<Vacancy> {
    return apiClient.patch<Vacancy>(`${this.endpoint}${id}/`, { is_active: isActive });
  }
}

export const vacanciesService = new VacanciesService();
