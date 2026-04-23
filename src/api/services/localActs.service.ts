import { BaseService } from './base.service';
import type { LocalAct, PaginatedResponse } from '@/types';

class LocalActsService extends BaseService<LocalAct> {
  constructor() {
    super('/local-acts');
  }

  async getPage(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<LocalAct>> {
    return this.getPaginated({ page, page_size: pageSize });
  }
}

export const localActsService = new LocalActsService();