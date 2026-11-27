import { apiClient } from '../client';
import { BaseService } from './base.service';
import type { Procurement, PaginatedResponse } from '@/types';

class ProcurementsService extends BaseService<Procurement> {
  constructor() {
    super('/procurements');
  }

  async getPage(page: number = 1, pageSize: number = 10, search = ''): Promise<PaginatedResponse<Procurement>> {
    return this.getPaginated({ page, page_size: pageSize, search });
  }
  exportToExcel(): Promise<Blob> {
    return apiClient.download(`${this.endpoint}export/`);
  }

  create(data: Partial<Procurement>): Promise<Procurement> {
    const withoutNumber = { ...data };
    delete withoutNumber.number;
    return super.create(withoutNumber);
  }
}

export const procurementsService = new ProcurementsService();