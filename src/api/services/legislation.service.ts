import { BaseService } from './base.service';
import type { Legislation, PaginatedResponse } from '@/types';

class LegislationService extends BaseService<Legislation> {
  constructor() {
    super('/legislation');
  }

  async getPage(page: number = 1, pageSize: number = 10, search = ''): Promise<PaginatedResponse<Legislation>> {
    return this.getPaginated({ page, page_size: pageSize, search });
  }
}

export const legislationService = new LegislationService();