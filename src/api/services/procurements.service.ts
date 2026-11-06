import { apiClient } from '../client';
import { BaseService } from './base.service';
import type { Procurement, PaginatedResponse } from '@/types';

class ProcurementsService extends BaseService<Procurement> {
  constructor() {
    super('/procurements');
  }

  async getPage(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Procurement>> {
    return this.getPaginated({ page, page_size: pageSize });
  }
  // все закупки файлом Excel, независимо от страницы списка
  exportToExcel(): Promise<Blob> {
    return apiClient.download(`${this.endpoint}export/`);
  }

  async create(data: Partial<Procurement>): Promise<Procurement | null> {
    const { number, ...dataWithoutNumber } = data;
    return super.create(dataWithoutNumber);
  }
}

export const procurementsService = new ProcurementsService();