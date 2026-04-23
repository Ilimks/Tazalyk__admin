import { BaseService } from './base.service';
import type { News, PaginatedResponse } from '@/types';

class NewsService extends BaseService<News> {
  constructor() {
    super('/news');
  }

  async getPage(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<News>> {
    return this.getPaginated({ page, page_size: pageSize });
  }
}

export const newsService = new NewsService();