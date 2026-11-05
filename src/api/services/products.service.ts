import { BaseService } from './base.service';
import { apiClient } from '../client';
import type { PaginatedResponse, Product, ProductFilters, ProductInput } from '@/types';

class ProductsService extends BaseService<Product> {
  constructor() {
    super('/shop/products');
  }

  // all=1 — менеджеру нужны и скрытые с сайта товары
  async getPage(page: number = 1, pageSize: number = 10, filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), all: '1' });
    if (filters.q?.trim()) params.append('q', filters.q.trim());
    if (filters.material) params.append('material', filters.material);

    try {
      return await apiClient.get<PaginatedResponse<Product>>(`${this.endpoint}?${params.toString()}`);
    } catch (error) {
      this.handleError(error);
      return { count: 0, next: null, previous: null, results: [] };
    }
  }

  // в отличие от BaseService ошибки не глотаются: форме нужны тексты ошибок по полям
  save(data: ProductInput, id?: string): Promise<Product> {
    return id ? apiClient.put<Product>(`${this.endpoint}${id}/`, data) : apiClient.post<Product>(this.endpoint, data);
  }
}

export const productsService = new ProductsService();
