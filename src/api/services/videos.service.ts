import { BaseService } from './base.service';
import type { Video, PaginatedResponse } from '@/types';

class VideosService extends BaseService<Video> {
  constructor() {
    super('/videos');
  }

  async getPage(page: number = 1, pageSize: number = 8): Promise<PaginatedResponse<Video>> {
    return this.getPaginated({ page, page_size: pageSize });
  }
}

export const videosService = new VideosService();