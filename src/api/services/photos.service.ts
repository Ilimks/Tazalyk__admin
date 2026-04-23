import { BaseService } from './base.service';
import type { Photo, PaginatedResponse } from '@/types';

class PhotosService extends BaseService<Photo> {
  constructor() {
    super('/photos');
  }

  async getPage(page: number = 1, pageSize: number = 8): Promise<PaginatedResponse<Photo>> {
    return this.getPaginated({ page, page_size: pageSize });
  }
}

export const photosService = new PhotosService();