import { BaseService } from './base.service';
import { apiClient } from '../client';
import type { Order, OrderFilters, OrderUpdate, PaginatedResponse } from '@/types';

class OrdersService extends BaseService<Order> {
  constructor() {
    super('/shop/orders');
  }

  async getPage(page: number = 1, pageSize: number = 10, filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    try {
      return await apiClient.get<PaginatedResponse<Order>>(`${this.endpoint}?${params.toString()}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  exportToExcel(): Promise<Blob> {
    return apiClient.download(`${this.endpoint}export/`);
  }

  patch(id: number, data: OrderUpdate): Promise<Order> {
    return apiClient.patch<Order>(`${this.endpoint}${id}/`, data);
  }
}

export const ordersService = new OrdersService();
