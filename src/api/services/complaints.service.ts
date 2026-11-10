import { BaseService } from './base.service';
import { apiClient } from '../client';
import type { Complaint, ComplaintFilters, ComplaintUpdate, PaginatedResponse } from '@/types';

// жалобы присылают граждане с сайта; админка их только обрабатывает
class ComplaintsService extends BaseService<Complaint> {
  constructor() {
    super('/complaints');
  }

  async getPage(page: number = 1, pageSize: number = 10, filters: ComplaintFilters = {}): Promise<PaginatedResponse<Complaint>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (filters.status) params.append('status', filters.status);
    if (filters.complaint_type) params.append('complaint_type', filters.complaint_type);

    try {
      return await apiClient.get<PaginatedResponse<Complaint>>(`${this.endpoint}?${params.toString()}`);
    } catch (error) {
      this.handleError(error);
      return { count: 0, next: null, previous: null, results: [] };
    }
  }

  // ошибки пробрасываются, чтобы показать текст сервера в форме
  patch(id: string, data: ComplaintUpdate): Promise<Complaint> {
    return apiClient.patch<Complaint>(`${this.endpoint}${id}/`, data);
  }

  // фото отдаются только с входом сотрудника, поэтому <img src> на сервер не сработает — качаем файлом
  downloadPhoto(complaintId: string, photoId: number): Promise<Blob> {
    return apiClient.download(`${this.endpoint}${complaintId}/photos/${photoId}/`);
  }
}

export const complaintsService = new ComplaintsService();
