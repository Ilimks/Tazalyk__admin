import { BaseService } from './base.service';
import type { Legislation, PaginatedResponse } from '@/types';

class LegislationService extends BaseService<Legislation> {
  constructor() {
    super('/legislation');
  }

  async getPage(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Legislation>> {
    return this.getPaginated({ page, page_size: pageSize });
  }
}

export const legislationService = new LegislationService();