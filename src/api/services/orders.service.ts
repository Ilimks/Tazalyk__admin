import { BaseService } from './base.service';
import { apiClient } from '../client';
import type { Order, OrderFilters, OrderUpdate, PaginatedResponse } from '@/types';

// заказы оформляют покупатели на сайте; админка их только смотрит, меняет статус и заметку
class OrdersService extends BaseService<Order> {
  constructor() {
    super('/shop/orders');
  }

  async getPage(page: number = 1, pageSize: number = 10, filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (filters.status) params.append('status', filters.status);

    try {
      return await apiClient.get<PaginatedResponse<Order>>(`${this.endpoint}?${params.toString()}`);
    } catch (error) {
      this.handleError(error);
      return { count: 0, next: null, previous: null, results: [] };
    }
  }

  // ошибки пробрасываются, чтобы показать текст сервера
  patch(id: number, data: OrderUpdate): Promise<Order> {
    return apiClient.patch<Order>(`${this.endpoint}${id}/`, data);
  }
}

export const ordersService = new OrdersService();
