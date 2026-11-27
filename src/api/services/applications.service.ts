import { BaseService } from './base.service';
import { apiClient } from '../client';
import type { ApplicationFilters, ApplicationUpdate, PaginatedResponse, VacancyApplication } from '@/types';

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
    if (filters.search) params.append('search', filters.search);

    try {
      return await apiClient.get<PaginatedResponse<VacancyApplication>>(`${this.endpoint}?${params.toString()}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  patch(id: string, data: ApplicationUpdate): Promise<VacancyApplication> {
    return apiClient.patch<VacancyApplication>(`${this.endpoint}${id}/`, data);
  }

  exportToExcel(): Promise<Blob> {
    return apiClient.download(`${this.endpoint}export/`);
  }

  downloadResume(id: string): Promise<Blob> {
    return apiClient.download(`${this.endpoint}${id}/resume/`);
  }
}

export const applicationsService = new ApplicationsService();
