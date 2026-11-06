import { BaseService } from './base.service';
import { apiClient } from '../client';
import type { ApplicationFilters, ApplicationUpdate, PaginatedResponse, VacancyApplication } from '@/types';

// отклики присылают кандидаты с сайта; отдел кадров их только обрабатывает
class ApplicationsService extends BaseService<VacancyApplication> {
  constructor() {
    super('/vacancy-applications');
  }

  async getPage(
    page: number = 1,
    pageSize: number = 10,
    filters: ApplicationFilters = {}
  ): Promise<PaginatedResponse<VacancyApplication>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (filters.status) params.append('status', filters.status);

    try {
      return await apiClient.get<PaginatedResponse<VacancyApplication>>(`${this.endpoint}?${params.toString()}`);
    } catch (error) {
      this.handleError(error);
      return { count: 0, next: null, previous: null, results: [] };
    }
  }

  // ошибки пробрасываются, чтобы показать текст сервера в форме
  patch(id: string, data: ApplicationUpdate): Promise<VacancyApplication> {
    return apiClient.patch<VacancyApplication>(`${this.endpoint}${id}/`, data);
  }

  // все отклики файлом Excel, независимо от фильтра в списке
  exportToExcel(): Promise<Blob> {
    return apiClient.download(`${this.endpoint}export/`);
  }

  downloadResume(id: string): Promise<Blob> {
    return apiClient.download(`${this.endpoint}${id}/resume/`);
  }
}

export const applicationsService = new ApplicationsService();
